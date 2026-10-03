#!/usr/bin/env python3
"""Scrape Dupify (dupify.in) product catalog via curl.
WooCommerce site. Gets product URLs from shop pages, then variants/prices from product pages.
"""
import json, re, subprocess, time

def fetch(url):
    r = subprocess.run(["curl","-s","--max-time","25",url,"-A","Mozilla/5.0"],
                       capture_output=True, text=True)
    return r.stdout

# get product URLs from all 5 shop pages
urls = set()
for page in range(1, 6):
    url = "https://dupify.in/shop/" if page == 1 else f"https://dupify.in/shop/page/{page}/"
    html = fetch(url)
    links = re.findall(r'href="(https://dupify\.in/product/[^"]+)/?"', html)
    for l in links:
        urls.add(l if l.endswith('/') else l + '/')
    print(f"page {page}: {len(links)} links", flush=True)
    time.sleep(0.5)

print(f"unique products: {len(urls)}")

results = []
for i, url in enumerate(sorted(urls)):
    html = fetch(url)
    prod = {"url": url}
    m = re.search(r'<title>([^<]*)</title>', html)
    prod["title"] = m.group(1).strip() if m else None
    # WooCommerce variations JSON (in data-product_variations, HTML-escaped)
    import html as htmllib
    variants = []
    vm = re.search(r'data-product_variations="([^"]+)"', html)
    if vm:
        try:
            raw = htmllib.unescape(vm.group(1))
            for v in json.loads(raw):
                attrs = v.get("attributes", {})
                variants.append({
                    "variant": list(attrs.values())[0] if attrs else None,
                    "price": v.get("display_price"),
                    "regular": v.get("display_regular_price"),
                    "inStock": v.get("is_in_stock"),
                })
        except Exception as e:
            prod["verr"] = str(e)[:100]
    prod["variants"] = variants

    # price range from listing
    pm = re.search(r'class="price".*?₹([\d,]+)\s*[–-]\s*₹([\d,]+)', html, re.S)
    if pm:
        prod["priceRange"] = [pm.group(1), pm.group(2)]
    results.append(prod)
    time.sleep(0.4)
    if (i+1) % 15 == 0:
        print(f"...{i+1}/{len(urls)}", flush=True)

with open("/home/hatch/workspace/scentiqa/data/scrapes/dupify-pages.json","w") as f:
    json.dump(results, f, ensure_ascii=False, indent=1)
ok = sum(1 for r in results if r.get("variants"))
print(f"done: {ok}/{len(results)} with variants")
