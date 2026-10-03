#!/usr/bin/env python3
"""Build dupify.json from scraped product pages.
53 perfumes + 1 sample set. 3 variants each: Attar 12ml, Perfume 20ml, Perfume 55ml.
inspiredBy only where the product page title explicitly states it.
"""
import json, re

PAGES = json.load(open("/home/hatch/workspace/scentiqa/data/scrapes/dupify-pages.json"))

# explicit inspiredBy from page titles (verbatim)
INSPIRED = {
    "https://dupify.in/product/dupify-fire/": "Rasasi Hawas Fire",
    "https://dupify.in/product/dupify-hawas/": "Rasasi Hawas",
    "https://dupify.in/product/dupify-waha/": "Lattafa Khamrah",
}

def clean_name(title):
    # "9PM by Dupify – Sweet Vanilla Amber Fragrance for Men" -> "9PM"
    # "Dupify Aventor - Dupify Perfumes India" -> "Aventor"
    t = title.replace(" - Dupify Perfumes India", "").strip()
    t = re.sub(r"\s+by Dupify.*$", "", t).strip()
    t = re.sub(r"^Dupify\s+", "", t).strip()
    # remove marketing descriptors after – or |
    t = re.split(r"\s+[–|]\s+", t)[0].strip()
    return t

products = []
for p in PAGES:
    url = p["url"]
    title = p.get("title") or ""
    name = clean_name(title)
    # skip the 5ml samples set (not a perfume)
    if "5 ML Samples" in title:
        continue
    variants = []
    for v in p.get("variants", []):
        vname = v["variant"] or ""
        # normalize size
        if "Attar" in vname:
            size, ml = "Attar 12ml", 12
        elif "20 ML" in vname:
            size, ml = "20ml", 20
        elif "55 ML" in vname:
            size, ml = "55ml", 55
        else:
            size, ml = vname, None
        variants.append({
            "size": size,
            "sizeMl": ml,
            "priceInr": v["price"],
            "mrpInr": v["regular"],
            "inStock": bool(v["inStock"]),
        })
    products.append({
        "name": name,
        "brand": "Dupify",
        "url": url,
        "category": "perfume",
        "concentration": "Eau de Parfum",
        "variants": variants,
        "inspiredBy": INSPIRED.get(url),
        "source": "dupify.in product page",
        "observedAt": "2026-10-02",
    })

out = {
    "site": "Dupify",
    "url": "https://dupify.in/",
    "observedAt": "2026-10-02",
    "notes": "WooCommerce store. 53 perfumes scraped (5ml sample set excluded). Each has 3 variants: Fragrance Oil/Attar 12ml, Perfume 20ml, Perfume 55ml. Prices are variant-specific sale prices with compare-at MRP. inspiredBy only where page title explicitly states it (3 products).",
    "products": products,
}

with open("/home/hatch/workspace/scentiqa/data/scrapes/dupify.json", "w") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

print(f"products: {len(products)}")
print(f"inspiredBy mapped: {sum(1 for p in products if p['inspiredBy'])}")
