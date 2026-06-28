# -*- coding: utf-8 -*-
import json, io
TASKS = r"C:\Users\shh92\AppData\Local\Temp\claude\C--Users-shh92-Documents--------\de65d78b-f849-4c8f-88fb-78e77c8a234a\tasks"
PROJ  = r"C:\Users\shh92\Documents\תל אביב"
RESULTS = PROJ + r"\research\full-run-results.json"

with io.open(RESULTS, encoding="utf-8") as f:
    existing = json.load(f)
with io.open(TASKS + r"\wjjkl8wdb.output", encoding="utf-8") as f:
    rerun = json.load(f).get("result", [])

names = {r.get("site",{}).get("name") for r in existing}
added = 0
for r in rerun:
    nm = r.get("site",{}).get("name")
    if nm and nm not in names:
        existing.append(r); names.add(nm); added += 1

with io.open(RESULTS, "w", encoding="utf-8") as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)
print("merged +%d -> total %d" % (added, len(existing)))
