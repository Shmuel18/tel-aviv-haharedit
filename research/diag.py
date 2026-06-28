# -*- coding: utf-8 -*-
import json, io
PROJ = r"C:\Users\shh92\Documents\תל אביב"
with io.open(PROJ + r"\site\src\data\hasidic-courts.json", encoding="utf-8") as f:
    data = json.load(f)

def central_tlv(lat, lng):
    return (32.045 <= lat <= 32.105) and (34.74 <= lng <= 34.795)

out = []
out.append("=== TWO FLAGGED ENTRIES ===")
for e in data:
    if ("הוסיאטין" in (e["dynasty"] + e["name_he"])) or ("אוניקובסקי" in e["name_he"]) or ("פרץ" in e["name_he"]):
        out.append(json.dumps({
            "id": e["id"], "name_he": e["name_he"], "dynasty": e["dynastyShort"] or e["dynasty"],
            "lat": e["lat"], "lng": e["lng"], "address": e["address"], "mapAddress": e["mapAddress"],
            "mapError": e["mapError"], "glatterMatch": e["glatterMatch_he"][:300]
        }, ensure_ascii=False, indent=2))

out.append("\n=== ALL ENTRIES WITH COORDS OUTSIDE CENTRAL TLV ===")
susp = [e for e in data if not central_tlv(e["lat"], e["lng"])]
out.append("count: %d" % len(susp))
for e in sorted(susp, key=lambda x: (-x["lng"], -x["lat"])):
    out.append("  %s | lat %.5f lng %.5f | %s | mapAddr=%s | err=%s" % (
        e["name_he"], e["lat"], e["lng"], e["address"][:40], e["mapAddress"][:30], e["mapError"]))

with io.open(r"C:\Users\shh92\AppData\Local\Temp\claude\C--Users-shh92-Documents--------\de65d78b-f849-4c8f-88fb-78e77c8a234a\scratchpad\diag.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("done; suspects:", len(susp))
