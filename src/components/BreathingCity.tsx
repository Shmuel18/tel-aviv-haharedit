import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import courtsRaw from '../data/hasidic-courts.json';
import type { HasidicCourt, Lang } from '../types';
import { STATUS_LABEL, LAYER_LABEL, CONF_LABEL, MAPERR_LABEL, lbl, parseFoundYear } from './courtLabels';

interface Court extends HasidicCourt { foundYear: number | null; }

const COURTS: Court[] = (courtsRaw as HasidicCourt[])
  .filter(c => typeof c.lat === 'number' && typeof c.lng === 'number')
  .map(c => ({ ...c, foundYear: parseFoundYear(c.year) }));

const FLAGGED = COURTS.filter(c => c.mapError && c.mapError !== 'none').length;
const UNDATED = COURTS.filter(c => c.foundYear == null).length;
const STATUS_COUNTS = COURTS.reduce<Record<string, number>>((a, c) => {
  a[c.status] = (a[c.status] || 0) + 1; return a;
}, {});
const ACTIVE = STATUS_COUNTS['active'] || 0;

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One shared icon per layer; visual state is applied imperatively to the inner
// .bc-dot so CSS transitions animate smoothly without recreating DOM.
const ICONS: Record<string, L.DivIcon> = {
  shtibel: L.divIcon({ html: '<i class="bc-dot bc-l-shtibel"></i>', className: 'bc-mote-wrap', iconSize: [22, 22], iconAnchor: [11, 11] }),
  'beit-midrash': L.divIcon({ html: '<i class="bc-dot bc-l-beit-midrash"></i>', className: 'bc-mote-wrap', iconSize: [22, 22], iconAnchor: [11, 11] }),
  yeshiva: L.divIcon({ html: '<i class="bc-dot bc-l-yeshiva"></i>', className: 'bc-mote-wrap', iconSize: [22, 22], iconAnchor: [11, 11] }),
};

interface Breath { year: number; label: string; today?: boolean; }
const BREATHS: Breath[] = [
  { year: 1888, label: '1888' },
  { year: 1940, label: '1940' },
  { year: 1949, label: '1949' },
  { year: 1965, label: '1965' },
  { year: 9999, label: 'today', today: true },
];

function visualState(c: Court, b: Breath): string {
  // On "today" every court is shown by its fate (status is known regardless of
  // founding year). On earlier breaths a court ignites only once it was founded.
  if (b.today) return c.status || 'unknown';
  return (c.foundYear != null && c.foundYear <= b.year) ? 'on' : 'off';
}
const STATUS_ORDER: Record<string, number> = { active: 0, closed: 1, moved: 2, demolished: 3, unknown: 4 };

const CENTER: LatLngTuple = [32.067, 34.778];

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    if (!COURTS.length) return;
    const lats = COURTS.map(c => c.lat), lngs = COURTS.map(c => c.lng);
    const b: LatLngBoundsExpression = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(b, { padding: [40, 40] });
  }, [map]);
  return null;
}

// Isolated so the per-frame count tween never re-renders the 100 markers.
function Counter({ target, label }: { target: number; label: string }) {
  const [n, setN] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (prefersReduced || document.hidden) { cur.current = target; setN(target); return; }
    let raf = 0;
    const from = cur.current, start = performance.now(), dur = 900;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const v = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      cur.current = v; setN(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // Safety: guarantee the final value even if rAF is throttled (background tab).
    const safety = window.setTimeout(() => { cur.current = target; setN(target); }, dur + 250);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [target]);
  return (
    <div className="bc-counter">
      <strong>{n}</strong><span>{label}</span>
    </div>
  );
}

