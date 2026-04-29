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
import type {
  GeocodedMap,
  Gmach,
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

function FitBounds({ activePoints }: { activePoints: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (activePoints.length === 0) return;
    const lats = activePoints.map(p => p.lat);
    const lngs = activePoints.map(p => p.lng);
    const bounds: LatLngBoundsExpression = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [activePoints.length, map]);
  return null;
}

interface Props { t: T; lang: Lang; }

type ActiveLayers = Record<Cat, boolean>;

export function LiveMap({ t, lang }: Props) {
  const [active, setActive] = useState<ActiveLayers>({
    synagogues: true,
    mikvaot: true,
    kosher: false, // 1095 points — off by default
    gmachim: true,
  });

  const activePoints = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];
    (Object.keys(LAYERS) as Cat[]).forEach((cat) => {
      if (active[cat]) out.push(...POINTS[cat]);
    });
    return out;
  }, [active]);

  const totalGeocoded = Object.values(POINTS).reduce((a, b) => a + b.length, 0);
  const totalAll = synagoguesData.length + mikvaotData.length + kosherData.length + gmachimData.length;
  const coveragePct = totalAll ? Math.round((totalGeocoded / totalAll) * 100) : 0;

  return (
    <section className="livemap-section" id="livemap" data-screen-label="08 Live Map">
      <div className="section">
        <div className="section-kicker">{t.livemap.kicker}</div>
        <h2 className="section-title">{t.livemap.title}</h2>
        <p className="section-lede">{t.livemap.lede}</p>

        <div className="livemap-toolbar">
          <div className="livemap-layers">
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
            <strong>{activePoints.length}</strong> {t.livemap.shown} ·{' '}
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
            <FitBounds activePoints={activePoints} />
          </MapContainer>
        </div>

        {totalGeocoded === 0 && (
          <div className="livemap-empty">
            {t.livemap.geocoding}
          </div>
        )}

        <div className="livemap-source">
          {t.livemap.source}: <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap</a> · Nominatim geocoding
        </div>
      </div>
    </section>
  );
}
