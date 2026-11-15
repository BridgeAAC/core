import { describe, it, expect } from 'vitest';
import { SYMBOLS, SYMBOL_ALIASES, symbolIdForWord, getSymbolSvg } from '../src/data/symbols';
import { resolveIconForButton, getSvgPictogram } from '../src/data/icons';
import { createStarterVocabulary } from '../src/data/starter';

describe('BridgeAAC symbols', () => {
  it('renders every symbol as a self-contained 100x100 SVG', () => {
    for (const id of Object.keys(SYMBOLS)) {
      const s = getSymbolSvg(id)!;
      expect(s, id).toMatch(/^<svg [^>]*viewBox="0 0 100 100"/);
      const urls = s.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
      expect(urls.every((u) => u === 'http://www.w3.org/2000/svg'), id).toBe(true);
      expect(s, id).not.toMatch(/<script|on\w+=/i);
    }
  });

  it('points every alias at a symbol that exists', () => {
    for (const [word, id] of Object.entries(SYMBOL_ALIASES)) {
      expect(SYMBOLS[id], `${word} -> ${id}`).toBeTypeOf('function');
    }
  });

  it('matches words, word forms and phrases', () => {
    expect(symbolIdForWord('Want')).toBe('want');
    expect(symbolIdForWord('wanted')).toBe('want');
    expect(symbolIdForWord('me')).toBe('i');
    expect(symbolIdForWord('All Done')).toBe('finished');
    expect(symbolIdForWord('Quick Chat')).toBe('quick-chat');
    expect(symbolIdForWord('zebra')).toBeUndefined();
    expect(symbolIdForWord('constructor')).toBeUndefined();
  });

  it('is what the picture lookup returns, ahead of other sources', () => {
    expect(resolveIconForButton('want')).toBe('svg:bs-want');
    expect(resolveIconForButton('going')).toBe('svg:bs-go');
    expect(getSvgPictogram('bs-want')).toContain('<svg');
    expect(getSvgPictogram('bs-nope')).toBeNull();
  });

  it('is used by the starter boards for words it covers', () => {
    const { vocab } = createStarterVocabulary('en', 60);
    const home = vocab.pages.find((p) => p.id === vocab.homePageId)!;
    const byLabel = new Map(home.buttons.map((b) => [b.label.toLowerCase(), b.image]));
    for (const w of ['i', 'want', 'go', 'stop', 'help', 'more', 'finished', 'happy']) {
      expect(byLabel.get(w), w).toMatch(/^svg:bs-/);
    }
  });

  it('has a picture for every word on the BridgeWords starter boards', () => {
    const missing = new Set<string>();
    for (const size of [42, 60, 84, 108] as const) {
      const { vocab } = createStarterVocabulary('en', size);
      for (const page of vocab.pages) {
        for (const b of page.buttons) if (!symbolIdForWord(b.label)) missing.add(b.label);
      }
    }
    expect([...missing]).toEqual([]);
  });

  it('handles phrases with punctuation and curly apostrophes', () => {
    expect(symbolIdForWord('What time is it?')).toBe('what time');
    expect(symbolIdForWord('I don’t know')).toBe("don't know");
    expect(symbolIdForWord('My name is…')).toBe('name');
    expect(symbolIdForWord('17')).toBe('17');
    expect(symbolIdForWord('seventeen')).toBe('17');
  });

  it('keeps aliases from hiding real symbols', () => {
    for (const word of Object.keys(SYMBOL_ALIASES)) {
      expect(Object.prototype.hasOwnProperty.call(SYMBOLS, word), word).toBe(false);
    }
  });
});
