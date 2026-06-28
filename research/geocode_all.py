# -*- coding: utf-8 -*-
"""Geocode each court's true street address (corrected where same-place fix, else map address)
   so pins sit on the real address rather than the map author's manual pin."""
import json, io, re, time, math, urllib.parse, urllib.request

PROJ = r"C:\Users\shh92\Documents\תל אביב"
DATA = PROJ + r"\site\src\data\hasidic-courts.json"
OUTC = PROJ + r"\research\court-coords.json"

with io.open(DATA, encoding="utf-8") as f:
    data = json.load(f)

UA = "telaviv-haharedit-research/1.0 (contact: shh92533@gmail.com)"

def clean_street(s):
    s = re.sub(r"\(.*?\)", "", s or "")          # drop parentheticals
    s = s.split(",")[0]                            # take part before first comma (= street + number)
    s = re.sub(r"^\s*(רחוב|רח['׳])\s+", "", s.strip())
    return s.strip()

def has_digit(s):
    return bool(re.search(r"\d", s))

def map_street(name_he):
    return name_he.split(" - ")[0].strip()

def in_tlv(lat, lng):
    return (32.01 <= lat <= 32.135) and (34.73 <= lng <= 34.815)

cache = {}
def geocode(q):
    if q in cache:
        return cache[q]
    params = {"q": q + ", תל אביב יפו", "format": "json", "countrycodes": "il",
              "accept-language": "he", "limit": "1",
              "viewbox": "34.73,32.14,34.815,32.01", "bounded": "1"}
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            res = json.load(r)
    except Exception as e:
        res = []
    time.sleep(1.15)
    out = None
    if res:
        lat = float(res[0]["lat"]); lng = float(res[0]["lon"])
        if in_tlv(lat, lng):
            out = (round(lat, 6), round(lng, 6))
    cache[q] = out
    return out

def dist_m(a, b):
    # rough meters
    dlat = (a[0]-b[0]) * 111000
    dlng = (a[1]-b[1]) * 92500
    return math.hypot(dlat, dlng)

coords = {}
ok = kept = moved = 0
for e in data:
    name = e["name_he"]
    err = e["mapError"]
    if err in ("wrong-number", "relocated") and has_digit(clean_street(e["address"])):
        q = clean_street(e["address"])            # corrected address
    else:
        q = map_street(name)                       # original map street+number
    if not q or not has_digit(q):
        # street-only (no number) -- still try, Nominatim returns street centroid
        q = q or map_street(name)
    g = geocode(q)
    if g:
        coords[name] = list(g)
        ok += 1
        if dist_m(g, (e["lat"], e["lng"])) > 150:
            moved += 1
    else:
        kept += 1

with io.open(OUTC, "w", encoding="utf-8") as f:
    json.dump(coords, f, ensure_ascii=False, indent=2)

print("geocoded ok: %d | kept (failed/out-of-box): %d | moved >150m: %d" % (ok, kept, moved))
print("saved", OUTC)
