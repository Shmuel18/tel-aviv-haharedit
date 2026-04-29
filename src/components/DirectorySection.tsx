import { useState, useMemo, useEffect } from 'react';
import synagoguesRaw from '../data/synagogues.json';
import mikvaotRaw from '../data/mikvaot.json';
import kosherRaw from '../data/kosher.json';
import officeMinyanimRaw from '../data/office-minyanim.json';
import eruvRaw from '../data/eruv.json';
import gmachimRaw from '../data/gmachim.json';
import historicalNotesRaw from '../data/historical-notes.json';
import { AddEntryModal } from './AddEntryModal';
import { ZmanimWidget } from './ZmanimWidget';
import type {
  EruvArea,
  Gmach,
  HistoricalNote,
  KosherBusiness,
  Lang,
  Mikve,
  Neighborhood,
  OfficeMinyan,
  Synagogue,
  T,
} from '../types';

const synagoguesData = synagoguesRaw as Synagogue[];
const mikvaotData = mikvaotRaw as Mikve[];
const kosherData = kosherRaw as KosherBusiness[];
const officeMinyanimData = officeMinyanimRaw as OfficeMinyan[];
const eruvData = eruvRaw as EruvArea[];
const gmachimData = gmachimRaw as Gmach[];
const historicalNotesData = historicalNotesRaw as HistoricalNote[];

// A directory item can be one of several shapes depending on the category.
// We treat them as a flexible record at runtime; render code uses `string`
// fields that all categories happen to share (name, address, notes...).
type DirItem = Record<string, unknown> & {
  _user?: boolean;
  name?: string;
  address?: string;
};

type CatId = 'synagogues' | 'mikvaot' | 'kosher' | 'office-minyanim' | 'eruv' | 'gmachim';

interface CategoryDef {
  label: { he: string; en: string };
  icon: string;
  schema: string[];
  fields: { he: Record<string, string>; en: Record<string, string> };
  filterKey: (item: DirItem) => string;
  filterOptions: { he: string[]; en: string[] };
  secondary: (item: DirItem) => string;
  source: string;
  manualOnly?: boolean;
  primaryField?: string;
}

// Index historical notes by "name|address" for fast lookup.
const NOTES_INDEX = new Map<string, HistoricalNote>(
  historicalNotesData.map(n => [`${n.matchName}|${n.matchAddress}`, n])
);
function noteFor(item: DirItem): HistoricalNote | null {
  const name = item?.name as string | undefined;
  if (!name) return null;
  const addr = (item.address as string) || '';
  return NOTES_INDEX.get(`${name}|${addr}`) || null;
}

function inNeighborhood(item: DirItem, neighborhood: Neighborhood | null): boolean {
  if (!neighborhood) return true;
  const note = noteFor(item);
  if (note?.neighborhoodId === neighborhood.id) return true;
  const addr = (item.address as string) || '';
  return (neighborhood.streetKeywords || []).some((k: string) => addr.includes(k));
}

const STORAGE_KEY = 'taharedit_userdata_v1';

const NUSACH_GROUPS: Record<string, string> = {
  'ספרד': 'ספרד', 'עדות המזרח': 'עדות המזרח', 'אשכנז': 'אשכנז',
  'תימן בלדי': 'תימן', 'תימן שאמי': 'תימן', 'תימן': 'תימן',
  'חב"ד': 'חסידי', 'חסידי גור (חסידותית)': 'חסידי', 'חסידי': 'חסידי',
  'מרוקו': 'עדות המזרח', 'ירושלמי': 'אשכנז',
  'לפי החזן': 'אחר', '—': 'אחר',
};

function nusachGroup(nusach: string): string {
  return NUSACH_GROUPS[nusach] || 'אחר';
}

