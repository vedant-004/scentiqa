#!/usr/bin/env python3
"""Build celestial-perfume.json from scraped product pages.
Combines 105 scraped products, excludes Tejasswi -copy dupes (already filtered)
and the Rs.199 empty gift box. Maps obfuscated titles to explicit inspiredBy originals.
"""
import json, re

PAGES = json.load(open("/home/hatch/workspace/scentiqa/data/scrapes/celestial-pages.json"))

# handle -> (clean name, inspiredBy original or None, category)
# inspiredBy only where the brand explicitly states it in the title
MAPPING = {
 "inspired-by-acqua-di-gio-pr0fumo-copy-2": ("Allure Homme Sport", "Chanel Allure Homme Sport", "perfume"),
 "inspired-by-je-n-p-ul-g-ultier-ultra-m-le": ("Ultra Male", "Jean Paul Gaultier Ultra Male", "perfume"),
 "inspired-by-r-s-si-h-wµs-p0µr-h0mu-perfume": ("Hawas Pour Homme", "Rasasi Hawas", "perfume"),
 "inspired-by-r-s-si-h-wµs-p0µr-h0mu-perfume-copy": ("Khamrah", "Lattafa Khamrah", "perfume"),
 "inspired-by-l-tt-fa-kh-mrah-perfume-copy": ("Wisal Dhahab", "Ajmal Wisal Dhahab", "perfume"),
 "inspired-by-jm-l-wis-l-dh-h-b-perfume-copy": ("Dylan Blue", "Versace Dylan Blue", "perfume"),
 "inspired-by-di0r-j-dore-perfume": ("J'adore", "Dior J'adore", "perfume"),
 "inspired-by-lv-im-gin-tions": ("Imagination", "Louis Vuitton Imagination", "perfume"),
 "inspired-by-my-w-y-gi0rgi0-arm-ni": ("My Way", "Giorgio Armani My Way", "perfume"),
 "inspired-by-k-y-li-eden-juicy-apple": ("Eden Juicy Apple", "Kayali Eden Juicy Apple", "perfume"),
 "inspired-by-gi0rgi0-arm-ni-si": ("Si", "Giorgio Armani Si", "perfume"),
 "inspired-by-k-yali-v-nilla": ("Vanilla", "Kayali Vanilla 28", "perfume"),
 "inspired-by-c-lvin-klein-0bsessi0n-worn-by-salman-khan": ("Obsession", "Calvin Klein Obsession", "perfume"),
 "inspired-by-pr-da-p-rad0xe": ("Paradoxe", "Prada Paradoxe", "perfume"),
 "inspired-by-jo-m-lone-0range-bl0ssom-worn-by-deepika-p-duk0ne": ("Orange Blossom", "Jo Malone London Orange Blossom", "perfume"),
 "inspired-by-gucci-flora-gorgeous-orchid": ("Flora Gorgeous Orchid", "Gucci Flora Gorgeous Orchid", "perfume"),
 "inspired-by-gucci-flora-gorgeous-jasmine": ("Flora Gorgeous Jasmine", "Gucci Flora Gorgeous Jasmine", "perfume"),
 "inspired-by-gucci-fl0r-gorgeous-magnolia": ("Flora Gorgeous Magnolia", "Gucci Flora Gorgeous Magnolia", "perfume"),
 "inspired-by-p-co-rabbane-lady-milli0n-perfume": ("Lady Million", "Paco Rabanne Lady Million", "perfume"),
 "inspired-by-miss-d-perfume": ("Miss Dior", "Dior Miss Dior", "perfume"),
 "inspired-by-cr-7-worn-by-cristi-no-ron-ld0": ("CR7", "Cristiano Ronaldo CR7", "perfume"),
 "inspired-by-l-tt-fa-kh-mrah-waha-perfume": ("Khamrah Waha", "Lattafa Khamrah", "perfume"),
 "inspired-by-kaaf-ahmed-al-maghribi": ("Kaaf", "Ahmed Al Maghribi Kaaf", "perfume"),
 "first-rain-perfume": ("First Rain", None, "perfume"),
 "inspired-by-hugo-boss-bottle-absoulte": ("Bottled Absolute", "Hugo Boss Bottled Absolute", "perfume"),
 "inspired-by-versace-crystal-noir": ("Crystal Noir", "Versace Crystal Noir", "perfume"),
 "inspired-by-aqva-pour-homme-marine-bvlgari": ("Aqva Pour Homme Marine", "Bvlgari Aqva Pour Homme Marine", "perfume"),
 "inspired-by-valentino-donna-born-in-roma-valentino": ("Donna Born In Roma", "Valentino Donna Born In Roma", "perfume"),
 "inspired-by-lv-symphony": ("Symphony", "Louis Vuitton Symphony", "perfume"),
 "inspired-by-emporio-armani-stronger-with-you": ("Stronger With You", "Emporio Armani Stronger With You", "perfume"),
 "inspired-by-narciso-rodriguez-for-her": ("For Her", "Narciso Rodriguez For Her", "perfume"),
 "inspired-by-jean-paul-gaultier-so-scandal": ("So Scandal", "Jean Paul Gaultier So Scandal", "perfume"),
 "inspired-by-hypnotic-poison-dior": ("Hypnotic Poison", "Dior Hypnotic Poison", "perfume"),
 "inspired-by-althair-parfums-de-marly": ("Althair", "Parfums de Marly Althair", "perfume"),
 "inspired-by-yves-saint-laurent-myslf-copy": ("MYSLF", "Yves Saint Laurent MYSLF", "perfume"),
 "inspired-by-carolina-herrera-good-girl-blush": ("Good Girl Blush", "Carolina Herrera Good Girl Blush", "perfume"),
 "inspired-by-burberry-goddess": ("Goddess", "Burberry Goddess", "perfume"),
 "inspired-by-oud-maracuja-by-m-is0n-cr-velli": ("Oud Maracuja", "Maison Crivelli Oud Maracuja", "perfume"),
 "inspired-by-ysl-tuxedo": ("Tuxedo", "Yves Saint Laurent Tuxedo", "perfume"),
 "inspired-by-d-purple-oud": ("Purple Oud", None, "perfume"),
 "inspired-by-t0mford-t-abacc0-v-nille": ("Tobacco Vanille", "Tom Ford Tobacco Vanille", "perfume"),
 "inspired-by-ysl-libre": ("Libre", "Yves Saint Laurent Libre", "perfume"),
 "inspired-by-ombre-nom-de": ("Ombre Nomade", "Louis Vuitton Ombre Nomade", "perfume"),
 "perfume": ("Sauvage", "Dior Sauvage", "perfume"),
 "inspired-by-acqua-di-gio-pr0fumo": ("Acqua di Gio Profumo", "Giorgio Armani Acqua di Gio Profumo", "perfume"),
 "perfume-3": ("Bright Crystal", "Versace Bright Crystal", "perfume"),
 "inspired-by-armani-c0de": ("Armani Code", "Giorgio Armani Armani Code", "perfume"),
 "inspired-by-bleu-de-ch-nel": ("Bleu de Chanel", "Chanel Bleu de Chanel", "perfume"),
 "inspired-by-gucci-fl0ra-worn-by-alia-bh-tt": ("Flora", "Gucci Flora", "perfume"),
 "inspired-by-creed-green-irish-twe3d-worn-by-s-hid-kapoor": ("Green Irish Tweed", "Creed Green Irish Tweed", "perfume"),
 "inspired-by-bvlgari-men-in-bl-ck": ("Man in Black", "Bvlgari Man in Black", "perfume"),
 "inspired-by-tomford-oud-w00d-worn-by-moni-r0y-am-n-gupta-bo-t-unisex": ("Oud Wood", "Tom Ford Oud Wood", "perfume"),
 "inspired-by-terre-de-herme-worn-by-sanj-y-dutt": ("Terre d'Hermes", "Hermes Terre d'Hermes", "perfume"),
 "inspired-by-creed-av3ntus-worn-by-d-vid-beckh-m-unisex": ("Aventus", "Creed Aventus", "perfume"),
 "inspired-by-dior-homme-p-rfum": ("Dior Homme Parfum", "Dior Homme Parfum", "perfume"),
 "inspired-by-ck-0ne": ("CK One", "Calvin Klein CK One", "perfume"),
 "inspired-by-azzaro-the-most-w-nted": ("The Most Wanted", "Azzaro The Most Wanted", "perfume"),
 "inspired-by-viking-worn-by-vir-t-k0hli": ("Viking", "Creed Viking", "perfume"),
 "inspired-by-david-0ff-cool-w-ter-worn-by-aksh-y-kum-r-unisex": ("Cool Water", "Davidoff Cool Water", "perfume"),
 "inspired-by-diptyuqe-tam-da0": ("Tam Dao", "Diptyque Tam Dao", "perfume"),
 "copy-of-perfum-23": ("Eros", "Versace Eros", "perfume"),
 "copy-of-copy-of-perfum-22": ("Bombshell", "Victoria's Secret Bombshell", "perfume"),
 "copy-of-copy-of-perfume-4": ("Icon", "Dunhill Icon", "perfume"),
 "inspired-by-paco-rabbane-one-milli0n-worn-by-ed-sheer-n": ("1 Million", "Paco Rabanne 1 Million", "perfume"),
 "copy-of-copy-of-perfume-5": ("Ombre Leather", "Tom Ford Ombre Leather", "perfume"),
 "inspired-by-carolina-herrera-go0d-girl": ("Good Girl", "Carolina Herrera Good Girl", "perfume"),
 "king-of-bollywood-perfume": ("King Of Bollywood", None, "perfume"),
 "inspired-by-gucci-blo0m-worn-by-aditi-rao-hydari": ("Bloom", "Gucci Bloom", "perfume"),
 "inspired-ch-nel-coco-m-demoiselle-worn-by-ileana-dcruz": ("Coco Mademoiselle", "Chanel Coco Mademoiselle", "perfume"),
 "inspired-by-ysl-black-0pium": ("Black Opium", "Yves Saint Laurent Black Opium", "perfume"),
 "inspired-by-b-ccarat-r0uge-540": ("Baccarat Rouge 540", "Maison Francis Kurkdjian Baccarat Rouge 540", "perfume"),
 "inspired-by-roja-ely-ium-worn-by-h-rdik-p-ndya": ("Elysium", "Roja Parfums Elysium", "perfume"),
 "inspired-by-ch-nel-n0-5-worn-by-s-ra-ali-kh-n": ("No 5", "Chanel No 5", "perfume"),
 # attars (house originals)
 "oud-maracuja": ("Oud Maracuja", None, "attar"),
 "shanaya": ("Shanaya", None, "attar"),
 "rose": ("Rose", None, "attar"),
 "jannat-ul-firdaus": ("Jannat Ul Firdaus", None, "attar"),
 "noor-e-ajmer": ("Noor-e Ajmer", None, "attar"),
 "mukhallat-saffron": ("Mukhallat Saffron", None, "attar"),
 "arab-ameerat": ("Arab Ameerat", None, "attar"),
 "honey-oud-copy": ("Musk Rijali", None, "attar"),
 "inspired-by-d-purple-oud-copy": ("Honey Oud", None, "attar"),
 "white-oud": ("White Oud", None, "attar"),
 "purple-oud": ("Purple Oud", None, "attar"),
 "mitti": ("Mitti", None, "attar"),
 "ameer-oud": ("Ameer Oud", None, "attar"),
 "imperial": ("Imperial", None, "attar"),
 "flora": ("Flora", None, "attar"),
 "cool-water": ("Cool Water", None, "attar"),
 "kesar-chandan": ("Kesar Chandan", None, "attar"),
 "jasmine": ("Jasmine", None, "attar"),
 "mogra": ("Mogra", None, "attar"),
 "musk-saphire": ("Musk Saphire", None, "attar"),
 # gourmet (house originals)
 "pistachio-perfume-gourmet-collection": ("Pistachio", None, "gourmet"),
 "marshmallow-perfume-100ml-gourmet-collection": ("Marshmallow", None, "gourmet"),
 "eden-apple-perfume-100ml-gourmet-collection": ("Eden Apple", None, "gourmet"),
 "eclaire-perfume-100ml-gourmet-collection": ("Eclaire", None, "gourmet"),
 "choco-truffle-perfume-100ml-gourmet-collection": ("Choco Truffle", None, "gourmet"),
 "mango-perfume-100ml-gourmet-collection": ("Mango", None, "gourmet"),
 "strawberry-perfume-100ml-gourmet-collection": ("Strawberry", None, "gourmet"),
 "vanilla-perfume-100ml-gourmet-collection": ("Vanilla", None, "gourmet"),
 "gourmet-gift-set-20ml": ("Gourmet Gift Set (4x20ml)", None, "giftset"),
 # gift sets
 "luxury-perfume-gift-set-for-him-4-x-20ml": ("Luxury Gift Set For Him (4x20ml)", None, "giftset"),
 "luxury-perfume-gift-set-for-her-4-x-20ml": ("Luxury Gift Set For Her (4x20ml)", None, "giftset"),
}

