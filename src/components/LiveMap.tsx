import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import synagoguesRaw from '../data/synagogues.json';
import mikvaotRaw from '../data/mikvaot.json';
import kosherRaw from '../data/kosher.json';
import gmachimRaw from '../data/gmachim.json';
import historicalNotesRaw from '../data/historical-notes.json';
import geocodedRaw from '../data/geocoded.json';
import courtsRaw from '../data/hasidic-courts.json';
import type {
  GeocodedMap,
  Gmach,
  HasidicCourt,
  HistoricalNote,
  KosherBusiness,
  Lang,
  Mikve,
  Synagogue,
  T,
} from '../types';

const synagoguesData = synagoguesRaw as Synagogue[];
const mikvaotData = mikvaotRaw as Mikve[];
const kosherData = kosherRaw as KosherBusiness[];
const gmachimData = gmachimRaw as Gmach[];
const historicalNotes = historicalNotesRaw as HistoricalNote[];
const geocoded = geocodedRaw as GeocodedMap;
const courtsData = courtsRaw as HasidicCourt[];

const NOTES_INDEX = new Map(
  historicalNotes.map(n => [`${n.matchName}|${n.matchAddress}`, n])
);

const TEL_AVIV_CENTER: LatLngTuple = [32.0853, 34.7818];

type Cat = 'synagogues' | 'mikvaot' | 'kosher' | 'gmachim';

interface LayerInfo {
  he: string;
  en: string;
  color: string;
  icon: string;
}

const LAYERS: Record<Cat, LayerInfo> = {
  synagogues: { he: 'בתי כנסת', en: 'Synagogues', color: '#8a2018', icon: '✡' },
  mikvaot:    { he: 'מקוואות', en: 'Mikvaot', color: '#2a4a6a', icon: '〰' },
  kosher:     { he: 'מסעדות כשרות', en: 'Kosher', color: '#5e3a18', icon: '✓' },
  gmachim:    { he: 'גמ"חים', en: 'Gemachim', color: '#b88a3e', icon: '♡' },
};

interface MapPoint {
  cat: Cat;
  name: string;
  addr: string;
  lat: number;
  lng: number;
  sub: string;
  note: HistoricalNote | null;
}

type PointsByCat = Record<Cat, MapPoint[]>;

function buildPoints(): PointsByCat {
  const out: PointsByCat = { synagogues: [], mikvaot: [], kosher: [], gmachim: [] };

  function merge<T extends { name: string; address?: string }>(
    cat: Cat,
    data: T[],
    fields: (item: T) => string
  ) {
    for (const item of data) {
      const addr = (item.address || '').trim();
      if (!addr) continue;
      const geo = geocoded[addr];
      if (!geo || typeof geo.lat !== 'number') continue;
      out[cat].push({
        cat,
        name: item.name,
        addr,
        lat: geo.lat,
        lng: geo.lng,
        sub: fields(item),
        note: cat === 'synagogues' ? NOTES_INDEX.get(`${item.name}|${addr}`) || null : null,
      });
    }
  }

  merge<Synagogue>('synagogues', synagoguesData, x => x.nusach);
  merge<Mikve>('mikvaot', mikvaotData, x => x.type);
  merge<KosherBusiness>('kosher', kosherData, x => `${x.type}${x.congregation ? ' · ' + x.congregation : ''}`);
  merge<Gmach>('gmachim', gmachimData, x => `${x.kind || x.category || ''}`);
  return out;
}

const POINTS: PointsByCat = buildPoints();

// ---- Hasidic courts layer ----

const COURTS = courtsData.filter(c => typeof c.lat === 'number' && typeof c.lng === 'number');

const COURT_LAYER_LABEL: Record<string, { he: string; en: string }> = {
  'shtibel':      { he: 'שטיבל', en: 'Shtibel' },
  'beit-midrash': { he: 'בית מדרש', en: 'Beit Midrash' },
  'yeshiva':      { he: 'ישיבה', en: 'Yeshiva' },
};

const CONF_LABEL: Record<string, { he: string; en: string }> = {
  high:   { he: 'ודאות גבוהה', en: 'High confidence' },
  medium: { he: 'ודאות בינונית', en: 'Medium confidence' },
  low:    { he: 'ודאות נמוכה', en: 'Low confidence' },
};

const STATUS_LABEL: Record<string, { he: string; en: string }> = {
  active:     { he: 'פעיל', en: 'Active' },
  closed:     { he: 'נסגר', en: 'Closed' },
  demolished: { he: 'נהרס', en: 'Demolished' },
  moved:      { he: 'עבר', en: 'Moved' },
  unknown:    { he: 'לא ידוע', en: 'Unknown' },
};

