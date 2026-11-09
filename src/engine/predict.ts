import { COMMON_WORDS } from './wordlist';
import { normalizeLangCode } from '../i18n';
import { VOCAB_TRANSLATIONS } from '../data/multilingual';

export interface PredictorData {
  uni: Record<string, number>;
  bi: Record<string, Record<string, number>>;
}

const DEFAULT_STARTERS = ['I', 'you', 'want', 'can', 'need', 'go', 'help', 'please', 'more', 'what'];

const DEFAULT_BIGRAMS: Record<string, string[]> = {
  i: ['want', 'need', 'like', 'am', 'can', "don't", 'have', 'feel', 'think', 'go'],
  you: ['are', 'want', 'can', 'have', 'need', 'like', 'know', 'do'],
  we: ['can', 'are', 'want', 'need', 'have', 'go', 'will'],
  they: ['are', 'can', 'want', 'have', 'will', 'go'],
  he: ['is', 'wants', 'can', 'has', 'likes', 'needs'],
  she: ['is', 'wants', 'can', 'has', 'likes', 'needs'],
  it: ['is', 'was', 'hurts', 'can', 'looks', 'feels'],
  want: ['to', 'more', 'some', 'it', 'that', 'this', 'a', 'the'],
  need: ['to', 'help', 'more', 'a', 'the', 'it', 'some'],
  like: ['to', 'it', 'that', 'this', 'the', 'my'],
  go: ['to', 'home', 'outside', 'in', 'out', 'back', 'bathroom'],
  can: ['I', 'you', 'we', 'help', 'have', 'go', 'play'],
  do: ['you', 'not', 'it', 'that', 'we'],
  "don't": ['want', 'like', 'know', 'feel', 'have', 'need'],
  is: ['it', 'that', 'the', 'good', 'not', 'here', 'my'],
  are: ['you', 'we', 'they', 'good', 'here'],
  to: ['go', 'eat', 'drink', 'play', 'the', 'sleep', 'help', 'see'],
  in: ['the', 'my', 'here', 'there', 'bed', 'school'],
  on: ['the', 'my', 'it', 'top'],
  for: ['me', 'you', 'the', 'my', 'us'],
  with: ['me', 'you', 'my', 'the', 'friends'],
  feel: ['good', 'sick', 'tired', 'happy', 'sad', 'hurt', 'bad'],
  what: ['is', 'time', 'do', 'are', 'happened'],
  where: ['is', 'are', 'did', 'to'],
};

function cleanToken(raw: string): string {
  return raw
    .trim()
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}'\u2019]+$/u, '')
    .replace(/\u2019/g, "'")
    .toLowerCase();
}

