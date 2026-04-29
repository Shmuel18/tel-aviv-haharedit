import archiveData from '../data/archive.json';
import type { ArchiveItem, Lang, T } from '../types';

interface Props { t: T; lang: Lang; }

export function ArchiveSection({ t }: Props) {
  const items = archiveData as ArchiveItem[];
  return (
    <section className="archive-section" id="archive" data-screen-label="07 Archive">
      <div className="section">
        <div className="section-kicker">{t.archive.kicker}</div>
        <h2 className="section-title">{t.archive.title}</h2>
        <p className="section-lede">{t.archive.lede}</p>

        <div className="archive-grid">
          {items.map((item, i) => (
            <article key={i} className="archive-item">
              <div className="archive-num">{String(i + 1).padStart(2, '0')}</div>
              <div className="archive-body">
                <h3 className="archive-title">{item.title}</h3>
                <div className="archive-meta">
                  <span className="archive-year">{item.year}</span>
                  <span className="archive-publisher">{item.publisher}</span>
                  <span className="archive-pages">{item.pages} {t.archive.pages}</span>
                </div>
                <p className="archive-summary">{item.summary}</p>
                <a
                  className="archive-download"
                  href={`/archive/${encodeURIComponent(item.filename)}`}
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  ↓ {t.archive.download} (PDF)
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="archive-footer">
          {t.archive.credit}
        </div>
      </div>
    </section>
  );
}
