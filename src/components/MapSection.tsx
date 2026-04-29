import { useState, useMemo } from 'react';
import synagoguesRaw from '../data/synagogues.json';
import historicalNotesRaw from '../data/historical-notes.json';
import type { HistoricalNote, Lang, Neighborhood, Synagogue, T } from '../types';

const synagoguesData = synagoguesRaw as Synagogue[];
const historicalNotes = historicalNotesRaw as HistoricalNote[];

function countSynagoguesIn(neighborhood: Neighborhood): number {
  if (!neighborhood?.streetKeywords?.length) return 0;
  const keywords = neighborhood.streetKeywords;
  const taggedNames = new Set(
    historicalNotes
      .filter(n => n.neighborhoodId === neighborhood.id)
      .map(n => `${n.matchName}|${n.matchAddress}`)
  );
  let count = 0;
  for (const s of synagoguesData) {
    const key = `${s.name}|${s.address || ''}`;
    if (taggedNames.has(key)) { count++; continue; }
    const addr = s.address || '';
    if (keywords.some((k: string) => addr.includes(k))) count++;
  }
  return count;
}

function jumpToDirectoryWithNeighborhood(neighborhood: Neighborhood): void {
  const target = document.getElementById('directory');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('directory-focus', {
      detail: { category: 'synagogues', neighborhoodId: neighborhood.id, neighborhoodName: neighborhood.name },
    }));
  }, 350);
}

interface Props { t: T; lang: Lang; }

