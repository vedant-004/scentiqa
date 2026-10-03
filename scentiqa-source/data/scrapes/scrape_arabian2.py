#!/usr/bin/env python3
"""Scrape Arabian Aroma remaining collection pages via curl.
Gets men's pages 3-4 and women's page 2. Deduplicates against existing 128.
"""
import json, re, subprocess, time

def fetch(url):
    r = subprocess.run(["curl","-s","--max-time","25",url,"-A","Mozilla/5.0"],
                       capture_output=True, text=True)
    return r.stdout

existing = json.load(open("/home/hatch/workspace/scentiqa/data/scrapes/arabian-aroma.json"))
seen_urls = {p["url"] for p in existing["products"]}
print(f"existing: {len(seen_urls)}")

new_products = []
for coll, pages in [("aroma-for-men", [3, 4]), ("aroma-for-women", [2])]:
    for page in pages:
        url = f"https://arabianaroma.co.in/collections/{coll}?page={page}"
        html = fetch(url)
        # product links and names/prices from collection listing
        # find product cards
        cards = re.findall(r'href="(/products/[^"]+)"[^>]*>.*?</a>', html, re.S)
        print(f"{coll} page {page}: {len(cards)} links", flush=True)
        for href in cards:
            full = "https://arabianaroma.co.in" + href
            if full in seen_urls:
                continue
            seen_urls.add(full)
            new_products.append({"url": full, "collection": coll})
        time.sleep(0.5)

print(f"new unique URLs: {len(new_products)}")

# fetch each product page for name, price, inspiredBy
results = []
for i, p in enumerate(new_products):
    html = fetch(p["url"])
    prod = {"url": p["url"], "collection": p["collection"]}
    m = re.search(r'<meta property="og:title" content="([^"]*)"', html)
    prod["name"] = m.group(1) if m else None
    # price
    pm = re.search(r'"price":(\d+)', html)
    if pm:
        prod["priceInr"] = int(pm.group(1)) / 100
    # check for explicit "Inspired By" in title or page
    tm = re.search(r'[Ii]nspired [Bb]y ([^<"]+)', html)
    if tm:
        prod["inspiredByRaw"] = tm.group(1).strip()[:100]
    results.append(prod)
    time.sleep(0.4)
    if (i+1) % 20 == 0:
        print(f"...{i+1}/{len(new_products)}", flush=True)

with open("/tmp/arabian-new.json","w") as f:
    json.dump(results, f, ensure_ascii=False, indent=1)
print(f"done: {len(results)}")
