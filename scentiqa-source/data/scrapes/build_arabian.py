#!/usr/bin/env python3
"""Build the Arabian Aroma site entry for real-houses.json (PARTIAL - batch 1).
Source: browser catalog extraction from https://arabianaroma.co.in/ on 2026-10-02 (IST).
Batch 1: men's pages 1-2 (96) + women's page 1 (48) = 144 listings, deduplicated by URL.
Batch 2 (men's pp.3-4, women's p.2) will be appended when the steered task returns.
Prices are collection-listing "From" prices (cheapest variant); bottle size unknown.
inspiredBy recorded ONLY where the product page explicitly states it (1 product).
"""
import json

# (name, url, fromPrice, collectionGender)
RAW = [
# ---- men's p.1 ----
("Arabian Aroma Sovage","https://arabianaroma.co.in/products/arabian-aroma-sovage",340,"men"),
("Arabian Aroma Bleu Tie Perfume","https://arabianaroma.co.in/products/arabian-aroma-bleu-tie-perfume",340,"men"),
("Arabian Aroma The Most Magnet","https://arabianaroma.co.in/products/arabian-aroma-the-most-magnet",350,"men"),
("Arabian Aroma Tamdan","https://arabianaroma.co.in/products/arabian-aroma-tamdan",350,"men"),
("Arabian Aroma Avenue","https://arabianaroma.co.in/products/arabian-aroma-avenue",340,"men"),
("Arabian Aroma Freez Water","https://arabianaroma.co.in/products/arabian-aroma-freez-water",340,"men"),
("Arabian Aroma Leather Noir","https://arabianaroma.co.in/products/arabian-aroma-leather-noir",350,"men"),
("Arabian Aroma Why","https://arabianaroma.co.in/products/arabian-aroma-why",340,"men"),
("Arabian Aroma 540 Golden Amber","https://arabianaroma.co.in/products/arabian-aroma-540-golden-amber",330,"men"),
("Arabian Aroma Havon","https://arabianaroma.co.in/products/arabian-aroma-havon-perfume",450,"men"),
("Arabian Aroma Sovage Elixir","https://arabianaroma.co.in/products/arabian-aroma-sovage-elixir",370,"men"),
("Arabian Aroma Oud Timber","https://arabianaroma.co.in/products/arabian-aroma-oud-timber",340,"men"),
("Arabian Aroma Ultra Man","https://arabianaroma.co.in/products/arabian-aroma-ultra-man",340,"men"),
("Arabian Aroma Millionaire Elixir","https://arabianaroma.co.in/products/arabian-aroma-millionaire-elixir",380,"men"),
("Arabian Aroma Marine Di Acqua","https://arabianaroma.co.in/products/arabian-aroma-marine-di-acqua",340,"men"),
("Arabian Aroma Dune Nomad","https://arabianaroma.co.in/products/arabian-aroma-dune-nomad",400,"men"),
("Arabian Aroma Cherry Noir","https://arabianaroma.co.in/products/arabian-aroma-cherry-noir",340,"men"),
("Arabian Aroma Golden Elixir","https://arabianaroma.co.in/products/arabian-aroma-golden-elixir",340,"men"),
("Arabian Aroma Truly Fabulous","https://arabianaroma.co.in/products/arabian-aroma-truly-fabulous",340,"men"),
("Arabian Aroma Millionaire","https://arabianaroma.co.in/products/arabian-aroma-millionaire",340,"men"),
("Arabian Aroma Icon","https://arabianaroma.co.in/products/icon",340,"men"),
("Inspired By Stronger With You Absolutely","https://arabianaroma.co.in/products/stronger-with-you-absolutely",340,"men"),
("Arabian Aroma Fresh Sport","https://arabianaroma.co.in/products/arabian-aroma-fresh-sport",340,"men"),
("Arabian Aroma Libera Spirit","https://arabianaroma.co.in/products/arabian-aroma-libera-spirit",340,"men"),
("Arabian Aroma Spice Riot Extreme","https://arabianaroma.co.in/products/arabian-aroma-spice-riot-extreme",340,"men"),
("Arabian Aroma Oneway","https://arabianaroma.co.in/products/arabian-aroma-oneway",340,"men"),
("Arabian Aroma Zeus Perfume","https://arabianaroma.co.in/products/arabian-aroma-zeus-perfume",340,"men"),
("Arabian Aroma Orange Terra","https://arabianaroma.co.in/products/arabian-aroma-orange-terra",340,"men"),
("Arabian Aroma Bois Citron","https://arabianaroma.co.in/products/arabian-aroma-bois-citron",350,"men"),
("Arabian Aroma Marine Di Profondo","https://arabianaroma.co.in/products/arabian-aroma-marine-di-profondo",340,"men"),
("Arabian Aroma Oud Tobacco Smoke","https://arabianaroma.co.in/products/arabian-aroma-oud-tobacco-smoke",340,"men"),
("Arabian Aroma The Blue","https://arabianaroma.co.in/products/arabian-aroma-the-blue-perfume",340,"men"),
("Arabian Aroma Sunlit Swim","https://arabianaroma.co.in/products/arabian-aroma-sunlit-swim",400,"men"),
("Arabian Aroma Viking","https://arabianaroma.co.in/products/viking-1",340,"men"),
("Arabian Aroma Stronger Together","https://arabianaroma.co.in/products/arabian-aroma-stronger-together",340,"men"),
("Arabian Aroma Paris Oud","https://arabianaroma.co.in/products/arabian-aroma-paris-oud",340,"men"),
("Arabian Aroma Mountain Water","https://arabianaroma.co.in/products/arabian-aroma-mountain-water",340,"men"),
("Arabian Aroma The One","https://arabianaroma.co.in/products/arabian-aroma-the-one",350,"men"),
("Arabian Aroma Homme Intense","https://arabianaroma.co.in/products/arabian-aroma-homme-intense",340,"men"),
("Arabian Aroma Black Blossom","https://arabianaroma.co.in/products/arabian-aroma-black-blossom",340,"men"),
("Arabian Aroma Commander Men","https://arabianaroma.co.in/products/arabian-aroma-commander-men",340,"men"),
("Arabian Aroma Magnet Night","https://arabianaroma.co.in/products/arabian-aroma-magnet-night",350,"men"),
("Arabian Aroma Fresh Tweed","https://arabianaroma.co.in/products/arabian-aroma-fresh-tweed",360,"men"),
("Arabian Aroma Apology Men","https://arabianaroma.co.in/products/arabian-aroma-apology-men",340,"men"),
("Arabian Aroma Route 121","https://arabianaroma.co.in/products/arabian-aroma-route-121",340,"men"),
("Arabian Aroma Magnet","https://arabianaroma.co.in/products/arabian-aroma-magnet",340,"men"),
("Arabian Aroma Sandal 33","https://arabianaroma.co.in/products/santal-33",400,"men"),
("Arabian Aroma Why le parfum","https://arabianaroma.co.in/products/why-le-parfum-by-arabian-aroma",340,"men"),
# ---- men's p.2 ----
("Arabian Aroma Heatwave","https://arabianaroma.co.in/products/arabian-aroma-heatwave",340,"men"),
("Arabian Aroma Marine Di Profumo","https://arabianaroma.co.in/products/arabian-aroma-marine-di-profumo",340,"men"),
("Arabian Aroma Lemon Neroli","https://arabianaroma.co.in/products/arabian-aroma-lemon-neroli",340,"men"),
("Arabian Aroma Invincible","https://arabianaroma.co.in/products/arabian-aroma-invincible",340,"men"),
("Arabian Aroma Bad Boy","https://arabianaroma.co.in/products/arabian-aroma-bad-boy",340,"men"),
("Arabian Aroma MB Legend","https://arabianaroma.co.in/products/mb-legend",340,"men"),
("Arabian Aroma Angels Land","https://arabianaroma.co.in/products/arabian-aroma-angels-land",480,"men"),
("Arabian Aroma Le Man","https://arabianaroma.co.in/products/arabian-aroma-le-man",350,"men"),
("Arabian Aroma Amber Oud","https://arabianaroma.co.in/products/arabian-aroma-amber-oud",350,"men"),
("Arabian Aroma Sky Blue","https://arabianaroma.co.in/products/arabian-aroma-sky-blue",340,"men"),
("Arabian Aroma Leyton Court Royale","https://arabianaroma.co.in/products/arabian-aroma-leyton-court-royale",400,"men"),
("Arabian Aroma Velvet Leather","https://arabianaroma.co.in/products/arabian-aroma-velvet-leather",340,"men"),
("Arabian Aroma MB Explorer","https://arabianaroma.co.in/products/mb-explorer",370,"men"),
("Arabian Aroma Sea and Spice","https://arabianaroma.co.in/products/arabian-aroma-sea-and-spice",340,"men"),
("Arabian Aroma TF Noir Extreme","https://arabianaroma.co.in/products/noir-extreme",340,"men"),
("Arabian Aroma Black Resin","https://arabianaroma.co.in/products/arabian-aroma-black-resin",360,"men"),
("Arabian Aroma Vetiver","https://arabianaroma.co.in/products/arabian-aroma-vetiver",340,"men"),
("Arabian Aroma Gentleman Prive","https://arabianaroma.co.in/products/arabian-aroma-gentleman-prive",350,"men"),
("Arabian Aroma Nuit Noire","https://arabianaroma.co.in/products/arabian-aroma-nuit-noire",450,"men"),
("Arabian Aroma Intense Cafe","https://arabianaroma.co.in/products/intense-cafe",360,"men"),
("Arabian Aroma Satin Oud","https://arabianaroma.co.in/products/arabian-aroma-satin-oud",400,"men"),
("Arabian Aroma Red Tobacco","https://arabianaroma.co.in/products/arabian-aroma-red-tobacco",360,"men"),
("Arabian Aroma Roman Girl","https://arabianaroma.co.in/products/arabian-aroma-roman-girl",340,"men"),
("Arabian Aroma Happy Men","https://arabianaroma.co.in/products/arabian-aroma-happy-men",340,"men"),
("Arabian Aroma Legend Men","https://arabianaroma.co.in/products/arabian-aroma-legend-men",340,"men"),
("Arabian Aroma Eternal Bond","https://arabianaroma.co.in/products/arabian-aroma-eternal-bond",340,"men"),
("Arabian Aroma The Afrique","https://arabianaroma.co.in/products/arabian-aroma-the-afrique",400,"men"),
("Arabian Aroma Mr Berry","https://arabianaroma.co.in/products/arabian-aroma-mr-berry",340,"men"),
("Arabian Aroma Coastal Neroli","https://arabianaroma.co.in/products/arabian-aroma-coastal-neroli",400,"men"),
("Arabian Aroma Code Parfum","https://arabianaroma.co.in/products/code-parfum",340,"men"),
("Arabian Aroma Greatest Oud","https://arabianaroma.co.in/products/arabian-aroma-greatest-oud",460,"men"),
("Arabian Aroma Men Intense Bottle","https://arabianaroma.co.in/products/arabian-aroma-men-intense-bottle",340,"men"),
("Arabian Aroma Side Effect","https://arabianaroma.co.in/products/arabian-aroma-side-effect",460,"men"),
("Arabian Aroma Fresh Carbon","https://arabianaroma.co.in/products/arabian-aroma-fresh-carbon",340,"men"),
("Arabian Aroma Invincible Victory","https://arabianaroma.co.in/products/arabian-aroma-invincible-victory",380,"men"),
("Arabian Aroma Royal Oud","https://arabianaroma.co.in/products/royal-oud",400,"men"),
("Arabian Aroma Tnoir","https://arabianaroma.co.in/products/arabian-aroma-tnoir",340,"men"),
("Arabian Aroma Lucky Millionaire","https://arabianaroma.co.in/products/arabian-aroma-lucky-millionaire",340,"men"),
("Arabian Aroma ARO Pour Homme","https://arabianaroma.co.in/products/arabian-aroma-aro-pour-homme",340,"men"),
("Arabian Aroma Elysian Grove","https://arabianaroma.co.in/products/arabian-aroma-elysian-grove",450,"men"),
("Arabian Aroma Soir Men","https://arabianaroma.co.in/products/arabian-aroma-soir-men",350,"men"),
("Arabian Aroma Gentleman","https://arabianaroma.co.in/products/arabian-aroma-gentleman",340,"men"),
("Arabian Aroma L'Eau D Pour Homme","https://arabianaroma.co.in/products/leau-d-pour-homme",340,"men"),
("Arabian Aroma 1861","https://arabianaroma.co.in/products/arabian-aroma-1861",430,"men"),
("Arabian Aroma Bottled Dark Night","https://arabianaroma.co.in/products/arabian-aroma-bottled-dark-night",340,"men"),
("Arabian Aroma Hero","https://arabianaroma.co.in/products/arabian-aroma-hero",340,"men"),
("Arabian Aroma Island Water","https://arabianaroma.co.in/products/arabian-aroma-island-water",480,"men"),
("Arabian Aroma Molecule X","https://arabianaroma.co.in/products/arabian-aroma-molecule-x",400,"men"),
# ---- women's p.1 ----
("Arabian Aroma Flora","https://arabianaroma.co.in/products/flora",340,"women"),
("Arabian Aroma Sweet Girl","https://arabianaroma.co.in/products/arabian-aroma-sweet-girl",340,"women"),
("Arabian Aroma Bombelle","https://arabianaroma.co.in/products/arabian-aroma-bombelle",340,"women"),
("Arabian Aroma One Women","https://arabianaroma.co.in/products/arabian-aroma-one-women",340,"women"),
("Arabian Aroma Roman Muse","https://arabianaroma.co.in/products/arabian-aroma-roman-muse",340,"women"),
("Arabian Aroma Paris Mademoiselle","https://arabianaroma.co.in/products/arabian-aroma-paris-mademoiselle",340,"women"),
("Arabian Aroma Hypnotic Vanilla","https://arabianaroma.co.in/products/arabian-aroma-hypnotic-vanilla",340,"women"),
("Arabian Aroma Blush Crystal","https://arabianaroma.co.in/products/arabian-aroma-blush-crystal",340,"women"),
("Arabian Aroma Lady Millionaire","https://arabianaroma.co.in/products/arabian-aroma-lady-millionaire",340,"women"),
("Arabian Aroma No 5","https://arabianaroma.co.in/products/no-5",370,"women"),
("Arabian Aroma 540 Golden Amber","https://arabianaroma.co.in/products/arabian-aroma-540-golden-amber",330,"women"),
("Arabian Aroma Cherry Noir","https://arabianaroma.co.in/products/arabian-aroma-cherry-noir",340,"women"),
("Arabian Aroma Truly Fabulous","https://arabianaroma.co.in/products/arabian-aroma-truly-fabulous",340,"women"),
("Arabian Aroma Ophira Noir","https://arabianaroma.co.in/products/arabian-aroma-ophira-noir",340,"women"),
("Arabian Aroma Paris Oud","https://arabianaroma.co.in/products/arabian-aroma-paris-oud",340,"women"),
("Arabian Aroma Adora Bloom","https://arabianaroma.co.in/products/arabian-aroma-adora-bloom",340,"women"),
("Arabian Aroma Coastal Cool","https://arabianaroma.co.in/products/arabian-aroma-coastal-cool",340,"women"),
("Arabian Aroma Love Shy","https://arabianaroma.co.in/products/arabian-aroma-love-shy",340,"women"),
("Arabian Aroma Sandal 33","https://arabianaroma.co.in/products/santal-33",400,"women"),
("Arabian Aroma Vanilla 21","https://arabianaroma.co.in/products/arabian-aroma-vanilla-21",350,"women"),
("Arabian Aroma Midnight Crystal","https://arabianaroma.co.in/products/arabian-aroma-midnight-crystal",340,"women"),
("Arabian Aroma Amber Oud","https://arabianaroma.co.in/products/arabian-aroma-amber-oud",350,"women"),
("Arabian Aroma Sky Blue","https://arabianaroma.co.in/products/arabian-aroma-sky-blue",340,"women"),
("Arabian Aroma Sea and Spice","https://arabianaroma.co.in/products/arabian-aroma-sea-and-spice",340,"women"),
("Arabian Aroma Burberry Body","https://arabianaroma.co.in/products/berry-body",340,"women"),
("Arabian Aroma Sweet Apple","https://arabianaroma.co.in/products/arabian-aroma-sweet-apple",380,"women"),
("Arabian Aroma Spring Aqua Floris","https://arabianaroma.co.in/products/arabian-aroma-spring-aqua-floris",340,"women"),
("Arabian Aroma Miss Eau de Parfum","https://arabianaroma.co.in/products/miss-eau-de-parfum",340,"women"),
("Arabian Aroma Last Chance","https://arabianaroma.co.in/products/arabian-aroma-last-chance",340,"women"),
("Arabian Aroma Intense Cafe","https://arabianaroma.co.in/products/intense-cafe",360,"women"),
("Arabian Aroma Satin Oud","https://arabianaroma.co.in/products/arabian-aroma-satin-oud",400,"women"),
("Arabian Aroma Red Tobacco","https://arabianaroma.co.in/products/arabian-aroma-red-tobacco",360,"women"),
("Arabian Aroma Bright Blue Intense","https://arabianaroma.co.in/products/arabian-aroma-bright-blue-intense",350,"women"),
("Arabian Aroma Oud Blossom","https://arabianaroma.co.in/products/arabian-aroma-oud-blossom",340,"women"),
("Arabian Aroma The Afrique","https://arabianaroma.co.in/products/arabian-aroma-the-afrique",400,"women"),
("Arabian Aroma White Rush","https://arabianaroma.co.in/products/arabian-aroma-white-rush",340,"women"),
("Arabian Aroma Toxic Girl","https://arabianaroma.co.in/products/arabian-aroma-toxic-girl",340,"women"),
("Arabian Aroma Roses Vanille","https://arabianaroma.co.in/products/roses-vanille",350,"women"),
("Arabian Aroma Sea Rose","https://arabianaroma.co.in/products/arabian-aroma-sea-rose",340,"women"),
("Arabian Aroma Bamboo Bloom","https://arabianaroma.co.in/products/arabian-aroma-bamboo-bloom",340,"women"),
("Arabian Aroma Euphoria","https://arabianaroma.co.in/products/arabian-aroma-euphoria",350,"women"),
("Arabian Aroma Elysian Grove","https://arabianaroma.co.in/products/arabian-aroma-elysian-grove",450,"women"),
("Arabian Aroma Soir Men","https://arabianaroma.co.in/products/arabian-aroma-soir-men",350,"women"),
("Arabian Aroma 1861","https://arabianaroma.co.in/products/arabian-aroma-1861",430,"women"),
("Arabian Aroma Weekend Rush","https://arabianaroma.co.in/products/arabian-aroma-weekend-rush",340,"women"),
("Arabian Aroma Island Water","https://arabianaroma.co.in/products/arabian-aroma-island-water",480,"women"),
("Arabian Aroma The Way","https://arabianaroma.co.in/products/arabian-aroma-the-way",350,"women"),
("Arabian Aroma Simple Women","https://arabianaroma.co.in/products/arabian-aroma-simple-women",340,"women"),
]