const CATEGORIES: Record<CatId, CategoryDef> = {
  synagogues: {
    label: { he: 'בתי כנסת', en: 'Synagogues' },
    icon: '✡',
    schema: ['name', 'nusach', 'address'],
    fields: {
      he: { name: 'שם', nusach: 'נוסח', address: 'כתובת' },
      en: { name: 'Name', nusach: 'Rite', address: 'Address' },
    },
    filterKey: (item) => nusachGroup(String(item.nusach || '')),
    filterOptions: { he: ['הכל','ספרד','עדות המזרח','אשכנז','תימן','חסידי','אחר'], en: ['All','Sefarad','Edot','Ashkenaz','Yemenite','Hasidic','Other'] },
    secondary: (item) => String(item.nusach || ''),
    source: 'kipa.co.il',
  },
  mikvaot: {
    label: { he: 'מקוואות', en: 'Mikvaot' },
    icon: '〰',
    schema: ['name', 'type', 'address'],
    fields: {
      he: { name: 'שם', type: 'סוג', address: 'כתובת' },
      en: { name: 'Name', type: 'Type', address: 'Address' },
    },
    filterKey: (item) => {
      const tp = String(item.type || '');
      return tp.includes('כלים') ? 'נשים+כלים' : tp.trim();
    },
    filterOptions: { he: ['הכל','נשים','נשים+כלים','גברים'], en: ['All','Women','Women+Vessels','Men'] },
    secondary: (item) => String(item.type || ''),
    source: 'kipa.co.il',
  },
  kosher: {
    label: { he: 'מסעדות וכשרות', en: 'Kosher' },
    icon: '✓',
    schema: ['name', 'type', 'address', 'congregation'],
    fields: {
      he: { name: 'שם', type: 'סוג', address: 'כתובת', congregation: 'רמת כשרות' },
      en: { name: 'Name', type: 'Type', address: 'Address', congregation: 'Kashrut' },
    },
    filterKey: (item) => {
      const tp = String(item.type || '');
      if (tp.includes('בשרי')) return 'בשרי';
      if (tp.includes('חלבי')) return 'חלבי';
      if (tp.includes('פרווה') || tp.includes('פיצוחים')) return 'פרווה';
      if (tp.includes('מאפיה') || tp.includes('קונדטוריה')) return 'מאפייה';
      if (tp.includes('מלון') || tp.includes('אולם')) return 'מלון/אירועים';
      if (tp.includes('מרכול') || tp.includes('חנות')) return 'חנות/מרכול';
      return 'אחר';
    },
    filterOptions: {
      he: ['הכל','בשרי','חלבי','פרווה','מאפייה','מלון/אירועים','חנות/מרכול','אחר'],
      en: ['All','Meat','Dairy','Pareve','Bakery','Hotels','Shops','Other'],
    },
    secondary: (item) => String(item.type || '') + (item.congregation ? ` · ${item.congregation}` : ''),
    source: 'rabanut.co.il',
  },
  'office-minyanim': {
    label: { he: 'מנייני משרדים', en: 'Office Minyanim' },
    icon: '🕒',
    schema: ['name', 'tower', 'address', 'floor', 'times', 'nusach'],
    fields: {
      he: { name: 'שם', tower: 'מגדל', address: 'כתובת', floor: 'קומה', times: 'זמנים', nusach: 'נוסח', notes: 'הערות' },
      en: { name: 'Name', tower: 'Tower', address: 'Address', floor: 'Floor', times: 'Times', nusach: 'Rite', notes: 'Notes' },
    },
    filterKey: (item) => String(item.tower || 'אחר'),
    filterOptions: { he: ['הכל'], en: ['All'] },
    secondary: (item) => [item.tower, item.floor, item.times].filter(Boolean).join(' · '),
    source: 'הזנה ידנית',
    manualOnly: true,
  },
  eruv: {
    label: { he: 'עירוב', en: 'Eruv' },
    icon: '◇',
    schema: ['area', 'status', 'lastChecked'],
    fields: {
      he: { area: 'אזור', status: 'סטטוס', lastChecked: 'נבדק לאחרונה', notes: 'הערות' },
      en: { area: 'Area', status: 'Status', lastChecked: 'Last Checked', notes: 'Notes' },
    },
    filterKey: (item) => String(item.status || 'לא ידוע'),
    filterOptions: { he: ['הכל','כשר','לא כשר','חלקי','לא ידוע'], en: ['All','Kosher','Invalid','Partial','Unknown'] },
    secondary: (item) => `${item.status || '—'} · ${item.lastChecked || ''}`,
    primaryField: 'area',
    source: 'הזנה ידנית · רבנות ת״א',
    manualOnly: true,
  },
  gmachim: {
    label: { he: 'גמ"חים', en: 'Gemachim' },
    icon: '♡',
    schema: ['name', 'category', 'address', 'phone', 'kind', 'notes'],
    fields: {
      he: { name: 'שם', category: 'קטגוריה', address: 'כתובת', phone: 'טלפון', kind: 'סוג', notes: 'הערות' },
      en: { name: 'Name', category: 'Category', address: 'Address', phone: 'Phone', kind: 'Kind', notes: 'Notes' },
    },
    filterKey: (item) => String(item.category || 'אחר'),
    filterOptions: {
      he: ['הכל', 'שמחות ואירועים', 'מוצרי תינוקות', 'ציוד רפואי וסיוע', 'מתנות ובגדים', 'הלוואות כספים', 'עזרה אישית', 'כללי'],
      en: ['All', 'Events', 'Baby items', 'Medical', 'Gifts/Clothing', 'Loans', 'Personal Help', 'General'],
    },
    secondary: (item) => [item.kind, item.notes].filter(Boolean).join(' · '),
    source: 'rabanut.co.il',
  },
};

