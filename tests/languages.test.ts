import { describe, it, expect } from 'vitest';
import { createStarterVocabulary, PAGE_SETS, type PageSetSize } from '../src/data/starter';
import { VOCAB_TRANSLATIONS, translateVocabulary } from '../src/data/multilingual';
import { SUPPORTED_LANGUAGES, type LangCode } from '../src/i18n';
import { pickVoice, voiceQuality, type VoiceInfo } from '../src/engine/speech';

const texts = (size: PageSetSize, lang: string) => {
  const out = new Set<string>();
  for (const p of createStarterVocabulary(lang, size).vocab.pages) {
    for (const b of p.buttons) {
      for (const s of [b.label, b.message, ...b.actions.map((a: any) => a.text)]) if (s) out.add(s);
    }
  }
  return out;
};

const english = new Set<string>();
for (const ps of PAGE_SETS) for (const s of texts(ps.size, 'en')) english.add(s);

describe('board translations', () => {
  for (const l of SUPPORTED_LANGUAGES.filter((x) => x.code !== 'en')) {
    it(`${l.englishName} has a word for every built-in button`, () => {
      const pack = VOCAB_TRANSLATIONS[l.code as Exclude<LangCode, 'en'>];
      const missing = [...english].filter((s) => !/^\d+$/.test(s) && pack.words[s] === undefined && pack.pages[s] === undefined);
      expect(missing).toEqual([]);
    });
  }

  it('changing an English board to Spanish translates its words and keeps custom buttons', () => {
    const en = createStarterVocabulary('en', 60).vocab;
    en.pages[0].buttons.push({ ...en.pages[0].buttons[0], id: 'custom', label: 'Grandma Rosa', message: 'Grandma Rosa', actions: [] });
    const es = translateVocabulary(en, 'es');
    expect(es.locale).toBe('es');
    const labels = es.pages[0].buttons.map((b) => b.label);
    expect(labels).toContain('yo');
    expect(labels).toContain('quiero');
    expect(labels).not.toContain('want');
    expect(labels).toContain('Grandma Rosa');
  });

  it('Spanish to French goes through the shared dictionary', () => {
    const es = createStarterVocabulary('es', 60).vocab;
    const fr = translateVocabulary(es, 'fr');
    const labels = fr.pages[0].buttons.map((b) => b.label);
    expect(labels).toContain('je');
    expect(labels).not.toContain('quiero');
    expect(fr.pages.find((p) => p.id === es.pages[1].id)?.name).not.toBe(es.pages[1].name);
  });

  it('Spanish back to English restores the starter words', () => {
    const es = createStarterVocabulary('es', 84).vocab;
    const back = translateVocabulary(es, 'en');
    const original = createStarterVocabulary('en', 84).vocab;
    const a = back.pages[0].buttons.map((b) => b.label);
    const b = original.pages[0].buttons.map((x) => x.label);
    const same = a.filter((x, i) => x === b[i]).length;
    expect(same / b.length).toBeGreaterThan(0.95);
  });
});

describe('voice choice', () => {
  const v = (name: string, lang: string, extra: Partial<VoiceInfo> = {}): VoiceInfo => ({ uri: name, name, lang, local: true, default: false, ...extra });
  const voices = [
    v('Samantha', 'en-US', { default: true }),
    v('Eddy (Spanish (Mexico))', 'es-MX'),
    v('Grandma (Spanish (Mexico))', 'es-MX'),
    v('Mónica', 'es-ES'),
    v('Paulina', 'es-MX'),
    v('Paulina (Enhanced)', 'es-MX'),
  ];

  it('picks the best voice for the language, not a novelty voice', () => {
    expect(pickVoice(voices, undefined, 'es-MX')?.name).toBe('Paulina (Enhanced)');
    expect(voiceQuality(voices[1], 'es-MX')).toBeLessThan(voiceQuality(voices[3], 'es-MX'));
  });

  it('ignores a chosen voice that speaks another language than the board', () => {
    expect(pickVoice(voices, 'Samantha', 'es-MX')?.lang.startsWith('es')).toBe(true);
    expect(pickVoice(voices, 'Mónica', 'es-MX')?.name).toBe('Mónica');
  });
});

describe('phrases soundboard', () => {
  it('has all 24 built-in phrases in every language', async () => {
    const { SOUNDBOARD_TRANSLATIONS } = await import('../src/data/soundboard-i18n');
    for (const [lang, list] of Object.entries(SOUNDBOARD_TRANSLATIONS)) {
      expect(list.length, lang).toBe(24);
      for (const [label, speech] of list) expect(label && speech, lang).toBeTruthy();
    }
  });
});

describe('interface translations', () => {
  it('every t("...") string in the app has a translation in every language', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const walk = (d: string): string[] =>
      fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    const keys = new Set<string>();
    for (const f of walk('src').filter((f) => /\.tsx?$/.test(f) && !f.includes('locales'))) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*("(?:[^"\\]|\\.)*")/g)) keys.add(JSON.parse(m[1]));
      for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1].replace(/\\'/g, "'"));
    }
    expect(keys.size).toBeGreaterThan(600);
    for (const lang of ['es', 'fr', 'de', 'pt', 'it', 'ar', 'zh', 'hi', 'tl']) {
      const dict = (await import(`../src/locales/${lang}.ts`)).default as Record<string, string>;
      const missing = [...keys].filter((k) => /\p{L}/u.test(k) && dict[k] === undefined);
      expect(missing, lang).toEqual([]);
      for (const k of keys) {
        if (dict[k] === undefined) continue;
        const ph = (s: string) => (s.match(/\{\d+\}/g) ?? []).sort().join();
        expect(ph(dict[k]), `${lang}: ${k}`).toBe(ph(k));
      }
    }
  });
});
