# -*- coding: utf-8 -*-
"""Transform raw research results -> clean site data file hasidic-courts.json."""
import json, io, os

PROJ = r"C:\Users\shh92\Documents\תל אביב"
RESULTS = PROJ + r"\research\full-run-results.json"
OUT = PROJ + r"\site\src\data\hasidic-courts.json"

with io.open(RESULTS, encoding="utf-8") as f:
    rows = json.load(f)

# Geocoded coordinates per site (Nominatim on the true address) — pins sit on the real
# address, not the map author's manual pin. Built by geocode_all.py.
try:
    with io.open(PROJ + r"\research\court-coords.json", encoding="utf-8") as f:
        GEO = json.load(f)
except Exception:
    GEO = {}

LAYER_MAP = {
    "בתי כנסת ושטיבלך": "shtibel",
    "בתי מדרש": "beit-midrash",
    "ישיבות": "yeshiva",
}

# Pin corrections: map coords were wrong (different city/area); geocoded the real TLV address.
COORD_OVERRIDE = {
    "ביאליק 19 - הוסיאטין": (32.07272, 34.77053),       # was Ramat Gan Bialik -> TLV Bialik 19
    "פרץ אוניקובסקי 13 - גור": (32.05967, 34.77462),    # was Ramat Aviv -> Y.L. Peretz 12, south TLV
}

def clean(s):
    return (s or "").strip()

out = []
seen = set()
for i, r in enumerate(rows):
    site = r.get("site") or {}
    res = r.get("research") or {}
    ver = r.get("verdict") or {}
    name = clean(site.get("name"))
    if not name or name in seen:
        continue
    seen.add(name)

    lat = site.get("lat")
    lng = site.get("lng")
    if name in GEO:
        lat, lng = GEO[name][0], GEO[name][1]
    if name in COORD_OVERRIDE:
        lat, lng = COORD_OVERRIDE[name]

    corrected = clean(res.get("correctedAddress"))
    map_addr = clean(site.get("address"))
    images = res.get("images") or []
    img = None
    for im in images:
        u = clean(im.get("url"))
        if u.startswith("http"):
            img = {
                "url": u,
                "license": clean(im.get("license")),
                "source": clean(im.get("source")),
                "caption": clean(im.get("caption")),
            }
            break

    sources = []
    for s in (res.get("sources") or []):
        u = clean(s.get("url"))
        if u.startswith("http"):
            sources.append({
                "title": clean(s.get("title")),
                "url": u,
                "publisher": clean(s.get("publisher")),
            })

    out.append({
        "id": "hc-%03d" % (i + 1),
        "name_he": name,
        "dynasty": clean(res.get("dynasty")) or clean(site.get("dynasty")),
        "dynastyShort": clean(site.get("dynasty")),
        "layer": LAYER_MAP.get(site.get("layer"), "shtibel"),
        "lat": lat,
        "lng": lng,
        "address": corrected or map_addr,
        "mapAddress": map_addr if (corrected and corrected != map_addr) else "",
        "founder": clean(res.get("founder")),
        "year": clean(res.get("foundingYear")),
        "dynastyBackground_he": clean(res.get("dynastyBackground_he")),
        "story_he": clean(res.get("story_he")),
        "significance_he": clean(res.get("significance_he")),
        "glatterMatch_he": clean(res.get("glatterMatch_he")),
        "status": clean(res.get("currentStatus")) or "unknown",
        "confidence": clean(res.get("confidence")) or "low",
        "verdict": clean(ver.get("overallVerdict")) or "",
        "mapError": clean(res.get("mapErrorFlag")) or "none",
        "sources": sources,
        "image": img,
    })

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with io.open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

# stats
def c(fn):
    d = {}
    for o in out:
        k = fn(o); d[k] = d.get(k,0)+1
    return dict(sorted(d.items(), key=lambda x:-x[1]))
print("WROTE", OUT, "|", len(out), "entries")
print("layer:", c(lambda o:o["layer"]))
print("confidence:", c(lambda o:o["confidence"]))
print("mapError:", c(lambda o:o["mapError"]))
print("with image:", sum(1 for o in out if o["image"]))
print("with sources:", sum(1 for o in out if o["sources"]))
print("with corrected addr:", sum(1 for o in out if o["mapAddress"]))
