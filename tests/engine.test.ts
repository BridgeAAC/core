import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  insertText,
  backspace,
  deleteWord,
  splitWords,
  wordAtIndex,
  currentWordPrefix,
  replaceCurrentWord,
  lastWord,
  normalizeForSpeech,
} from '../src/engine/message';
import { COMMON_WORDS } from '../src/engine/wordlist';
import { Predictor } from '../src/engine/predict';
import { Scanner, type ScanTarget, type ScanLevel } from '../src/engine/scan';
import {
  speak,
  stopSpeaking,
  pickVoice,
  synthesizeOfflineWav,
  precacheVocabularyAudio,
  downloadNeuralVoice,
  getDownloadedNeuralVoices,
  removeNeuralVoice,
  type VoiceInfo,
} from '../src/engine/speech';
import { createStarterVocabulary } from '../src/data/starter';
import { resolveIconForButton } from '../src/data/icons';
import { SUPPORTED_LANGUAGES } from '../src/i18n';
import { firstFreeCell, newButton, occupancy, saveButton, searchButtons } from '../src/edit';
import { vocab as vocabSignal } from '../src/state';

describe('message engine', () => {
  it('inserts text with automatic spacing and capitalization', () => {
    let msg = '';
    msg = insertText(msg, 'hello', { autoCapitalize: true });
    expect(msg).toBe('Hello ');

    msg = insertText(msg, 'world', { autoCapitalize: true });
    expect(msg).toBe('Hello world ');

    msg = insertText(msg, '.', { attach: true });
    expect(msg).toBe('Hello world. ');

    msg = insertText(msg, 'i', { autoCapitalize: true });
    expect(msg).toBe('Hello world. I ');

    msg = insertText(msg, 'eat', { autoCapitalize: false });
    expect(msg).toBe('Hello world. I eat ');

    msg = insertText(msg, 'ing', { attach: true });
    expect(msg).toBe('Hello world. I eating ');
  });

  it('supports noSpace and character-by-character typing', () => {
    let msg = '';
    msg = insertText(msg, 'c', { noSpace: true, autoCapitalize: true });
    msg = insertText(msg, 'a', { noSpace: true });
    msg = insertText(msg, 't', { noSpace: true });
    expect(msg).toBe('Cat');
    expect(currentWordPrefix(msg)).toBe('Cat');

    msg = replaceCurrentWord(msg, 'cats');
    expect(msg).toBe('cats ');
    expect(currentWordPrefix(msg)).toBe('');
    expect(lastWord(msg)).toBe('cats');
  });

  it('handles backspace and deleteWord accurately', () => {
    expect(backspace('Hello ')).toBe('Hello');
    expect(backspace('')).toBe('');
    expect(deleteWord('Hello world ')).toBe('Hello ');
    expect(deleteWord('Hello world')).toBe('Hello ');
    expect(deleteWord('Hello')).toBe('');
  });

  it('splits words with character spans and resolves wordAtIndex', () => {
    const msg = 'I want more water ';
    const spans = splitWords(msg);
    expect(spans).toEqual([
      { text: 'I', start: 0, end: 1 },
      { text: 'want', start: 2, end: 6 },
      { text: 'more', start: 7, end: 11 },
      { text: 'water', start: 12, end: 17 },
    ]);
    expect(wordAtIndex(msg, 0)?.text).toBe('I');
    expect(wordAtIndex(msg, 3)?.text).toBe('want');
    expect(wordAtIndex(msg, 9)?.text).toBe('more');
    expect(wordAtIndex(msg, 14)?.text).toBe('water');
    expect(normalizeForSpeech('  Hello   world  ')).toBe('Hello world');
  });
});

describe('word prediction engine', () => {
  it('provides a deduplicated lowercase wordlist of >= 2000 words', () => {
    expect(COMMON_WORDS.length).toBeGreaterThanOrEqual(2000);
    const seen = new Set<string>();
    for (const w of COMMON_WORDS) {
      expect(w).toBe(w.toLowerCase());
      expect(seen.has(w)).toBe(false);
      seen.add(w);
    }
  });

  it('suggests prefix completions, bigrams, and learns user phrases quickly', () => {
    const predictor = new Predictor();
    const { vocab } = createStarterVocabulary();
    predictor.observeVocabulary(
      vocab.pages.flatMap((p) => p.buttons.map((b) => b.label)),
    );

    const t0 = performance.now();
    const initial = predictor.suggest('', undefined, 6);
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(20);
    expect(initial.length).toBe(6);

    const pref = predictor.suggest('wa', 'I', 6);
    expect(pref).toContain('want');
    expect(pref.every((w) => w.toLowerCase().startsWith('wa'))).toBe(true);

    const afterI = predictor.suggest('', 'I', 6);
    expect(afterI).toContain('want');

    for (let i = 0; i < 5; i++) {
      predictor.learn('supercalifragilistic marshmallow');
    }
    expect(predictor.suggest('supercal', undefined, 5)[0]).toBe('supercalifragilistic');
    expect(predictor.suggest('', 'supercalifragilistic', 5)[0]).toBe('marshmallow');

    const snapshot = predictor.toJSON();
    const restored = Predictor.fromJSON(snapshot);
    expect(restored.suggest('', 'supercalifragilistic', 5)[0]).toBe('marshmallow');
  });
});

