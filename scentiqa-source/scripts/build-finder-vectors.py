#!/usr/bin/env python3
"""
Build 84-dim accord vectors for Scentiqa perfumes missing them in ml-model-compact.json.

Method (documented for consistency):
- Accord ordering: exact 84-accord list from ml-model-compact.json['accords'].
- Source data: the perfume's own top/heart/base notes (from the perfumes table / API).
- Note -> accord mapping: public/ml/ml-note-accords.json (the model's own mapping,
  built from the 24k-Fragrantica training set). No accord data is invented.
- Position weights: top=1.0, heart=1.3, base=1.6 (same philosophy as the Finder's
  note matching in lib/finder-scoring.ts and lib/ml/engine.ts).
- Note lookup: exact lowercase match first, then substring fallback
  (mirrors noteHit() in finder-scoring.ts).
- Accord aliases: ambery->amber, leathery->leather (mirrors ACCORD_ALIASES).
- Aggregation: sum(position_weight * note_accord_weight) per accord dimension.
- Normalization: max-normalize so the strongest accord = 1.0, matching the
  convention of the existing 3,113 Fragrantica-derived vectors (max 1.0).
  (Cosine similarity — the only consumer — is scale-invariant, so this is
  behaviorally identical to any positive scaling.)
- Rounding: 3 decimals, matching stored precision.
- Existing vectors are NEVER overwritten.

Usage:
  python3 build-finder-vectors.py \
    --model ../public/ml/ml-model-compact.json \
    --note-accords ../public/ml/ml-note-accords.json \
    --perfumes /tmp/all_perfumes.json \
    --out /tmp/ml-model-compact-extended.json \
    [--new-only /tmp/finder_vectors_new.json]

The --perfumes JSON must be a list (or {"perfumes": [...]}) of objects with
id, topNotes, heartNotes, baseNotes (arrays of strings).
"""

import argparse
import json
import sys

ACCORD_ALIASES = {"ambery": "amber", "leathery": "leather"}
POS_W = {"top": 1.0, "heart": 1.3, "base": 1.6}


def norm(s):
    return str(s or "").lower().strip()


def build_accord_index(accords):
    idx = {}
    for i, a in enumerate(accords):
        nl = norm(a)
        if nl and nl not in idx:
            idx[nl] = i
    return idx


def lookup_note_accords(note, note_accords):
    nl = norm(note)
    if not nl:
        return None
    if nl in note_accords:
        return note_accords[nl]
    for key, accs in note_accords.items():
        if key in nl or nl in key:
            return accs
    return None


def build_vector(top, heart, base, accords, accord_idx, note_accords):
    vec = [0.0] * len(accords)
    touched = False
    for notes, w in ((top, POS_W["top"]), (heart, POS_W["heart"]), (base, POS_W["base"])):
        for n in notes or []:
            accs = lookup_note_accords(n, note_accords)
            if not accs:
                continue
            touched = True
            for acc_name, acc_w in accs:
                nl = norm(acc_name)
                i = accord_idx.get(nl)
                if i is None and nl in ACCORD_ALIASES:
                    i = accord_idx.get(ACCORD_ALIASES[nl])
                if i is not None:
                    vec[i] += w * acc_w
    if not touched:
        return None
    mx = max(vec)
    if mx <= 0:
        return None
    return [round(v / mx, 3) for v in vec]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--note-accords", required=True)
    ap.add_argument("--perfumes", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--new-only", default=None)
    args = ap.parse_args()

    model = json.load(open(args.model))
    accords = model["accords"]
    assert len(accords) == 84, f"expected 84 accords, got {len(accords)}"
    accord_idx = build_accord_index(accords)
    note_accords = json.load(open(args.note_accords))

    raw = json.load(open(args.perfumes))
    perfumes = raw["perfumes"] if isinstance(raw, dict) and "perfumes" in raw else raw

    existing = set(model["vectors"].keys())
    new_vectors = {}
    skipped_no_notes = 0
    for p in perfumes:
        pid = p.get("id")
        if not pid or pid in existing or pid in new_vectors:
            continue
        v = build_vector(
            p.get("topNotes"), p.get("heartNotes"), p.get("baseNotes"),
            accords, accord_idx, note_accords,
        )
        if v is None:
            skipped_no_notes += 1
            continue
        new_vectors[pid] = v

    print(f"existing vectors: {len(existing)}")
    print(f"new vectors built: {len(new_vectors)}")
    print(f"skipped (no usable notes): {skipped_no_notes}")
    print(f"total after merge: {len(existing) + len(new_vectors)}")

    if args.new_only:
        json.dump(new_vectors, open(args.new_only, "w"))
        print(f"wrote new-only: {args.new_only}")

    merged = {
        "accords": accords,
        "vectors": {**model["vectors"], **new_vectors},
        "notes": model.get("notes", {}),
    }
    json.dump(merged, open(args.out, "w"))
    print(f"wrote merged model: {args.out}")


if __name__ == "__main__":
    main()