function isWordToken(w: string): boolean {
  return w.length > 0 && w.length <= 28 && /^[\p{L}\p{M}][\p{L}\p{M}'-]*$/u.test(w);
}

function formatCase(word: string, rawPrefix: string): string {
  if (word === 'i' || word.startsWith("i'")) return 'I' + word.slice(1);
  if (!rawPrefix) return word;
  if (rawPrefix.length > 1 && rawPrefix === rawPrefix.toUpperCase() && /[A-Z]/.test(rawPrefix)) {
    return word.toUpperCase();
  }
  if (rawPrefix[0] === rawPrefix[0].toUpperCase() && rawPrefix[0] !== rawPrefix[0].toLowerCase()) {
    return word[0].toUpperCase() + word.slice(1);
  }
  return word;
}

export class Predictor {
  private baseScore = new Map<string, number>();
  private uni = new Map<string, number>();
  private bi = new Map<string, Map<string, number>>();
  private sortedWords: string[] = [];
  private dirty = true;

  constructor(seedWords: string[] = COMMON_WORDS) {
    const total = seedWords.length || 1;
    for (let i = 0; i < seedWords.length; i++) {
      const w = seedWords[i].toLowerCase().trim();
      if (!w || this.baseScore.has(w)) continue;
      const score = 1 + 9 * Math.pow(1 - i / total, 2);
      this.baseScore.set(w, score);
    }
    this.dirty = true;
  }

  get size(): number {
    this.ensureIndex();
    return this.sortedWords.length;
  }

  private ensureIndex(): void {
    if (!this.dirty) return;
    const all = new Set<string>(this.baseScore.keys());
    for (const k of this.uni.keys()) all.add(k);
    this.sortedWords = [...all].sort();
    this.dirty = false;
  }

  private addWordIfNew(w: string, baseWeight = 0.5): void {
    if (!this.baseScore.has(w) && !this.uni.has(w)) {
      this.baseScore.set(w, baseWeight);
      this.dirty = true;
    }
  }

  learn(text: string): void {
    const rawTokens = text.split(/\s+/);
    const words: string[] = [];
    for (const rt of rawTokens) {
      const w = cleanToken(rt);
      if (isWordToken(w)) words.push(w);
    }
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (!this.baseScore.has(w) && !this.uni.has(w)) this.dirty = true;
      this.uni.set(w, (this.uni.get(w) ?? 0) + 1);
      if (i > 0) {
        const prev = words[i - 1];
        let nextMap = this.bi.get(prev);
        if (!nextMap) {
          nextMap = new Map();
          this.bi.set(prev, nextMap);
        }
        nextMap.set(w, (nextMap.get(w) ?? 0) + 1);
      }
    }
  }

  observeVocabulary(labels: Iterable<string>): void {
    for (const label of labels) {
      if (!label) continue;
      for (const part of label.split(/\s+/)) {
        const w = cleanToken(part);
        if (isWordToken(w)) this.addWordIfNew(w, 0.8);
      }
    }
  }

  private scoreWord(w: string, prevLower: string, bigrams: Record<string, string[]> = DEFAULT_BIGRAMS): number {
    const base = this.baseScore.get(w) ?? 0.2;
    const u = (this.uni.get(w) ?? 0) * 6;
    const b = prevLower ? (this.bi.get(prevLower)?.get(w) ?? 0) * 25 : 0;
    const defaultBi =
      prevLower && bigrams[prevLower]?.includes(w)
        ? 14 - bigrams[prevLower].indexOf(w)
        : 0;
    return base + u + b + defaultBi;
  }

  suggest(prefix: string, prevWord?: string, limit = 5, locale = 'en'): string[] {
    if (limit <= 0) return [];
    const lang = normalizeLangCode(locale);
    const pack = lang !== 'en' ? VOCAB_TRANSLATIONS[lang] : undefined;
    const starters = pack ? pack.starters : DEFAULT_STARTERS;
    const bigrams = pack ? pack.bigrams : DEFAULT_BIGRAMS;

    if (pack) {
      for (const s of starters) this.addWordIfNew(s.toLowerCase(), 3);
      for (const v of Object.values(pack.words)) {
        for (const part of v.split(/\s+/)) {
          const w = cleanToken(part);
          if (isWordToken(w)) this.addWordIfNew(w, 1.2);
        }
      }
    }

    this.ensureIndex();
    const rawPrefix = prefix.trim();
    const pref = rawPrefix.toLowerCase().replace(/\u2019/g, "'");
    const prev = prevWord ? cleanToken(prevWord) : '';

    if (!pref) {
      const candidates = new Set<string>();
      if (prev) {
        const learnedNext = this.bi.get(prev);
        if (learnedNext) for (const k of learnedNext.keys()) candidates.add(k);
        const defNext = bigrams[prev];
        if (defNext) for (const k of defNext) candidates.add(k);
      }
      for (const s of starters) candidates.add(s.toLowerCase());
      if (lang === 'en') {
        for (const [k] of this.uni) {
          candidates.add(k);
          if (candidates.size >= 80) break;
        }
      }
      const scored = [...candidates].map((w) => ({ w, s: this.scoreWord(w, prev, bigrams) }));
      scored.sort((a, b) => b.s - a.s || a.w.localeCompare(b.w));
      return scored.slice(0, limit).map((x) => (lang === 'en' ? formatCase(x.w, rawPrefix) : x.w));
    }

    const arr = this.sortedWords;
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid] < pref) lo = mid + 1;
      else hi = mid;
    }

    const matches: { w: string; s: number }[] = [];
    for (let i = lo; i < arr.length; i++) {
      const w = arr[i];
      if (!w.startsWith(pref)) break;
      matches.push({ w, s: this.scoreWord(w, prev, bigrams) });
    }

    matches.sort((a, b) => b.s - a.s || a.w.length - b.w.length || a.w.localeCompare(b.w));
    return matches.slice(0, limit).map((x) => (lang === 'en' ? formatCase(x.w, rawPrefix) : x.w));
  }

  toJSON(): PredictorData {
    const uni: Record<string, number> = {};
    for (const [k, v] of this.uni) uni[k] = v;
    const bi: Record<string, Record<string, number>> = {};
    for (const [prev, map] of this.bi) {
      const inner: Record<string, number> = {};
      for (const [w, c] of map) inner[w] = c;
      bi[prev] = inner;
    }
    return { uni, bi };
  }

  static fromJSON(data: PredictorData, seedWords?: string[]): Predictor {
    const p = new Predictor(seedWords);
    if (data?.uni) {
      for (const [k, v] of Object.entries(data.uni)) {
        if (typeof v === 'number' && v > 0) {
          p.uni.set(k, v);
          p.dirty = true;
        }
      }
    }
    if (data?.bi) {
      for (const [prev, inner] of Object.entries(data.bi)) {
        if (!inner || typeof inner !== 'object') continue;
        const m = new Map<string, number>();
        for (const [w, c] of Object.entries(inner)) {
          if (typeof c === 'number' && c > 0) m.set(w, c);
        }
        if (m.size > 0) p.bi.set(prev, m);
      }
    }
    return p;
  }
}