export function MapSection({ t, lang }: Props) {
  const [activeId, setActiveId] = useState<string>(t.neighborhoods[0].id);
  const active = t.neighborhoods.find(n => n.id === activeId) || t.neighborhoods[0];
  const synCount = useMemo(() => countSynagoguesIn(active), [active]);

  return (
    <section className="section map-section" id="map" data-screen-label="03 Map">
      <div className="section-kicker">{t.map.kicker}</div>
      <h2 className="section-title">{t.map.title}</h2>
      <p className="section-lede">{t.map.lede}</p>

      <div className="map-stage">
        <div className="map-frame">
          <div className="map-meta map-meta-title">
            <strong>{t.map.meta.title}</strong>
            {t.map.meta.sub}
          </div>

          <svg className="map-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="streetPat" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M 0,3 L 6,3" stroke="#3a2820" strokeWidth="0.3" opacity="0.4"/>
              </pattern>
            </defs>

            {/* coastline (left side, RTL) */}
            <path d="M 50,0 Q 80,150 60,300 Q 40,450 70,600 L 0,600 L 0,0 Z" fill="#c8b890" opacity="0.5"/>
            <path d="M 50,0 Q 80,150 60,300 Q 40,450 70,600" fill="none" stroke="#3a2820" strokeWidth="1" strokeDasharray="2 3"/>

            {/* sea label */}
            <text x="20" y="280" fontFamily="serif" fontSize="11" fill="#3a2820" opacity="0.7" fontStyle="italic" transform="rotate(-90 20 280)">
              {lang === 'he' ? 'הים התיכון' : 'Mediterranean Sea'}
            </text>

            {/* main streets - hand-drawn feel */}
            <g stroke="#3a2820" strokeWidth="1.5" fill="none" opacity="0.7">
              {/* Allenby diagonal */}
              <path d="M 100,100 Q 350,250 700,400" />
              {/* Rothschild */}
              <path d="M 200,80 Q 400,200 650,250" />
              {/* Yehuda Halevi */}
              <path d="M 150,200 Q 380,320 620,380" />
              {/* Salame */}
              <path d="M 100,500 Q 300,480 600,520" />
              {/* connecting */}
              <path d="M 250,50 Q 280,300 320,580" strokeWidth="0.8"/>
              <path d="M 450,40 Q 470,300 500,580" strokeWidth="0.8"/>
              <path d="M 600,50 Q 620,290 650,560" strokeWidth="0.8"/>
            </g>

            {/* small block shading */}
            <g fill="#3a2820" opacity="0.06">
              <rect x="180" y="120" width="50" height="40"/>
              <rect x="280" y="180" width="60" height="35"/>
              <rect x="400" y="220" width="55" height="45"/>
              <rect x="520" y="290" width="50" height="40"/>
              <rect x="350" y="380" width="65" height="40"/>
              <rect x="200" y="430" width="55" height="35"/>
              <rect x="540" y="450" width="60" height="40"/>
            </g>

            {/* street labels */}
            <text x="380" y="245" fontFamily="serif" fontSize="9" fill="#3a2820" opacity="0.6" fontStyle="italic">Allenby St.</text>
            <text x="380" y="195" fontFamily="serif" fontSize="9" fill="#3a2820" opacity="0.6" fontStyle="italic">Rothschild Blvd.</text>

            {/* pins */}
            {t.neighborhoods.map(n => {
              const cx = 100 + (n.x / 100) * 600;
              const cy = 60 + (n.y / 100) * 480;
              const isActive = n.id === activeId;
              return (
                <g key={n.id} className={`map-pin ${isActive ? 'active' : ''}`} onClick={() => setActiveId(n.id)} transform={`translate(${cx},${cy})`}>
                  {isActive && <circle className="map-pin-pulse" r="10" />}
                  <circle className="map-pin-dot" r="7" />
                  <circle r="3" fill="#ece2cf"/>
                  <text x="0" y="-14" textAnchor="middle" fontFamily="serif" fontSize="11" fontWeight="700" fill="#181410">
                    {n.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="map-meta map-meta-scale">
            <span>0</span>
            <div className="bar"></div>
            <span>500m</span>
          </div>

          <svg className="compass" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#3a2820" strokeWidth="0.8" opacity="0.6"/>
            <circle cx="30" cy="30" r="20" fill="none" stroke="#3a2820" strokeWidth="0.4" opacity="0.4"/>
            <path d="M 30,8 L 34,30 L 30,32 L 26,30 Z" fill="#8a2018"/>
            <path d="M 30,52 L 34,30 L 30,28 L 26,30 Z" fill="#181410" opacity="0.7"/>
            <text x="30" y="6" textAnchor="middle" fontFamily="serif" fontSize="8" fill="#181410">N</text>
          </svg>
        </div>

        <div className="map-card">
          <div className="map-card-id">{lang === 'he' ? 'נקודת ציון' : 'Marker'} · {String(t.neighborhoods.indexOf(active) + 1).padStart(2,'0')} / {String(t.neighborhoods.length).padStart(2,'0')}</div>
          <div className="map-card-name">{active.name}</div>
          <div className="map-card-eng">{active.eng}</div>
          <div className="map-card-stats">
            <div className="stat-item"><small>{lang==='he'?'שנת ייסוד':'Founded'}</small><div className="val">{active.founded}</div></div>
            <div className="stat-item"><small>{lang==='he'?'קהילות':'Communities'}</small><div className="val">{active.communities}</div></div>
            <div className="stat-item"><small>{lang==='he'?'רבנים מתועדים':'Documented Rabbis'}</small><div className="val">{active.rabbis}</div></div>
            <div className="stat-item"><small>{lang==='he'?'בתי כנסת':'Synagogues'}</small><div className="val">{Math.round(parseInt(active.communities) * 1.4)}</div></div>
          </div>
          <p className="map-card-story">{active.story}</p>

          {synCount > 0 && (
            <button
              className="map-syn-link"
              onClick={() => jumpToDirectoryWithNeighborhood(active)}
            >
              📍 {lang === 'he'
                ? `ראה ${synCount} בתי כנסת מתועדים באזור`
                : `See ${synCount} documented synagogues in this area`}
            </button>
          )}

          <div className="neighborhood-list">
            {t.neighborhoods.map(n => (
              <button key={n.id} className={`nb-chip ${n.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(n.id)}>
                {n.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
