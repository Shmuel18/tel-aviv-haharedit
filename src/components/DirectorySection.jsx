import { useState, useMemo, useEffect } from 'react';
import synagoguesData from '../data/synagogues.json';
import mikvaotData from '../data/mikvaot.json';
import kosherData from '../data/kosher.json';
import officeMinyanimData from '../data/office-minyanim.json';
import eruvData from '../data/eruv.json';
import gmachimData from '../data/gmachim.json';
import historicalNotesData from '../data/historical-notes.json';
import { AddEntryModal } from './AddEntryModal.jsx';
import { ZmanimWidget } from './ZmanimWidget.jsx';

// Index historical notes by "name|address" for fast lookup.
const NOTES_INDEX = new Map(
  historicalNotesData.map(n => [`${n.matchName}|${n.matchAddress}`, n])
);
function noteFor(item) {
  if (!item || !item.name) return null;
  return NOTES_INDEX.get(`${item.name}|${item.address || ''}`) || null;
}

// Match a synagogue to a neighborhood by note tag or street keyword.
function inNeighborhood(item, neighborhood) {
  if (!neighborhood) return true;
  const note = noteFor(item);
  if (note?.neighborhoodId === neighborhood.id) return true;
  const addr = item.address || '';
  return (neighborhood.streetKeywords || []).some(k => addr.includes(k));
}

const STORAGE_KEY = 'taharedit_userdata_v1';

const NUSACH_GROUPS = {
  he: {
    'ספרד': 'ספרד', 'עדות המזרח': 'עדות המזרח', 'אשכנז': 'אשכנז',
    'תימן בלדי': 'תימן', 'תימן שאמי': 'תימן', 'תימן': 'תימן',
    'חב"ד': 'חסידי', 'חסידי גור (חסידותית)': 'חסידי', 'חסידי': 'חסידי',
    'מרוקו': 'עדות המזרח', 'ירושלמי': 'אשכנז',
    'לפי החזן': 'אחר', '—': 'אחר',
  },
};

function nusachGroup(nusach) {
  return NUSACH_GROUPS.he[nusach] || 'אחר';
}

const CATEGORIES = {
  synagogues: {
    label: { he: 'בתי כנסת', en: 'Synagogues' },
    icon: '✡',
    schema: ['name', 'nusach', 'address'],
    fields: {
      he: { name: 'שם', nusach: 'נוסח', address: 'כתובת' },
      en: { name: 'Name', nusach: 'Rite', address: 'Address' },
    },
    filterKey: (item) => nusachGroup(item.nusach),
    filterOptions: { he: ['הכל','ספרד','עדות המזרח','אשכנז','תימן','חסידי','אחר'], en: ['All','Sefarad','Edot','Ashkenaz','Yemenite','Hasidic','Other'] },
    secondary: (item) => item.nusach,
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
    filterKey: (item) => item.type.includes('כלים') ? 'נשים+כלים' : item.type.trim(),
    filterOptions: { he: ['הכל','נשים','נשים+כלים','גברים'], en: ['All','Women','Women+Vessels','Men'] },
    secondary: (item) => item.type,
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
      const t = item.type;
      if (t.includes('בשרי')) return 'בשרי';
      if (t.includes('חלבי')) return 'חלבי';
      if (t.includes('פרווה') || t.includes('פיצוחים')) return 'פרווה';
      if (t.includes('מאפיה') || t.includes('קונדטוריה')) return 'מאפייה';
      if (t.includes('מלון') || t.includes('אולם')) return 'מלון/אירועים';
      if (t.includes('מרכול') || t.includes('חנות')) return 'חנות/מרכול';
      return 'אחר';
    },
    filterOptions: {
      he: ['הכל','בשרי','חלבי','פרווה','מאפייה','מלון/אירועים','חנות/מרכול','אחר'],
      en: ['All','Meat','Dairy','Pareve','Bakery','Hotels','Shops','Other'],
    },
    secondary: (item) => item.type + (item.congregation ? ` · ${item.congregation}` : ''),
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
    filterKey: (item) => item.tower || 'אחר',
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
    filterKey: (item) => item.status || 'לא ידוע',
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
    filterKey: (item) => item.category || 'אחר',
    filterOptions: {
      he: ['הכל', 'שמחות ואירועים', 'מוצרי תינוקות', 'ציוד רפואי וסיוע', 'מתנות ובגדים', 'הלוואות כספים', 'עזרה אישית', 'כללי'],
      en: ['All', 'Events', 'Baby items', 'Medical', 'Gifts/Clothing', 'Loans', 'Personal Help', 'General'],
    },
    secondary: (item) => [item.kind, item.notes].filter(Boolean).join(' · '),
    source: 'rabanut.co.il',
  },
};

