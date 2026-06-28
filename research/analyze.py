# -*- coding: utf-8 -*-
import json, io, re

SCRATCH = r"C:\Users\shh92\AppData\Local\Temp\claude\C--Users-shh92-Documents--------\de65d78b-f849-4c8f-88fb-78e77c8a234a\scratchpad"
TASKS   = r"C:\Users\shh92\AppData\Local\Temp\claude\C--Users-shh92-Documents--------\de65d78b-f849-4c8f-88fb-78e77c8a234a\tasks"
PROJ    = r"C:\Users\shh92\Documents\תל אביב"

with io.open(TASKS + r"\wfbrq4ylf.output", encoding="utf-8") as f:
    raw = json.load(f)

result = raw.get("result", [])
# Save clean result array durably
with io.open(PROJ + r"\research\full-run-results.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print("SAVED full-run-results.json  | items:", len(result))

# Reconstruct the 100 SITES to find which 3 failed
with io.open(SCRATCH + r"\placemarks.json", encoding="utf-8-sig") as f:
    pms = json.load(f)
EXCLUDE = ['ק"ם 87 - גור', 'ק"ם 89 - גור', 'נמירובר 24 - גור']
site_names = [p['name'] for p in pms if p.get('coords') and p['name'] not in EXCLUDE]
got_names = set()
for r in result:
    s = r.get("site", {})
    got_names.add(s.get("name"))
missing = [n for n in site_names if n not in got_names]
print("TOTAL SITES:", len(site_names), "| SUCCEEDED:", len(result), "| FAILED:", len(missing))
print("FAILED SITES:", missing)

def dist(items, fn):
    d = {}
    for it in items:
        k = fn(it) or "(none)"
        d[k] = d.get(k, 0) + 1
    return dict(sorted(d.items(), key=lambda x: -x[1]))

verdicts = dist(result, lambda r: (r.get("verdict") or {}).get("overallVerdict"))
conf     = dist(result, lambda r: (r.get("research") or {}).get("confidence"))
flags    = dist(result, lambda r: (r.get("research") or {}).get("mapErrorFlag"))
status   = dist(result, lambda r: (r.get("research") or {}).get("currentStatus"))

print("\n=== overallVerdict ==="); [print(f"  {k}: {v}") for k,v in verdicts.items()]
print("=== confidence ===");      [print(f"  {k}: {v}") for k,v in conf.items()]
print("=== mapErrorFlag ===");    [print(f"  {k}: {v}") for k,v in flags.items()]
print("=== currentStatus ===");   [print(f"  {k}: {v}") for k,v in status.items()]

with_img = [r for r in result if (r.get("research") or {}).get("images")]
with_corr= [r for r in result if (r.get("research") or {}).get("correctedAddress")]
print("\nWith free image:", len(with_img), "| With corrected address:", len(with_corr))

print("\n=== MAP ERRORS / CORRECTIONS (flag != none) ===")
for r in result:
    rs = r.get("research") or {}
    flag = rs.get("mapErrorFlag")
    if flag and flag != "none":
        corr = rs.get("correctedAddress") or ""
        print(f"  [{flag}] {r['site']['name']}  ->  {corr[:80]}")

print("\n=== FREE IMAGES FOUND ===")
for r in with_img:
    rs = r.get("research") or {}
    for im in rs["images"]:
        print(f"  {r['site']['name']}: {im.get('license','?')} | {im.get('url','')[:70]}")
