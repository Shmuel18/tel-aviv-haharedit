import { useState, useEffect, type ReactElement } from 'react';

export function ScrollProgress(): ReactElement {
  const [pct, setPct] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const next = max > 0 ? (window.scrollY / max) * 100 : 0;
        setPct(next);
        setShowTop(window.scrollY > 600);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div
        className="scroll-progress"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      />
      <button
        className={`back-to-top ${showTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="חזור לראש העמוד"
        title="חזור לראש העמוד"
      >
        ↑
      </button>
    </>
  );
}
