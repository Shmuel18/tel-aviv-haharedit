import json, re, io

SCRATCH = r"C:\Users\shh92\AppData\Local\Temp\claude\C--Users-shh92-Documents--------\de65d78b-f849-4c8f-88fb-78e77c8a234a\scratchpad"

with io.open(SCRATCH + r"\placemarks.json", encoding="utf-8-sig") as f:
    pms = json.load(f)
with io.open(SCRATCH + r"\glatter.txt", encoding="utf-8-sig") as f:
    glatter = f.read()

EXCLUDE = ['ק"ם 87 - גור', 'ק"ם 89 - גור', 'נמירובר 24 - גור']  # genuine Bnei Brak
COORD_FIX = {'אחד העם 65 - גור': (32.0673, 34.7766)}  # broken pin -> Achad HaAm, TLV

def strip_html(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s or '')).strip()

sites = []
for p in pms:
    name = p['name']
    if name in EXCLUDE:
        continue
    if not p.get('coords'):
        continue
    parts = name.split(' - ')
    if len(parts) >= 2:
        address = parts[0].strip()
        dynasty = parts[-1].strip()
    else:
        address = name.strip()
        dynasty = ''
    lng, lat = [float(x) for x in p['coords'].split(',')[:2]]
    if name in COORD_FIX:
        lat, lng = COORD_FIX[name]
    sites.append({
        'name': name,
        'dynasty': dynasty,
        'address': address + ', תל אביב',
        'layer': p['layer'],
        'lat': round(lat, 5),
        'lng': round(lng, 5),
        'note': strip_html(p.get('desc', '')) if p.get('descLen', 0) else '',
    })

import os
OUT_NAME = "hasidic_full_run.js"
RERUN = SCRATCH + r"\rerun_only.json"
if os.path.exists(RERUN):
    with io.open(RERUN, encoding="utf-8") as rf:
        only = set(json.load(rf))
    sites = [s for s in sites if s['name'] in only]
    OUT_NAME = "hasidic_rerun.js"
print("SITES:", len(sites), "| OUT:", OUT_NAME)
print("GLATTER chars:", len(glatter))

