import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function followEventLink(link) {
  if (!link) return;
  if (link.type === 'synagogue') {
    const target = document.getElementById('directory');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('directory-focus', {
        detail: { category: 'synagogues', name: link.name, address: link.address },
      }));
    }, 350);
  } else if (link.type === 'neighborhood') {
    const target = document.getElementById('directory');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('directory-focus', {
        detail: { category: 'synagogues', neighborhoodId: link.id },
      }));
    }, 350);
  } else if (link.type === 'category') {
    const target = document.getElementById('directory');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('directory-focus', {
        detail: { category: link.id },
      }));
    }, 350);
  }
}

export function TimelineSection({ t, lang }) {
  const stageRef = useRef(null);

  useEffect(() => {
    if (!stageRef.current) return;
    const ctx = gsap.context(() => {
      // Animate the golden path drawing as user enters the section
      const paths = stageRef.current.querySelectorAll('.timeline-path path');
      paths.forEach(p => {
        const len = p.getTotalLength?.();
        if (!len) return;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(p, {
          strokeDashoffset: 0,
          duration: 2.4,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: stageRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });
      });

      // Stagger-reveal each timeline event
      const events = stageRef.current.querySelectorAll('.timeline-event');
      events.forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 30, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            delay: i * 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, stageRef);

    return () => ctx.revert();
  }, [lang]);

  return (
    <section className="timeline-section" id="timeline" data-screen-label="05 Timeline">
      <div className="section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="section-kicker">{t.timeline.kicker}</div>
        <h2 className="section-title">{t.timeline.title}</h2>
        <p className="section-lede">{t.timeline.lede}</p>
      </div>

      <div className="timeline-stage" ref={stageRef}>
        {/* The curving golden path */}
        <svg className="timeline-path" viewBox="0 0 1200 1400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="goldP" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#b88a3e" stopOpacity="0.2"/>
              <stop offset="0.3" stopColor="#d9b577" stopOpacity="0.9"/>
              <stop offset="0.7" stopColor="#b88a3e" stopOpacity="0.9"/>
              <stop offset="1" stopColor="#8a2018" stopOpacity="0.4"/>
            </linearGradient>
            <filter id="goldGlow">
              <feGaussianBlur stdDeviation="6"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="2"/>
              </feComponentTransfer>
            </filter>
          </defs>

          {/* glow underlay */}
          <path
            d="M 100,80 Q 700,140 400,300 Q 100,460 700,540 Q 1100,620 350,780 Q 50,920 800,1020 Q 1200,1100 600,1240 Q 400,1320 600,1400"
            fill="none" stroke="#d9b577" strokeWidth="14" opacity="0.25" filter="url(#goldGlow)"
          />
          <path
            d="M 100,80 Q 700,140 400,300 Q 100,460 700,540 Q 1100,620 350,780 Q 50,920 800,1020 Q 1200,1100 600,1240 Q 400,1320 600,1400"
            fill="none" stroke="url(#goldP)" strokeWidth="3"
          />
          {/* dashes to suggest motion / road */}
          <path
            d="M 100,80 Q 700,140 400,300 Q 100,460 700,540 Q 1100,620 350,780 Q 50,920 800,1020 Q 1200,1100 600,1240 Q 400,1320 600,1400"
            fill="none" stroke="#ece2cf" strokeWidth="1" strokeDasharray="6 18" opacity="0.7"
          />
        </svg>

        {/* Events positioned along the curve */}
        {t.events.map((e, i) => {
          const positions = [
            { x: '5%',  y: 60,   side: 'right' },
            { x: '55%', y: 170,  side: 'left'  },
            { x: '20%', y: 300,  side: 'right' },
            { x: '60%', y: 430,  side: 'left'  },
            { x: '15%', y: 560,  side: 'right' },
            { x: '60%', y: 700,  side: 'left'  },
            { x: '10%', y: 840,  side: 'right' },
            { x: '55%', y: 990,  side: 'left'  },
            { x: '25%', y: 1140, side: 'right' },
          ];
          const pos = positions[i] || positions[0];
          return (
            <div
              key={e.year}
              className="timeline-event"
              data-side={pos.side}
              style={{ left: pos.x, top: pos.y }}
            >
              <div className="te-marker">
                <span className="te-year">{e.year.slice(-2)}</span>
              </div>
              <div className="te-content">
                <div className="te-year-large">{e.year}</div>
                <div className="te-title">{e.title}</div>
                <div className="te-desc">{e.desc}</div>
                {e.link && (
                  <button className="te-link" onClick={() => followEventLink(e.link)}>
                    → {e.link.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Manifesto({ t }) {
  return (
    <section className="manifesto" id="manifesto" data-screen-label="02 Manifesto">
      <div className="manifesto-grid">
        <div className="manifesto-head">
          <div className="small">{t.manifesto.kicker} · {t.manifesto.sub}</div>
          <h2>{t.manifesto.title}</h2>
        </div>
        <div className="manifesto-col drop-cap">{t.manifesto.colA}</div>
        <div className="manifesto-col">{t.manifesto.colB}</div>
      </div>
    </section>
  );
}

export function Colophon({ t, lang }) {
  return (
    <footer className="colophon" data-screen-label="06 Colophon">
      <div className="colophon-top">
        <div>
          <div className="colophon-mark">{t.colophon.mark}</div>
          <p style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t.colophon.vol}</p>
          <p style={{ marginTop: 4 }}>{t.colophon.volSub}</p>
        </div>
        <div>
          <h3>{t.colophon.credits}</h3>
          <ul>{t.colophon.creditsList.map(c => <li key={c}>{c}</li>)}</ul>
        </div>
        <div>
          <h3>{t.colophon.contact}</h3>
          <ul>{t.colophon.contactList.map(c => <li key={c}>{c}</li>)}</ul>
        </div>
      </div>
      <div className="colophon-bottom">
        <span>{t.colophon.bottom}</span>
        <span>{t.colophon.issue}</span>
      </div>
    </footer>
  );
}