EXPLICIT_INSPIRED = {
    "https://arabianaroma.co.in/products/stronger-with-you-absolutely": "Emporio Armani Stronger With You Absolutely",
}

def build():
    seen = {}
    for name, url, price, g in RAW:
        if url in seen:
            # listed in both collections -> unisex
            seen[url]["gender"] = "unisex"
            seen[url]["collections"].append(g)
        else:
            seen[url] = {"name": name, "url": url, "priceInr": price, "gender": g, "collections": [g]}
    products = []
    for url, r in seen.items():
        p = {
            "name": r["name"],
            "url": url,
            "conc": "edp",
            "gender": r["gender"],
            "priceInr": r["priceInr"],
            "sizeMl": None,
            "sizeNote": "Collection listing shows a 'From' price; multiple sizes likely, exact size unconfirmed.",
            "inspiredBy": EXPLICIT_INSPIRED.get(url),
            "inspiredByRaw": EXPLICIT_INSPIRED.get(url),
            "claimedAccuracy": None,
            "claimText": None,
        }
        products.append(p)
    entry = {
        "site": "https://arabianaroma.co.in",
        "status": "ok",
        "houseSlug": "arabian-aroma",
        "sellerSlug": "arabian-aroma-official",
        "importMode": "auto",
        "priceProvenance": "live",
        "observedAt": "2026-10-02",
        "house": {
            "name": "Arabian Aroma",
            "city": "Kanpur",
            "country": "India",
            "type": "indian_clone",
            "site": "https://arabianaroma.co.in",
            "founded": 2020,
            "desc": "Kanpur house (arabianaroma.co.in) with 240+ listings across men's and women's collections, priced 'From' Rs.330-Rs.480. Reportedly sold ~500,000 bottles in 2024; its original creation Seduction is now its bestseller. Most scents carry lookalike names but the site's product pages do not explicitly name designer inspirations, so no inspired-by mappings are recorded except where the page states one. Researched live 2026-10-02.",
        },
        "products": products,
        "notes": "Batch 1 (2026-10-02 IST): men's collection pages 1-2 + women's page 1 = 144 listings deduplicated to N unique products by URL (cross-listed items marked unisex). Prices are collection 'From' prices; exact bottle sizes unconfirmed. Only one product page explicitly states a designer inspiration ('Inspired By Stronger With You Absolutely'). Batch 2 (men's pp.3-4, women's p.2) pending.",
    }
    return entry

if __name__ == "__main__":
    entry = build()
    n = len(entry["products"])
    entry["notes"] = entry["notes"].replace("deduplicated to N unique", f"deduplicated to {n} unique")
    print(f"unique products={n} explicit inspiredBy={sum(1 for p in entry['products'] if p['inspiredBy'])}")
    with open("/home/hatch/workspace/scentiqa/data/scrapes/arabian-aroma.json", "w") as f:
        json.dump(entry, f, ensure_ascii=False, indent=1)
    print("wrote data/scrapes/arabian-aroma.json (batch 1)")
