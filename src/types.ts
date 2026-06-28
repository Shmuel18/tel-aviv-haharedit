// Shared types for the data files and content tree.

// ===== Data files =====

export interface Synagogue {
  name: string;
  nusach: string;
  address: string;
}

export interface Mikve {
  name: string;
  type: string;
  address: string;
}

export interface KosherBusiness {
  name: string;
  type: string;
  address: string;
  congregation: string | null;
  kosher_until: number | null;
}

export interface Gmach {
  category: string;
  name: string;
  address: string;
  phone: string;
  kind: string;
  notes: string;
}

export interface OfficeMinyan {
  name: string;
  tower?: string;
  address?: string;
  floor?: string;
  times?: string;
  nusach?: string;
  notes?: string;
}

export interface EruvArea {
  area: string;
  status?: string;
  lastChecked?: string;
  notes?: string;
}

export interface HistoricalNote {
  matchName: string;
  matchAddress: string;
  year?: string;
  soulId?: number;
  neighborhoodId?: string;
  he: string;
  en: string;
}

export interface ArchiveItem {
  title: string;
  filename: string;
  year: string;
  publisher: string;
  pages: string;
  summary: string;
}

export interface Vignette {
  year: string;
  title_he: string;
  title_en: string;
  he: string;
  en: string;
  source: string;
  soulId?: number;
  neighborhoodId?: string;
}

export interface GeoCoord {
  lat: number;
  lng: number;
}

export type GeocodedMap = Record<string, GeoCoord | null>;

// ===== Hasidic courts (historical research layer) =====

export interface CourtSource { title: string; url: string; publisher?: string; }
export interface CourtImage { url: string; license: string; source: string; caption?: string; }

export type CourtLayer = 'shtibel' | 'beit-midrash' | 'yeshiva';
export type CourtStatus = 'active' | 'closed' | 'demolished' | 'moved' | 'unknown';
export type CourtConfidence = 'high' | 'medium' | 'low';
export type CourtMapError = 'none' | 'wrong-number' | 'wrong-dynasty' | 'not-a-synagogue' | 'unverifiable' | 'relocated';

export interface HasidicCourt {
  id: string;
  name_he: string;
  dynasty: string;
  dynastyShort: string;
  layer: CourtLayer;
  lat: number;
  lng: number;
  address: string;
  mapAddress: string;
  founder: string;
  year: string;
  dynastyBackground_he: string;
  story_he: string;
  significance_he: string;
  glatterMatch_he: string;
  status: CourtStatus;
  confidence: CourtConfidence;
  verdict: string;
  mapError: CourtMapError;
  sources: CourtSource[];
  image: CourtImage | null;
}

// ===== Localized content tree =====

export type Lang = 'he' | 'en';

export interface Soul {
  id: number;
  name: string;
  years: string;
  role: string;
  bio: string;
  x: number;
  y: number;
  delay: number;
  linkedSynagogue?: { name: string; address: string; label: string };
}

export interface Neighborhood {
  id: string;
  name: string;
  eng: string;
  founded: string;
  communities: string;
  rabbis: string;
  story: string;
  x: number;
  y: number;
  streetKeywords?: string[];
}

export type EventLink =
  | { type: 'neighborhood'; id: string; label: string }
  | { type: 'synagogue'; name: string; address: string; label: string }
  | { type: 'category'; id: string; label: string };

export interface TimelineEvent {
  year: string;
  title: string;
  desc: string;
  link?: EventLink;
}

export interface LocalizedContent {
  nav: {
    home: string;
    manifesto: string;
    map: string;
    souls: string;
    vignettes: string;
    timeline: string;
    directory: string;
    livemap: string;
    archive: string;
  };
  edition: string;
  hero: { kicker: string; titleA: string; titleB: string; subtitle: string };
  heroCorner: { line1: string; line2: string };
  scrollCue: string;
  manifesto: { kicker: string; title: string; sub: string; colA: string; colB: string };
  map: { kicker: string; title: string; lede: string; meta: { title: string; sub: string } };
  neighborhoods: Neighborhood[];
  souls: { kicker: string; title: string; lede: string };
  soulsList: Soul[];
  timeline: { kicker: string; title: string; lede: string };
  events: TimelineEvent[];
  vignettes: { kicker: string; title: string; lede: string; from: string };
  livemap: {
    kicker: string;
    title: string;
    lede: string;
    shown: string;
    coverage: string;
    geocoding: string;
    source: string;
  };
  archive: {
    kicker: string;
    title: string;
    lede: string;
    pages: string;
    download: string;
    credit: string;
  };
  directory: {
    kicker: string;
    title: string;
    lede: string;
    searchPlaceholder: string;
    empty: string;
    manualEmpty: string;
    addFirst: string;
    source: string;
    userAdded: string;
    addBtn: string;
    addTitle: string;
    addHint: string;
    exportBtn: string;
    cancel: string;
    save: string;
    delete: string;
    deleteConfirm: string;
    noteHint: string;
    didYouKnow: string;
    openMaps: string;
    heritageFilter: string;
    heritageHint: string;
    statsTotal: string;
    statsNotes: string;
    statsSources: string;
    statsUpdated: string;
    statsUpdatedDate: string;
    routeTitle: string;
    routeDesc: string;
    routeOpenMaps: string;
    routeDownload: string;
  };
  zmanim: { kicker: string; loading: string; error: string; source: string };
  globalSearch: {
    trigger: string;
    shortcutHint: string;
    placeholder: string;
    hint: string;
    empty: string;
    navigate: string;
    select: string;
    close: string;
  };
  colophon: {
    mark: string;
    vol: string;
    volSub: string;
    credits: string;
    creditsList: string[];
    contact: string;
    contactList: string[];
    bottom: string;
    issue: string;
  };
}

export type ContentTree = Record<Lang, LocalizedContent>;

// Convenience alias used everywhere as a prop.
export type T = LocalizedContent;