const MAPERR_LABEL: Record<string, { he: string; en: string }> = {
  'wrong-number':    { he: 'מספר בית תוקן', en: 'House number corrected' },
  'wrong-dynasty':   { he: 'חסידות תוקנה', en: 'Dynasty corrected' },
  'not-a-synagogue': { he: 'לא בית כנסת', en: 'Not a synagogue' },
  'unverifiable':    { he: 'לא אומת', en: 'Unverified' },
  'relocated':       { he: 'מוקם מחדש', en: 'Relocated' },
  'none':            { he: '', en: '' },
};

// Visual encoding: purple shades by confidence; gray/hollow for hard map errors.
function courtStyle(c: HasidicCourt) {
  const hardError = c.mapError === 'not-a-synagogue' || c.verdict === 'likely-fabricated';
  const radius = c.layer === 'yeshiva' ? 8 : c.layer === 'beit-midrash' ? 7 : 6;
  if (hardError) {
    return { color: '#8a8580', fillColor: '#bfb9b0', fillOpacity: 0.35, weight: 1, dashArray: '3 3', radius };
  }
  const color = c.confidence === 'high' ? '#4a1d6e' : c.confidence === 'medium' ? '#7b4fa0' : '#a98fc2';
  return { color, fillColor: color, fillOpacity: c.confidence === 'high' ? 0.85 : c.confidence === 'medium' ? 0.65 : 0.45, weight: c.mapError !== 'none' ? 2 : 1, dashArray: undefined as string | undefined, radius };
}

