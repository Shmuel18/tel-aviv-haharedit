# Data Files

Each category is a JSON array. Schema below.

## synagogues.json (227 entries — kipa.co.il)
```json
{ "name": "string", "nusach": "string", "address": "string" }
```

## mikvaot.json (20 entries — kipa.co.il)
```json
{ "name": "string", "type": "string", "address": "string" }
```
`type` values: `"נשים"`, `"נשים כלים"`, `"גברים"`, etc.

## kosher.json (1095 entries — rabanut.co.il, official)
```json
{
  "name": "string",
  "type": "string",
  "address": "string",
  "congregation": "string | null",
  "kosher_until": "unix timestamp | null"
}
```

## office-minyanim.json (manual — TfilaFinder app has no public data)
```json
{
  "name": "string",
  "tower": "string",
  "address": "string",
  "floor": "string",
  "times": "string",
  "nusach": "string",
  "notes": "string | null"
}
```

## eruv.json (manual — Tel Aviv Rabbinate publishes weekly map)
```json
{
  "area": "string",
  "status": "כשר | לא כשר | חלקי",
  "lastChecked": "YYYY-MM-DD",
  "notes": "string | null"
}
```

## Adding entries

Two options:

1. **Edit JSON directly** — open the file in a text editor, add an object to the array, save.
2. **Use the in-app form** — navigate to the directory section, click `+ הוסף`. Fill the form. Click "ייצא JSON" to download the merged file. Replace the corresponding file in `src/data/` with it.

User-added entries persist in browser localStorage automatically until you commit them to a JSON file via export.