function CourtDetail({ c, lang, audit, onClose }: { c: Court; lang: Lang; audit: boolean; onClose: () => void }) {
  const he = lang === 'he';
  const flagged = !!c.mapError && c.mapError !== 'none';
  const title = (c.dynastyShort && c.dynastyShort.length < 40 ? c.dynastyShort : '') || c.name_he;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Dialog behavior: focus in on open, Escape to close, basic Tab trap, restore focus.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href],button,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
  }, [onClose]);

  return (
    <div className="bc-detail" role="dialog" aria-modal="true" aria-label={title} dir={he ? 'rtl' : 'ltr'} ref={panelRef}>
      <button className="bc-detail-close" onClick={onClose} aria-label={he ? 'סגור' : 'Close'} ref={closeRef}>✕</button>
      <div className="bc-detail-chips">
        <span className="court-chip court-chip-layer">{lbl(LAYER_LABEL, c.layer, lang)}</span>
        <span className={`court-chip court-chip-conf court-conf-${c.confidence}`}>{lbl(CONF_LABEL, c.confidence, lang)}</span>
        <span className="court-chip">{lbl(STATUS_LABEL, c.status, lang)}</span>
        {flagged && <span className="court-chip court-chip-err">{lbl(MAPERR_LABEL, c.mapError, lang)}</span>}
      </div>
      <h3 className="bc-detail-title">{title}</h3>
      <div className="bc-detail-addr"><bdi>{c.address}</bdi>{c.year ? <> · <bdi>{c.year}</bdi></> : null}</div>
      {c.founder && <div className="bc-detail-founder" dir="rtl">{c.founder}</div>}
      {c.image && (
        <figure className="bc-detail-img">
          <img src={c.image.url} alt={c.image.caption || title} loading="lazy" />
          {c.image.caption && <figcaption>{c.image.caption}</figcaption>}
        </figure>
      )}
      {c.story_he && <p className="bc-detail-story" dir="rtl">{c.story_he}</p>}
      {audit && flagged && (
        <div className="bc-detail-audit">
          <strong>{he ? 'מה המפה החמיצה' : 'What the map missed'}</strong>
          {c.mapAddress && (
            <div className="bc-audit-line">
              {he ? 'המפה אמרה' : 'Map said'}: <bdi><s>{c.mapAddress}</s></bdi> {he ? '←' : '→'} <bdi><b>{c.address}</b></bdi>
            </div>
          )}
          {c.glatterMatch_he && <p className="bc-audit-glatter" dir="rtl">{c.glatterMatch_he}</p>}
        </div>
      )}
      {c.status === 'active' && (
        <a className="bc-visit" href="#directory" onClick={onClose}>
          {he ? 'בקרו היום — מדריך השירותים ←' : '→ Visit today — services directory'}
        </a>
      )}
      {c.sources && c.sources.length > 0 && (
        <div className="bc-detail-sources">
          <span>{he ? 'מקורות:' : 'Sources:'}</span>
          {c.sources.slice(0, 4).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer">{s.publisher || s.title}</a>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props { lang: Lang; }

export function BreathingCity({ lang }: Props) {
  const he = lang === 'he';
  const [idx, setIdx] = useState(0);
  const [audit, setAudit] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<Court | null>(null);
  const [ready, setReady] = useState(false);
  const markers = useRef<Map<string, L.Marker>>(new Map());

  const breath = BREATHS[idx];

  // Apply visual state to every mote imperatively (smooth CSS transitions).
  useEffect(() => {
    const apply = () => {
      COURTS.forEach(c => {
        const m = markers.current.get(c.id);
        const el = m && m.getElement();
        const dot = el && el.querySelector('.bc-dot');
        if (!dot) return;
        const st = visualState(c, breath);
        let cls = `bc-dot bc-l-${c.layer} bc-s-${st}`;
        if (audit && c.mapError && c.mapError !== 'none') cls += ' bc-flag';
        dot.setAttribute('class', cls);
      });
    };
    const raf = requestAnimationFrame(apply);
    const t = window.setTimeout(apply, 150); // idempotent safety once markers exist
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [idx, audit, ready, breath]);

  // Autoplay through the breaths (user-initiated; has a visible Pause).
  useEffect(() => {
    if (!playing) return;
    if (idx >= BREATHS.length - 1) { setPlaying(false); return; }
    const t = window.setTimeout(() => setIdx(i => Math.min(BREATHS.length - 1, i + 1)), 2600);
    return () => clearTimeout(t);
  }, [playing, idx]);

  const captions = he ? [
    'לפני שהעיר קמה — חצר אחת על החולות.',
    'העיר מתמלאת. עשרות שטיבלעך, בתי מדרש וישיבות נטמעים בלב תל אביב.',
    'אחרי השואה — גל של פליטים מקים מחדש את חצרותיו על אדמת העיר.',
    'השיא. תל אביב — בירת החסידוּת שהעולם שכח.',
    'מה שרד, מה נסגר, ומה נמחק מן המפה.',
  ] : [
    'Before the city rose — a single court on the sands.',
    'The city fills. Dozens of shtiblech, study houses and yeshivas woven into Tel Aviv.',
    "After the Holocaust — a wave of refugees rebuilds its courts on the city's soil.",
    'The peak. Tel Aviv — the Hasidic capital the world forgot.',
    'What survived, what closed, and what was erased from the map.',
  ];

  const tabLabel = (b: Breath) => (b.today ? (he ? 'היום' : 'Today') : b.label);

  const targetCount = breath.today ? ACTIVE : COURTS.filter(c => c.foundYear != null && c.foundYear <= breath.year).length;
  const counterLabel = breath.today ? (he ? 'עדיין פעילים' : 'still active') : (he ? 'בתי תפילה' : 'houses of prayer');

  // Keyboard-reachable list of the courts relevant to this breath.
  const visibleCourts = useMemo(() => {
    if (breath.today) return [...COURTS].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
    return COURTS.filter(c => c.foundYear != null && c.foundYear <= breath.year)
      .sort((a, b) => (a.foundYear || 0) - (b.foundYear || 0));
  }, [breath]);

  // Stable marker list — rendered once, never rebuilt (state lives on the DOM).
  const markerEls = useMemo(() => COURTS.map(c => (
    <Marker
      key={c.id}
      position={[c.lat, c.lng]}
      icon={ICONS[c.layer] || ICONS.shtibel}
      ref={(m) => { if (m) markers.current.set(c.id, m); else markers.current.delete(c.id); }}
      eventHandlers={{ click: () => setSelected(c) }}
    />
  )), []);

  return (
    <section className="bc-section" id="breathing" data-screen-label="03 Breathing City">
      <div className="section">
        <div className="section-kicker">{he ? 'גאוגרפיה · אטלס חי' : 'Geography · Living Atlas'}</div>
        <h2 className="section-title">{he ? 'העיר נושמת' : 'The Breathing City'}</h2>
        <p className="section-lede">
          {he
            ? 'בזמן שהעולם קורא לה "העיר הלבנה" החילונית, צפו במאה בתי התפילה החסידיים נדלקים על פני החולות, מגיעים לשיא — ואז דועכים. לא אורחים. חלק מיסודותיה.'
            : 'While the world calls it the secular "White City", watch a hundred Hasidic houses of prayer ignite over the sands, crest — then fade. Not guests. Part of its foundations.'}
        </p>

        <div className="bc-rail" role="group" aria-label={he ? 'בחירת שנה' : 'Choose a year'}>
          {BREATHS.map((b, i) => (
            <button
              key={b.label}
              aria-pressed={i === idx}
              className={`bc-tab ${i === idx ? 'active' : ''} ${b.today ? 'bc-tab-today' : ''}`}
              onClick={() => { setPlaying(false); setIdx(i); }}
            >
              {tabLabel(b)}
            </button>
          ))}
          <button
            className="bc-play"
            onClick={() => { if (idx >= BREATHS.length - 1) setIdx(0); setPlaying(p => !p); }}
            aria-pressed={playing}
          >
            <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span> {he ? (playing ? 'עצור' : 'הקרנה') : (playing ? 'Pause' : 'Play')}
          </button>
        </div>

        <div className="bc-readout">
          <Counter target={targetCount} label={counterLabel} />
          <p className="bc-caption">{captions[idx]}</p>
          {!breath.today && UNDATED > 0 && (
            <span className="bc-undated-note">{he ? `+${UNDATED} ללא שנת ייסוד מתועדת` : `+${UNDATED} without a documented founding year`}</span>
          )}
        </div>
        <span className="bc-sr-live" aria-live="polite">{`${targetCount} ${counterLabel}`}</span>

        <div className="bc-mapwrap">
          <MapContainer center={CENTER} zoom={14} scrollWheelZoom={false} whenReady={() => setReady(true)} className="bc-map" style={{ height: '600px', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            />
            {markerEls}
            <FitBounds />
          </MapContainer>

          {breath.today && (
            <div className="bc-legend">
              {(['active', 'closed', 'demolished', 'moved', 'unknown'] as const).map(s => (
                <span key={s} className={`bc-leg bc-leg-${s}`}>
                  <i aria-hidden="true" /> {lbl(STATUS_LABEL, s, lang)}<bdi>{STATUS_COUNTS[s] ? ` (${STATUS_COUNTS[s]})` : ''}</bdi>
                </span>
              ))}
            </div>
          )}

          <button className={`bc-audit ${audit ? 'active' : ''}`} onClick={() => setAudit(a => !a)} aria-pressed={audit}>
            <span aria-hidden="true">🔍</span> {he ? 'מה המפה החמיצה' : 'What the map missed'} <bdi>({FLAGGED})</bdi>
          </button>
        </div>

        {audit && (
          <p className="bc-reckoning">
            {he
              ? `${FLAGGED} מתוך ${COURTS.length} הסיכות היו שגויות, ממוקמות לא נכון או לא מאומתות — לא כי החצרות היו שוליות, אלא כי הן היו בכל מקום, מקופלות כה עמוק בעיר עד שאיבדה את הספירה.`
              : `${FLAGGED} of ${COURTS.length} pins were wrong, misplaced or unverifiable — not because the courts were marginal, but because they were everywhere, folded so deep into the city it lost count.`}
          </p>
        )}

        {/* Keyboard / non-map path to every court (also helps the dense cluster). */}
        <details className="bc-listwrap">
          <summary>{he ? `רשימת החצרות (${visibleCourts.length})` : `List of courts (${visibleCourts.length})`}</summary>
          <ul className="bc-list" aria-label={he ? 'רשימת חצרות' : 'List of courts'}>
            {visibleCourts.map(c => (
              <li key={c.id}>
                <button className="bc-list-item" onClick={() => setSelected(c)}>
                  <span className="bc-list-dyn"><bdi>{(c.dynastyShort && c.dynastyShort.length < 40 ? c.dynastyShort : '') || c.name_he}</bdi></span>
                  <span className="bc-list-addr"><bdi>{c.address}</bdi></span>
                  <span className={`bc-list-badge bc-s-${breath.today ? c.status : 'on'}`}>
                    {breath.today ? lbl(STATUS_LABEL, c.status, lang) : (c.foundYear || '')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>

        {selected && <CourtDetail c={selected} lang={lang} audit={audit} onClose={() => setSelected(null)} />}

        <div className="bc-source">
          {he ? 'מחקר עצמאי על בסיס ד"ר מיכל גלטר ומפת המקור · רקע: ' : 'Independent research after Dr. Michal Glatter & the source map · basemap: '}
          <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a> / OpenStreetMap
        </div>
      </div>
    </section>
  );
}
