#!/usr/bin/env python3
"""Build the RZLER site entry for real-houses.json.
Source: browser catalog extraction from https://perfume.rzler.com/ on 2026-10-02 (IST).
43 products (41 perfumes + 2 discovery sets), every product page opened individually.
All products marked SOLD OUT at observation. Prices are sale prices (regular in parens).
inspiredBy copied verbatim from each page's "Inspired by" line; canonicalized here
(de-obfuscation/typo-fix only, never inference). Notes from the Key Notes accordion.
"""
import json

# verbatim "Inspired by" -> canonical (typo fix / word order only)
CANON = {
 "Rasasi Hawas": "Rasasi Hawas",
 "YSL Libre Intence": "Yves Saint Laurent Libre Intense",
 "Xerxoff Nexos": "Xerjoff Naxos",
 "Louis Vuitton Ombre Nomade": "Louis Vuitton Ombre Nomade",
 "Latafa Kamrah": "Lattafa Khamrah",
 "Musk Rizali": "Musk Rizali",
 "Tiziana Terenzi Kirke": "Tiziana Terenzi Kirke",
 "Oud Initio": "Oud Initio",
 "Tomford Tobacco Vanila": "Tom Ford Tobacco Vanille",
 "Moncera Red Tobacco": "Mancera Red Tobacco",
 "BR540": "Maison Francis Kurkdjian Baccarat Rouge 540",
 "Roses of No Man Land": "Byredo Rose of No Man's Land",
 "Gucci Flora": "Gucci Flora",
 "Kayali Eden Juicy Apple": "Kayali Eden Juicy Apple",
 "Raspberry Vanilla": "Raspberry Vanilla",
 "Burbery Weekend": "Burberry Weekend",
 "PDM Delina Exclusive": "Parfums de Marly Delina Exclusif",
 "Bombshell": "Victoria's Secret Bombshell",
 "Fleir Nerotic": "Fleir Nerotic",
 "Vampior Blood": "Vampior Blood",
 "Ameer Al Oudh Intense Oud Lattafa Perfumes": "Lattafa Ameer Al Oudh Intense Oud",
 "Althair Parfums de Marly": "Parfums de Marly Althair",
 "Tom ford oud wood": "Tom Ford Oud Wood",
 "1 Million by Rabanne": "Paco Rabanne 1 Million",
 "Titan Skin Raw": "Titan Skinn Raw",
 "Dylan Blue Versace": "Versace Dylan Blue",
 "Green Irish Tweed": "Creed Green Irish Tweed",
 "Angels' Share by Kilian": "Kilian Angels Share",
 "Terre d'Hermes Intense by Hermes": "Hermes Terre d'Hermes Intense",
 "Flowerbomb Viktor&Rolf": "Viktor and Rolf Flowerbomb",
 "Gucci Bloom": "Gucci Bloom",
 "Armani My Way": "Giorgio Armani My Way",
 "Burberry Her": "Burberry Her",
 "CD J'adore": "Dior J'adore",
 "CK Eternity": "Calvin Klein Eternity",
 "YSL Y": "Yves Saint Laurent Y",
 "Black Opium": "Yves Saint Laurent Black Opium",
 "Gucci guilty": "Gucci Guilty",
 "Kayali Capri in a Bottle Lemon Sugar 14": "Kayali Capri in a Bottle Lemon Sugar",
}

def N(s):
    return [x.strip() for x in s.split(",")] if s else []

