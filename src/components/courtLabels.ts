// Shared labels + helpers for Hasidic-court UI (used by BreathingCity).
import type { Lang } from '../types';

type LabelMap = Record<string, { he: string; en: string }>;

export const STATUS_LABEL: LabelMap = {
  active: { he: 'פעיל', en: 'Active' },
  closed: { he: 'נסגר', en: 'Closed' },
  demolished: { he: 'נהרס', en: 'Demolished' },
  moved: { he: 'עבר', en: 'Moved' },
  unknown: { he: 'גורל לא ידוע', en: 'Fate unknown' },
};

export const LAYER_LABEL: LabelMap = {
  shtibel: { he: 'שטיבל', en: 'Shtibel' },
  'beit-midrash': { he: 'בית מדרש', en: 'Beit Midrash' },
  yeshiva: { he: 'ישיבה', en: 'Yeshiva' },
};

export const CONF_LABEL: LabelMap = {
  high: { he: 'ודאות גבוהה', en: 'High confidence' },
  medium: { he: 'ודאות בינונית', en: 'Medium confidence' },
  low: { he: 'ודאות נמוכה', en: 'Low confidence' },
};

export const MAPERR_LABEL: LabelMap = {
  'wrong-number': { he: 'מספר בית תוקן', en: 'House number corrected' },
  'wrong-dynasty': { he: 'חסידות תוקנה', en: 'Dynasty corrected' },
  'not-a-synagogue': { he: 'לא בית כנסת', en: 'Not a synagogue' },
  'unverifiable': { he: 'לא אומת', en: 'Unverified' },
  'relocated': { he: 'מוקם מחדש', en: 'Relocated' },
  'none': { he: '', en: '' },
};

export function lbl(map: LabelMap, key: string, lang: Lang): string {
  return map[key] ? map[key][lang] : key;
}

// Parse a 4-digit 18xx/19xx founding year out of a free-text year field.
// Guards: an "unknown/irrelevant" marker → null; a pre-Tel-Aviv year (< 1882,
// i.e. the dynasty's world-court founding, not the local shtibel) → null.
export function parseFoundYear(s: string): number | null {
  const t = s || '';
  if (/לא ידוע|לא רלוונטי|לא תועד|unknown|irrelevant/i.test(t)) return null;
  const m = t.match(/1[89]\d\d/);
  if (!m) return null;
  const y = parseInt(m[0], 10);
  return y >= 1882 ? y : null;
}
