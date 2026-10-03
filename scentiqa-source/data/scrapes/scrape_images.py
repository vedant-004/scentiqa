#!/usr/bin/env python3
"""Extract og:image product image URLs for all new-site products.
Reads product URLs from scrape JSONs, fetches og:image via curl.
"""
import json, re, subprocess, time, sys

def get_image(url):
    try:
        r = subprocess.run(["curl","-s","--max-time","20","-L",url,"-A","Mozilla/5.0"],
                           capture_output=True, text=True, timeout=25)
        html = r.stdout
        # try og:image first
        m = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html)
        if not m:
            m = re.search(r'<meta[^>]+content="([^"]+)"[^>]+property="og:image"', html)
        if m:
            img = m.group(1)
            # upgrade Shopify CDN to a reasonable size
            return img
        return None
    except Exception:
        return None

# collect all product URLs from the 6 scrape files
sources = {}
for name, path in [
    ("no-name", "/home/hatch/workspace/scentiqa/data/scrapes/no-name-perfume.json"),
    ("rzler", "/home/hatch/workspace/scentiqa/data/scrapes/rzler.json"),
    ("kannauj", "/home/hatch/workspace/scentiqa/data/scrapes/kannauj-fragrance.json"),
    ("arabian", "/home/hatch/workspace/scentiqa/data/scrapes/arabian-aroma.json"),
    ("celestial", "/home/hatch/workspace/scentiqa/data/scrapes/celestial-perfume.json"),
    ("dupify", "/home/hatch/workspace/scentiqa/data/scrapes/dupify.json"),
]:
    try:
        d = json.load(open(path))
        prods = d.get("products", d if isinstance(d, list) else [])
        urls = [(p.get("url"), p.get("name")) for p in prods if p.get("url")]
        sources[name] = urls
        print(f"{name}: {len(urls)} URLs", flush=True)
    except Exception as e:
        print(f"{name}: ERROR {e}", flush=True)

# also check My Perfume Secrets in real-houses.json
real = json.load(open("/home/hatch/workspace/scentiqa/data/real-houses.json"))
for s in real["sites"]:
    if s.get("houseSlug") == "my-perfume-secrets":
        urls = [(p.get("url"), p.get("name")) for p in s.get("products", []) if p.get("url")]
        sources["mps"] = urls
        print(f"mps: {len(urls)} URLs", flush=True)

results = {}
total = sum(len(v) for v in sources.values())
done = 0
for site, urls in sources.items():
    site_results = {}
    for url, name in urls:
        img = get_image(url)
        site_results[url] = {"name": name, "image": img}
        done += 1
        if done % 25 == 0:
            print(f"...{done}/{total}", flush=True)
        time.sleep(0.25)
    results[site] = site_results
    ok = sum(1 for v in site_results.values() if v["image"])
    print(f"{site}: {ok}/{len(urls)} images found", flush=True)

with open("/home/hatch/workspace/scentiqa/data/scrapes/product-images.json", "w") as f:
    json.dump(results, f, ensure_ascii=False, indent=1)
print("saved")