describe('switch scanning controller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const targets: ScanTarget[] = [
    { id: 'b00', row: 0, col: 0, rowSpan: 1, colSpan: 2 },
    { id: 'b02', row: 0, col: 2, rowSpan: 1, colSpan: 1 },
    { id: 'b10', row: 1, col: 0, rowSpan: 1, colSpan: 1 },
    { id: 'b11', row: 1, col: 1, rowSpan: 1, colSpan: 1 },
  ];

  it('scans linearly in auto mode and activates highlighted item', () => {
    let highlighted: string[] = [];
    const activated: string[] = [];
    const scanner = new Scanner({
      onHighlight: (ids) => {
        highlighted = ids;
      },
      onSelect: (id) => activated.push(id),
    });
    scanner.setTargets(targets, {
      pattern: 'linear',
      mode: 'auto',
      intervalMs: 1000,
      firstDelayMs: 500,
      maxLoops: 2,
    });
    scanner.start();

    vi.advanceTimersByTime(500);
    expect(highlighted).toEqual(['b00']);
    vi.advanceTimersByTime(1000);
    expect(highlighted).toEqual(['b02']);
    vi.advanceTimersByTime(1000);
    expect(highlighted).toEqual(['b10']);

    scanner.select();
    expect(activated).toEqual(['b10']);
    scanner.stop();
  });

  it('scans row-then-column in step mode', () => {
    let highlighted: string[] = [];
    let currentLevel: ScanLevel = 'group';
    const activated: string[] = [];
    const scanner = new Scanner({
      onHighlight: (ids, level) => {
        highlighted = ids;
        currentLevel = level;
      },
      onSelect: (id) => activated.push(id),
    });
    scanner.setTargets(targets, {
      pattern: 'row-column',
      mode: 'step',
      intervalMs: 1000,
      firstDelayMs: 1000,
      maxLoops: 2,
    });
    scanner.start();

    expect(currentLevel).toBe('group');
    expect(highlighted).toEqual(['b00', 'b02']);

    scanner.select();
    expect(currentLevel).toBe('item');
    expect(highlighted).toEqual(['b00']);

    scanner.next();
    expect(highlighted).toEqual(['b02']);

    scanner.select();
    expect(activated).toEqual(['b02']);
    expect(scanner.running).toBe(false);
  });

  it('scans column-then-row and stops after maxLoops', () => {
    let highlighted: string[] = [];
    let wentIdle = false;
    const scanner = new Scanner({
      onHighlight: (ids) => {
        highlighted = ids;
      },
      onSelect: () => {},
      onIdle: () => {
        wentIdle = true;
      },
    });
    scanner.setTargets(targets, {
      pattern: 'column-row',
      mode: 'auto',
      intervalMs: 500,
      firstDelayMs: 500,
      maxLoops: 1,
    });
    scanner.start();
    vi.advanceTimersByTime(500);
    expect(highlighted).toEqual(['b00', 'b10']);
    vi.advanceTimersByTime(500);
    expect(highlighted).toEqual(['b11']);
    vi.advanceTimersByTime(500);
    expect(highlighted).toEqual(['b02']);
    vi.advanceTimersByTime(500);
    expect(wentIdle).toBe(true);
    expect(scanner.running).toBe(false);
  });
});

