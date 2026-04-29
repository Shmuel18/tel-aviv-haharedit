import { useState, useEffect, useRef } from 'react';
import type { Lang, T } from '../types';

interface Props { t: T; lang: Lang; }
type FigureVariant = 'historic' | 'modern';
type FigureType = 'rabbi' | 'woman' | 'modern1' | 'modern2';

export function Hero({ t }: Props) {
  const heroRef = useRef<HTMLElement | null>(null);
  const [scrollY, setScrollY] = useState<number>(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const p = (rate: number) => `translateY(${scrollY * rate}px)`;

  return (
    <section className="hero" id="home" ref={heroRef} data-screen-label="01 Hero">
      {/* Sky */}
      <div className="hero-layer layer-sky" style={{ transform: p(0.05) }} />

      {/* Modern towers - back */}
      <div className="hero-layer layer-modern" style={{ transform: p(0.18) }}>
        <ModernSkyline />
      </div>

      {/* Bauhaus mid */}
      <div className="hero-layer layer-bauhaus" style={{ transform: p(0.32) }}>
        <BauhausRow />
      </div>

      {/* Title - sits between bauhaus and figures */}
      <div className="hero-layer layer-title" style={{ transform: `translateY(${scrollY * 0.5}px)`, opacity: Math.max(0, 1 - scrollY / 600) }}>
        <div className="hero-kicker">{t.hero.kicker}</div>
        <h1 className="hero-title">
          {t.hero.titleA} <span className="accent">{t.hero.titleB}</span>
        </h1>
        <div className="hero-subtitle">{t.hero.subtitle}</div>
      </div>

      {/* Foreground figures */}
      <div className="hero-layer layer-figures" style={{ transform: p(0.6) }}>
        <div className="figure-group">
          <Figure variant="historic" type="rabbi" />
          <Figure variant="historic" type="woman" />
        </div>
        <div className="figure-group">
          <Figure variant="modern" type="modern1" />
          <Figure variant="modern" type="modern2" />
        </div>
      </div>

      <div className="hero-ground" />

      <div className="scroll-cue">
        <span>{t.scrollCue}</span>
      </div>

      <div className="hero-corner">
        <strong>{t.heroCorner.line1}</strong>
        {t.heroCorner.line2}
      </div>
    </section>
  );
}

function ModernSkyline() {
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="xMinYMax meet" style={{ width: '100%', height: '70%' }}>
      <defs>
        <linearGradient id="towerG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a8b8c8" />
          <stop offset="1" stopColor="#8a9bb0" />
        </linearGradient>
      </defs>
      {/* tall towers cluster */}
      <rect x="50"  y="120" width="60"  height="280" fill="url(#towerG)" />
      <rect x="120" y="80"  width="80"  height="320" fill="#9aabbf" />
      <rect x="210" y="40"  width="50"  height="360" fill="url(#towerG)" />
      <rect x="270" y="100" width="70"  height="300" fill="#8597ad" />
      <rect x="350" y="60"  width="60"  height="340" fill="#a4b4c6" />
      <rect x="420" y="130" width="55"  height="270" fill="#92a3b8" />
      <rect x="485" y="90"  width="75"  height="310" fill="url(#towerG)" />
      <rect x="570" y="50"  width="55"  height="350" fill="#8e9fb4" />
      <rect x="635" y="110" width="65"  height="290" fill="#9eafc2" />
      <rect x="710" y="70"  width="80"  height="330" fill="url(#towerG)" />
      <rect x="800" y="140" width="50"  height="260" fill="#94a5ba" />
      <rect x="860" y="30"  width="65"  height="370" fill="#a0b1c4" />
      <rect x="935" y="100" width="55"  height="300" fill="#8a9bb0" />
      <rect x="1000" y="80" width="70"  height="320" fill="url(#towerG)" />
      <rect x="1080" y="120" width="60" height="280" fill="#96a7bc" />
      {/* window grids */}
      {[120,210,350,485,710,860,1000].map((x,i) => (
        <g key={i} opacity="0.35">
          {[...Array(8)].map((_,r) => [...Array(4)].map((_,c) => (
            <rect key={r+'-'+c} x={x+8+c*15} y={90+r*32} width="6" height="14" fill="#1a2230" />
          )))}
        </g>
      ))}
    </svg>
  );
}

