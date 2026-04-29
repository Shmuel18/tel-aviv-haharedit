import type { CSSProperties } from 'react';
import type { Lang, T } from '../types';

function focusSynagogue(name: string, address: string): void {
  const target = document.getElementById('directory');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // give scroll a beat, then dispatch
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('directory-focus', {
      detail: { category: 'synagogues', name, address },
    }));
  }, 350);
}

interface Props { t: T; lang: Lang; }

export function SoulsSection({ t }: Props) {
  return (
    <section className="souls-section" id="souls" data-screen-label="04 Souls">
      <div className="section">
        <div className="section-kicker">{t.souls.kicker}</div>
        <h2 className="section-title">{t.souls.title}</h2>
        <p className="section-lede">{t.souls.lede}</p>

        <div className="souls-stage">
          {t.soulsList.map((s) => {
            const bioSide = s.x > 50 ? 'left' : 'right';
            const linked = s.linkedSynagogue;
            const soulStyle = { left: `${s.x}%`, top: `${s.y}%`, '--delay': `${s.delay}s` } as CSSProperties;
            return (
              <div
                key={s.id}
                className="soul"
                style={soulStyle}
              >
                <div className="soul-portrait">
                  <SoulPortrait id={s.id} />
                  <div className="soul-frame" />
                </div>
                <div className="soul-label">
                  {s.name}
                  <small>{s.role} · {s.years}</small>
                </div>
                <div className={`soul-bio ${bioSide}`}>
                  <strong>{s.role}</strong>
                  {s.bio}
                  {linked && (
                    <button
                      className="soul-link"
                      onClick={() => focusSynagogue(linked.name, linked.address)}
                    >
                      📍 {linked.label}: <em>{linked.name}</em>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SoulPortrait({ id }: { id: number }) {
  // 8 stylized SVG portraits in archival style
  const variants = [
    // 1 - Rabbi Amiel: bearded, hat
    <g key="1">
      <rect width="180" height="220" fill="#c9b896"/>
      <rect width="180" height="220" fill="url(#pSepia)"/>
      <ellipse cx="90" cy="100" rx="42" ry="50" fill="#d4c2a4"/>
      <path d="M 50,120 Q 90,180 130,120 Q 130,170 90,180 Q 50,170 50,120 Z" fill="#e8e0d4"/>
      <ellipse cx="90" cy="50" rx="55" ry="22" fill="#1a1410"/>
      <rect x="40" y="40" width="100" height="20" fill="#1a1410"/>
      <ellipse cx="78" cy="95" rx="3" ry="4" fill="#1a1410"/>
      <ellipse cx="102" cy="95" rx="3" ry="4" fill="#1a1410"/>
      <rect x="40" y="160" width="100" height="60" fill="#2a1f18"/>
    </g>,
    // 2 - Rabbanit Kapach: woman with headscarf
    <g key="2">
      <rect width="180" height="220" fill="#cbb898"/>
      <rect width="180" height="220" fill="url(#pSepia)"/>
      <path d="M 30,80 Q 30,40 90,38 Q 150,40 150,80 L 152,150 Q 130,170 90,170 Q 50,170 28,150 Z" fill="#5a3020"/>
      <ellipse cx="90" cy="115" rx="40" ry="48" fill="#d8c4a6"/>
      <ellipse cx="78" cy="110" rx="2.5" ry="3.5" fill="#1a1410"/>
      <ellipse cx="102" cy="110" rx="2.5" ry="3.5" fill="#1a1410"/>
      <path d="M 80,135 Q 90,142 100,135" fill="none" stroke="#1a1410" strokeWidth="1"/>
      <rect x="30" y="170" width="120" height="50" fill="#3a2820"/>
    </g>,
    // 3 - Auerbach: thin face, glasses
    <g key="3">
      <rect width="180" height="220" fill="#c8b694"/>
      <rect width="180" height="220" fill="url(#pSepia)"/>
      <ellipse cx="90" cy="100" rx="38" ry="48" fill="#d6c4a4"/>
      <path d="M 55,115 Q 90,170 125,115 Q 125,160 90,165 Q 55,160 55,115 Z" fill="#f0ece0"/>
      <ellipse cx="90" cy="42" rx="42" ry="14" fill="#0a0606"/>
      <rect x="48" y="35" width="84" height="14" fill="#0a0606"/>
      <circle cx="76" cy="92" r="8" fill="none" stroke="#1a1410" strokeWidth="1.5"/>
      <circle cx="104" cy="92" r="8" fill="none" stroke="#1a1410" strokeWidth="1.5"/>
      <line x1="84" y1="92" x2="96" y2="92" stroke="#1a1410" strokeWidth="1"/>
      <rect x="40" y="155" width="100" height="65" fill="#2a1f18"/>
    </g>,
    // 4 - Miriam Zvadya: midwife, tichel
    <g key="4">
      <rect width="180" height="220" fill="#cab896"/>
      <rect width="180" height="220" fill="url(#pSepia)"/>
      <path d="M 25,90 Q 25,45 90,43 Q 155,45 155,90 L 156,155 Q 130,175 90,175 Q 50,175 24,155 Z" fill="#7a5040"/>
      <ellipse cx="90" cy="115" rx="38" ry="46" fill="#d4c0a2"/>
      <ellipse cx="78" cy="112" rx="2.5" ry="3" fill="#1a1410"/>
      <ellipse cx="102" cy="112" rx="2.5" ry="3" fill="#1a1410"/>
      <path d="M 78,138 Q 90,144 102,138" fill="none" stroke="#1a1410" strokeWidth="1"/>
      <rect x="35" y="175" width="110" height="45" fill="#4a3528"/>
      <line x1="60" y1="180" x2="120" y2="180" stroke="#d4c0a2" strokeWidth="1" opacity="0.5"/>
    </g>,
    // 5 - Boyaner Rebbe: streimel
    <g key="5">
      <rect width="180" height="220" fill="#c7b594"/>
      <rect width="180" height="220" fill="url(#pSepia)"/>
      <ellipse cx="90" cy="105" rx="40" ry="48" fill="#d4c2a2"/>
      <path d="M 55,125 Q 90,175 125,125 Q 125,165 90,170 Q 55,165 55,125 Z" fill="#3a2820"/>
      <ellipse cx="90" cy="42" rx="58" ry="20" fill="#5a3020"/>
      <ellipse cx="90" cy="38" rx="58" ry="14" fill="#7a4030"/>
      {[...Array(20)].map((_,i) => <circle key={i} cx={35+i*6} cy={36+Math.sin(i)*4} r="2" fill="#3a2010"/>)}
      <ellipse cx="78" cy="98" rx="2.5" ry="3" fill="#1a1410"/>
      <ellipse cx="102" cy="98" rx="2.5" ry="3" fill="#1a1410"/>
      <rect x="35" y="160" width="110" height="60" fill="#1a1410"/>
    </g>,
    // 6 - Hadaya: oriental, white beard
    <g key="6">
      <rect width="180" height="220" fill="#c9b896"/>
      <rect width="180" height="220" fill="url(#pSepia)"/>
      <ellipse cx="90" cy="100" rx="40" ry="48" fill="#d6c4a4"/>
      <path d="M 50,120 Q 90,185 130,120 Q 130,175 90,185 Q 50,175 50,120 Z" fill="#f0ece0"/>
      <path d="M 35,55 Q 35,30 90,28 Q 145,30 145,55 L 145,75 L 35,75 Z" fill="#2a1f18"/>
      <ellipse cx="78" cy="92" rx="2.5" ry="3.5" fill="#1a1410"/>
      <ellipse cx="102" cy="92" rx="2.5" ry="3.5" fill="#1a1410"/>
      <rect x="40" y="170" width="100" height="50" fill="#3a2820"/>
    </g>,
    // 7 - Altusky: woman teacher
    <g key="7">
      <rect width="180" height="220" fill="#cab898"/>
      <rect width="180" height="220" fill="url(#pSepia)"/>
      <path d="M 28,85 Q 28,42 90,40 Q 152,42 152,85 L 153,148 Q 130,168 90,168 Q 50,168 27,148 Z" fill="#3a2820"/>
      <ellipse cx="90" cy="110" rx="38" ry="46" fill="#d6c4a4"/>
      <ellipse cx="78" cy="105" rx="2.5" ry="3" fill="#1a1410"/>
      <ellipse cx="102" cy="105" rx="2.5" ry="3" fill="#1a1410"/>
      <path d="M 80,132 Q 90,138 100,132" fill="none" stroke="#1a1410" strokeWidth="1"/>
      <circle cx="60" cy="155" r="3" fill="#8a2018" opacity="0.6"/>
      <rect x="32" y="168" width="116" height="52" fill="#5a3838"/>
    </g>,
    // 8 - Yosef Kapach: Yemenite sage
    <g key="8">
      <rect width="180" height="220" fill="#c8b694"/>
      <rect width="180" height="220" fill="url(#pSepia)"/>
      <ellipse cx="90" cy="105" rx="40" ry="48" fill="#c8b08e"/>
      <path d="M 55,125 Q 90,180 125,125 Q 125,170 90,178 Q 55,170 55,125 Z" fill="#3a2818"/>
      <path d="M 35,60 Q 35,32 90,30 Q 145,32 145,60 L 148,85 L 32,85 Z" fill="#e8e0d4" stroke="#3a2820" strokeWidth="1"/>
      <line x1="50" y1="55" x2="130" y2="55" stroke="#8a2018" strokeWidth="1" opacity="0.5"/>
      <ellipse cx="78" cy="100" rx="2.5" ry="3" fill="#1a1410"/>
      <ellipse cx="102" cy="100" rx="2.5" ry="3" fill="#1a1410"/>
      <rect x="40" y="165" width="100" height="55" fill="#2a1f18"/>
    </g>,
  ];

  return (
    <svg viewBox="0 0 180 220" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <pattern id="pSepia" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#000" opacity="0.04"/>
          <rect width="1" height="1" fill="#000" opacity="0.06"/>
        </pattern>
      </defs>
      {variants[(id - 1) % variants.length]}
    </svg>
  );
}