describe('speech engine', () => {
  const sampleVoices: VoiceInfo[] = [
    { uri: 'es-1', name: 'Spanish', lang: 'es-ES', local: true, default: false },
    { uri: 'en-gb', name: 'UK English', lang: 'en-GB', local: false, default: false },
    { uri: 'en-us', name: 'US English', lang: 'en-US', local: true, default: true },
  ];

  it('picks voice by exact URI, then language match, then prefix, then default', () => {
    expect(pickVoice(sampleVoices, 'es-1')?.uri).toBe('es-1');
    expect(pickVoice(sampleVoices, undefined, 'en_US')?.uri).toBe('en-us');
    expect(pickVoice(sampleVoices, undefined, 'en-AU')?.uri).toBe('en-gb');
    expect(pickVoice(sampleVoices, undefined, 'fr-FR')?.uri).toBe('en-us');
  });

  it('applies pronunciation replacements and maps boundary offsets back to original text', () => {
    const spokenUtterances: any[] = [];
    class MockUtterance {
      text: string;
      rate = 1;
      pitch = 1;
      volume = 1;
      lang = '';
      voice: any = null;
      onstart?: () => void;
      onend?: () => void;
      onerror?: (e: any) => void;
      onboundary?: (e: any) => void;
      constructor(t: string) {
        this.text = t;
      }
    }

    const prevSynth = (window as any).speechSynthesis;
    const prevUtt = (window as any).SpeechSynthesisUtterance;
    (window as any).SpeechSynthesisUtterance = MockUtterance;
    (window as any).speechSynthesis = {
      cancel: vi.fn(),
      getVoices: () => [],
      speak: (u: any) => {
        spokenUtterances.push(u);
        u.onstart?.();
        const idx = u.text.indexOf('world');
        if (idx >= 0) {
          u.onboundary?.({ name: 'word', charIndex: idx, charLength: 5 });
        }
        u.onend?.();
      },
    };

    try {
      const boundaries: Array<[number, number]> = [];
      let ended = false;
      speak('AAC world', {
        settings: { rate: 1, pitch: 1, volume: 1, muted: false },
        replacements: { AAC: 'augmentative communication' },
        onBoundary: (charIndex, charLength) => boundaries.push([charIndex, charLength]),
        onEnd: (completed) => {
          ended = completed;
        },
      });

      expect(spokenUtterances.length).toBe(1);
      expect(spokenUtterances[0].text).toBe('augmentative communication world');
      expect(boundaries).toEqual([[4, 5]]);
      expect(ended).toBe(true);
    } finally {
      stopSpeaking();
      (window as any).speechSynthesis = prevSynth;
      (window as any).SpeechSynthesisUtterance = prevUtt;
    }
  });

  it('falls back to built-in offline mespeak WAV synthesis when OS speechSynthesis has 0 voices', async () => {
    const prevSynth = (window as any).speechSynthesis;
    const prevCtx = (window as any).AudioContext;
    (window as any).speechSynthesis = undefined;

    let decodedBytes = 0;
    class MockAudioContext {
      state = 'running';
      destination = {};
      resume = async () => {};
      decodeAudioData = async (buf: ArrayBuffer) => {
        decodedBytes = buf.byteLength;
        return { duration: 0.05 };
      };
      createBufferSource = () => {
        const node: any = {
          buffer: null,
          playbackRate: { value: 1 },
          detune: { value: 0 },
          onended: null as null | (() => void),
          connect: () => {},
          disconnect: () => {},
          start: () => {
            setTimeout(() => node.onended?.(), 10);
          },
          stop: () => {},
        };
        return node;
      };
      createGain = () => ({
        gain: { value: 1 },
        connect: () => {},
      });
    }
    (window as any).AudioContext = MockAudioContext;

    try {
      let started = false;
      const completed = await new Promise<boolean>((resolve) => {
        speak('I want water', {
          settings: {
            voiceURI: 'bridge:offline-f2',
            rate: 1,
            pitch: 1,
            volume: 1,
            muted: false,
          },
          onStart: () => {
            started = true;
          },
          onEnd: (ok) => resolve(ok),
        });
      });

      expect(started).toBe(true);
      expect(completed).toBe(true);
      expect(decodedBytes).toBeGreaterThan(1000);
    } finally {
      stopSpeaking();
      (window as any).speechSynthesis = prevSynth;
      (window as any).AudioContext = prevCtx;
    }
  });

  it('synthesizes offline WAV audio across English, Spanish, Arabic, and Hindi and precaches offline', async () => {
    const settings = { rate: 1, pitch: 1, volume: 1 };
    const enWav = await synthesizeOfflineWav('Hello sister', settings, 'bridge:offline-f2', 'en-US');
    const esWav = await synthesizeOfflineWav('Hola hermana', settings, 'bridge:offline-es', 'es-MX');
    const arWav = await synthesizeOfflineWav('مرحبا أريد ماء', settings, undefined, 'ar-SA');
    const hiWav = await synthesizeOfflineWav('नमस्ते पानी', settings, undefined, 'hi-IN');

    expect(enWav?.byteLength).toBeGreaterThan(1000);
    expect(esWav?.byteLength).toBeGreaterThan(1000);
    expect(arWav?.byteLength).toBeGreaterThan(1000);
    expect(hiWav?.byteLength).toBeGreaterThan(1000);

    const { vocab } = createStarterVocabulary('en');
    const miniVocab = {
      ...vocab,
      pages: [
        {
          ...vocab.pages[0],
          buttons: vocab.pages[0].buttons.slice(0, 4),
        },
      ],
    };
    const res = await precacheVocabularyAudio(miniVocab, 'en-US');
    expect(res.total).toBeGreaterThan(0);
    expect(res.cached).toBe(res.total);

    let lastPct = 0;
    const dlOk = await downloadNeuralVoice(
      'en_US-amy-low',
      (pct) => {
        lastPct = pct;
      },
      miniVocab,
    );
    expect(dlOk).toBe(true);
    expect(lastPct).toBe(100);
    const installed = await getDownloadedNeuralVoices();
    expect(installed).toContain('en_US-amy-low');

    await removeNeuralVoice('en_US-amy-low');
    const afterRemove = await getDownloadedNeuralVoices();
    expect(afterRemove).not.toContain('en_US-amy-low');
  });
});