function BauhausRow() {
  return (
    <svg viewBox="0 0 1400 380" preserveAspectRatio="xMidYMax meet" style={{ width: '110%', height: '70%' }}>
      <defs>
        <pattern id="windowsB" width="22" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="8" x="4" y="3" fill="#3a3026" opacity="0.55"/>
        </pattern>
      </defs>
      {/* sepia-toned bauhaus blocks */}
      {/* small synagogue with dome */}
      <g transform="translate(40,180)">
        <rect width="90" height="200" fill="#d6c7a4" stroke="#3a3026" strokeWidth="1"/>
        <path d="M 0,0 Q 45,-30 90,0" fill="#c4b48f" stroke="#3a3026" strokeWidth="1"/>
        <rect x="35" y="20" width="20" height="40" fill="#3a3026" opacity="0.5" rx="10"/>
        <rect x="10" y="80" width="14" height="20" fill="#3a3026" opacity="0.5"/>
        <rect x="66" y="80" width="14" height="20" fill="#3a3026" opacity="0.5"/>
      </g>
      {/* bauhaus block 1 - curved corner */}
      <g transform="translate(160,80)">
        <path d="M 0,40 Q 0,0 40,0 L 240,0 L 240,300 L 0,300 Z" fill="#e6dab9" stroke="#2a221a" strokeWidth="1"/>
        <rect x="20" y="60" width="200" height="220" fill="url(#windowsB)"/>
        {/* horizontal bands */}
        <line x1="0" y1="120" x2="240" y2="120" stroke="#2a221a" strokeWidth="0.8" opacity="0.5"/>
        <line x1="0" y1="180" x2="240" y2="180" stroke="#2a221a" strokeWidth="0.8" opacity="0.5"/>
        <line x1="0" y1="240" x2="240" y2="240" stroke="#2a221a" strokeWidth="0.8" opacity="0.5"/>
        {/* balcony */}
        <rect x="40" y="140" width="100" height="6" fill="#2a221a" opacity="0.6"/>
      </g>
      {/* bauhaus block 2 */}
      <g transform="translate(420,40)">
        <rect width="200" height="340" fill="#dccea9" stroke="#2a221a" strokeWidth="1"/>
        <rect x="0" y="0" width="200" height="40" fill="#2a221a" opacity="0.2"/>
        {[60,120,180,240,300].map(y => (
          <g key={y}>
            <line x1="10" y1={y} x2="190" y2={y} stroke="#2a221a" strokeWidth="0.5" opacity="0.4"/>
            {[20,60,100,140,170].map(x => (
              <rect key={x} x={x} y={y-20} width="22" height="14" fill="#3a3026" opacity="0.5"/>
            ))}
          </g>
        ))}
        {/* roof element */}
        <rect x="80" y="-20" width="40" height="20" fill="#c4b48f"/>
      </g>
      {/* bauhaus block 3 - the building TITLE sits behind */}
      <g transform="translate(640,100)">
        <rect width="280" height="280" fill="#e8dcb8" stroke="#2a221a" strokeWidth="1.2"/>
        <path d="M 280,40 Q 280,0 240,0 L 60,0 Q 20,0 20,40" fill="none" stroke="#2a221a" strokeWidth="1"/>
        {[60,110,160,210,260].map(y => (
          <g key={y}>
            {[20,60,100,140,180,220].map(x => (
              <rect key={x} x={x} y={y} width="22" height="14" fill="#3a3026" opacity="0.5"/>
            ))}
          </g>
        ))}
        {/* corner balcony, classic bauhaus */}
        <rect x="0" y="170" width="280" height="3" fill="#2a221a" opacity="0.5"/>
        <rect x="200" y="170" width="80" height="3" fill="#2a221a" opacity="0.7"/>
        <rect x="200" y="170" width="3" height="50" fill="#2a221a" opacity="0.7"/>
      </g>
      {/* bauhaus block 4 */}
      <g transform="translate(940,140)">
        <rect width="180" height="240" fill="#d4c79e" stroke="#2a221a" strokeWidth="1"/>
        {[40,90,140,190].map(y => (
          <g key={y}>
            {[15,55,95,135].map(x => (
              <rect key={x} x={x} y={y} width="22" height="14" fill="#3a3026" opacity="0.5"/>
            ))}
          </g>
        ))}
      </g>
      {/* lamp post */}
      <g transform="translate(1140,80)">
        <line x1="10" y1="0" x2="10" y2="300" stroke="#2a221a" strokeWidth="2"/>
        <circle cx="10" cy="0" r="8" fill="#3a3026"/>
        <path d="M 10,8 L 0,16 L 20,16 Z" fill="#3a3026"/>
      </g>
      {/* small bauhaus 5 */}
      <g transform="translate(1180,160)">
        <rect width="160" height="220" fill="#dccea9" stroke="#2a221a" strokeWidth="1"/>
        {[30,80,130,180].map(y => (
          <g key={y}>
            {[15,55,95,135].map(x => (
              <rect key={x} x={x} y={y} width="22" height="14" fill="#3a3026" opacity="0.5"/>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

function Figure({ variant, type }: { variant: FigureVariant; type: FigureType }) {
  const isHistoric = variant === 'historic';
  const skin = isHistoric ? '#d4c0a0' : '#e6c8a8';
  const coat = type === 'rabbi' ? '#1a1410' : type === 'woman' ? '#3a2820' : type === 'modern1' ? '#7a4a30' : '#3a4a6a';
  const hat: string | null = type === 'rabbi' ? '#0a0606' : type === 'woman' ? '#5a3020' : null;

  return (
    <div className={`figure figure-${variant}`}>
      <svg viewBox="0 0 110 280" style={{ width: '100%', height: '100%' }}>
        {/* legs / coat bottom */}
        <rect x="30" y="180" width="50" height="100" fill={coat} />
        {/* shoes */}
        <rect x="28" y="270" width="22" height="10" fill="#1a0f08"/>
        <rect x="60" y="270" width="22" height="10" fill="#1a0f08"/>
        {/* coat / dress */}
        {type === 'rabbi' && (
          <>
            <path d="M 25,90 Q 15,150 28,180 L 82,180 Q 95,150 85,90 Z" fill={coat}/>
            <line x1="55" y1="90" x2="55" y2="180" stroke="#0a0606" strokeWidth="1.5"/>
            {/* tzitzit hint */}
            <line x1="35" y1="170" x2="33" y2="180" stroke="#fff" strokeWidth="1" opacity="0.7"/>
            <line x1="40" y1="172" x2="38" y2="180" stroke="#fff" strokeWidth="1" opacity="0.7"/>
            <line x1="70" y1="170" x2="72" y2="180" stroke="#fff" strokeWidth="1" opacity="0.7"/>
            <line x1="75" y1="172" x2="77" y2="180" stroke="#fff" strokeWidth="1" opacity="0.7"/>
          </>
        )}
        {type === 'woman' && (
          <>
            <path d="M 22,90 Q 12,160 25,200 L 85,200 Q 98,160 88,90 Z" fill={coat}/>
            {/* apron */}
            <rect x="40" y="100" width="30" height="80" fill="#5a4030" opacity="0.6"/>
          </>
        )}
        {(type === 'modern1' || type === 'modern2') && (
          <>
            <path d="M 30,90 L 30,180 L 80,180 L 80,90 Z" fill={coat}/>
            {/* zipper / detail */}
            <line x1="55" y1="90" x2="55" y2="180" stroke={isHistoric ? '#000' : '#fff'} strokeWidth="0.8" opacity="0.5"/>
          </>
        )}
        {/* head */}
        <circle cx="55" cy="60" r="22" fill={skin} />
        {/* beard for rabbi */}
        {type === 'rabbi' && <path d="M 38,68 Q 55,98 72,68 Q 70,82 55,90 Q 40,82 38,68 Z" fill="#d4d0c8"/>}
        {/* hat / scarf */}
        {type === 'rabbi' && (
          <>
            <ellipse cx="55" cy="38" rx="32" ry="14" fill={hat ?? undefined}/>
            <rect x="32" y="30" width="46" height="14" fill={hat ?? undefined}/>
          </>
        )}
        {type === 'woman' && (
          <path d="M 30,40 Q 30,30 55,28 Q 80,30 80,40 L 82,75 Q 70,82 55,82 Q 40,82 28,75 Z" fill={hat ?? undefined}/>
        )}
        {type === 'modern1' && (
          <>
            {/* messy hair */}
            <path d="M 35,45 Q 35,30 55,30 Q 75,30 75,45 L 75,55 Q 70,40 55,40 Q 40,40 35,55 Z" fill="#3a2818"/>
          </>
        )}
        {type === 'modern2' && (
          <>
            {/* short hair */}
            <path d="M 35,48 Q 35,32 55,32 Q 75,32 75,48 Q 70,42 55,42 Q 40,42 35,48 Z" fill="#5a3818"/>
            {/* sunglasses */}
            <ellipse cx="48" cy="58" rx="6" ry="3" fill="#0a0606"/>
            <ellipse cx="62" cy="58" rx="6" ry="3" fill="#0a0606"/>
          </>
        )}
        {/* arms */}
        <rect x="18" y="95" width="14" height="80" fill={coat}/>
        <rect x="78" y="95" width="14" height="80" fill={coat}/>
      </svg>
    </div>
  );
}
