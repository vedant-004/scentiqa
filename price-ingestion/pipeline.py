"""
Scentarchy price ingestion pipeline.
Scrapes real INR prices from Indian retailers and writes them to the
`prices` table. The DB trigger trg_prices_lowest auto-updates
perfumes.lowest_price_inr from verified sellers.

Precision rules (non-negotiable):
- NEVER invent a price. Only scraped/indexed prices go in.
- price_provenance is always 'indexed' for pipeline rows.
- size_ml stays null unless the page states it.
- in_stock=false when the page says out of stock.
- Sanity bounds: 200 <= price_inr <= 300000 else the row is rejected.
"""
import json
import os
import re
import time
import uuid
from dataclasses import dataclass
from urllib.parse import quote_plus

import requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
SB_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
REST = f"{SUPABASE_URL}/rest/v1"
HEADERS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}

UA = (
    "Mozilla/5.0 (Linux; Android 14; Vivo X300) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"
)
REQ_HEADERS = {"User-Agent": UA, "Accept-Language": "en-IN,en;q=0.9"}

MIN_PRICE, MAX_PRICE = 200, 300000


@dataclass
class PriceHit:
    perfume_id: str
    seller_id: str
    price_inr: int
    mrp_inr: int | None = None
    size_ml: int | None = None
    in_stock: bool = True
    product_url: str | None = None
    title: str = ""  # retailer product title, for match scoring (not stored)


@dataclass
class Retailer:
    seller_id: str
    name: str
    delay: float = 3.0  # seconds between requests

    def search(self, perfume_name: str, house: str) -> list[PriceHit]:
        raise NotImplementedError


def fetch(url: str, timeout: int = 25) -> str | None:
    try:
        r = requests.get(url, headers=REQ_HEADERS, timeout=timeout)
        return r.text if r.status_code == 200 else None
    except Exception:
        return None


def parse_inr(text: str) -> int | None:
    m = re.search(r"(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)", text)
    if not m:
        return None
    try:
        v = int(float(m.group(1).replace(",", "")))
    except ValueError:
        return None
    return v if MIN_PRICE <= v <= MAX_PRICE else None


def parse_size_ml(text: str) -> int | None:
    m = re.search(r"(\d{2,3})\s?ml", text, re.I)
    if not m:
        return None
    v = int(m.group(1))
    return v if 5 <= v <= 500 else None


# ---------------- Supabase helpers ----------------

def sb_get(path: str, params: str = "") -> list:
    r = requests.get(f"{REST}/{path}?{params}", headers={
        "apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}, timeout=30)
    r.raise_for_status()
    return r.json()


def sb_post(path: str, payload: dict) -> dict:
    r = requests.post(f"{REST}/{path}", headers=HEADERS, json=payload, timeout=30)
    r.raise_for_status()
    return r.json()


def get_queue(limit: int, offset: int) -> list[dict]:
    """Priceless perfumes, most popular first."""
    return sb_get(
        "perfumes",
        "select=id,slug,name,rating_count,houses(name)"
        "&lowest_price_inr=is.null&order=rating_count.desc.nullslast"
        f"&limit={limit}&offset={offset}",
    )


def get_house_name(row: dict) -> str:
    h = row.get("houses")
    if isinstance(h, dict):
        return h.get("name") or ""
    return ""


def existing_seller_hits(perfume_id: str) -> set[str]:
    rows = sb_get("prices", f"select=seller_id&perfume_id=eq.{perfume_id}")
    return {r["seller_id"] for r in rows}


def write_hit(hit: PriceHit) -> bool:
    payload = {
        "id": f"price_{uuid.uuid4().hex[:12]}",
        "perfume_id": hit.perfume_id,
        "seller_id": hit.seller_id,
        "price_inr": hit.price_inr,
        "mrp_inr": hit.mrp_inr,
        "size_ml": hit.size_ml,
        "in_stock": hit.in_stock,
        "product_url": hit.product_url,
        "price_provenance": "indexed",
    }
    try:
        sb_post("prices", payload)
        return True
    except Exception as e:
        print(f"    WRITE FAIL {hit.perfume_id}/{hit.seller_id}: {e}")
        return False


def title_match_score(perfume_name: str, house: str, hit_title: str) -> float:
    """0-1 score: how well does a retailer's result title match our perfume?"""
    import re as _re
    def toks(s: str) -> set[str]:
        return {t for t in _re.sub(r'[^a-z0-9 ]', ' ', s.lower()).split() if len(t) > 2}
    pn, hn, ht = toks(perfume_name), toks(house), toks(hit_title)
    if not pn:
        return 0.0
    # all perfume-name tokens present in hit title = strong
    name_cov = len(pn & ht) / len(pn)
    # house token present = bonus
    house_hit = 1.0 if (hn & ht) else 0.0
    return 0.8 * name_cov + 0.2 * house_hit


# ---------------- main loop ----------------

def run(retailers: list[Retailer], batch: int = 100, start_offset: int = 0,
        state_file: str = "queue_state.json", min_score: float = 0.8):
    try:
        with open(state_file) as f:
            state = json.load(f)
    except FileNotFoundError:
        state = {"offset": start_offset, "done": 0, "hits": 0}
    offset = state.get("offset", start_offset)

    while True:
        queue = get_queue(batch, offset)
        if not queue:
            print("Queue exhausted. Done.")
            break
        for row in queue:
            pid, name = row["id"], row["name"]
            house = get_house_name(row)
            have = existing_seller_hits(pid)
            for ret in retailers:
                if ret.seller_id in have:
                    continue
                try:
                    hits = ret.search(name, house)
                except Exception as e:
                    print(f"  [{ret.name}] search error for {name}: {e}")
                    hits = []
                time.sleep(ret.delay)
                # keep only the best-matching hit (strict: must cover the name)
                scored = [(title_match_score(name, house, h.title), i, h) for i, h in enumerate(hits)]
                best = None
                for score, _, h in sorted(scored, key=lambda t: (-t[0], t[1])):
                    if score >= min_score:
                        best = h
                        break
                if best is None and hits and min_score <= 0:
                    best = hits[0]
                if best:
                    best.perfume_id = pid
                    if write_hit(best):
                        state["hits"] = state.get("hits", 0) + 1
                        have.add(ret.seller_id)
                        print(f"  + {name[:40]} @ {ret.name}: ₹{best.price_inr} {best.product_url or ''}")
                elif hits:
                    print(f"  ~ {name[:40]} @ {ret.name}: {len(hits)} hits, none scored >= {min_score}")
            state["done"] = state.get("done", 0) + 1
            if state["done"] % 10 == 0:
                print(f"progress: {state['done']} perfumes, {state['hits']} price rows")
        offset += batch
        state["offset"] = offset
        with open(state_file, "w") as f:
            json.dump(state, f)
    with open(state_file, "w") as f:
        json.dump(state, f)
    print(f"FINISHED: {state['done']} perfumes processed, {state['hits']} new price rows")
