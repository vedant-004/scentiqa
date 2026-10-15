"""
Shopify bulk price importer.
Fetches entire product catalogs via /products.json from official brand
stores (all verified sellers) and matches products to Scentarchy perfumes.

Precision rules:
- Only exact/strong name matches are imported. Weak matches are logged
  for manual review, never inserted.
- price_provenance = 'indexed'.
- size_ml only when stated in the variant/title.
"""
import json
import os
import re
import time
import uuid

import requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
SB_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
REST = f"{SUPABASE_URL}/rest/v1"
H = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}", "Content-Type": "application/json"}
UA = {"User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36"}

# seller_id -> (store base url, house names to match, or None for multi-brand)
STORES = {
    "seller_em5-official": ("https://www.houseofem5.com", ["House of EM5"]),
    "seller_armafindia": ("https://armafperfume.com", ["Armaf"]),
    "seller_lattafaindia": ("https://lattafaindia.com", ["Lattafa Perfumes", "Lattafa Pride"]),
    "seller_myperfumesecrets-official": ("https://myperfumesecrets.com", ["My Perfume Secrets"]),
    "seller_bombayperfumery": ("https://bombayperfumery.com", ["Bombay Perfumery"]),
    "seller_ajmal-india-official": ("https://in.ajmal.com", ["Ajmal Perfumes India"]),
    "seller_afnanindia": ("https://india.afnan.com", ["Afnan"]),
    "seller_scentkart": ("https://scentkart.com", None),
    "seller_perfumeaddiction": ("https://perfumeaddiction.com", None),
    "seller_perfumenetwork": ("https://perfumenetwork.in", None),
    "seller_fragstalk": ("https://fragstalk.in", None),
    "seller_naseem": ("https://www.naseemperfume.in", ["Naseem"]),
    "seller_vokka": ("https://vokka.in", ["Vokka"]),
    "seller_brandmall": ("https://www.brandmall.in", None),
    "seller_sugandhi": ("https://sugandhi.in", ["Sugandhi"]),
    "seller_kenaz": ("https://www.kenazperfumes.com", ["Kenaz"]),
}


