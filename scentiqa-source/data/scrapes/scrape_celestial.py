#!/usr/bin/env python3
"""Scrape remaining Celestial Perfume product pages via curl.
Extracts title, variants (size/price/compare_at/available) from Shopify HTML.
"""
import json, re, subprocess, sys, time

HANDLES = [
 "perfume",
 "inspired-by-acqua-di-gio-pr0fumo",
 "perfume-3",
 "inspired-by-armani-c0de",
 "inspired-by-bleu-de-ch-nel",
 "inspired-by-gucci-fl0ra-worn-by-alia-bh-tt",
 "inspired-by-creed-green-irish-twe3d-worn-by-s-hid-kapoor",
 "inspired-by-bvlgari-men-in-bl-ck",
 "inspired-by-tomford-oud-w00d-worn-by-moni-r0y-am-n-gupta-bo-t-unisex",
 "inspired-by-terre-de-herme-worn-by-sanj-y-dutt",
 "inspired-by-creed-av3ntus-worn-by-d-vid-beckh-m-unisex",
 "inspired-by-dior-homme-p-rfum",
 "inspired-by-ck-0ne",
 "inspired-by-azzaro-the-most-w-nted",
 "inspired-by-viking-worn-by-vir-t-k0hli",
 "inspired-by-david-0ff-cool-w-ter-worn-by-aksh-y-kum-r-unisex",
 "inspired-by-diptyuqe-tam-da0",
 "copy-of-perfum-23",
 "copy-of-copy-of-perfum-22",
 "copy-of-copy-of-perfume-4",
 "inspired-by-paco-rabbane-one-milli0n-worn-by-ed-sheer-n",
 "copy-of-copy-of-perfume-5",
 "inspired-by-carolina-herrera-go0d-girl",
 "king-of-bollywood-perfume",
 "inspired-by-gucci-blo0m-worn-by-aditi-rao-hydari",
 "inspired-ch-nel-coco-m-demoiselle-worn-by-ileana-dcruz",
 "inspired-by-ysl-black-0pium",
 "inspired-by-b-ccarat-r0uge-540",
 "inspired-by-roja-ely-ium-worn-by-h-rdik-p-ndya",
 "inspired-by-ch-nel-n0-5-worn-by-s-ra-ali-kh-n",
 "white-oud",
 "purple-oud",
 "mitti",
 "ameer-oud",
 "imperial",
 "flora",
 "cool-water",
 "kesar-chandan",
 "jasmine",
 "mogra",
 "musk-saphire"
]

def fetch(handle):
    url = f"https://celestialperfume.in/products/{handle}"
    r = subprocess.run(["curl","-s","--max-time","25",url,"-A","Mozilla/5.0"],
                       capture_output=True, text=True)
    return r.stdout

def parse(html, handle):
    out = {"handle": handle}
    m = re.search(r'<meta property="og:title" content="([^"]*)"', html)
    out["title"] = m.group(1) if m else None
    # find product JSON variants
    variants = []
    vi = html.find('"variants":')
    if vi != -1:
        s = html.find('[', vi)
        depth, j = 0, s
        while j < len(html):
            if html[j] == '[': depth += 1
            elif html[j] == ']':
                depth -= 1
                if depth == 0: break
            j += 1
        try:
            for v in json.loads(html[s:j+1]):
                variants.append({
                    "title": v.get("public_title") or v.get("title"),
                    "price": v.get("price"),
                    "compare_at": v.get("compare_at_price"),
                    "available": v.get("available"),
                })
        except Exception as e:
            out["verr"] = str(e)[:80]
    out["variants"] = variants
    # description notes: "Top notes are ...; middle notes are ...; base notes are ..."
    dm = re.search(r'Top notes are ([^.;]*);?\s*middle notes are ([^.;]*);?\s*base notes are ([^.;]*)[.;]', html, re.I)
    if dm:
        out["notes"] = [dm.group(1), dm.group(2), dm.group(3)]
    return out

results = []
for i, h in enumerate(HANDLES):
    html = fetch(h)
    if len(html) < 5000:
        results.append({"handle": h, "error": f"short response {len(html)}"})
    else:
        results.append(parse(html, h))
    time.sleep(0.4)
    if (i+1) % 15 == 0:
        print(f"...{i+1}/{len(HANDLES)}", flush=True)

existing = json.load(open("/home/hatch/workspace/scentiqa/data/scrapes/celestial-pages.json"))
seen = {p["handle"] for p in existing}
existing.extend(p for p in results if p["handle"] not in seen)
with open("/home/hatch/workspace/scentiqa/data/scrapes/celestial-pages.json","w") as f:
    json.dump(existing, f, ensure_ascii=False, indent=1)
ok = sum(1 for r in results if r.get("variants"))
print(f"done: {ok}/{len(results)} with variants")