const BUILTIN_DATA = {
  synagogues: synagoguesData,
  mikvaot: mikvaotData,
  kosher: kosherData,
  'office-minyanim': officeMinyanimData,
  eruv: eruvData,
  gmachim: gmachimData,
};

function loadUserData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function DirectorySection({ t, lang }) {
  const [activeCat, setActiveCat] = useState('synagogues');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [heritageOnly, setHeritageOnly] = useState(false);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState(null);
  const [userData, setUserData] = useState(() => loadUserData());
  const [showAdd, setShowAdd] = useState(false);
  const [expandedNote, setExpandedNote] = useState(null);

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
    const onFocus = (e) => {
      const { category, name, address, neighborhoodId, neighborhoodName } = e.detail || {};
      if (category && category in CATEGORIES) {
        setActiveCat(category);
      }
      if (name) {
        setQuery(name);
        setActiveFilter(0);
        setNeighborhoodFilter(null);
        setTimeout(() => setExpandedNote(`${name}-${address || ''}-0`), 50);
      } else if (neighborhoodId) {
        // Find the neighborhood object to access streetKeywords
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
  const userEntries = userData[activeCat] || [];
  const all = [...builtin, ...userEntries.map(e => ({ ...e, _user: true }))];

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

  const handleAdd = (entry) => {
    const next = { ...userData, [activeCat]: [...(userData[activeCat] || []), entry] };
    setUserData(next);
    saveUserData(next);
    setShowAdd(false);
  };

  const handleDeleteUserEntry = (idx) => {
    const newEntries = userEntries.filter((_, i) => i !== idx);
    const next = { ...userData, [activeCat]: newEntries };
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
    // Use the historically-noted synagogues as the curated route
    const route = synagoguesData
      .filter(s => noteFor(s))
      .map(s => {
        const note = noteFor(s);
        return {
          stop: 0,
          name: s.name,
          address: s.address,
          year: note?.year,
          note: note?.[lang] || note?.he,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address + ', תל אביב')}`,
        };
      })
      .map((s, i) => ({ ...s, stop: i + 1 }));

    const exportObj = {
      title: lang === 'he' ? 'מסלול תיירות: תל אביב החרדית' : 'Tourism Route: The Other White City',
      date: new Date().toISOString().slice(0, 10),
      source: 'kipa.co.il + curated historical research',
      stops: route,
      googleMapsDirections: `https://www.google.com/maps/dir/${route.map(s => encodeURIComponent(s.address + ', תל אביב')).join('/')}`,
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
      .filter(s => noteFor(s))
      .map(s => encodeURIComponent(s.address + ', תל אביב'))
      .join('/');
    window.open(`https://www.google.com/maps/dir/${addrs}`, '_blank');
  };

  const primaryKey = cat.primaryField || 'name';

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
          {Object.entries(CATEGORIES).map(([key, c]) => (
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
          ))}
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
            const cardKey = `${item[primaryKey]}-${item.address || ''}-${i}`;
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
                    {item[primaryKey] || '—'}
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
                    {item.address && (
                      <a
                        className="syn-addr syn-addr-link"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address + ', תל אביב')}`}
                        target="_blank"
                        rel="noreferrer"
                        title={t.directory.openMaps}
                      >
                        <span>{item.address}</span>
                        <span className="syn-addr-icon">🗺</span>
                      </a>
                    )}
                    {item.notes && <span className="syn-addr syn-notes">{item.notes}</span>}
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