def normalize(name: str) -> str:
    n = name.lower()
    n = re.sub(r"\beau de (parfum|toilette)\b|\bedt\b|\bedp\b|\bextrait\b|\bparfum\b|\battar\b", "", n)
    n = re.sub(r"\|.*$", "", n)  # "Name | Eau de Parfum" -> "Name"
    n = re.sub(r"\d+\s?ml.*$", "", n)
    n = re.sub(r"[^a-z0-9 ]", " ", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n


def sb_get(path: str, params: str = "") -> list:
    r = requests.get(f"{REST}/{path}?{params}", headers={
        "apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}, timeout=60)
    r.raise_for_status()
    return r.json()


def fetch_products(base: str) -> list[dict]:
    out = []
    page = 1
    while True:
        r = requests.get(f"{base}/products.json?limit=250&page={page}", headers=UA, timeout=30)
        if r.status_code != 200:
            print(f"  !! {base} page {page}: HTTP {r.status_code}")
            break
        prods = r.json().get("products", [])
        if not prods:
            break
        out.extend(prods)
        if len(prods) < 250:
            break
        page += 1
        time.sleep(1)
    return out


def sb_get_all(path: str, params: str = "") -> list:
    """Paginated GET — PostgREST caps at 1000 rows per request."""
    out, offset = [], 0
    while True:
        sep = "&" if params else ""
        r = requests.get(f"{REST}/{path}?{params}{sep}limit=1000&offset={offset}",
                         headers={"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"},
                         timeout=60)
        r.raise_for_status()
        batch = r.json()
        out.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    return out


def load_perfumes(houses: list[str] | None) -> list[dict]:
    """All perfumes (or selected houses') with normalized names."""
    rows = sb_get_all("perfumes", "select=id,name,houses(name)")
    perfumes = []
    for r in rows:
        h = r.get("houses")
        hname = (h.get("name") if isinstance(h, dict) else "") or ""
        if houses and hname.strip() not in houses:
            continue
        perfumes.append({"id": r["id"], "name": r["name"], "house": hname,
                         "norm": normalize(r["name"])})
    return perfumes


def match_product(title: str, perfumes: list[dict]) -> dict | None:
    """Strong match only: normalized title equals/contain perfume name."""
    nt = normalize(title)
    if not nt:
        return None
    best = None
    for p in perfumes:
        pn = p["norm"]
        if not pn or len(pn) < 3:
            continue
        if nt == pn:
            return p  # exact
        # strong containment: one contains the other and the shorter is >= 60% of longer
        if pn in nt or nt in pn:
            shorter, longer = (pn, nt) if len(pn) < len(nt) else (nt, pn)
            if len(shorter) >= 0.6 * len(longer) and len(shorter) >= 5:
                if best is None or len(shorter) > len(best["norm"]):
                    best = p
    return best


def existing_seller_hits(seller_id: str) -> set[str]:
    rows = sb_get_all("prices", f"select=perfume_id&seller_id=eq.{seller_id}")
    return {r["perfume_id"] for r in rows}


def main():
    total_new = 0
    review = []
    for seller_id, (base, houses) in STORES.items():
        print(f"\n=== {seller_id} ({base}) ===")
        perfumes = load_perfumes(houses)
        print(f"  {len(perfumes)} perfumes in scope")
        products = fetch_products(base)
        print(f"  {len(products)} store products")
        # existing (perfume_id, seller_id) pairs to avoid dupes
        existing = existing_seller_hits(seller_id)
        new_rows = []
        for prod in products:
            title = prod.get("title", "")
            m = match_product(title, perfumes)
            if not m or m["id"] in existing:
                if not m:
                    review.append({"store": seller_id, "title": title})
                continue
            variants = prod.get("variants", [])
            # pick the cheapest in-stock variant with a sane price
            best_v = None
            for v in variants:
                try:
                    price = int(float(v.get("price", "0")))
                except (ValueError, TypeError):
                    continue
                if 200 <= price <= 300000 and v.get("available", True):
                    if best_v is None or price < best_v[0]:
                        best_v = (price, v)
            if not best_v:
                continue
            price, var = best_v
            size = None
            szm = re.search(r"(\d{2,3})\s?ml", (var.get("title", "") or "") + " " + title, re.I)
            if szm:
                sv = int(szm.group(1))
                size = sv if 5 <= sv <= 500 else None
            try:
                mrp = int(float(var.get("compare_at_price") or "0")) or None
            except (ValueError, TypeError):
                mrp = None
            new_rows.append({
                "id": f"price_{uuid.uuid4().hex[:12]}",
                "perfume_id": m["id"],
                "seller_id": seller_id,
                "price_inr": price,
                "mrp_inr": mrp if mrp and mrp > price else None,
                "size_ml": size,
                "in_stock": True,
                "product_url": f"{base}/products/{prod.get('handle')}",
                "price_provenance": "indexed",
            })
            existing.add(m["id"])
        print(f"  {len(new_rows)} new price rows to insert")
        # insert in batches of 200
        for i in range(0, len(new_rows), 200):
            batch = new_rows[i:i + 200]
            r = requests.post(f"{REST}/prices", headers=H, json=batch, timeout=60)
            if r.status_code not in (200, 201):
                print(f"  !! batch insert failed: {r.status_code} {r.text[:200]}")
            else:
                total_new += len(batch)
        time.sleep(2)
    print(f"\nDONE: {total_new} new price rows")
    with open("shopify_review.json", "w") as f:
        json.dump(review[:500], f, indent=1)
    print(f"Unmatched titles logged for review: {len(review)}")


if __name__ == "__main__":
    main()
