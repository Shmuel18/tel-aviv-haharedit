import { useState } from 'react';
import vignettes from '../data/vignettes.json';

export function VignettesSection({ t, lang }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section className="vignettes-section" id="vignettes" data-screen-label="0X Stories">
      <div className="section">
        <div className="section-kicker">{t.vignettes.kicker}</div>
        <h2 className="section-title">{t.vignettes.title}</h2>
        <p className="section-lede">{t.vignettes.lede}</p>

        <div className="vignettes-list">
          {vignettes.map((v, i) => {
            const open = i === activeIdx;
            return (
              <article
                key={i}
                className={`vignette ${open ? 'open' : ''}`}
                onClick={() => setActiveIdx(open ? -1 : i)}
              >
                <div className="vignette-year">{v.year}</div>
                <div className="vignette-body">
                  <h3 className="vignette-title">
                    {lang === 'he' ? v.title_he : v.title_en}
                  </h3>
                  <p className="vignette-text">
                    {lang === 'he' ? v.he : v.en}
                  </p>
                  <div className="vignette-source">
                    {t.vignettes.from}: <em>{v.source}</em>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
