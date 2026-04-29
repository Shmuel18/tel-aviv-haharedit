import { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import synagoguesRaw from '../data/synagogues.json';
import mikvaotRaw from '../data/mikvaot.json';
import kosherRaw from '../data/kosher.json';
import gmachimRaw from '../data/gmachim.json';
import type { Gmach, KosherBusiness, Lang, Mikve, Synagogue, T } from '../types';

const synagoguesData = synagoguesRaw as Synagogue[];
const mikvaotData = mikvaotRaw as Mikve[];
const kosherData = kosherRaw as KosherBusiness[];
const gmachimData = gmachimRaw as Gmach[];

type Cat = 'synagogues' | 'mikvaot' | 'kosher' | 'gmachim';

interface IndexEntry {
  cat: Cat;
  name: string;
  sub: string;
  addr: string;
  blob: string;
}

function buildIndex(): IndexEntry[] {
  const idx: IndexEntry[] = [];
  for (const s of synagoguesData) {
    idx.push({
      cat: 'synagogues', name: s.name, sub: s.nusach, addr: s.address || '',
      blob: `${s.name} ${s.nusach} ${s.address || ''}`.toLowerCase(),
    });
  }
  for (const m of mikvaotData) {
    idx.push({
      cat: 'mikvaot', name: m.name, sub: m.type, addr: m.address || '',
      blob: `${m.name} ${m.type} ${m.address || ''}`.toLowerCase(),
    });
  }
  for (const k of kosherData) {
    idx.push({
      cat: 'kosher', name: k.name, sub: k.type, addr: k.address || '',
      blob: `${k.name} ${k.type} ${k.address || ''} ${k.congregation || ''}`.toLowerCase(),
    });
  }
  for (const g of gmachimData) {
    idx.push({
      cat: 'gmachim', name: g.name, sub: g.kind || g.category, addr: g.address || '',
      blob: `${g.name} ${g.kind || ''} ${g.category || ''} ${g.address || ''}`.toLowerCase(),
    });
  }
  return idx;
}

const INDEX = buildIndex();

// Fuse.js with weights — name is most important, then sub (nusach/type), then address.
// `threshold: 0.4` keeps results meaningful while tolerating typos.
const FUSE = new Fuse(INDEX, {
  keys: [
    { name: 'name', weight: 0.55 },
    { name: 'sub', weight: 0.20 },
    { name: 'addr', weight: 0.25 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: false,
  minMatchCharLength: 2,
});

const CAT_LABELS: Record<Lang, Record<Cat, string>> = {
  he: { synagogues: 'בית כנסת', mikvaot: 'מקווה', kosher: 'כשר', gmachim: 'גמ"ח' },
  en: { synagogues: 'Synagogue', mikvaot: 'Mikve', kosher: 'Kosher', gmachim: 'Gemach' },
};

const CAT_ICON: Record<Cat, string> = { synagogues: '✡', mikvaot: '〰', kosher: '✓', gmachim: '♡' };

interface Props { t: T; lang: Lang; }

export function GlobalSearch({ t, lang }: Props) {
  const [query, setQuery] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo<IndexEntry[]>(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return FUSE.search(q, { limit: 30 }).map(r => r.item);
  }, [query]);

  // Keyboard shortcut: Ctrl/Cmd + K opens
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handlePick = (entry: IndexEntry) => {
    const target = document.getElementById('directory');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('directory-focus', {
        detail: {
          category: entry.cat,
          name: entry.cat === 'synagogues' ? entry.name : undefined,
          address: entry.cat === 'synagogues' ? entry.addr : undefined,
        },
      }));
      // Also pre-fill the directory's own search (for non-synagogue cats)
      if (entry.cat !== 'synagogues') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('directory-focus', {
            detail: { category: entry.cat, name: entry.name, address: entry.addr },
          }));
        }, 100);
      }
    }, 350);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        className="global-search-trigger"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        title={t.globalSearch.shortcutHint}
      >
        🔍 <span>{t.globalSearch.trigger}</span>
        <kbd className="gs-kbd">⌘K</kbd>
      </button>

      {open && (
        <div className="gs-backdrop" onClick={() => setOpen(false)}>
          <div className="gs-modal" onClick={e => e.stopPropagation()}>
            <div className="gs-input-wrap">
              <span className="gs-input-icon">🔍</span>
              <input
                ref={inputRef}
                type="search"
                className="gs-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.globalSearch.placeholder}
                aria-label={t.globalSearch.placeholder}
              />
              <button className="gs-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="gs-results">
              {query.trim().length < 2 && (
                <div className="gs-hint">{t.globalSearch.hint}</div>
              )}
              {query.trim().length >= 2 && results.length === 0 && (
                <div className="gs-hint">{t.globalSearch.empty}</div>
              )}
              {results.map((r, i) => (
                <button
                  key={`${r.cat}-${r.name}-${i}`}
                  className="gs-result"
                  onClick={() => handlePick(r)}
                >
                  <span className="gs-result-icon">{CAT_ICON[r.cat]}</span>
                  <div className="gs-result-body">
                    <div className="gs-result-name">{r.name}</div>
                    <div className="gs-result-meta">
                      <span className="gs-result-cat">{CAT_LABELS[lang][r.cat]}</span>
                      {r.sub && <span> · {r.sub}</span>}
                      {r.addr && <span> · {r.addr}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="gs-footer">
              <kbd>↑↓</kbd> {t.globalSearch.navigate} ·{' '}
              <kbd>↵</kbd> {t.globalSearch.select} ·{' '}
              <kbd>Esc</kbd> {t.globalSearch.close}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
