import type { Action, Button, ImageRef } from '../model';
import { VOCAB_TRANSLATIONS } from './multilingual';
import { getArasaacIdForWord } from './arasaac';

let reverseMultilingualMap: Map<string, string> | null = null;
function getReverseMultilingualMap(): Map<string, string> {
  if (!reverseMultilingualMap) {
    reverseMultilingualMap = new Map();
    for (const pack of Object.values(VOCAB_TRANSLATIONS)) {
      for (const [en, trans] of Object.entries(pack.words)) {
        const k = trans.trim().toLowerCase();
        if (k && !reverseMultilingualMap.has(k)) {
          reverseMultilingualMap.set(k, en.toLowerCase());
        }
      }
    }
  }
  return reverseMultilingualMap;
}

export function getSvgPictogram(id: string): string | null {
  const fn = SVG_PICTOGRAMS[id];
  return fn ? fn() : null;
}

const wrapSvg = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">${inner}</svg>`;

const SVG_PICTOGRAMS: Record<string, () => string> = {
  'pronoun-i': () =>
    wrapSvg(`
      <circle cx="32" cy="16" r="10" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
      <path d="M16 56 C16 38 48 38 48 56 Z" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
      <path d="M48 34 L34 34 M34 34 L40 29 M34 34 L40 39" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'pronoun-my': () =>
    wrapSvg(`
      <circle cx="32" cy="15" r="9.5" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
      <path d="M16 56 C16 38 48 38 48 56 Z" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
      <path d="M32 39 C29 35 23 36 23 41 C23 46 32 51 32 51 C32 51 41 46 41 41 C41 36 35 35 32 39 Z" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>
    `),
  'pronoun-you': () =>
    wrapSvg(`
      <circle cx="44" cy="18" r="9" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
      <path d="M30 54 C30 39 58 39 58 54 Z" fill="#60a5fa" stroke="#1e3a8a" stroke-width="2.5"/>
      <path d="M8 32 L32 32 M32 32 L25 25 M32 32 L25 39" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'pronoun-he': () =>
    wrapSvg(`
      <circle cx="26" cy="17" r="9.5" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
      <path d="M12 55 C12 39 40 39 40 55 Z" fill="#2563eb" stroke="#1e3a8a" stroke-width="2.5"/>
      <text x="49" y="34" font-size="24" font-weight="900" text-anchor="middle" fill="#1d4ed8">♂</text>
    `),
  'pronoun-she': () =>
    wrapSvg(`
      <circle cx="26" cy="17" r="9.5" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
      <path d="M12 55 L20 38 L32 38 L40 55 Z" fill="#ec4899" stroke="#831843" stroke-width="2.5"/>
      <text x="49" y="34" font-size="24" font-weight="900" text-anchor="middle" fill="#db2777">♀</text>
    `),
  'pronoun-we': () =>
    wrapSvg(`
      <circle cx="22" cy="18" r="8" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>
      <path d="M10 52 C10 39 34 39 34 52 Z" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2"/>
      <circle cx="42" cy="18" r="8" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>
      <path d="M30 52 C30 39 54 39 54 52 Z" fill="#10b981" stroke="#065f46" stroke-width="2"/>
      <ellipse cx="32" cy="34" rx="28" ry="22" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="5 3"/>
    `),
  'pronoun-they': () =>
    wrapSvg(`
      <circle cx="26" cy="18" r="7.5" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>
      <path d="M15 52 C15 40 37 40 37 52 Z" fill="#6366f1" stroke="#312e81" stroke-width="2"/>
      <circle cx="45" cy="18" r="7.5" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>
      <path d="M34 52 C34 40 56 40 56 52 Z" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
      <path d="M4 32 L16 32 M16 32 L11 27 M16 32 L11 37" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'pronoun-it': () =>
    wrapSvg(`
      <rect x="26" y="22" width="26" height="26" rx="5" fill="#f59e0b" stroke="#78350f" stroke-width="2.5"/>
      <path d="M8 35 L23 35 M23 35 L17 29 M23 35 L17 41" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'pronoun-this': () =>
    wrapSvg(`
      <circle cx="32" cy="44" r="11" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
      <path d="M32 10 L32 29 M32 29 L25 22 M32 29 L39 22" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'pronoun-that': () =>
    wrapSvg(`
      <circle cx="48" cy="20" r="10" fill="#8b5cf6" stroke="#4c1d95" stroke-width="2.5"/>
      <path d="M10 48 L35 27 M35 27 L26 26 M35 27 L33 36" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),

  'prep-in': () =>
    wrapSvg(`
      <path d="M14 26 L14 52 L50 52 L50 26" fill="#fef3c7" stroke="#92400e" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="32" cy="40" r="9" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
      <path d="M32 10 L32 26 M32 26 L26 20 M32 26 L38 20" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-out': () =>
    wrapSvg(`
      <path d="M12 30 L12 52 L42 52 L42 30" fill="#fef3c7" stroke="#92400e" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="50" cy="18" r="8" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
      <path d="M27 42 Q32 18 40 18 M40 18 L34 13 M40 18 L35 24" fill="none" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-on': () =>
    wrapSvg(`
      <rect x="12" y="34" width="40" height="18" rx="3" fill="#d97706" stroke="#78350f" stroke-width="2.5"/>
      <circle cx="32" cy="22" r="10" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>
    `),
  'prep-off': () =>
    wrapSvg(`
      <rect x="10" y="36" width="30" height="16" rx="3" fill="#d97706" stroke="#78350f" stroke-width="2.5"/>
      <circle cx="50" cy="42" r="8" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
      <path d="M25 22 Q44 20 48 31 M48 31 L42 27 M48 31 L52 25" fill="none" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-up': () =>
    wrapSvg(`
      <path d="M32 54 L32 12 M32 12 L18 26 M32 12 L46 26" stroke="#16a34a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-down': () =>
    wrapSvg(`
      <path d="M32 10 L32 52 M32 52 L18 38 M32 52 L46 38" stroke="#2563eb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-under': () =>
    wrapSvg(`
      <path d="M10 22 L54 22 M16 22 L16 52 M48 22 L48 52" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="9.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
    `),
  'prep-over': () =>
    wrapSvg(`
      <rect x="18" y="36" width="28" height="16" rx="3" fill="#94a3b8" stroke="#334155" stroke-width="2.5"/>
      <path d="M10 34 Q32 6 54 34 M54 34 L47 30 M54 34 L53 26" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-to': () =>
    wrapSvg(`
      <circle cx="50" cy="32" r="9" fill="#10b981" stroke="#065f46" stroke-width="2.5"/>
      <path d="M10 32 L37 32 M37 32 L29 24 M37 32 L29 40" stroke="#2563eb" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-from': () =>
    wrapSvg(`
      <circle cx="14" cy="32" r="9" fill="#f59e0b" stroke="#78350f" stroke-width="2.5"/>
      <path d="M26 32 L54 32 M54 32 L46 24 M54 32 L46 40" stroke="#2563eb" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-with': () =>
    wrapSvg(`
      <circle cx="22" cy="32" r="11" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
      <circle cx="42" cy="32" r="11" fill="#f59e0b" stroke="#78350f" stroke-width="2.5"/>
      <path d="M26 32 L38 32" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    `),
  'prep-for': () =>
    wrapSvg(`
      <rect x="14" y="24" width="24" height="24" rx="4" fill="#ec4899" stroke="#831843" stroke-width="2.5"/>
      <path d="M26 24 L26 48 M14 36 L38 36" stroke="#fbcfe8" stroke-width="3"/>
      <path d="M40 36 L54 36 M54 36 L48 30 M54 36 L48 42" stroke="#16a34a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-at': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="20" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/>
      <circle cx="32" cy="32" r="7" fill="#ef4444"/>
    `),
  'prep-here': () =>
    wrapSvg(`
      <ellipse cx="32" cy="48" rx="18" ry="7" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
      <path d="M32 10 L32 42 M32 42 L22 32 M32 42 L42 32" stroke="#ef4444" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'prep-between': () =>
    wrapSvg(`
      <rect x="8" y="20" width="12" height="28" rx="2" fill="#64748b"/>
      <rect x="44" y="20" width="12" height="28" rx="2" fill="#64748b"/>
      <circle cx="32" cy="34" r="9" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
    `),
  'prep-around': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="8" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
      <path d="M32 12 A20 20 0 1 1 14 24 M14 24 L12 15 M14 24 L23 23" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    `),

  'verb-is': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#dcfce7" stroke="#15803d" stroke-width="3"/>
      <path d="M20 26 L44 26 M20 38 L44 38" stroke="#15803d" stroke-width="5.5" stroke-linecap="round"/>
    `),
  'verb-do': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#fef9c3" stroke="#ca8a04" stroke-width="3"/>
      <path d="M34 12 L20 34 L32 34 L28 52 L44 28 L32 28 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2" stroke-linejoin="round"/>
    `),
  'verb-have': () =>
    wrapSvg(`
      <path d="M14 38 Q32 52 50 38 L46 48 Q32 56 18 48 Z" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
      <rect x="22" y="16" width="20" height="18" rx="4" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
    `),
  'verb-get': () =>
    wrapSvg(`
      <circle cx="20" cy="32" r="9" fill="#f59e0b" stroke="#78350f" stroke-width="2.5"/>
      <path d="M52 32 L33 32 M33 32 L41 24 M33 32 L41 40" stroke="#16a34a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'verb-put': () =>
    wrapSvg(`
      <path d="M12 48 L52 48" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
      <rect x="23" y="28" width="18" height="16" rx="3" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2"/>
      <path d="M32 10 L32 25 M32 25 L26 19 M32 25 L38 19" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'verb-go': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="23" fill="#22c55e" stroke="#14532d" stroke-width="3"/>
      <path d="M20 32 L44 32 M44 32 L34 22 M44 32 L34 42" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'verb-come': () =>
    wrapSvg(`
      <circle cx="18" cy="32" r="9" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
      <path d="M54 32 L31 32 M31 32 L39 24 M31 32 L39 40" stroke="#16a34a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'verb-stop': () =>
    wrapSvg(`
      <polygon points="22,8 42,8 56,22 56,42 42,56 22,56 8,42 8,22" fill="#ef4444" stroke="#7f1d1d" stroke-width="3"/>
      <rect x="20" y="28" width="24" height="8" rx="2" fill="#ffffff"/>
    `),
  'verb-more': () =>
    wrapSvg(`
      <circle cx="24" cy="32" r="16" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
      <path d="M24 23 L24 41 M15 32 L33 32" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="46" cy="24" r="11" fill="#60a5fa" stroke="#1e3a8a" stroke-width="2"/>
      <path d="M46 18 L46 30 M40 24 L52 24" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
    `),
  'verb-finish': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#22c55e" stroke="#14532d" stroke-width="3"/>
      <path d="M20 33 L28 41 L45 23" fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'verb-want': () =>
    wrapSvg(`
      <path d="M32 14 L36 24 L47 25 L39 32 L41 43 L32 37 L23 43 L25 32 L17 25 L28 24 Z" fill="#fbbf24" stroke="#b45309" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M14 48 Q32 58 50 48" fill="none" stroke="#2563eb" stroke-width="4.5" stroke-linecap="round"/>
    `),
  'verb-need': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#fee2e2" stroke="#dc2626" stroke-width="3"/>
      <path d="M32 18 L32 35" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>
      <circle cx="32" cy="45" r="3.5" fill="#dc2626"/>
    `),
  'verb-help': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#ef4444" stroke="#7f1d1d" stroke-width="3"/>
      <circle cx="32" cy="32" r="10" fill="#ffffff" stroke="#7f1d1d" stroke-width="2"/>
      <path d="M32 10 L32 22 M32 42 L32 54 M10 32 L22 32 M42 32 L54 32" stroke="#ffffff" stroke-width="5"/>
    `),
  'verb-turn': () =>
    wrapSvg(`
      <path d="M46 22 A18 18 0 1 0 48 40" fill="none" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/>
      <path d="M46 12 L46 23 L35 23" fill="none" stroke="#16a34a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'verb-open': () =>
    wrapSvg(`
      <rect x="14" y="28" width="36" height="24" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
      <path d="M14 28 L8 16 L28 16 L32 28 M50 28 L56 16 L36 16 L32 28" fill="#f59e0b" stroke="#78350f" stroke-width="2" stroke-linejoin="round"/>
    `),
  'verb-close': () =>
    wrapSvg(`
      <rect x="14" y="22" width="36" height="28" rx="3" fill="#d97706" stroke="#78350f" stroke-width="2.5"/>
      <path d="M14 30 L50 30 M32 22 L32 50" stroke="#78350f" stroke-width="2.5"/>
    `),
  'verb-give': () =>
    wrapSvg(`
      <rect x="16" y="20" width="18" height="18" rx="3" fill="#ec4899" stroke="#831843" stroke-width="2"/>
      <path d="M36 29 L54 29 M54 29 L47 22 M54 29 L47 36" stroke="#16a34a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'verb-take': () =>
    wrapSvg(`
      <rect x="30" y="20" width="18" height="18" rx="3" fill="#8b5cf6" stroke="#4c1d95" stroke-width="2"/>
      <path d="M28 29 L10 29 M10 29 L17 22 M10 29 L17 36" stroke="#2563eb" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),

  'gram-not': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#fee2e2" stroke="#dc2626" stroke-width="4.5"/>
      <path d="M17 17 L47 47" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/>
    `),
  'gram-and': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#e0e7ff" stroke="#4338ca" stroke-width="3"/>
      <path d="M32 18 L32 46 M18 32 L46 32" stroke="#4338ca" stroke-width="5.5" stroke-linecap="round"/>
    `),
  'gram-ing': () =>
    wrapSvg(`
      <rect x="8" y="16" width="48" height="32" rx="8" fill="#dcfce7" stroke="#15803d" stroke-width="3"/>
      <text x="32" y="38" font-size="18" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="#14532d">-ing</text>
    `),
  'gram-ed': () =>
    wrapSvg(`
      <rect x="8" y="16" width="48" height="32" rx="8" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/>
      <text x="32" y="38" font-size="19" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="#1e3a8a">-ed</text>
    `),
  'gram-s': () =>
    wrapSvg(`
      <rect x="10" y="16" width="44" height="32" rx="8" fill="#fef3c7" stroke="#b45309" stroke-width="3"/>
      <text x="32" y="39" font-size="21" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="#78350f">+s</text>
    `),
  'gram-poss': () =>
    wrapSvg(`
      <rect x="10" y="16" width="44" height="32" rx="8" fill="#fce7f3" stroke="#be185d" stroke-width="3"/>
      <text x="32" y="39" font-size="20" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="#831843">'s</text>
    `),
  'gram-article': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="18" fill="#f1f5f9" stroke="#475569" stroke-width="3"/>
      <circle cx="32" cy="32" r="6" fill="#3b82f6"/>
    `),
  'gram-big': () =>
    wrapSvg(`
      <circle cx="26" cy="32" r="18" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
      <circle cx="52" cy="42" r="6" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
    `),
  'gram-little': () =>
    wrapSvg(`
      <circle cx="22" cy="34" r="15" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
      <circle cx="48" cy="40" r="8" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
    `),
  'gram-all': () =>
    wrapSvg(`
      <circle cx="22" cy="24" r="7" fill="#3b82f6"/>
      <circle cx="42" cy="24" r="7" fill="#10b981"/>
      <circle cx="22" cy="42" r="7" fill="#f59e0b"/>
      <circle cx="42" cy="42" r="7" fill="#ec4899"/>
      <rect x="10" y="12" width="44" height="42" rx="10" fill="none" stroke="#1e293b" stroke-width="3" stroke-dasharray="5 3"/>
    `),
  'gram-some': () =>
    wrapSvg(`
      <circle cx="22" cy="26" r="7" fill="#3b82f6"/>
      <circle cx="42" cy="26" r="7" fill="#cbd5e1"/>
      <circle cx="22" cy="42" r="7" fill="#3b82f6"/>
      <circle cx="42" cy="42" r="7" fill="#cbd5e1"/>
    `),

  'q-what': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="23" fill="#f3e8ff" stroke="#7e22ce" stroke-width="3.5"/>
      <text x="32" y="43" font-size="34" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="#6b21a8">?</text>
    `),
  'q-where': () =>
    wrapSvg(`
      <path d="M32 8 C20 8 14 17 14 26 C14 39 32 56 32 56 C32 56 50 39 50 26 C50 17 44 8 32 8 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>
      <circle cx="32" cy="25" r="7" fill="#ffffff"/>
    `),
  'q-when': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#e0e7ff" stroke="#3730a3" stroke-width="3"/>
      <path d="M32 18 L32 32 L42 38" fill="none" stroke="#3730a3" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'q-who': () =>
    wrapSvg(`
      <circle cx="28" cy="20" r="10" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
      <path d="M14 54 C14 39 42 39 42 54 Z" fill="#8b5cf6" stroke="#4c1d95" stroke-width="2.5"/>
      <text x="50" y="34" font-size="26" font-weight="900" text-anchor="middle" fill="#6b21a8">?</text>
    `),
  'q-why': () =>
    wrapSvg(`
      <circle cx="32" cy="26" r="14" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
      <rect x="26" y="40" width="12" height="8" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      <text x="32" y="32" font-size="18" font-weight="900" text-anchor="middle" fill="#78350f">?</text>
    `),
  'q-how': () =>
    wrapSvg(`
      <circle cx="24" cy="26" r="10" fill="#60a5fa" stroke="#1e3a8a" stroke-width="3"/>
      <circle cx="42" cy="38" r="9" fill="#f59e0b" stroke="#78350f" stroke-width="3"/>
      <circle cx="24" cy="26" r="4" fill="#fff"/>
      <circle cx="42" cy="38" r="3.5" fill="#fff"/>
    `),

  'cat-folder': () =>
    wrapSvg(`
      <path d="M8 18 L26 18 L31 24 L56 24 L56 50 L8 50 Z" fill="#fbbf24" stroke="#92400e" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M8 26 L56 26 L56 50 L8 50 Z" fill="#fcd34d" stroke="#92400e" stroke-width="2"/>
    `),
  'cat-abc': () =>
    wrapSvg(`
      <rect x="8" y="10" width="22" height="22" rx="4" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
      <text x="19" y="26" font-size="15" font-weight="900" text-anchor="middle" fill="#fff">A</text>
      <rect x="34" y="10" width="22" height="22" rx="4" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2"/>
      <text x="45" y="26" font-size="15" font-weight="900" text-anchor="middle" fill="#fff">B</text>
      <rect x="21" y="34" width="22" height="22" rx="4" fill="#10b981" stroke="#065f46" stroke-width="2"/>
      <text x="32" y="50" font-size="14" font-weight="900" text-anchor="middle" fill="#fff">123</text>
    `),
  'cat-colors': () =>
    wrapSvg(`
      <circle cx="22" cy="22" r="10" fill="#ef4444"/>
      <circle cx="42" cy="22" r="10" fill="#eab308"/>
      <circle cx="22" cy="42" r="10" fill="#3b82f6"/>
      <circle cx="42" cy="42" r="10" fill="#22c55e"/>
    `),
  'cat-groups': () =>
    wrapSvg(`
      <rect x="10" y="12" width="18" height="18" rx="4" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
      <rect x="36" y="12" width="18" height="18" rx="4" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2"/>
      <rect x="10" y="36" width="18" height="18" rx="4" fill="#10b981" stroke="#065f46" stroke-width="2"/>
      <rect x="36" y="36" width="18" height="18" rx="4" fill="#ec4899" stroke="#831843" stroke-width="2"/>
    `),
  'cat-describe': () =>
    wrapSvg(`
      <polygon points="32,8 38,24 55,24 41,34 46,51 32,41 18,51 23,34 9,24 26,24" fill="#60a5fa" stroke="#1e3a8a" stroke-width="2.5" stroke-linejoin="round"/>
    `),
  'ctrl-clear': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#fee2e2" stroke="#b91c1c" stroke-width="3"/>
      <path d="M21 21 L43 43 M43 21 L21 43" stroke="#b91c1c" stroke-width="5.5" stroke-linecap="round"/>
    `),
  'ctrl-backspace': () =>
    wrapSvg(`
      <path d="M22 16 L54 16 L54 48 L22 48 L8 32 Z" fill="#f1f5f9" stroke="#334155" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 25 L44 39 M44 25 L30 39" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/>
    `),
  'ctrl-space': () =>
    wrapSvg(`
      <path d="M12 28 L12 42 L52 42 L52 28" fill="none" stroke="#1e293b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
  'ctrl-back': () =>
    wrapSvg(`
      <circle cx="32" cy="32" r="22" fill="#e2e8f0" stroke="#334155" stroke-width="3"/>
      <path d="M44 32 L20 32 M20 32 L30 22 M20 32 L30 42" stroke="#1e293b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
};

export const COLOR_SWATCH_MAP: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#facc15',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  violet: '#8b5cf6',
  pink: '#ec4899',
  brown: '#92400e',
  black: '#1e293b',
  white: '#ffffff',
  gray: '#94a3b8',
  grey: '#94a3b8',
  gold: '#eab308',
  silver: '#cbd5e1',
  teal: '#14b8a6',
  turquoise: '#06b6d4',
};

const WORD_ICON_MAP: Record<string, ImageRef> = {
  i: 'svg:pronoun-i',
  me: 'svg:pronoun-i',
  myself: 'svg:pronoun-i',
  "i'm": 'svg:pronoun-i',
  "i'll": 'svg:pronoun-i',
  "i'd": 'svg:pronoun-i',
  "i've": 'svg:pronoun-i',
  my: 'svg:pronoun-my',
  mine: 'svg:pronoun-my',
  'my/mine': 'svg:pronoun-my',
  you: 'svg:pronoun-you',
  your: 'svg:pronoun-you',
  yours: 'svg:pronoun-you',
  yourself: 'svg:pronoun-you',
  "you're": 'svg:pronoun-you',
  he: 'svg:pronoun-he',
  him: 'svg:pronoun-he',
  his: 'svg:pronoun-he',
  himself: 'svg:pronoun-he',
  "he's": 'svg:pronoun-he',
  she: 'svg:pronoun-she',
  her: 'svg:pronoun-she',
  hers: 'svg:pronoun-she',
  herself: 'svg:pronoun-she',
  "she's": 'svg:pronoun-she',
  we: 'svg:pronoun-we',
  us: 'svg:pronoun-we',
  our: 'svg:pronoun-we',
  ours: 'svg:pronoun-we',
  "let's": 'svg:pronoun-we',
  "we're": 'svg:pronoun-we',
  they: 'svg:pronoun-they',
  them: 'svg:pronoun-they',
  their: 'svg:pronoun-they',
  theirs: 'svg:pronoun-they',
  "they're": 'svg:pronoun-they',
  it: 'svg:pronoun-it',
  its: 'svg:pronoun-it',
  "it's": 'svg:pronoun-it',
  this: 'svg:pronoun-this',
  these: 'svg:pronoun-this',
  that: 'svg:pronoun-that',
  those: 'svg:pronoun-that',

  in: 'svg:prep-in',
  inside: 'svg:prep-in',
  into: 'svg:prep-in',
  out: 'svg:prep-out',
  outside: 'emoji:🌳',
  on: 'svg:prep-on',
  onto: 'svg:prep-on',
  off: 'svg:prep-off',
  up: 'svg:prep-up',
  down: 'svg:prep-down',
  under: 'svg:prep-under',
  below: 'svg:prep-under',
  over: 'svg:prep-over',
  above: 'svg:prep-over',
  to: 'svg:prep-to',
  toward: 'svg:prep-to',
  from: 'svg:prep-from',
  away: 'svg:prep-from',
  with: 'svg:prep-with',
  without: 'svg:gram-not',
  for: 'svg:prep-for',
  at: 'svg:prep-at',
  here: 'svg:prep-here',
  there: 'svg:pronoun-that',
  between: 'svg:prep-between',
  around: 'svg:prep-around',
  of: 'svg:prep-at',
  about: ' emoji:💬'.trim(),
  by: 'svg:prep-with',
  near: 'svg:prep-here',
  front: 'svg:pronoun-this',
  behind: 'svg:ctrl-back',
  next: 'emoji:⏭️',
  previous: 'emoji:⏮️',

  is: 'svg:verb-is',
  am: 'svg:verb-is',
  are: 'svg:verb-is',
  was: 'svg:verb-is',
  were: 'svg:verb-is',
  be: 'svg:verb-is',
  been: 'svg:verb-is',
  being: 'svg:verb-is',
  do: 'svg:verb-do',
  does: 'svg:verb-do',
  did: 'svg:verb-do',
  doing: 'svg:verb-do',
  done: 'svg:verb-finish',
  have: 'svg:verb-have',
  has: 'svg:verb-have',
  had: 'svg:verb-have',
  having: 'svg:verb-have',
  can: 'emoji:💪',
  could: 'emoji:💪',
  will: 'svg:prep-to',
  would: 'svg:prep-to',
  should: 'svg:prep-to',
  may: 'svg:prep-to',
  might: 'svg:prep-to',
  must: 'svg:verb-need',
  want: 'svg:verb-want',
  need: 'svg:verb-need',
  like: 'emoji:❤️',
  love: 'emoji:❤️',
  go: 'svg:verb-go',
  going: 'svg:verb-go',
  went: 'svg:verb-go',
  gone: 'svg:verb-go',
  come: 'svg:verb-come',
  coming: 'svg:verb-come',
  came: 'svg:verb-come',
  stop: 'svg:verb-stop',
  help: 'svg:verb-help',
  more: 'svg:verb-more',
  finish: 'svg:verb-finish',
  finished: 'svg:verb-finish',
  'all done': 'svg:verb-finish',
  get: 'svg:verb-get',
  got: 'svg:verb-get',
  gotten: 'svg:verb-get',
  put: 'svg:verb-put',
  give: 'svg:verb-give',
  gave: 'svg:verb-give',
  given: 'svg:verb-give',
  take: 'svg:verb-take',
  took: 'svg:verb-take',
  taken: 'svg:verb-take',
  turn: 'svg:verb-turn',
  'turn page': 'emoji:📖',
  open: 'svg:verb-open',
  close: 'svg:verb-close',
  make: 'emoji:🔨',
  made: 'emoji:🔨',
  eat: 'emoji:🍽️',
  ate: 'emoji:🍽️',
  eaten: 'emoji:🍽️',
  drink: 'emoji:🥤',
  drank: 'emoji:🥤',
  drunk: 'emoji:🥤',
  play: 'emoji:🎮',
  read: 'emoji:📖',
  write: 'emoji:✏️',
  wrote: 'emoji:✏️',
  draw: 'emoji:🖍️',
  paint: 'emoji:🎨',
  color: 'svg:cat-colors',
  look: 'emoji:👀',
  see: 'emoji:👁️',
  saw: 'emoji:👁️',
  seen: 'emoji:👁️',
  watch: 'emoji:📺',
  listen: 'emoji:👂',
  hear: 'emoji:👂',
  heard: 'emoji:👂',
  talk: 'emoji:🗣️',
  speak: 'emoji:🗣️',
  say: 'emoji:💬',
  said: 'emoji:💬',
  tell: 'emoji:💬',
  told: 'emoji:💬',
  ask: 'svg:q-what',
  think: 'emoji:🤔',
  thought: 'emoji:🤔',
  know: 'emoji:💡',
  knew: 'emoji:💡',
  feel: 'emoji:🙂',
  felt: 'emoji:🙂',
  sleep: 'emoji:😴',
  slept: 'emoji:😴',
  wake: 'emoji:⏰',
  walk: 'emoji:🚶',
  run: 'emoji:🏃',
  ran: 'emoji:🏃',
  jump: 'emoji:🦘',
  sit: 'emoji:🪑',
  sat: 'emoji:🪑',
  stand: 'emoji:🧍',
  ride: 'emoji:🚲',
  drive: 'emoji:🚗',
  fly: 'emoji:✈️',
  swim: 'emoji:🏊',
  swing: 'emoji:🛝',
  throw: 'emoji:⚾',
  catch: 'emoji:🧤',
  push: 'emoji:👐',
  pull: 'emoji:🪢',
  cut: 'emoji:✂️',
  cutting: 'emoji:✂️',
  wash: 'emoji:🧼',
  clean: 'emoji:🧹',
  brush: 'emoji:🪥',
  bathe: 'emoji:🛁',
  shower: 'emoji:🚿',
  dress: 'emoji:👕',
  wear: 'emoji:👕',
  wore: 'emoji:👕',
  worn: 'emoji:👕',
  cook: 'emoji:🍳',
  bake: 'emoji:🧁',
  buy: 'emoji:🛒',
  shop: 'emoji:🛍️',
  pay: 'emoji:💵',
  work: 'emoji:💼',
  wait: 'emoji:✋',
  sing: 'emoji:🎤',
  dance: 'emoji:💃',
  kiss: 'emoji:💋',
  hug: 'emoji:🤗',
  cry: 'emoji:😢',
  laugh: 'emoji:😂',
  smile: 'emoji:😊',
  smell: 'emoji:👃',
  taste: 'emoji:👅',
  touch: 'emoji:👆',
  blow: 'emoji:🌬️',
  pop: 'emoji:🫧',
  shake: 'emoji:🤝',
  spin: 'svg:verb-turn',
  fall: 'emoji:🍂',
  hurt: 'emoji:🤕',
  feed: 'emoji:🍼',
  pet: 'emoji:🐾',
  call: 'emoji:📞',
  send: 'emoji:📨',
  text: 'emoji:📱',
  email: 'emoji:✉️',
  search: 'emoji:🔍',
  find: 'emoji:🔍',
  found: 'emoji:🔍',
  show: 'emoji:👁️',
  move: 'svg:verb-go',
  change: 'svg:verb-turn',
  use: 'emoji:🖐️',
  try: 'emoji:⭐',
  keep: 'emoji:📦',
  let: 'svg:verb-go',
  leave: 'svg:prep-out',
  stay: 'svg:prep-here',
  live: 'emoji:🏠',
  chew: 'emoji:👄',
  communic: 'emoji:💬',
  communicate: 'emoji:💬',
  reply: 'emoji:↩️',
  charge: 'emoji:🔋',
  cancel: 'svg:ctrl-clear',

  not: 'svg:gram-not',
  "don't": 'svg:gram-not',
  "doesn't": 'svg:gram-not',
  "didn't": 'svg:gram-not',
  "can't": 'svg:gram-not',
  "won't": 'svg:gram-not',
  "isn't": 'svg:gram-not',
  "aren't": 'svg:gram-not',
  "-n't": 'svg:gram-not',
  no: 'svg:gram-not',
  never: 'svg:gram-not',
  yes: 'emoji:👍',
  okay: 'emoji:👌',
  ok: 'emoji:👌',
  please: 'emoji:🙏',
  'thank you': 'emoji:🙏',
  thanks: 'emoji:🙏',
  sorry: 'emoji:😔',
  'excuse me': 'emoji:🙋',
  hi: 'emoji:👋',
  hello: 'emoji:👋',
  bye: 'emoji:👋',
  goodbye: 'emoji:👋',
  maybe: 'emoji:🤷',
  and: 'svg:gram-and',
  or: 'svg:prep-between',
  but: 'svg:verb-turn',
  because: 'svg:q-why',
  if: 'svg:q-what',
  so: 'svg:prep-to',
  than: 'svg:prep-between',
  '-ing': 'svg:gram-ing',
  '-ed': 'svg:gram-ed',
  '-s': 'svg:gram-s',
  "-'s": 'svg:gram-poss',
  a: 'svg:gram-article',
  'a-': 'svg:gram-article',
  an: 'svg:gram-article',
  the: 'svg:gram-article',
  all: 'svg:gram-all',
  every: 'svg:gram-all',
  everybody: 'svg:gram-all',
  everyone: 'svg:gram-all',
  everything: 'svg:gram-all',
  some: 'svg:gram-some',
  many: 'svg:gram-all',
  much: 'svg:verb-more',
  lot: 'svg:verb-more',
  other: 'svg:prep-to',
  another: 'svg:verb-more',
  else: 'svg:verb-more',
  same: 'svg:verb-is',
  different: 'svg:prep-between',
  again: 'svg:verb-turn',
  first: 'emoji:🥇',
  second: 'emoji:🥈',
  last: 'emoji:🏁',
  beginning: 'emoji:▶️',
  end: 'emoji:⏹️',

  good: 'emoji:👍',
  great: 'emoji:🌟',
  best: 'emoji:🏆',
  better: 'emoji:👍',
  fine: 'emoji:🙂',
  well: 'emoji:🙂',
  nice: 'emoji:😊',
  favorite: 'emoji:⭐',
  bad: 'emoji:👎',
  worse: 'emoji:👎',
  worst: 'emoji:👎',
  big: 'svg:gram-big',
  large: 'svg:gram-big',
  huge: 'svg:gram-big',
  little: 'svg:gram-little',
  small: 'svg:gram-little',
  tiny: 'svg:gram-little',
  hot: 'emoji:🔥',
  warm: 'emoji:☀️',
  cold: 'emoji:🥶',
  cool: 'emoji:😎',
  happy: 'emoji:😊',
  glad: 'emoji:😊',
  sad: 'emoji:😢',
  angry: 'emoji:😠',
  mad: 'emoji:😡',
  scared: 'emoji:😨',
  afraid: 'emoji:😨',
  tired: 'emoji:😴',
  sleepy: 'emoji:🥱',
  sick: 'emoji:🤒',
  ill: 'emoji:🤒',
  excited: 'emoji:🤩',
  bored: 'emoji:🥱',
  worried: 'emoji:😟',
  nervous: 'emoji:😬',
  lonely: 'emoji:🥺',
  proud: 'emoji:😌',
  silly: 'emoji:🤪',
  funny: 'emoji:😂',
  calm: 'emoji:😌',
  frustrated: 'emoji:😤',
  confused: 'emoji:😕',
  upset: 'emoji:😞',
  hungry: 'emoji:😋',
  thirsty: 'emoji:🥤',
  dizzy: 'emoji:😵',
  ready: 'svg:verb-finish',
  busy: 'emoji:🐝',
  fast: 'emoji:⚡',
  slow: 'emoji:🐢',
  loud: 'emoji:🔊',
  quiet: 'emoji:🤫',
  hard: 'emoji:🪨',
  soft: 'emoji:🧸',
  wet: 'emoji:💧',
  dry: 'emoji:☀️',
  dirty: 'emoji:🦠',
  messy: 'emoji:🗑️',
  pretty: 'emoji:🌸',
  beautiful: 'emoji:✨',
  cute: 'emoji:🥰',
  mean: 'emoji:😠',
  yummy: 'emoji:😋',
  yucky: 'emoji:🤢',
  new: 'emoji:✨',
  old: 'emoji:🕰️',
  young: 'emoji:👶',
  tall: 'svg:prep-up',
  short: 'svg:prep-down',
  long: 'svg:prep-to',
  full: 'svg:gram-all',
  empty: 'svg:gram-article',
  heavy: 'emoji:🏋️',
  light: 'emoji:💡',
  dark: 'emoji:🌑',
  right: 'svg:verb-finish',
  wrong: 'svg:ctrl-clear',
  very: 'emoji:⚡',
  really: 'emoji:⭐',
  too: 'svg:verb-more',
  problem: 'emoji:⚠️',
  uncomfortable: 'emoji:😣',

  what: 'svg:q-what',
  where: 'svg:q-where',
  when: 'svg:q-when',
  who: 'svg:q-who',
  why: 'svg:q-why',
  how: 'svg:q-how',
  which: 'svg:q-what',
  question: 'svg:q-what',
  questions: 'svg:q-what',

  people: 'emoji:👨‍👩‍👧‍👦',
  person: 'emoji:🧑',
  actions: 'emoji:🏃',
  social: 'emoji:💬',
  places: 'emoji:🏠',
  time: 'emoji:⏰',
  groups: 'svg:cat-groups',
  describe: 'svg:cat-describe',
  colors: 'svg:cat-colors',
  extra: 'emoji:➕',
  numbers: 'emoji:🔢',
  'quick chat': 'emoji:⚡',
  keyboard: 'emoji:⌨️',
  'abc//123': 'svg:cat-abc',
  '1 2 3': 'emoji:🔢',
  food: 'emoji:🍎',
  drinks: 'emoji:🥤',
  snacks: 'emoji:🍿',
  meals: 'emoji:🍽️',
  dessert: 'emoji:🍰',
  breakfast: 'emoji:🥞',
  lunch: 'emoji:🥪',
  dinner: 'emoji:🍝',
  fruit: 'emoji:🍓',
  veggie: 'emoji:🥦',
  vegetables: 'emoji:🥦',
  'fruit veg': 'emoji:🍎',
  pets: 'emoji:🐶',
  farm: 'emoji:🐄',
  animals: 'emoji:🐾',
  birds: 'emoji:🐦',
  dinosaur: 'emoji:🦖',
  sports: 'emoji:⚽',
  music: 'emoji:🎵',
  song: 'emoji:🎶',
  video: 'emoji:🎬',
  books: 'emoji:📚',
  book: 'emoji:📘',
  school: 'emoji:🏫',
  math: 'emoji:➕',
  science: 'emoji:🔬',
  weather: 'emoji:⛅',
  body: 'emoji:🧍',
  face: 'emoji:🙂',
  hygiene: 'emoji:🧼',
  sensory: 'emoji:✨',
  feelings: 'emoji:😊',
  money: 'emoji:💵',
  character: 'emoji:🦸',
  movement: 'emoji:🏃',
  sounds: 'emoji:🔊',

  mom: 'emoji:👩',
  mother: 'emoji:👩',
  mommy: 'emoji:👩',
  dad: 'emoji:👨',
  father: 'emoji:👨',
  daddy: 'emoji:👨',
  brother: 'emoji:👦',
  sister: 'emoji:👧',
  grandma: 'emoji:👵',
  grandmother: 'emoji:👵',
  grandpa: 'emoji:👴',
  grandfather: 'emoji:👴',
  baby: 'emoji:👶',
  kid: 'emoji:🧒',
  child: 'emoji:🧒',
  boy: 'emoji:👦',
  girl: 'emoji:👧',
  man: 'emoji:👨',
  woman: 'emoji:👩',
  friend: 'emoji:🧑‍🤝‍🧑',
  family: 'emoji:👨‍👩‍👧',
  teacher: 'emoji:👩‍🏫',
  doctor: 'emoji:🧑‍⚕️',
  nurse: 'emoji:🧑‍⚕️',
  helper: 'emoji:🙋',
  aunt: 'emoji:👩',
  uncle: 'emoji:👨',
  cousin: 'emoji:🧒',
  neighbor: 'emoji:🏘️',
  therapist: 'emoji:🧑‍⚕️',
  driver: 'emoji:🚌',

  water: 'emoji:💧',
  juice: 'emoji:🧃',
  milk: 'emoji:🥛',
  coffee: 'emoji:☕',
  tea: 'emoji:🍵',
  soda: 'emoji:🥤',
  smoothie: 'emoji:🥤',
  apple: 'emoji:🍎',
  banana: 'emoji:🍌',
  grapes: 'emoji:🍇',
  strawberry: 'emoji:🍓',
  orange: 'emoji:🍊',
  carrot: 'emoji:🥕',
  broccoli: 'emoji:🥦',
  bread: 'emoji:🍞',
  cheese: 'emoji:🧀',
  egg: 'emoji:🥚',
  chicken: 'emoji:🍗',
  pizza: 'emoji:🍕',
  burger: 'emoji:🍔',
  fries: 'emoji:🍟',
  pasta: 'emoji:🍝',
  rice: 'emoji:🍚',
  soup: 'emoji:🍲',
  cereal: 'emoji:🥣',
  sandwich: 'emoji:🥪',
  salad: 'emoji:🥗',
  cookie: 'emoji:🍪',
  'ice cream': 'emoji:🍦',
  cake: 'emoji:🍰',
  chocolate: 'emoji:🍫',
  candy: 'emoji:🍬',
  snack: 'emoji:🍿',
  spoon: 'emoji:🥄',
  fork: 'emoji:🍴',
  cup: 'emoji:🥤',
  plate: 'emoji:🍽️',
  bowl: 'emoji:🥣',
  napkin: 'emoji:🧻',

  home: 'emoji:🏠',
  house: 'emoji:🏠',
  bathroom: 'emoji:🚽',
  toilet: 'emoji:🚽',
  bedroom: 'emoji:🛏️',
  bed: 'emoji:🛏️',
  kitchen: 'emoji:🍳',
  'living room': 'emoji:🛋️',
  park: 'emoji:🏞️',
  playground: 'emoji:🛝',
  store: 'emoji:🏪',
  restaurant: 'emoji:🍽️',
  hospital: 'emoji:🏥',
  church: 'emoji:⛪',
  library: 'emoji:📚',
  beach: 'emoji:🏖️',
  pool: 'emoji:🏊',
  zoo: 'emoji:🦁',
  movies: 'emoji:🎬',
  car: 'emoji:🚗',
  bus: 'emoji:🚌',
  truck: 'emoji:🚚',
  train: 'emoji:🚆',
  plane: 'emoji:✈️',

  dog: 'emoji:🐶',
  cat: 'emoji:🐱',
  horse: 'emoji:🐴',
  cow: 'emoji:🐄',
  pig: 'emoji:🐷',
  sheep: 'emoji:🐑',
  duck: 'emoji:🦆',
  fish: 'emoji:🐟',
  mouse: 'emoji:🐭',
  rabbit: 'emoji:🐰',
  bear: 'emoji:🐻',
  lion: 'emoji:🦁',
  monkey: 'emoji:🐵',

  head: 'emoji:🗣️',
  hair: 'emoji:💇',
  eyes: 'emoji:👀',
  eye: 'emoji:👁️',
  nose: 'emoji:👃',
  mouth: 'emoji:👄',
  teeth: 'emoji:🦷',
  tooth: 'emoji:🦷',
  ear: 'emoji:👂',
  ears: 'emoji:👂',
  hand: 'emoji:✋',
  hands: 'emoji:👐',
  arm: 'emoji:💪',
  leg: 'emoji:🦵',
  foot: 'emoji:🦶',
  feet: 'emoji:🦶',
  stomach: 'emoji:🤢',
  tummy: 'emoji:🤢',
  heart: 'emoji:❤️',

  now: 'emoji:⏱️',
  later: 'emoji:🕒',
  soon: 'emoji:⏳',
  today: 'emoji:📅',
  tomorrow: 'emoji:➡️',
  yesterday: 'emoji:⬅️',
  morning: 'emoji:🌅',
  afternoon: 'emoji:☀️',
  evening: 'emoji:🌆',
  night: 'emoji:🌙',
  day: 'emoji:☀️',
  week: 'emoji:🗓️',
  month: 'emoji:🗓️',
  year: 'emoji:📅',
  minute: 'emoji:⏳',
  hour: 'emoji:🕐',
  monday: 'emoji:📅',
  mon: 'emoji:📅',
  tuesday: 'emoji:📅',
  tues: 'emoji:📅',
  wednesday: 'emoji:📅',
  wed: 'emoji:📅',
  thursday: 'emoji:📅',
  thur: 'emoji:📅',
  friday: 'emoji:📅',
  fri: 'emoji:📅',
  saturday: 'emoji:📅',
  sunday: 'emoji:📅',
  sun: 'emoji:☀️',
  sunny: 'emoji:☀️',
  rainy: 'emoji:🌧️',
  rain: 'emoji:🌧️',
  cloudy: 'emoji:☁️',
  windy: 'emoji:💨',
  snow: 'emoji:❄️',

  computer: 'emoji:💻',
  ipad: 'emoji:📱',
  tablet: 'emoji:📱',
  phone: 'emoji:📱',
  tv: 'emoji:📺',
  youtube: 'emoji:▶️',

  clear: 'svg:ctrl-clear',
  delete: 'svg:ctrl-backspace',
  'delete wd': 'svg:ctrl-backspace',
  'delete word': 'svg:ctrl-backspace',
  bksp: 'svg:ctrl-backspace',
  backspace: 'svg:ctrl-backspace',
  space: 'svg:ctrl-space',
  tab: ' emoji:⇥'.trim(),
  back: 'svg:ctrl-back',
  escape: 'svg:ctrl-clear',
  shift: 'svg:prep-up',
  'lock page': 'emoji:🔒',
  'save message': 'emoji:⭐',
  'select to save a message': 'emoji:⭐',
  'volume up': 'emoji:🔊',
  'volume dn': 'emoji:🔉',
  'volume down': 'emoji:🔉',
  pause: 'emoji:⏸️',
  minimize: 'emoji:🔽',
  maximize: 'emoji:🔼',
  'page up': 'svg:prep-up',
  'page dn': 'svg:prep-down',
};

function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/←/g, '')
    .replace(/\/+/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function candidateKeys(rawLabel: string): string[] {
  const norm = normalizeLabel(rawLabel);
  if (!norm) return [];
  const out: string[] = [norm];
  const rev = getReverseMultilingualMap().get(norm);
  if (rev) out.push(rev);

  const abbrev: Record<string, string> = {
    "tom'row": 'tomorrow',
    "yest'day": 'yesterday',
    "frustr'd": 'frustrated',
    uncomf: 'uncomfortable',
    breakfst: 'breakfast',
    geograph: 'places',
    'full scr': 'maximize',
    'a break': 'wait',
    'wash hands': 'wash',
    'wash my hands': 'wash',
    'wash my hair': 'wash',
    'wash my face': 'wash',
    'brush my teeth': 'brush',
    'take a shower': 'shower',
    'take a bath': 'bathe',
    'dress up': 'dress',
    'what is that': 'what',
    'what time': 'time',
    'how much': 'money',
    'how many': 'numbers',
  };
  if (abbrev[norm]) out.push(abbrev[norm]);

  if (norm.startsWith('to ') && norm.length > 3) {
    out.push(norm.slice(3).trim());
  }

  const apoMatch = /^([a-z]+?)(?:'ng|'g|'d|g)$/.exec(norm);
  if (apoMatch) {
    const base = apoMatch[1];
    out.push(base);
    if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
      out.push(base.slice(0, -1));
    }
  }

  if (norm.endsWith('ing') && norm.length > 4) {
    const stem = norm.slice(0, -3);
    out.push(stem, stem + 'e');
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      out.push(stem.slice(0, -1));
    }
  }
  if (norm.endsWith('ed') && norm.length > 3) {
    const stem = norm.slice(0, -2);
    out.push(stem, stem + 'e', norm.slice(0, -1));
  }
  if (norm.endsWith('s') && norm.length > 2 && !norm.endsWith('ss')) {
    out.push(norm.slice(0, -1));
    if (norm.endsWith('es') && norm.length > 3) out.push(norm.slice(0, -2));
    if (norm.endsWith('ies') && norm.length > 4) out.push(norm.slice(0, -3) + 'y');
  }

  const words = norm.split(' ').filter(Boolean);
  if (words.length > 1) {
    out.push(words[words.length - 1], words[0]);
  }

  return out;
}

export function resolveIconForButton(
  label: string,
  message?: string,
  actions: Action[] = [],
): ImageRef | undefined {
  for (const a of actions) {
    switch (a.type) {
      case 'clear':
        return 'svg:ctrl-clear';
      case 'deleteWord':
      case 'backspace':
        return 'svg:ctrl-backspace';
      case 'back':
        return 'svg:ctrl-back';
      case 'home':
        return 'emoji:🏠';
      case 'speakWindow':
        return 'emoji:🔊';
      case 'keyboard':
        return 'emoji:⌨️';
      case 'speakTime':
        return 'emoji:⏰';
      case 'speakDate':
        return 'emoji:📅';
      case 'saveMessage':
        return 'emoji:⭐';
      case 'volumeUp':
        return 'emoji:🔊';
      case 'volumeDown':
        return 'emoji:🔉';
      case 'toggleMute':
        return 'emoji:🔇';
      default:
        break;
    }
  }

  const trimmed = (label || message || '').trim();
  if (!trimmed) return undefined;

  if (/^\p{Extended_Pictographic}/u.test(trimmed) && Array.from(trimmed).length <= 2) {
    return `emoji:${trimmed}`;
  }

  const lower = normalizeLabel(trimmed);
  if (COLOR_SWATCH_MAP[lower]) {
    return `badge:color:${COLOR_SWATCH_MAP[lower]}`;
  }

  for (const key of candidateKeys(trimmed)) {
    const hit = WORD_ICON_MAP[key];
    if (hit) return hit;
    if (COLOR_SWATCH_MAP[key]) return `badge:color:${COLOR_SWATCH_MAP[key]}`;
    const arasaacId = getArasaacIdForWord(key);
    if (arasaacId) return `arasaac:${arasaacId}`;
  }

  const directArasaac = getArasaacIdForWord(trimmed);
  if (directArasaac) return `arasaac:${directArasaac}`;

  if (/^-[a-z']+$/i.test(trimmed)) {
    return `badge:gram:${trimmed}`;
  }

  if (/^(?:\d+|:\d\d|\d+x)$/.test(trimmed)) {
    return `badge:num:${trimmed}`;
  }

  if (/^[a-zA-Z]$/.test(trimmed) || /^(?:th|sh|ch|ph|wh)$/i.test(trimmed)) {
    return `badge:key:${trimmed}`;
  }

  if (/^[.,?!;:'"\-+=/\\*$%#@&()<>×÷]$/.test(trimmed)) {
    return `badge:punct:${trimmed}`;
  }

  if (actions.some((a) => a.type === 'navigate')) {
    return 'svg:cat-folder';
  }

  const initials = trimmed
    .replace(/[^\p{L}\p{N}]/gu, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => Array.from(w)[0]?.toUpperCase() ?? '')
    .join('');
  return `badge:word:${initials || Array.from(trimmed).slice(0, 2).join('').toUpperCase()}`;
}

export function ensureButtonImage(b: Pick<Button, 'label' | 'message' | 'actions' | 'image'>): ImageRef | undefined {
  if (b.image === 'none:') return undefined;
  if (b.image) return b.image;
  return resolveIconForButton(b.label, b.message, b.actions);
}