function CourtPopup({ c, lang }: { c: HasidicCourt; lang: Lang }) {
  const L = (m: Record<string, { he: string; en: string }>, k: string) => (m[k] ? m[k][lang] : k);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`;
  const title = c.dynastyShort || c.dynasty || c.name_he;
  return (
    <div className="court-popup">
      <div className="court-popup-head">
        <span className="court-chip court-chip-layer">{L(COURT_LAYER_LABEL, c.layer)}</span>
        <span className={`court-chip court-chip-conf court-conf-${c.confidence}`}>{L(CONF_LABEL, c.confidence)}</span>
        {c.status !== 'unknown' && <span className="court-chip">{L(STATUS_LABEL, c.status)}</span>}
        {c.mapError !== 'none' && <span className="court-chip court-chip-err">{L(MAPERR_LABEL, c.mapError)}</span>}
      </div>

      <div className="court-popup-title">{title}</div>
      <div className="court-popup-addr">
        <a href={mapsUrl} target="_blank" rel="noreferrer">{c.address} 🗺</a>
        {c.mapAddress && <div className="court-popup-mapaddr">{lang === 'he' ? 'במפה המקורית' : 'on source map'}: <s>{c.mapAddress}</s></div>}
      </div>

      {(c.founder || c.year) && (
        <div className="court-popup-meta">
          {c.year && <span>{c.year}</span>}
          {c.founder && <span>{c.founder}</span>}
        </div>
      )}

      {c.image && (
        <figure className="court-popup-img">
          <img src={c.image.url} alt={c.image.caption || title} loading="lazy" />
          {c.image.caption && <figcaption>{c.image.caption}</figcaption>}
          <a className="court-img-credit" href={c.image.source} target="_blank" rel="noreferrer">{c.image.license}</a>
        </figure>
      )}

      {c.story_he && <p className="court-popup-story">{c.story_he}</p>}
      {c.significance_he && <p className="court-popup-sig">{c.significance_he}</p>}

      {c.sources.length > 0 && (
        <div className="court-popup-sources">
          <strong>{lang === 'he' ? 'מקורות' : 'Sources'}</strong>
          <ul>
            {c.sources.slice(0, 6).map((s, i) => (
              <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>{s.publisher ? ` · ${s.publisher}` : ''}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FitBounds({ coords }: { coords: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    const lats = coords.map(p => p.lat);
    const lngs = coords.map(p => p.lng);
    const bounds: LatLngBoundsExpression = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [coords.length, map]);
  return null;
}

interface Props { t: T; lang: Lang; }

type ActiveLayers = Record<Cat, boolean>;

export function LiveMap({ t, lang }: Props) {
  const [active, setActive] = useState<ActiveLayers>({
    synagogues: false,
    mikvaot: false,
    kosher: false,
    gmachim: false,
  });
  const [showCourts, setShowCourts] = useState<boolean>(true);

  const activePoints = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];
    (Object.keys(LAYERS) as Cat[]).forEach((cat) => {
      if (active[cat]) out.push(...POINTS[cat]);
    });
    return out;
  }, [active]);

  const boundsCoords = useMemo(() => {
    const c: { lat: number; lng: number }[] = activePoints.map(p => ({ lat: p.lat, lng: p.lng }));
    if (showCourts) COURTS.forEach(k => c.push({ lat: k.lat, lng: k.lng }));
    return c;
  }, [activePoints, showCourts]);

  const totalGeocoded = Object.values(POINTS).reduce((a, b) => a + b.length, 0);
  const totalAll = synagoguesData.length + mikvaotData.length + kosherData.length + gmachimData.length;
  const coveragePct = totalAll ? Math.round((totalGeocoded / totalAll) * 100) : 0;
  const shownCount = activePoints.length + (showCourts ? COURTS.length : 0);

  return (
    <section className="livemap-section" id="livemap" data-screen-label="08 Live Map">
      <div className="section">
        <div className="section-kicker">{t.livemap.kicker}</div>
        <h2 className="section-title">{t.livemap.title}</h2>
        <p className="section-lede">{t.livemap.lede}</p>

        <div className="livemap-toolbar">
          <div className="livemap-layers">
            <button
              className={`livemap-toggle livemap-toggle-courts ${showCourts ? 'active' : ''}`}
              onClick={() => setShowCourts(v => !v)}
              style={showCourts ? { borderColor: '#4a1d6e', background: '#4a1d6e', color: '#f5ede0' } : { color: '#4a1d6e' }}
            >
              <span className="lm-toggle-icon">✦</span>
              <span className="lm-toggle-label">{lang === 'he' ? 'חצרות חסידיות (היסטורי)' : 'Hasidic Courts (historical)'}</span>
              <span className="lm-toggle-count">{COURTS.length}</span>
            </button>
            {(Object.keys(LAYERS) as Cat[]).map((key) => {
              const l = LAYERS[key];
              const count = POINTS[key].length;
              return (
                <button
                  key={key}
                  className={`livemap-toggle ${active[key] ? 'active' : ''}`}
                  onClick={() => setActive(s => ({ ...s, [key]: !s[key] }))}
                  style={active[key] ? { borderColor: l.color, background: l.color, color: '#f5ede0' } : { color: l.color }}
                >
                  <span className="lm-toggle-icon">{l.icon}</span>
                  <span className="lm-toggle-label">{l[lang]}</span>
                  <span className="lm-toggle-count">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="livemap-stats">
            <strong>{shownCount}</strong> {t.livemap.shown} ·{' '}
            <span title={`${totalGeocoded} / ${totalAll} מ-1408 ערכים מוקמו`}>{coveragePct}% {t.livemap.coverage}</span>
          </div>
        </div>

        <div className="livemap-wrap">
          <MapContainer
            center={TEL_AVIV_CENTER}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '600px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {activePoints.map((p, i) => (
              <CircleMarker
                key={`${p.cat}-${p.name}-${i}`}
                center={[p.lat, p.lng]}
                radius={p.note ? 7 : 5}
                pathOptions={{
                  color: LAYERS[p.cat].color,
                  fillColor: LAYERS[p.cat].color,
                  fillOpacity: p.note ? 0.85 : 0.55,
                  weight: p.note ? 2 : 1,
                }}
              >
                <Popup>
                  <div className="lm-popup">
                    <div className="lm-popup-cat" style={{ color: LAYERS[p.cat].color }}>
                      {LAYERS[p.cat].icon} {LAYERS[p.cat][lang]}
                    </div>
                    <div className="lm-popup-name">{p.name}</div>
                    {p.sub && <div className="lm-popup-sub">{p.sub}</div>}
                    {p.addr && <div className="lm-popup-addr">{p.addr}</div>}
                    {p.note && (
                      <div className="lm-popup-note">
                        <strong>{t.directory.didYouKnow}</strong>
                        {p.note[lang] || p.note.he}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {showCourts && COURTS.map((c) => {
              const st = courtStyle(c);
              return (
                <CircleMarker
                  key={c.id}
                  center={[c.lat, c.lng]}
                  radius={st.radius}
                  pathOptions={{ color: st.color, fillColor: st.fillColor, fillOpacity: st.fillOpacity, weight: st.weight, dashArray: st.dashArray }}
                >
                  <Popup maxWidth={340} minWidth={280}>
                    <CourtPopup c={c} lang={lang} />
                  </Popup>
                </CircleMarker>
              );
            })}

            <FitBounds coords={boundsCoords} />
          </MapContainer>
        </div>

        <div className="livemap-source">
          {t.livemap.source}: <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap</a> · Nominatim geocoding
          {' · '}{lang === 'he' ? 'חצרות חסידיות: מחקר עצמאי על בסיס ד"ר מיכל גלטר ומפת המקור' : 'Hasidic courts: independent research after Dr. Michal Glatter & the source map'}
        </div>
      </div>
    </section>
  );
}