TEMPLATE = r'''export const meta = {
  name: 'hasidic-tlv-full',
  description: 'Full run: research ~100 Hasidic Tel Aviv sites using Glatter archival source as primary + web enrichment, each adversarially verified',
  phases: [
    { title: 'Glatter index', detail: 'extract authoritative institution index from Glatter article text' },
    { title: 'Research', detail: 'per-site: Glatter primary authority + web story/status/images' },
    { title: 'Verify', detail: 'adversarial fact-check per site (Glatter may override web)' },
  ],
}

const GLATTER = __GLATTER__;
const SITES = __SITES__;

const LOAD = 'First call ToolSearch with query "select:WebSearch,WebFetch" to load web tools, then use WebSearch and WebFetch. ';

const INDEX_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    institutions: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      properties: {
        dynasty: { type: 'string' },
        rebbe: { type: 'string' },
        street: { type: 'string' },
        number: { type: 'string' },
        year: { type: 'string' },
        origin: { type: 'string' },
        type: { type: 'string' },
        archivalRef: { type: 'string', description: 'Tel Aviv Archive file/doc numbers if present' },
        quote: { type: 'string', description: 'short supporting Hebrew quote' },
      }, required: ['dynasty'],
    } },
  }, required: ['institutions'],
};

const SITE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    name: { type: 'string' },
    dynasty: { type: 'string' },
    address: { type: 'string' },
    correctedAddress: { type: 'string', description: 'empty unless Glatter/sources give a different/better address' },
    mapErrorFlag: { type: 'string', enum: ['none','wrong-number','wrong-dynasty','not-a-synagogue','unverifiable','relocated'] },
    foundingYear: { type: 'string' },
    founder: { type: 'string' },
    dynastyBackground_he: { type: 'string' },
    glatterMatch_he: { type: 'string', description: 'Hebrew: what the Glatter index says about this exact site, with archival ref if any' },
    story_he: { type: 'string' },
    significance_he: { type: 'string' },
    currentStatus: { type: 'string', enum: ['active','closed','demolished','moved','unknown'] },
    sources: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { title: { type: 'string' }, url: { type: 'string' }, publisher: { type: 'string' } }, required: ['title','url'] } },
    images: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { url: { type: 'string' }, license: { type: 'string' }, source: { type: 'string' }, caption: { type: 'string' } }, required: ['url','license','source'] } },
    confidence: { type: 'string', enum: ['high','medium','low'] },
    gaps: { type: 'string' },
  },
  required: ['name','dynasty','dynastyBackground_he','story_he','mapErrorFlag','sources','confidence','gaps'],
};

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    overallVerdict: { type: 'string', enum: ['solid','mostly-solid','shaky','likely-fabricated'] },
    founderCheck: { type: 'string' },
    foundingYearCheck: { type: 'string' },
    dynastyCheck: { type: 'string' },
    addressCheck: { type: 'string', description: 'does Glatter/sources support the address & number?' },
    sourceQuality: { type: 'string' },
    imageCheck: { type: 'string' },
    flaggedClaims: { type: 'array', items: { type: 'string' } },
    corrections: { type: 'string' },
  },
  required: ['overallVerdict','addressCheck','sourceQuality','corrections'],
};

phase('Glatter index')
const indexObj = await agent(
  'You are extracting a structured index from an authoritative Hebrew academic source: Michal Glatter, "Admorim in the streets of Tel Aviv 1940-1965" (Bar-Ilan / Iyunim journal), including its appendices 1-4 (maps of Hasidic centers in 1940/1949/1965 and a table of Tel Aviv rebbes with dynasty, origin town and arrival year). The text was extracted from PDF and Hebrew word-order within a line may be imperfect, but the facts are intact. Extract EVERY Hasidic institution / address / rebbe you can find: dynasty, rebbe name, street, house number, year, origin town, type (shtibel/beit-midrash/yeshiva/rebbe-home), Tel Aviv Archive (ATB / את"ב) file or document numbers, and a short supporting quote. Preserve house numbers and archival numbers verbatim. Do not invent anything; include only what the text supports.\n\nTEXT:\n' + GLATTER,
  { label: 'glatter-index', phase: 'Glatter index', schema: INDEX_SCHEMA }
);
const INDEX = JSON.stringify(indexObj);
log('Glatter index built: ' + (indexObj.institutions ? indexObj.institutions.length : 0) + ' institutions');

const results = await pipeline(
  SITES,
  (s) => agent(
    LOAD +
    'You are a meticulous historian of Hasidic Tel Aviv before 1980. Research ONE institution and return structured data.\n\n' +
    'TARGET (from a community-made map; its address/dynasty MAY contain errors):\n' + JSON.stringify(s) + '\n\n' +
    'PRIMARY SOURCE - GLATTER INDEX (authoritative academic/archival; for dynasty, rebbe, street, house NUMBER, year and archival reference, TRUST GLATTER over the open web):\n' + INDEX + '\n\n' +
    'METHOD: (1) Find the Glatter entry matching this dynasty/street and record it in glatterMatch_he (include archival ref if any). (2) If Glatter gives a different house number/address than the map, TRUST GLATTER: put the corrected value in correctedAddress and set mapErrorFlag (wrong-number/wrong-dynasty/relocated). (3) Use the web (Hebrew + English) for the founding STORY, current status (active/closed/demolished/moved), independent corroboration, and FREE-licensed images ONLY - Wikimedia Commons / PikiWiki / clear public-domain whose license page you actually opened; the image MUST be a PORTRAIT of the rebbe (NEVER a gravestone/מצבה, building, or invented URL); if unsure, include NO image. (4) If NEITHER Glatter NOR the web supports a real Hasidic institution at this address, set mapErrorFlag=not-a-synagogue or unverifiable, confidence=low, and explain in gaps. Carefully separate the LOCAL Tel Aviv shtibel from the worldwide court - do not attribute the dynasty main-court events to this address. ABSOLUTE RULES: cite only URLs you actually retrieved; NEVER invent sources, facts, dates, names, or image URLs; "unknown" is far better than a guess. Write dynastyBackground_he, glatterMatch_he, story_he and significance_he in Hebrew.',
    { label: 'research:' + (s.dynasty || s.name), phase: 'Research', schema: SITE_SCHEMA }
  ),
  (research, s) => {
    if (!research) return null;
    return agent(
      LOAD +
      'You are an adversarial fact-checker. Assume the research JSON below (about a Hasidic institution in Tel Aviv) may contain fabrication or conflation, and try to break it.\n\n' +
      'CLAIM:\n' + JSON.stringify(research) + '\n\n' +
      'AUTHORITATIVE GLATTER INDEX (this academic source cites Tel Aviv Archive file numbers for exact house numbers and may OVERRIDE open-web geographic reasoning):\n' + INDEX + '\n\n' +
      'Verify via BOTH the web and the Glatter index: is the founder real and specifically tied to THIS address (not merely the dynasty elsewhere)? Is the year defensible? Does the dynasty attribution hold? Does Glatter support the (corrected) address & house number? Open each cited URL - does it resolve and actually support the claim? Is each image a REAL, free-licensed PORTRAIT (not a gravestone, not a fabricated URL)? Where Glatter and the research disagree, state which is correct and why. Flag every anachronism/conflation/unsupported or fabricated claim. Give concrete corrections.',
      { label: 'verify:' + (s.dynasty || s.name), phase: 'Verify', schema: VERDICT_SCHEMA, effort: 'high' }
    ).then(v => ({ site: s, research, verdict: v }));
  }
);
return results.filter(Boolean);
'''

js = TEMPLATE.replace('__GLATTER__', json.dumps(glatter, ensure_ascii=False))
js = js.replace('__SITES__', json.dumps(sites, ensure_ascii=False))

OUTPATH = SCRATCH + "\\" + OUT_NAME
with io.open(OUTPATH, "w", encoding="utf-8") as f:
    f.write(js)
print("WROTE:", OUTPATH, "(", len(js), "chars )")
