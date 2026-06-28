import { useState, useEffect, lazy, Suspense, type Dispatch, type SetStateAction } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CONTENT } from './content';
import type { Lang, T } from './types';

gsap.registerPlugin(ScrollTrigger);
import { Hero } from './components/Hero';
import { MapSection } from './components/MapSection';
import { SoulsSection } from './components/SoulsSection';
import { TimelineSection, Manifesto, Colophon } from './components/Timeline';
import { DirectorySection } from './components/DirectorySection';
import { ArchiveSection } from './components/ArchiveSection';
import { VignettesSection } from './components/VignettesSection';
import { GlobalSearch } from './components/GlobalSearch';
import { ScrollProgress } from './components/ScrollProgress';
import { ErrorBoundary } from './components/ErrorBoundary';

// LiveMap pulls in Leaflet (~150 KB). Code-split so initial paint stays fast.
const LiveMap = lazy(() => import('./components/LiveMap').then(m => ({ default: m.LiveMap })));
// Breathing City: flagship temporal atlas (Leaflet + data). Code-split.
const BreathingCity = lazy(() => import('./components/BreathingCity').then(m => ({ default: m.BreathingCity })));
import './styles.css';

interface TopNavProps {
  t: T;
  lang: Lang;
  setLang: Dispatch<SetStateAction<Lang>>;
}

function TopNav({ t, lang, setLang }: TopNavProps) {
  const [activeSection, setActiveSection] = useState<string>('home');

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const ids = ['home', 'manifesto', 'map', 'breathing', 'souls', 'vignettes', 'timeline', 'directory', 'livemap', 'archive'];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.top <= 200 && r.bottom >= 200) {
            setActiveSection(id);
            break;
          }
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = [
    { id: 'home', label: t.nav.home },
    { id: 'manifesto', label: t.nav.manifesto },
    { id: 'map', label: t.nav.map },
    { id: 'breathing', label: lang === 'he' ? 'העיר נושמת' : 'Breathing City' },
    { id: 'souls', label: t.nav.souls },
    { id: 'vignettes', label: t.nav.vignettes },
    { id: 'timeline', label: t.nav.timeline },
    { id: 'directory', label: t.nav.directory },
    { id: 'livemap', label: t.nav.livemap },
    { id: 'archive', label: t.nav.archive },
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
  const [lang, setLang] = useState<Lang>('he');
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
      <a className="skip-to-content" href="#home">{lang === 'he' ? 'דלג לתוכן הראשי' : 'Skip to main content'}</a>
      <ScrollProgress />
      <TopNav t={t} lang={lang} setLang={setLang} />
      <div className="edition-mark">{t.edition}</div>
      <ErrorBoundary label="Hero"><Hero t={t} lang={lang} /></ErrorBoundary>
      <ErrorBoundary label="Manifesto"><Manifesto t={t} /></ErrorBoundary>
      <ErrorBoundary label="MapSection"><MapSection t={t} lang={lang} /></ErrorBoundary>
      <ErrorBoundary label="BreathingCity" title="האטלס החי לא נטען" message="כל שאר האתר ממשיך כרגיל. בדוק חיבור אינטרנט וטען מחדש.">
        <Suspense fallback={<div style={{ minHeight: 400, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', color: 'var(--ink-muted)', fontStyle: 'italic' }}>טוען אטלס...</div>}>
          <BreathingCity lang={lang} />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary label="Souls"><SoulsSection t={t} lang={lang} /></ErrorBoundary>
      <ErrorBoundary label="Vignettes"><VignettesSection t={t} lang={lang} /></ErrorBoundary>
      <ErrorBoundary label="Timeline"><TimelineSection t={t} lang={lang} /></ErrorBoundary>
      <ErrorBoundary label="Directory"><DirectorySection t={t} lang={lang} /></ErrorBoundary>
      <ErrorBoundary label="LiveMap" title="המפה החיה לא נטענה" message="כל שאר האתר ממשיך כרגיל. בדוק חיבור אינטרנט וטען מחדש.">
        <Suspense fallback={<div style={{ minHeight: 400, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', color: 'var(--ink-muted)', fontStyle: 'italic' }}>טוען מפה...</div>}>
          <LiveMap t={t} lang={lang} />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary label="Archive"><ArchiveSection t={t} lang={lang} /></ErrorBoundary>
      <Colophon t={t} lang={lang} />
    </>
  );
}
