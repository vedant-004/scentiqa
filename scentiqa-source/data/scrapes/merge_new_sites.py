#!/usr/bin/env python3
"""Merge 6 new 2026-10-02 scrape JSONs into data/real-houses.json as new site entries.
Converts each scrape format to the real-houses.json site-entry schema.
"""
import json

ROOT = "/home/hatch/workspace/scentiqa"
real = json.load(open(f"{ROOT}/data/real-houses.json"))

def site_entry(site_url, house_slug, seller_slug, house_name, house_city, house_type,
               house_site, house_desc, products, notes, price_prov="live"):
    return {
        "site": site_url,
        "status": "ok",
        "houseSlug": house_slug,
        "sellerSlug": seller_slug,
        "importMode": "full",
        "priceProvenance": price_prov,
        "observedAt": "2026-10-02",
        "house": {
            "name": house_name,
            "city": house_city,
            "country": "India",
            "type": house_type,
            "site": house_site,
            "founded": 0,
            "desc": house_desc,
        },
        "products": products,
        "notes": notes,
    }

def std_product(name, price, size_ml, conc, url, inspired_by, claim_text=None):
    return {
        "name": name,
        "priceInr": price,
        "sizeMl": size_ml,
        "conc": conc,
        "gender": "unisex",
        "url": url,
        "inspiredBy": inspired_by,
        "claimedAccuracy": None,
        "claimText": claim_text,
    }

entries = []

# 1. No Name Perfume (108)
d = json.load(open(f"{ROOT}/data/scrapes/no-name-perfume.json"))
prods = []
for p in d["products"]:
    # use first variant price
    v = p["variants"][0] if p.get("variants") else {}
    prods.append(std_product(
        p["name"], v.get("priceInr"), None, "edp",
        p["url"], p.get("inspiredBy"),
        f"Brand notes: {', '.join(p['notes'])}" if p.get("notes") else None,
    ))
entries.append(site_entry(
    "https://nonameperfume.in/", "no-name-perfume", "no-name-perfume-store",
    "No Name Perfume", None, "indian_clone", "https://nonameperfume.in/",
    "Indian clone house (nonameperfume.in). 108 perfumes with explicit brand-stated inspired-by mappings (102) and house originals (6). Researched 2026-10-02.",
    prods, d.get("notes", ""),
))

# 2. RZLER (43)
d = json.load(open(f"{ROOT}/data/scrapes/rzler.json"))
prods = []
for p in d["products"]:
    v = p["variants"][0] if p.get("variants") else {}
    prods.append(std_product(
        p["name"], v.get("priceInr"), 50, "edp",
        p["url"], p.get("inspiredBy"),
    ))
    # mark sold out in claimText
    if not v.get("inStock", True):
        prods[-1]["claimText"] = "Marked sold out on 2026-10-02."
entries.append(site_entry(
    "https://perfume.rzler.com/", "rzler", "rzler-store",
    "RZLER", None, "indian_clone", "https://perfume.rzler.com/",
    "Indian dupe house (perfume.rzler.com). 43 products (41 perfumes + 2 discovery sets) with explicit inspired-by mappings (39). All marked sold out on 2026-10-02. Researched 2026-10-02.",
    prods, d.get("notes", ""),
))

# 3. Kannauj Fragrance (32 attars)
d = json.load(open(f"{ROOT}/data/scrapes/kannauj-fragrance.json"))
prods = []
for p in d["products"]:
    v = p["variants"][0] if p.get("variants") else {}
    size = None
    if v.get("size"):
        import re
        m = re.search(r"(\d+)\s*ml", v["size"], re.I)
        if m: size = int(m.group(1))
    prods.append(std_product(
        p["name"], v.get("priceInr"), size, "attar",
        p["url"], p.get("inspiredBy"),
    ))