# (name, handle, sale, regular, sizeMl|setNote, inspiredByRaw|None, top, mid, base, extraNote)
P = [
 ("RZLER Nautis","nautis",649,899,50,"Rasasi Hawas","Bergamot, Lemon, Apple, Cinnamon","Aquatic notes, Plum, Cardamom, Orange blossom","Musk, Ambergris, Patchouli, Driftwood",None),
 ("RZLER Juliet","juliet",649,899,50,"YSL Libre Intence","Lavender, Mandarin, Bergamot","Jasmine, Orchid, Orange blossom","Vanilla, Amber, Ambergris, Tonka bean",None),
 ("RZLER Nexorien","nexorien",1299,1699,50,"Xerxoff Nexos","Juicy citrus, Bergamot, Lavender","Honey, Cinnamon, Cashmeran, Jasmine","Tonka bean, Tobacco leaf, Vanilla",None),
 ("RZLER Nomade","nomade",999,1299,50,"Louis Vuitton Ombre Nomade","Rose, Incense, Raspberry","Oud Rose, Saffron","Amber, Leather, Musk",None),
 ("RZLER Kamrah","kamrah",999,1299,50,"Latafa Kamrah","Cinnamon, Nutmeg, Bergamot","Dates, Praline, Tuberose, Mahonial","Vanilla, Amberwood, Myrrh, Akigalawood",None),
 ("RZLER Durby","durby",999,1299,50,"Musk Rizali","White florals, Lily-of-the-valley","Powdery notes, Tolu balsam","Vanilla",None),
 ("RZLER Krike","krike",999,1299,50,"Tiziana Terenzi Kirke","Passionfruit, Pear, Raspberry, Peach","Lily of the valley","Musk, Sandalwood, Patchouli",None),
 ("RZLER Grandoud","grandoud",849,1199,50,"Oud Initio","Bergamot, Lavender","Fir, Saffron, Agarwood","Oud",None),
 ("RZLER Vanilian Tobaco","vanilian-tobaco",649,899,50,"Tomford Tobacco Vanila","Tobacco leaf, Spice","Vanilla, Tobacco blossom, Tonka bean","Dried fruits, Wood",None),
 ("RZLER Red Monster","red-monster",649,899,50,"Moncera Red Tobacco","Cinnamon, Saffron, White pear, Green apple, Nutmeg","Patchouli, Jasmine","Tobacco, Vanilla, Amber, Sandalwood",None),
 ("RZLER Spicy Grove","spicy-grove",849,1199,50,"BR540","Saffron, Jasmine","Hedione, Agarwood, Ambergris, Fir","Oakmoss, Sugar, Cedar",None),
 ("RZLER British Rose","british-rose",849,1199,50,"Roses of No Man Land","Rose, Pink pepper","Raspberry blossom, Rose","Amber, Papyrus",None),
 ("RZLER Garden Girl","garden-girl",649,899,50,"Gucci Flora","Peony, Mandarin orange, Pear, Pepper","Rose, Osmanthus","Sandalwood, Musk, Patchouli",None),
 ("RZLER Juicy Apple","juicy-apple",649,899,50,"Kayali Eden Juicy Apple","Red apple, Lychee, Blackcurrant","Wild berries, Jasmine, May rose, Raspberry blossom","Vanilla, Sugar, Amber, Musk",None),
 ("RZLER Vanilian Berry","vanilian-berry",849,1199,50,"Raspberry Vanilla","Black currant, Blueberry, Red wine","Jasmine, Oris Root, Osmanthus","Vanilla, Sandalwood",None),
 ("RZLER Over The Week","over-the-week",649,899,50,"Burbery Weekend","Mandarin, Mignonette, Sage","Peach blossom, Red cyclamen, Nectarine","Musk, Sandalwood, Cedar",None),
 ("RZLER Delinia","delinia",849,1199,50,"PDM Delina Exclusive","Pear, Grapefruit, Lychee, Bergamot","Turkish Rose, Oud","Woody notes, Vanilla, Amber, Musk",None),
 ("RZLER Lady Shield","lady-shield",699,999,50,"Bombshell","Passionfruit, Grapefruit, Pineapple, Tangerine, Strawberry","Peony, Jasmine, Lily of the valley, Red berries","Musk, Oakmoss",None),
 ("RZLER Nerotic","nerotic",999,1299,50,"Fleir Nerotic","Litchi, Peach, Bergamot","Peony, Orange blossom, Petalia","Musk, Moss, Woody notes",None),
 ("RZLER Vampblow","vampblow",849,1199,50,"Vampior Blood","Red berries, Plum, Pomegranate","Jasmine, Gardenia","Vetiver, Vanilla Flower",None),
 ("RZLER Veil of Rain","veil-of-rain",649,899,50,None,"Petrichor, Creamy Sandalwood","Cypriol","Patchouli","H1: 'Inspired by the First Rain Scent' (a concept, not a designer fragrance) - no mapping."),
 ("RZLER Oud of Gold","oud-of-gold",649,899,50,"Ameer Al Oudh Intense Oud Lattafa Perfumes","Woody notes of Agarwood","Sugar, Vanilla","Sandalwood, Oud",None),
 ("RZLER Tharr","tharr",1249,1699,50,"Althair Parfums de Marly","Cardamom","Bourbon vanilla, Elemi","Praline, Musk, Tonka",None),
 ("RZLER Honey Kissed","honey-kissed",849,1199,50,None,"Candied apple","Honey","Rose","No 'Inspired by' line on page - no mapping."),
 ("RZLER Discovery Set: The Voyager Collection","rzler-discovery-set-the-voyager-collection",1499,1999,"SET",None,None,None,None,"Men's discovery set: 5 x 15ml minis (Nexorien, Nomade, Oud of Gold, Nautis, Durby). No 'Inspired by' line - no mapping."),
 ("RZLER Discovery Set: The Lush Collection Women","rzler-discovery-set-the-lush-collection-women",1499,1999,"SET",None,None,None,None,"Women's discovery set: 5 mini perfumes (Lady Shield, Vampblow, Delinia, Juliet, Vanilian Berry). No 'Inspired by' line - no mapping."),
 ("RZLER Forest Wood","forest-wood",899,1299,50,"Tom ford oud wood","Cardamom, Pink Pepper","Oud, Patchouli","Tonka Bean, Vanilla, Oud",None),
 ("RZLER Luxury Gold","luxury-gold",649,899,50,"1 Million by Rabanne","Blood Mandarin, Grapefruit, Mint","Cinnamon, Spicy Notes, Rose","Amber, Leather, Woody Notes",None),
 ("RZLER Raw","raw",649,899,50,"Titan Skin Raw","Bergamot, Watery Fruits, Mandarin","Violet Leaves, Pomarose, Carnation, Geranium","Indonesian Patchouli, Cashmeran, Gaiac Wood",None),
 ("RZLER Dylan Blue","dylan-blue",649,899,50,"Dylan Blue Versace","Bergamot, Grapefruit, Aquatic Notes","Black Pepper, Patchouli, Violet Leaf","Musk, Saffron, Tonka Bean, Incense",None),
 ("RZLER Irish Moss","irish-moss",649,899,50,"Green Irish Tweed","Vervain, Iris","Violet Leaf, Geranium","Sandalwood, Oakmoss, Musk",None),
 ("RZLER Angel Share","angel-share",650,899,50,"Angels' Share by Kilian","Cognac, Raspberry","Tonka Bean, Oak, Caramel","Vanilla, Sandalwood, Oakmoss",None),
 ("RZLER Terre d herm","terre-d-herm",849,1199,50,"Terre d'Hermes Intense by Hermes","Bergamot, Black Pepper","Coffee, Licorice","Woody Notes, Lava, Stone","Name spelled 'Terre d herm' on site."),
 ("RZLER Flowerbomb","flowerbomb",649,899,50,"Flowerbomb Viktor&Rolf","Tea, Bergamot, Osmanthus","Orchid, Jasmine, Rose, Freesia, African Orange Flower","Patchouli, Musk, Vanilla",None),
 ("RZLER Eternal Blossom","eternal-blossom",649,899,50,"Gucci Bloom","Tuberose","Jasmine Bud","Rangoon Creeper",None),
 ("RZLER My Essence","my-essence",649,899,50,"Armani My Way","Pear, Bergamot, Orange Blossom","Violet Leaf, Tuberose, Jasmine","Vanilla, White Musk, Cedarwood",None),
 ("RZLER Her Legacy","her-legacy",649,899,50,"Burberry Her","Strawberry, Raspberry, Blackberry","Jasmine, Violet","Vanilla, Musk, Amberwood, Oakmoss",None),
 ("RZLER Adorable Blossom","adorable-blossom",649,899,50,"CD J'adore","Melon, Pear, Magnolia, Peach, Bergamot","Jasmine, Rose, Freesia, Tuberose, Orchid, Lily of the Valley, Violet, Plum","Sandalwood, Vanilla, Cedar",None),
 ("RZLER Eternal Grace","eternal-grace",649,899,50,"CK Eternity","Passionflower, Grapefruit, Ginger","White Florals, Lily-of-the-Valley, Peony","Musk, Amber",None),
 ("RZLER Y Essence","y-essence",649,899,50,"YSL Y","Lemon, Mint, Bergamot, Ginger","Apple, Sage, Geranium, Violet Leaf, Pineapple","Amberwood, Tonka Bean, Cedarwood, Incense",None),
 ("RZLER Midnight Seduction","midnight-seduction",650,899,50,"Black Opium","Pink Pepper, Orange Blossom, Pear","Coffee, Jasmine, Bitter Almond, Licorice","Vanilla, Patchouli, Cedarwood, Cashmere Wood",None),
 ("RZLER Women Guilt","women-guilt",650,899,50,"Gucci guilty","Pink Pepper, Mandarin Orange, Bergamot","Lilac, Violet, Geranium, Rose","Patchouli, Amber",None),
 ("RZLER Vanillin Blast","vanillin-blast",849,1199,50,"Kayali Capri in a Bottle Lemon Sugar 14","Sugar, Lemon","Raspberry, Freesia","Vanilla, Musk",None),
]