const BUILTIN_DATA: Record<CatId, DirItem[]> = {
  synagogues: synagoguesData as unknown as DirItem[],
  mikvaot: mikvaotData as unknown as DirItem[],
  kosher: kosherData as unknown as DirItem[],
  'office-minyanim': officeMinyanimData as unknown as DirItem[],
  eruv: eruvData as unknown as DirItem[],
  gmachim: gmachimData as unknown as DirItem[],
};

type UserData = Partial<Record<CatId, DirItem[]>>;

function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserData) : {};
  } catch {
    return {};
  }
}

function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface FocusEventDetail {
  category?: CatId;
  name?: string;
  address?: string;
  neighborhoodId?: string;
  neighborhoodName?: string;
}

interface Props { t: T; lang: Lang; }

export function DirectorySection({ t, lang }: Props) {
  const [activeCat, setActiveCat] = useState<CatId>('synagogues');
  const [query, setQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<number>(0);
  const [heritageOnly, setHeritageOnly] = useState<boolean>(false);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<Neighborhood | null>(null);
  const [userData, setUserData] = useState<UserData>(() => loadUserData());
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  // Reset filter index when switching category
  useEffect(() => {
    setActiveFilter(0);
    setQuery('');
    setExpandedNote(null);
    setHeritageOnly(false);
    setNeighborhoodFilter(null);
  }, [activeCat]);

  // Listen for cross-section navigation (e.g., from Souls → "go to this synagogue")
  useEffect(() => {
    const onFocus = (e: Event) => {
      const detail = (e as CustomEvent<FocusEventDetail>).detail || {};
      const { category, name, address, neighborhoodId } = detail;
      if (category && category in CATEGORIES) {
        setActiveCat(category);
      }
      if (name) {
        setQuery(name);
        setActiveFilter(0);
        setNeighborhoodFilter(null);
        setTimeout(() => setExpandedNote(`${name}-${address || ''}-0`), 50);
      } else if (neighborhoodId) {
        const nb = (t.neighborhoods || []).find(n => n.id === neighborhoodId);
        if (nb) {
          setNeighborhoodFilter(nb);
          setQuery('');
          setActiveFilter(0);
          setHeritageOnly(false);
        }
      }
    };
    window.addEventListener('directory-focus', onFocus);
    return () => window.removeEventListener('directory-focus', onFocus);
  }, [t.neighborhoods]);

  const cat = CATEGORIES[activeCat];
  const builtin = BUILTIN_DATA[activeCat];
  const userEntries: DirItem[] = userData[activeCat] || [];
  const all: DirItem[] = [...builtin, ...userEntries.map(e => ({ ...e, _user: true }))];

  const filterLabels = cat.filterOptions[lang] || cat.filterOptions.he;
  const heLabels = cat.filterOptions.he;
  const isAll = activeFilter === 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(item => {
      if (heritageOnly && activeCat === 'synagogues' && !noteFor(item)) return false;
      if (neighborhoodFilter && activeCat === 'synagogues' && !inNeighborhood(item, neighborhoodFilter)) return false;
      if (!isAll) {
        const k = cat.filterKey(item);
        if (k !== heLabels[activeFilter]) return false;
      }
      if (!q) return true;
      const blob = Object.values(item).filter(v => typeof v === 'string').join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [all, query, activeFilter, isAll, cat, heLabels, heritageOnly, neighborhoodFilter, activeCat]);

  const heritageCount = activeCat === 'synagogues'
    ? all.filter(item => noteFor(item)).length
    : 0;

  const handleAdd = (entry: Record<string, string>) => {
    const next: UserData = { ...userData, [activeCat]: [...(userData[activeCat] || []), entry as DirItem] };
    setUserData(next);
    saveUserData(next);
    setShowAdd(false);
  };

  const handleDeleteUserEntry = (idx: number) => {
    const newEntries = userEntries.filter((_, i) => i !== idx);
    const next: UserData = { ...userData, [activeCat]: newEntries };
    setUserData(next);
    saveUserData(next);
  };

  const handleExport = () => {
    const merged = [...builtin, ...userEntries];
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCat}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportRoute = () => {
    const route = synagoguesData
      .filter(s => noteFor(s as unknown as DirItem))
      .map(s => {
        const note = noteFor(s as unknown as DirItem);
        return {
          stop: 0,
          name: s.name,
          address: s.address,
          year: note?.year,
          note: note ? note[lang] : undefined,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address + ', תל אביב')}`,
        };
      })
      .map((s, i) => ({ ...s, stop: i + 1 }));

    const exportObj = {
      title: lang === 'he' ? 'מסלול תיירות: תל אביב החרדית' : 'Tourism Route: The Other White City',
      date: new Date().toISOString().slice(0, 10),
      source: 'kipa.co.il + curated historical research',
      stops: route,
      googleMapsDirections: `https://www.google.com/maps/dir/${route.map(s => encodeURIComponent((s.address || '') + ', תל אביב')).join('/')}`,
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tourism-route.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenRouteInMaps = () => {
    const addrs = synagoguesData
      .filter(s => noteFor(s as unknown as DirItem))
      .map(s => encodeURIComponent(s.address + ', תל אביב'))
      .join('/');
    window.open(`https://www.google.com/maps/dir/${addrs}`, '_blank');
  };

  const primaryKey: string = cat.primaryField || 'name';

  return (
    <section className="directory-section" id="directory" data-screen-label="06 Directory">
      <div className="section">
        <div className="section-kicker">{t.directory.kicker}</div>
        <h2 className="section-title">{t.directory.title}</h2>
        <p className="section-lede">{t.directory.lede}</p>

        {/* Zmanim widget — today's prayer times for Tel Aviv */}
        <ZmanimWidget t={t} lang={lang} />

        {/* Stats banner */}
        <div className="dir-stats">
          <div className="dir-stat">
            <span className="dir-stat-num">{Object.values(BUILTIN_DATA).reduce((a, b) => a + b.length, 0)}</span>
            <span className="dir-stat-label">{t.directory.statsTotal}</span>
          </div>
          <div className="dir-stat-divider" />
          <div className="dir-stat">
            <span className="dir-stat-num">{historicalNotesData.length}</span>
            <span className="dir-stat-label">{t.directory.statsNotes}</span>
          </div>
          <div className="dir-stat-divider" />
          <div className="dir-stat">
            <span className="dir-stat-num">3</span>
            <span className="dir-stat-label">{t.directory.statsSources}</span>
          </div>
          <div className="dir-stat-divider" />
          <div className="dir-stat">
            <span className="dir-stat-num">{t.directory.statsUpdatedDate}</span>
            <span className="dir-stat-label">{t.directory.statsUpdated}</span>
          </div>
        </div>

        {/* Category tabs */}
        <div className="dir-tabs">
          {(Object.keys(CATEGORIES) as CatId[]).map((key) => {
            const c = CATEGORIES[key];
            return (
              <button
                key={key}
                className={`dir-tab ${key === activeCat ? 'active' : ''}`}
                onClick={() => setActiveCat(key)}
              >
                <span className="dir-tab-icon">{c.icon}</span>
                <span className="dir-tab-label">{c.label[lang]}</span>
                <span className="dir-tab-count">
                  {(BUILTIN_DATA[key]?.length || 0) + (userData[key]?.length || 0)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="syn-controls">
          <div className="syn-search">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.directory.searchPlaceholder}
              aria-label={t.directory.searchPlaceholder}
            />
            <span className="syn-count">{filtered.length} / {all.length}</span>
            <button className="dir-add-btn" onClick={() => setShowAdd(true)} title={t.directory.addBtn}>
              + {t.directory.addBtn}
            </button>
            {userEntries.length > 0 && (
              <button className="dir-export-btn" onClick={handleExport} title={t.directory.exportBtn}>
                ↓ {t.directory.exportBtn}
              </button>
            )}
          </div>

          {neighborhoodFilter && (
            <div className="syn-active-filter">
              <span className="syn-af-label">
                📍 {lang === 'he' ? 'מסונן לאזור' : 'Filtered by area'}: <strong>{neighborhoodFilter.name}</strong>
              </span>
              <button className="syn-af-clear" onClick={() => setNeighborhoodFilter(null)}>
                ✕ {lang === 'he' ? 'נקה' : 'Clear'}
              </button>
            </div>
          )}

          {cat.filterOptions[lang].length > 1 && (
            <div className="syn-filters">
              {filterLabels.map((label, i) => (
                <button
                  key={label}
                  className={`syn-chip ${i === activeFilter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(i)}
                >
                  {label}
                </button>
              ))}
              {heritageCount > 0 && (
                <button
                  className={`syn-chip syn-chip-heritage ${heritageOnly ? 'active' : ''}`}
                  onClick={() => setHeritageOnly(v => !v)}
                  title={t.directory.heritageHint}
                >
                  ★ {t.directory.heritageFilter} ({heritageCount})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tourism route bar (visible when heritage filter is active) */}
        {heritageOnly && activeCat === 'synagogues' && (
          <div className="dir-route-bar">
            <div className="dir-route-text">
              <strong>★ {t.directory.routeTitle}</strong>
              <span>{t.directory.routeDesc}</span>
            </div>
            <div className="dir-route-actions">
              <button className="btn-secondary dir-route-btn" onClick={handleOpenRouteInMaps}>
                🗺 {t.directory.routeOpenMaps}
              </button>
              <button className="btn-primary dir-route-btn" onClick={handleExportRoute}>
                ↓ {t.directory.routeDownload}
              </button>
            </div>
          </div>
        )}

        {/* Empty state for manual-only categories */}
        {cat.manualOnly && all.length === 0 && (
          <div className="dir-empty-manual">
            <p>{t.directory.manualEmpty}</p>
            <button className="dir-add-btn primary" onClick={() => setShowAdd(true)}>
              + {t.directory.addFirst}
            </button>
          </div>
        )}

        {/* Results grid */}
        <div className="syn-grid">
          {filtered.map((item, i) => {
            const note = activeCat === 'synagogues' ? noteFor(item) : null;
            const primary = String(item[primaryKey] || '');
            const addrStr = String(item.address || '');
            const cardKey = `${primary}-${addrStr}-${i}`;
            const isExpanded = expandedNote === cardKey;
            return (
              <article
                key={cardKey}
                className={`syn-card ${item._user ? 'user-added' : ''} ${note ? 'has-note' : ''} ${isExpanded ? 'expanded' : ''}`}
                data-group={cat.filterKey(item)}
              >
                <div className="syn-card-num">
                  {item._user ? '★' : String(i + 1).padStart(3, '0')}
                </div>
                <div className="syn-card-body">
                  <h3 className="syn-card-name">
                    {primary || '—'}
                    {note && (
                      <button
                        className="syn-note-badge"
                        onClick={() => setExpandedNote(isExpanded ? null : cardKey)}
                        title={t.directory.noteHint}
                        aria-expanded={isExpanded}
                      >
                        ℹ
                      </button>
                    )}
                  </h3>
                  <div className="syn-card-meta">
                    <span className="syn-nusach">{cat.secondary(item) || ''}</span>
                    {addrStr && (
                      <a
                        className="syn-addr syn-addr-link"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrStr + ', תל אביב')}`}
                        target="_blank"
                        rel="noreferrer"
                        title={t.directory.openMaps}
                      >
                        <span>{addrStr}</span>
                        <span className="syn-addr-icon">🗺</span>
                      </a>
                    )}
                    {item.notes != null && <span className="syn-addr syn-notes">{String(item.notes)}</span>}
                  </div>

                  {note && isExpanded && (
                    <div className="syn-note-body">
                      <div className="syn-note-kicker">
                        {t.directory.didYouKnow}
                        {note.year && <span className="syn-note-year"> · {note.year}</span>}
                      </div>
                      <p className="syn-note-text">{note[lang] || note.he}</p>
                    </div>
                  )}
                </div>
                {item._user && (
                  <button
                    className="syn-delete"
                    onClick={() => {
                      const userIdx = userEntries.findIndex(e => e[primaryKey] === item[primaryKey]);
                      if (userIdx >= 0 && confirm(t.directory.deleteConfirm)) {
                        handleDeleteUserEntry(userIdx);
                      }
                    }}
                    title={t.directory.delete}
                  >
                    ✕
                  </button>
                )}
              </article>
            );
          })}
          {filtered.length === 0 && !cat.manualOnly && (
            <div className="syn-empty">{t.directory.empty}</div>
          )}
        </div>

        <div className="syn-source">
          {t.directory.source}: <strong>{cat.source}</strong>
          {userEntries.length > 0 && (
            <> · {t.directory.userAdded}: <strong>{userEntries.length}</strong></>
          )}
        </div>
      </div>

      {showAdd && (
        <AddEntryModal
          category={activeCat}
          schema={cat.schema}
          fields={cat.fields[lang]}
          onSubmit={handleAdd}
          onClose={() => setShowAdd(false)}
          t={t}
        />
      )}
    </section>
  );
}
