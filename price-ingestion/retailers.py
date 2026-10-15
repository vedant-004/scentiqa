"""
Retailer adapters for Flipkart and Sephora.in.
Both are server-rendered and fetchable from datacenter IPs.

Flipkart: search page embeds window.__INITIAL_STATE__ JSON with structured
  product cards (productId, title, displayPrice, strikeOffPrice).
Sephora.in: Vue SSR markup with brand/title/price cards and product links.
"""
import html as htmlmod
import json
import re
import sys
import time
from urllib.parse import quote_plus

sys.path.insert(0, '.')
from pipeline import Retailer, PriceHit, fetch, parse_inr, parse_size_ml, UA, REQ_HEADERS

SELLER_FLIPKART = "seller_flipkart"
SELLER_SEPHORA = "seller_sephora_in"


def _fk_blob(html: str):
    """Parse window.__INITIAL_STATE__ via raw_decode (tolerant)."""
    idx = html.find('window.__INITIAL_STATE__ = ')
    if idx < 0:
        return None
    start = html.find('{', idx)
    try:
        data, _ = json.JSONDecoder().raw_decode(html[start:start + 400000])
        return data
    except Exception:
        return None


def _fk_cards_via_regex(html: str) -> list[tuple[str, str, int, int | None]]:
    """Fallback: regex productId -> title/price from the raw HTML blob."""
    idx = html.find('window.__INITIAL_STATE__ = ')
    if idx < 0:
        return []
    start = html.find('{', idx)
    blob = html[start:start + 400000]
    out, seen = [], set()
    for m in re.finditer(r'"productId":"([A-Z0-9]+)"', blob):
        pid = m.group(1)
        if pid in seen:
            continue
        seen.add(pid)
        seg = blob[m.start():m.start() + 4000]
        pm = re.search(r'"displayPrice":(\d+)', seg)
        mm = re.search(r'"strikeOffPrice":(\d+)', seg)
        tm = re.search(r'"title":"([^"]{8,140})"', seg)
        if pm and tm:
            out.append((pid, tm.group(1), int(pm.group(1)),
                        int(mm.group(1)) if mm else None))
    return out


class FlipkartRetailer(Retailer):
    def __init__(self):
        super().__init__(seller_id=SELLER_FLIPKART, name="Flipkart", delay=4.0)

    def search(self, perfume_name: str, house: str) -> list[PriceHit]:
        query = f"{house} {perfume_name}".strip()
        url = f"https://www.flipkart.com/search?q={quote_plus(query)}"
        html = fetch(url)
        if not html:
            return []
        cards = _fk_cards_via_regex(html)
        # product URLs from anchors: pid -> url
        pid_url: dict[str, str] = {}
        for m in re.finditer(
                r'<a[^>]*href="(/[^"]*?/p/itm[a-z0-9]+[^"]*?pid=([A-Z0-9]+))',
                html, re.I):
            raw = m.group(1).replace('&amp;', '&')
            pid_url[m.group(2)] = 'https://www.flipkart.com' + raw.split('&')[0]
        hits: list[PriceHit] = []
        for pid, title, price, mrp in cards:
            if not (200 <= price <= 300000):
                continue
            # title must share at least 2 significant words with the query
            qtokens = {t for t in re.sub(r'[^a-z0-9 ]', ' ', query.lower()).split()
                       if len(t) > 2}
            ttokens = set(re.sub(r'[^a-z0-9 ]', ' ', title.lower()).split())
            if len(qtokens & ttokens) < 2:
                continue
            hits.append(PriceHit(
                perfume_id="", seller_id=self.seller_id,
                price_inr=price,
                mrp_inr=mrp if mrp and mrp > price else None,
                size_ml=parse_size_ml(title),
                in_stock=True,
                product_url=pid_url.get(pid) or url,
                title=title,
            ))
        return hits


class SephoraRetailer(Retailer):
    def __init__(self):
        super().__init__(seller_id=SELLER_SEPHORA, name="Sephora India", delay=4.0)

    def search(self, perfume_name: str, house: str) -> list[PriceHit]:
        query = f"{house} {perfume_name}".strip()
        url = f"https://sephora.in/products?q={quote_plus(query)}"
        html = fetch(url)
        if not html:
            return []
        hits: list[PriceHit] = []
        # card anchors: find <a href="/product/..."> preceding each title block
        pat = re.compile(
            r'<a[^>]*href="(/product/[^"]+)"[^>]*>.*?'
            r'<div class="ukt-title ellipse-2-line"[^>]*>\s*(.*?)\s*</div>\s*'
            r'<h5 class="ukt-sub-title ellipse-2-line"[^>]*>\s*(.*?)\s*</h5>.*?'
            r'<span class="main-price"[^>]*>\s*₹([\d,]+)\s*</span>',
            re.S)
        for m in pat.finditer(html):
            purl, brand, title, price_s = m.groups()
            price = parse_inr('₹' + price_s)
           
            if price is None:
                continue
            full_title = f"{brand.strip()} {title.strip()}"
            qtokens = {t for t in re.sub(r'[^a-z0-9 ]', ' ', query.lower()).split()
                       if len(t) > 2}
            ttokens = set(re.sub(r'[^a-z0-9 ]', ' ', full_title.lower()).split())
            if len(qtokens & ttokens) < 2:
                continue
            hits.append(PriceHit(
                perfume_id="", seller_id=self.seller_id,
                price_inr=price, mrp_inr=None,
                size_ml=parse_size_ml(title),
                in_stock=True,
                product_url='https://sephora.in' + purl,
                title=full_title,
            ))
            time.sleep(0.2)
        return hits
