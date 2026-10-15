"""
Priority price runner: Flipkart + Sephora.in for top priceless perfumes.
Uses pipeline.run() with strict per-hit matching.

Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python3 priority_run.py [batch] [offset]
"""
import sys

sys.path.insert(0, '.')
from pipeline import run
from retailers import FlipkartRetailer, SephoraRetailer, SELLER_FLIPKART, SELLER_SEPHORA


def get_queue(limit: int, offset: int) -> list[dict]:
    """Priceless perfumes, most popular first, via direct REST."""
    import requests, os
    url = os.environ["SUPABASE_URL"] + "/rest/v1/perfumes"
    h = {"apikey": os.environ["SUPABASE_SERVICE_ROLE_KEY"],
         "Authorization": f"Bearer {os.environ['SUPABASE_SERVICE_ROLE_KEY']}"}
    out, off = [], 0
    while len(out) < limit:
        r = requests.get(url, headers=h, params={
            "select": "id,name,houses(name)",
            "lowest_price_inr": "is.null",
            "order": "rating_count.desc.nullslast",
            "limit": min(1000, limit - len(out)),
            "offset": offset + off,
        }, timeout=60)
        r.raise_for_status()
        batch = r.json()
        out.extend(batch)
        if len(batch) < 1000:
            break
        off += 1000
    return out


if __name__ == "__main__":
    import pipeline
    pipeline.get_queue = get_queue  # patch the queue fetcher
    batch = int(sys.argv[1]) if len(sys.argv) > 1 else 150
    offset = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    run([SephoraRetailer(), FlipkartRetailer()],
        batch=batch, start_offset=offset,
        state_file="priority_state.json")
