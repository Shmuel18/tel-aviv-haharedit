import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CONTENT } from './content.js';

gsap.registerPlugin(ScrollTrigger);
import { Hero } from './components/Hero.jsx';
import { MapSection } from './components/MapSection.jsx';
import { SoulsSection } from './components/SoulsSection.jsx';
import { TimelineSection, Manifesto, Colophon } from './components/Timeline.jsx';
import { DirectorySection } from './components/DirectorySection.jsx';
import { GlobalSearch } from './components/GlobalSearch.jsx';
import './styles.css';

function TopNav({ t, lang, setLang }) {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const onScroll = () => {
      const ids = ['home', 'manifesto', 'map', 'souls', 'timeline', 'directory'];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= 200 && r.bottom >= 200) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = [
    { id: 'home', label: t.nav.home },
    { id: 'manifesto', label: t.nav.manifesto },
    { id: 'map', label: t.nav.map },
    { id: 'souls', label: t.nav.souls },
    { id: 'timeline', label: t.nav.timeline },
    { id: 'directory', label: t.nav.directory },
  ];

  return (
    <nav className="topnav">
      <div className="brand">
        <div className="brand-mark">ת</div>
        <div className="brand-text">
          <span>{lang === 'he' ? 'תל אביב החרדית' : 'The Other White City'}</span>
          <small>{lang === 'he' ? 'פוליו דיגיטלי · א׳' : 'Digital Folio · I'}</small>
        </div>
      </div>
      <ul className="nav-links">
        {items.map(it => (
          <li key={it.id}>
            <a href={`#${it.id}`} className={activeSection === it.id ? 'active' : ''}>{it.label}</a>
          </li>
        ))}
      </ul>
      <div className="topnav-actions">
        <GlobalSearch t={t} lang={lang} />
        <button className="lang-toggle" onClick={() => setLang(lang === 'he' ? 'en' : 'he')}>
          {lang === 'he' ? 'EN' : 'עב'}
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const [lang, setLang] = useState('he');
  const t = CONTENT[lang];

  useEffect(() => {
    document.body.dataset.lang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = lang === 'he'
      ? 'תל אביב החרדית — פוליו דיגיטלי'
      : 'The Other White City — Digital Folio';
  }, [lang]);

  // Reveal section titles + ledes as they enter the viewport.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const titles = document.querySelectorAll('.section-title, .section-kicker, .section-lede');
      titles.forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <TopNav t={t} lang={lang} setLang={setLang} />
      <div className="edition-mark">{t.edition}</div>
      <Hero t={t} lang={lang} />
      <Manifesto t={t} />
      <MapSection t={t} lang={lang} />
      <SoulsSection t={t} lang={lang} />
      <TimelineSection t={t} lang={lang} />
      <DirectorySection t={t} lang={lang} />
      <Colophon t={t} lang={lang} />
    </>
  );
}
