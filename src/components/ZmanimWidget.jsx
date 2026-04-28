import { useState, useEffect, useMemo } from 'react';

const HEBCAL_URL = 'https://www.hebcal.com/zmanim?cfg=json&geonameid=293397'; // Tel Aviv
const CACHE_KEY = 'taharedit_zmanim_v1';

const FIELDS = [
  { key: 'alotHaShachar', he: 'עלות השחר', en: 'Alot HaShachar' },
  { key: 'sunrise', he: 'הנץ החמה', en: 'Sunrise' },
  { key: 'sofZmanShma', he: 'סוף ק״ש', en: 'Sof Zman Shma' },
  { key: 'sofZmanTfilla', he: 'סוף תפילה', en: 'Sof Zman Tfilla' },
  { key: 'chatzot', he: 'חצות', en: 'Chatzot' },
  { key: 'minchaGedola', he: 'מנחה גדולה', en: 'Mincha Gedola' },
  { key: 'plagHaMincha', he: 'פלג המנחה', en: 'Plag HaMincha' },
  { key: 'sunset', he: 'שקיעה', en: 'Sunset' },
  { key: 'tzeit7083deg', he: 'צאת הכוכבים', en: 'Tzeit HaKochavim' },
];

function todayDateStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function loadCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj.date !== todayDateStr()) return null;
    return obj.times;
  } catch { return null; }
}

function saveCached(times) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayDateStr(), times }));
  } catch { /* quota */ }
}

export function ZmanimWidget({ t, lang }) {
  const [times, setTimes] = useState(() => loadCached());
  const [loading, setLoading] = useState(!loadCached());
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Tick once a minute so the "current"/"next" highlight stays fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Find the index of the next upcoming time (and mark the previous as "current").
  const { currentIdx, nextIdx } = useMemo(() => {
    if (!times) return { currentIdx: -1, nextIdx: -1 };
    let next = -1;
    for (let i = 0; i < FIELDS.length; i++) {
      const ts = times[FIELDS[i].key];
      if (!ts) continue;
      if (new Date(ts).getTime() > now) { next = i; break; }
    }
    const current = next === -1 ? FIELDS.length - 1 : next - 1;
    return { currentIdx: current, nextIdx: next };
  }, [times, now]);

  useEffect(() => {
    if (times) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${HEBCAL_URL}&date=${todayDateStr()}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(data => {
        if (cancelled) return;
        setTimes(data.times || {});
        saveCached(data.times || {});
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const dateNice = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="zmanim-widget">
      <div className="zmanim-head">
        <div>
          <div className="zmanim-kicker">{t.zmanim.kicker}</div>
          <div className="zmanim-title">{lang === 'he' ? dateNice : new Date().toDateString()}</div>
        </div>
        <div className="zmanim-loc">{lang === 'he' ? 'תל אביב' : 'Tel Aviv'}</div>
      </div>

      {loading && <div className="zmanim-status">{t.zmanim.loading}</div>}
      {error && <div className="zmanim-status zmanim-error">{t.zmanim.error}</div>}

      {times && (
        <div className="zmanim-grid">
          {FIELDS.map((f, i) => {
            const isPast = currentIdx >= 0 && i <= currentIdx;
            const isNext = i === nextIdx;
            return (
              <div
                key={f.key}
                className={`zmanim-row ${isPast ? 'is-past' : ''} ${isNext ? 'is-next' : ''}`}
              >
                <span className="zmanim-label">
                  {isNext && <span className="zmanim-pulse" aria-hidden="true">●</span>}
                  {lang === 'he' ? f.he : f.en}
                </span>
                <span className="zmanim-time">{formatTime(times[f.key])}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="zmanim-source">
        {t.zmanim.source} ·{' '}
        <a href="https://www.hebcal.com/" target="_blank" rel="noreferrer">Hebcal</a>
      </div>
    </div>
  );
}