def build():
    products = []
    for row in P:
        name, handle, sale, reg, size, raw, top, mid, base, note = row
        canon = CANON.get(raw) if raw and raw in CANON else (raw if raw and not note else None)
        if raw and raw not in CANON and not (note and "no mapping" in note.lower()):
            raise SystemExit(f"unmapped inspiredBy: {raw!r}")
        is_set = (size == "SET")
        prod = {
            "name": name,
            "url": f"https://perfume.rzler.com/products/{handle}",
            "conc": "edp",
            "gender": "unisex",
            "priceInr": sale,
            "mrpInr": reg,
            "sizeMl": None if is_set else size,
            "sizeNote": "Discovery/gift set." if is_set else None,
            "inspiredBy": canon,
            "inspiredByRaw": raw,
            "claimedAccuracy": None,
            "claimText": (f"Key notes as published by the house. {note}" if note else "Key notes as published by the house.") if (top or mid or base) else note,
            "accords": [],
            "accordSource": None,
            "notesTop": N(top),
            "notesHeart": N(mid),
            "notesBase": N(base),
            "notesUntiered": None,
            "notesSource": "brand" if (top or mid or base) else None,
            "inStock": False,
            "stockNote": "Marked 'Sold out' on every product page at observation (2026-10-02).",
        }
        products.append(prod)
    entry = {
        "site": "https://perfume.rzler.com",
        "status": "ok",
        "houseSlug": "rzler",
        "sellerSlug": "rzler-official",
        "importMode": "auto",
        "priceProvenance": "live",
        "observedAt": "2026-10-02",
        "house": {
            "name": "RZLER",
            "city": None,
            "country": "India",
            "type": "indian_clone",
            "site": "https://perfume.rzler.com",
            "founded": 2023,
            "desc": "Indian dupe house (perfume.rzler.com) with a premium-minimal identity; 50ml EDPs Rs.649-Rs.1299 (sale) with full key-note pyramids and explicit 'Inspired by' lines per scent. Entire catalog marked sold out at observation on 2026-10-02. Researched live 2026-10-02.",
        },
        "products": products,
        "notes": "43 products via Shop All (3 pages) cross-verified against the official sitemap, 2026-10-02 IST. 41 single 50ml perfumes + 2 discovery sets. Every product page opened individually. All marked sold out.",
    }
    return entry

if __name__ == "__main__":
    entry = build()
    assert len(entry["products"]) == 43, len(entry["products"])
    m = sum(1 for p in entry["products"] if p["inspiredBy"])
    print(f"products=43 inspiredBy={m}")
    with open("/home/hatch/workspace/scentiqa/data/scrapes/rzler.json", "w") as f:
        json.dump(entry, f, ensure_ascii=False, indent=1)
    print("wrote data/scrapes/rzler.json")
