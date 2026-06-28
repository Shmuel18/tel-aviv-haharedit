# -*- coding: utf-8 -*-
import json, io
SCRATCH = r"C:\Users\shh92\AppData\Local\Temp\claude\C--Users-shh92-Documents--------\de65d78b-f849-4c8f-88fb-78e77c8a234a\scratchpad"
PROJ    = r"C:\Users\shh92\Documents\תל אביב"
with io.open(SCRATCH + r"\placemarks.json", encoding="utf-8-sig") as f:
    pms = json.load(f)
EXCLUDE = ['ק"ם 87 - גור', 'ק"ם 89 - גור', 'נמירובר 24 - גור']
names = [p['name'] for p in pms if p.get('coords') and p['name'] not in EXCLUDE]
with io.open(PROJ + r"\research\full-run-results.json", encoding="utf-8") as f:
    result = json.load(f)
got = {r.get("site",{}).get("name") for r in result}
missing = [n for n in names if n not in got]
with io.open(SCRATCH + r"\rerun_only.json", "w", encoding="utf-8") as f:
    json.dump(missing, f, ensure_ascii=False)
print("MISSING:", len(missing))
for m in missing:
    print(" -", m)