entries.append(site_entry(
    "https://kannaujfragrance.com/", "kannauj-fragrance", "kannauj-fragrance-store",
    "Kannauj Fragrance", "Kannauj, Uttar Pradesh", "attar_maker", "https://kannaujfragrance.com/",
    "Traditional Kannauj attar maker. 32 alcohol-free attars. One explicit mapping (Blue Lady → Rasasi Blue Lady). Researched 2026-10-02.",
    prods, d.get("notes", ""),
))

# 4. Arabian Aroma (238)
d = json.load(open(f"{ROOT}/data/scrapes/arabian-aroma.json"))
prods = []
for p in d["products"]:
    prods.append(std_product(
        p["name"], p.get("priceInr"), p.get("sizeMl"), p.get("conc") or "edp",
        p["url"], p.get("inspiredBy"),
        p.get("sizeNote"),
    ))
entries.append(site_entry(
    "https://arabianaroma.co.in/", "arabian-aroma", "arabian-aroma-store",
    "Arabian Aroma", "Kanpur, Uttar Pradesh", "indian_clone", "https://arabianaroma.co.in/",
    "Kanpur clone house (arabianaroma.co.in). 238 products. Prices are collection 'From' prices; exact size unconfirmed. Only 1 explicit inspired-by mapping. Researched 2026-10-02.",
    prods, d.get("notes", ""), price_prov="mixed",
))

# 5. Celestial Perfume (104)
d = json.load(open(f"{ROOT}/data/scrapes/celestial-perfume.json"))
prods = []
for p in d["products"]:
    v = p["variants"][0] if p.get("variants") else {}
    size = None
    if v.get("size"):
        import re
        m = re.search(r"(\d+)\s*ml", v["size"], re.I)
        if m: size = int(m.group(1))
    conc = "attar" if p.get("category") == "attar" else "edp"
    notes_txt = None
    if p.get("notesTop"):
        notes_txt = f"Top: {', '.join(p['notesTop'])}; Heart: {', '.join(p['notesHeart'])}; Base: {', '.join(p['notesBase'])} (brand page description)"
    prods.append(std_product(
        p["name"], v.get("priceInr"), size, conc,
        p["url"], p.get("inspiredBy"), notes_txt,
    ))
entries.append(site_entry(
    "https://celestialperfume.in/", "celestial-perfume", "celestial-perfume-store",
    "Celestial Perfume", "Surat, Gujarat", "indian_clone", "https://celestialperfume.in/",
    "Surat clone house (celestialperfume.in). 104 products (73 perfumes, 20 attars, 9 gourmet, 2 gift sets). 70 explicit inspired-by mappings. 27 duplicate -copy listings excluded. Researched 2026-10-02.",
    prods, d.get("notes", ""),
))

# 6. Dupify (53)
d = json.load(open(f"{ROOT}/data/scrapes/dupify.json"))
prods = []
for p in d["products"]:
    # use 55ml variant as primary price
    v55 = next((v for v in p.get("variants", []) if v.get("sizeMl") == 55), None)
    v = v55 or (p["variants"][0] if p.get("variants") else {})
    prods.append(std_product(
        p["name"], v.get("priceInr"), v.get("sizeMl"), "edp",
        p["url"], p.get("inspiredBy"),
        f"Also available: {', '.join(f'{x['size']} Rs.{x['priceInr']}' for x in p.get('variants', []))}" if len(p.get("variants", [])) > 1 else None,
    ))
entries.append(site_entry(
    "https://dupify.in/", "dupify", "dupify-store",
    "Dupify", None, "indian_clone", "https://dupify.in/",
    "Budget clone label (dupify.in). 53 perfumes, each with 3 variants (Attar 12ml, Perfume 20ml/55ml). 3 explicit inspired-by mappings. Researched 2026-10-02.",
    prods, d.get("notes", ""),
))

# append to real-houses.json
real["sites"].extend(entries)
real["observedAt"] = "2026-10-02 (6 new sites); 2026-09-30 (original 20 sites)"

with open(f"{ROOT}/data/real-houses.json", "w") as f:
    json.dump(real, f, ensure_ascii=False, indent=1)

print(f"total sites: {len(real['sites'])}")
print(f"new products added: {sum(len(e['products']) for e in entries)}")