describe('starter vocabulary & edit operations', () => {
  it('builds a valid starter vocabulary with 100% icon coverage and resolved navigation targets', () => {
    const { vocab } = createStarterVocabulary();
    const pageById = new Map(vocab.pages.map((p) => [p.id, p]));
    expect(pageById.get(vocab.homePageId)).toBeDefined();

    for (const page of vocab.pages) {
      const occupied = new Set<string>();
      for (const btn of page.buttons) {
        expect(btn.style.bg).toBeTruthy();
        expect(btn.image).toBeTruthy();
        for (let r = btn.row; r < btn.row + btn.rowSpan; r++) {
          for (let c = btn.col; c < btn.col + btn.colSpan; c++) {
            const key = `${r},${c}`;
            expect(occupied.has(key)).toBe(false);
            occupied.add(key);
          }
        }
        for (const act of btn.actions) {
          if (act.type === 'navigate') {
            expect(pageById.get(act.pageId)).toBeDefined();
          }
        }
      }
    }
  });

  it('computes grid occupancy and finds free cells', () => {
    const { vocab } = createStarterVocabulary();
    const colorsPage = vocab.pages.find((p) => p.id === 'colors')!;
    const occ = occupancy({ ...colorsPage, rows: 3 });
    expect(occ[0][0]).toBeTruthy();
    expect(occ[2][0]).toBeNull();

    const free = firstFreeCell({ ...colorsPage, rows: 3 });
    expect(free).toEqual({ row: 2, col: 0 });
    const nb = newButton(2, 0, { label: 'Teal' });
    expect(nb.label).toBe('Teal');
    expect(nb.row).toBe(2);
    expect(nb.col).toBe(0);

    vocabSignal.value = vocab;
    const firstBtn = colorsPage.buttons[0];
    saveButton('colors', { ...firstBtn, colSpan: 3, rowSpan: 2 });
    const updatedColors = vocabSignal.value.pages.find((p) => p.id === 'colors')!;
    const savedFirst = updatedColors.buttons.find((b) => b.id === firstBtn.id)!;
    expect(savedFirst.colSpan).toBe(1);
    expect(savedFirst.rowSpan).toBe(1);

    saveButton('colors', {
      ...savedFirst,
      variants: { 2: { label: 'crimson', message: 'bright crimson' } },
    });
    expect(searchButtons('crimson').length).toBe(1);
  });

  it('builds multilingual starter vocabularies across all 10 supported languages with 100% icon coverage', () => {
    const p = new Predictor();
    for (const lang of SUPPORTED_LANGUAGES) {
      const { vocab } = createStarterVocabulary(lang.code);
      expect(vocab.locale).toBe(lang.code);
      expect(vocab.pages.length).toBe(11);
      for (const page of vocab.pages) {
        expect(page.name).toBeTruthy();
        for (const btn of page.buttons) {
          expect(btn.label).toBeTruthy();
          expect(btn.image).toBeTruthy();
        }
      }
      const suggestions = p.suggest('', undefined, 5, lang.code);
      expect(suggestions.length).toBe(5);
    }

    expect(resolveIconForButton('agua')).toBe(resolveIconForButton('water'));
    expect(resolveIconForButton('ماء')).toBe(resolveIconForButton('water'));
    expect(resolveIconForButton('水')).toBe(resolveIconForButton('water'));
  });
});