def split_notes(note_str):
    """Split 'A, B and C' into [A, B, C]."""
    parts = re.split(r',\s*|\s+and\s+', note_str.strip().rstrip('.'))
    return [p.strip() for p in parts if p.strip()]

products = []
for p in PAGES:
    h = p["handle"]
    if h == "valentine-special-box":
        continue  # Rs.199 empty gift box, not a fragrance
    if h not in MAPPING:
        print(f"WARNING: no mapping for {h}")
        continue
    name, inspired_by, category = MAPPING[h]
    vs = p["variants"]
    variants = []
    for v in vs:
        variants.append({
            "size": v["title"],
            "priceInr": v["price"] / 100,
            "mrpInr": (v["compare_at"] / 100) if v["compare_at"] else None,
            "inStock": bool(v["available"]),
        })
    prod = {
        "name": name,
        "brand": "Celestial Perfume",
        "url": f"https://celestialperfume.in/products/{h}",
        "category": category,
        "concentration": "Eau de Parfum" if category == "perfume" else ("Attar" if category == "attar" else None),
        "variants": variants,
        "inspiredBy": inspired_by,
        "source": "celestialperfume.in product page",
        "observedAt": "2026-10-02",
    }
    if p.get("notes") and len(p["notes"]) == 3:
        top, heart, base = p["notes"]
        prod["notesTop"] = split_notes(top)
        prod["notesHeart"] = split_notes(heart)
        prod["notesBase"] = split_notes(base)
        prod["notesSource"] = "brand product page description"
    products.append(prod)

out = {
    "site": "Celestial Perfume",
    "url": "https://celestialperfume.in/",
    "observedAt": "2026-10-02",
    "notes": "Shopify store. 105 unique products scraped; 27 Tejasswi -copy duplicate listings excluded; Rs.199 empty gift box excluded. Prices from product JSON (sale + compare-at MRP). Availability from product JSON available flags (inventory not tracked). Note pyramids from brand page descriptions where present.",
    "products": products,
}

with open("/home/hatch/workspace/scentiqa/data/scrapes/celestial-perfume.json", "w") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

print(f"products: {len(products)}")
print(f"inspiredBy mapped: {sum(1 for p in products if p['inspiredBy'])}")
print(f"originals: {sum(1 for p in products if not p['inspiredBy'])}")
print(f"with notes: {sum(1 for p in products if p.get('notesTop'))}")
