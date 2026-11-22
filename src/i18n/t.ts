import { signal } from '@preact/signals';
import { settings } from '../settings';
import { normalizeLangCode, type LangCode } from '../i18n';

export type Dictionary = Record<string, string>;

/** The active board's language. state.ts keeps this in step with the open board. */
export const boardLocale = signal<string | undefined>(undefined);

const dictionaries = signal<Partial<Record<LangCode, Dictionary>>>({});

const loaders: Record<Exclude<LangCode, 'en'>, () => Promise<{ default: Dictionary }>> = {
  es: () => import('../locales/es'),
  fr: () => import('../locales/fr'),
  de: () => import('../locales/de'),
  pt: () => import('../locales/pt'),
  it: () => import('../locales/it'),
  ar: () => import('../locales/ar'),
  zh: () => import('../locales/zh'),
  hi: () => import('../locales/hi'),
  tl: () => import('../locales/tl'),
};

const pending = new Map<LangCode, Promise<void>>();

export function loadLanguage(lang: LangCode): Promise<void> {
  if (lang === 'en' || dictionaries.peek()[lang]) return Promise.resolve();
  let p = pending.get(lang);
  if (!p) {
    p = loaders[lang]()
      .then((m) => {
        dictionaries.value = { ...dictionaries.peek(), [lang]: m.default };
      })
      .catch(() => {
        pending.delete(lang);
      });
    pending.set(lang, p);
  }
  return p;
}

/** The language the interface is shown in: the user's choice, or else the board's language. */
export function uiLang(): LangCode {
  const pref = settings.value.uiLanguage;
  if (pref && pref !== 'auto') return normalizeLangCode(pref);
  const board = boardLocale.value;
  if (board) return normalizeLangCode(board);
  if (typeof navigator !== 'undefined' && navigator.language) return normalizeLangCode(navigator.language);
  return 'en';
}

/**
 * Translates an English interface string. `{0}`, `{1}`… in the text are replaced by the
 * extra arguments. Strings without a translation are shown in English.
 */
export function t(en: string, ...args: unknown[]): string {
  const lang = uiLang();
  let out = en;
  if (lang !== 'en') {
    const dict = dictionaries.value[lang];
    if (dict) out = dict[en] ?? en;
    else void loadLanguage(lang);
  }
  if (args.length) out = out.replace(/\{(\d+)\}/g, (m, i) => (Number(i) < args.length ? String(args[Number(i)]) : m));
  return out;
}
