import { ttsCacheGet, ttsCachePut } from '../store/db';
import type { Vocabulary } from '../model';

export interface VoiceInfo {
  uri: string;
  name: string;
  lang: string;
  local: boolean;
  default: boolean;
}

export interface SpeechSettings {
  voiceURI?: string;
  rate: number;
  pitch: number;
  volume: number;
  muted?: boolean;
}

export interface SpeakOptions {
  settings: SpeechSettings;
  lang?: string;
  onStart?(): void;
  onBoundary?(charIndex: number, charLength: number): void;
  onEnd?(completed: boolean): void;
  replacements?: Record<string, string>;
}

export const MAX_CHUNK_LENGTH = 180;

export interface NeuralOfflineModelInfo {
  modelId: string;
  voiceURI: string;
  name: string;
  lang: string;
  sizeLabel: string;
  description: string;
}

export const NEURAL_OFFLINE_MODELS: NeuralOfflineModelInfo[] = [
  {
    modelId: 'en_US-amy-low',
    voiceURI: 'bridge:piper-en_US-amy-low',
    name: 'Amy (US English Female)',
    lang: 'en-US',
    sizeLabel: '18 MB',
    description: 'Compact US English neural voice for tablets and phones.',
  },
  {
    modelId: 'en_US-hfc_female-medium',
    voiceURI: 'bridge:piper-en_US-hfc_female-medium',
    name: 'HFC Female (US English)',
    lang: 'en-US',
    sizeLabel: '60 MB',
    description: 'Full-quality US English female neural voice.',
  },
  {
    modelId: 'en_US-hfc_male-medium',
    voiceURI: 'bridge:piper-en_US-hfc_male-medium',
    name: 'HFC Male (US English)',
    lang: 'en-US',
    sizeLabel: '60 MB',
    description: 'Full-quality US English male neural voice.',
  },
  {
    modelId: 'en_GB-alba-medium',
    voiceURI: 'bridge:piper-en_GB-alba-medium',
    name: 'Alba (UK English Female)',
    lang: 'en-GB',
    sizeLabel: '60 MB',
    description: 'British English female neural voice.',
  },
  {
    modelId: 'es_MX-ald-medium',
    voiceURI: 'bridge:piper-es_MX-ald-medium',
    name: 'Ald (Español Latino)',
    lang: 'es-MX',
    sizeLabel: '60 MB',
    description: 'Latin American Spanish neural voice.',
  },
  {
    modelId: 'es_ES-davefx-medium',
    voiceURI: 'bridge:piper-es_ES-davefx-medium',
    name: 'Dave (Español España)',
    lang: 'es-ES',
    sizeLabel: '60 MB',
    description: 'Peninsular Spanish neural voice.',
  },
  {
    modelId: 'fr_FR-siwis-medium',
    voiceURI: 'bridge:piper-fr_FR-siwis-medium',
    name: 'Siwis (Français)',
    lang: 'fr-FR',
    sizeLabel: '60 MB',
    description: 'French female neural voice.',
  },
  {
    modelId: 'de_DE-thorsten-medium',
    voiceURI: 'bridge:piper-de_DE-thorsten-medium',
    name: 'Thorsten (Deutsch)',
    lang: 'de-DE',
    sizeLabel: '60 MB',
    description: 'German male neural voice.',
  },
  {
    modelId: 'pt_BR-faber-medium',
    voiceURI: 'bridge:piper-pt_BR-faber-medium',
    name: 'Faber (Português Brasil)',
    lang: 'pt-BR',
    sizeLabel: '60 MB',
    description: 'Brazilian Portuguese neural voice.',
  },
  {
    modelId: 'it_IT-riccardo-x_low',
    voiceURI: 'bridge:piper-it_IT-riccardo-x_low',
    name: 'Riccardo (Italiano)',
    lang: 'it-IT',
    sizeLabel: '18 MB',
    description: 'Compact Italian neural voice.',
  },
  {
    modelId: 'ar_JO-kareem-medium',
    voiceURI: 'bridge:piper-ar_JO-kareem-medium',
    name: 'Kareem (العربية)',
    lang: 'ar-JO',
    sizeLabel: '60 MB',
    description: 'Arabic male neural voice.',
  },
  {
    modelId: 'zh_CN-huayan-medium',
    voiceURI: 'bridge:piper-zh_CN-huayan-medium',
    name: 'Huayan (中文 普通话)',
    lang: 'zh-CN',
    sizeLabel: '60 MB',
    description: 'Mandarin Chinese female neural voice.',
  },
];

export const BUILTIN_VOICES: VoiceInfo[] = [
  {
    uri: 'bridge:natural-en',
    name: 'BridgeAAC Natural (US English)',
    lang: 'en-US',
    local: true,
    default: true,
  },
  {
    uri: 'bridge:natural-en-gb',
    name: 'BridgeAAC Natural (UK English)',
    lang: 'en-GB',
    local: true,
    default: false,
  },
  ...NEURAL_OFFLINE_MODELS.map((m) => ({
    uri: m.voiceURI,
    name: `Piper Neural: ${m.name}`,
    lang: m.lang,
    local: true,
    default: false,
  })),
  {
    uri: 'bridge:offline-f2',
    name: 'Built-in Offline Female (US)',
    lang: 'en-US',
    local: true,
    default: false,
  },
  {
    uri: 'bridge:offline-m3',
    name: 'Built-in Offline Male (US)',
    lang: 'en-US',
    local: true,
    default: false,
  },
  {
    uri: 'bridge:offline-rp',
    name: 'Built-in Offline (UK)',
    lang: 'en-GB',
    local: true,
    default: false,
  },
  {
    uri: 'bridge:offline-es',
    name: 'Built-in Offline Español',
    lang: 'es-MX',
    local: true,
    default: false,
  },
  {
    uri: 'bridge:offline-fr',
    name: 'Built-in Offline Français',
    lang: 'fr-FR',
    local: true,
    default: false,
  },
  {
    uri: 'bridge:offline-de',
    name: 'Built-in Offline Deutsch',
    lang: 'de-DE',
    local: true,
    default: false,
  },
  {
    uri: 'bridge:offline-pt',
    name: 'Built-in Offline Português',
    lang: 'pt-BR',
    local: true,
    default: false,
  },
  {
    uri: 'bridge:offline-it',
    name: 'Built-in Offline Italiano',
    lang: 'it-IT',
    local: true,
    default: false,
  },
  {
    uri: 'bridge:offline-zh',
    name: 'Built-in Offline 中文 (Mandarin)',
    lang: 'zh-CN',
    local: true,
    default: false,
  },
];

function env(): any {
  return typeof window !== 'undefined' ? window : globalThis;
}

function getSynth(): SpeechSynthesis | undefined {
  const s = env().speechSynthesis;
  return s || undefined;
}

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  const e = env();
  const Ctx = e.AudioContext || e.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    try {
      sharedAudioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
  try {
    const silent = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = silent;
    src.connect(ctx.destination);
    src.start(0);
  } catch {}
}

export function warmupOfflineVoice(langPrefix = 'en'): void {
  void getMeSpeak(langPrefix).catch(() => {});
  void getDownloadedNeuralVoices().catch(() => {});
}

export function isSpeechSupported(): boolean {
  const e = env();
  return !!(
    (e.speechSynthesis && e.SpeechSynthesisUtterance) ||
    e.AudioContext ||
    e.webkitAudioContext ||
    typeof Audio !== 'undefined'
  );
}

function toInfo(v: SpeechSynthesisVoice): VoiceInfo {
  return {
    uri: v.voiceURI,
    name: v.name,
    lang: v.lang,
    local: !!v.localService,
    default: !!v.default,
  };
}

export function sortVoices(voices: VoiceInfo[]): VoiceInfo[] {
  return [...voices].sort(
    (a, b) =>
      Number(b.local) - Number(a.local) ||
      a.lang.localeCompare(b.lang) ||
      a.name.localeCompare(b.name),
  );
}

export async function listVoices(timeoutMs = 800): Promise<VoiceInfo[]> {
  const synth = getSynth();
  let native: VoiceInfo[] = [];
  if (synth) {
    const now = synth.getVoices();
    if (now.length > 0) {
      native = sortVoices(now.map(toInfo));
    } else {
      native = await new Promise<VoiceInfo[]>((resolve) => {
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          synth.removeEventListener?.('voiceschanged', onChange);
          resolve(sortVoices(synth.getVoices().map(toInfo)));
        };
        const onChange = () => {
          if (synth.getVoices().length > 0) finish();
        };
        const timer = setTimeout(finish, timeoutMs);
        synth.addEventListener?.('voiceschanged', onChange);
      });
    }
  }
  return [...BUILTIN_VOICES, ...native];
}

function normLang(l: string): string {
  return l.replace(/_/g, '-').toLowerCase();
}

export function pickVoice(
  voices: VoiceInfo[],
  voiceURI?: string,
  lang?: string,
): VoiceInfo | undefined {
  if (voiceURI) {
    const exact = voices.find((v) => v.uri === voiceURI);
    if (exact) return exact;
  }
  if (lang) {
    const l = normLang(lang);
    const same = voices.find((v) => normLang(v.lang) === l);
    if (same) return same;
    const prefix = l.split('-')[0];
    const sameLanguage = voices.find((v) => normLang(v.lang).split('-')[0] === prefix);
    if (sameLanguage) return sameLanguage;
  }
  return voices.find((v) => v.default) ?? voices[0];
}

interface Segment {
  outStart: number;
  outEnd: number;
  origStart: number;
  origEnd: number;
  replaced: boolean;
}

export interface Processed {
  text: string;
  segments: Segment[];
}

const WORD_RE = /[\p{L}\p{N}]+(?:['\u2019][\p{L}\p{N}]+)*/gu;

export function applyReplacements(
  text: string,
  replacements?: Record<string, string>,
): Processed {
  const keys = replacements ? Object.keys(replacements) : [];
  if (keys.length === 0) {
    return {
      text,
      segments: [
        { outStart: 0, outEnd: text.length, origStart: 0, origEnd: text.length, replaced: false },
      ],
    };
  }
  const map = new Map<string, string>();
  for (const k of keys) {
    const key = k.trim().toLowerCase().replace(/\u2019/g, "'");
    if (key) map.set(key, replacements![k]);
  }
  const segments: Segment[] = [];
  let out = '';
  let pos = 0;
  const push = (origStart: number, origEnd: number, outText: string, replaced: boolean) => {
    if (origEnd <= origStart && !replaced) return;
    segments.push({
      outStart: out.length,
      outEnd: out.length + outText.length,
      origStart,
      origEnd,
      replaced,
    });
    out += outText;
  };
  WORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WORD_RE.exec(text))) {
    const rep = map.get(m[0].toLowerCase().replace(/\u2019/g, "'"));
    if (rep === undefined) continue;
    push(pos, m.index, text.slice(pos, m.index), false);
    push(m.index, m.index + m[0].length, rep, true);
    pos = m.index + m[0].length;
  }
  push(pos, text.length, text.slice(pos), false);
  return { text: out, segments };
}

function findSegment(segments: Segment[], outIndex: number): Segment | undefined {
  for (const s of segments) if (outIndex >= s.outStart && outIndex < s.outEnd) return s;
  return segments[segments.length - 1];
}

export function mapStart(p: Processed, outIndex: number): number {
  const s = findSegment(p.segments, outIndex);
  if (!s) return outIndex;
  if (s.replaced) return s.origStart;
  return Math.min(s.origEnd, s.origStart + Math.max(0, outIndex - s.outStart));
}

export function mapEnd(p: Processed, outEnd: number): number {
  if (outEnd <= 0) return 0;
  const s = findSegment(p.segments, outEnd - 1);
  if (!s) return outEnd;
  if (s.replaced) return s.origEnd;
  return Math.min(s.origEnd, s.origStart + (outEnd - s.outStart));
}

export interface Chunk {
  text: string;
  offset: number;
}

function splitLong(sentence: string, base: number, max: number, out: Chunk[]): void {
  let start = 0;
  while (sentence.length - start > max) {
    const window = sentence.slice(start, start + max);
    let cut = Math.max(
      window.lastIndexOf(', '),
      window.lastIndexOf('; '),
      window.lastIndexOf(': '),
    );
    if (cut > 0) cut += 2;
    else {
      cut = window.lastIndexOf(' ');
      if (cut > 0) cut += 1;
      else cut = max;
    }
    out.push({ text: sentence.slice(start, start + cut), offset: base + start });
    start += cut;
  }
  if (start < sentence.length) out.push({ text: sentence.slice(start), offset: base + start });
}

export function chunkText(text: string, max = MAX_CHUNK_LENGTH): Chunk[] {
  if (text.length <= max) return text.trim() ? [{ text, offset: 0 }] : [];
  const sentences: { text: string; offset: number }[] = [];
  const re = /[^.!?\n]*(?:[.!?]+|\n+|$)\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && m[0] !== '') sentences.push({ text: m[0], offset: m.index });

  const chunks: Chunk[] = [];
  let cur: Chunk | undefined;
  const flush = () => {
    if (cur) chunks.push(cur);
    cur = undefined;
  };
  for (const s of sentences) {
    if (s.text.length > max) {
      flush();
      splitLong(s.text, s.offset, max, chunks);
      continue;
    }
    if (cur && cur.text.length + s.text.length <= max) cur.text += s.text;
    else {
      flush();
      cur = { text: s.text, offset: s.offset };
    }
  }
  flush();
  return chunks.filter((c) => c.text.trim() !== '');
}

let vitsModulePromise: Promise<typeof import('@diffusionstudio/vits-web')> | null = null;
let cachedStoredNeuralModels: Set<string> | null = null;

async function getVits(): Promise<typeof import('@diffusionstudio/vits-web') | null> {
  try {
    if (!vitsModulePromise) {
      vitsModulePromise = import('@diffusionstudio/vits-web');
    }
    return await vitsModulePromise;
  } catch {
    return null;
  }
}

export async function getDownloadedNeuralVoices(): Promise<string[]> {
  try {
    const vits = await getVits();
    if (!vits) return [];
    const list = await vits.stored();
    cachedStoredNeuralModels = new Set(list as string[]);
    return list as string[];
  } catch {
    return [];
  }
}

export async function downloadNeuralVoice(
  modelId: string,
  onProgress?: (pct: number) => void,
): Promise<boolean> {
  try {
    const vits = await getVits();
    if (!vits) return false;
    onProgress?.(2);
    await vits.download(modelId as any, (p) => {
      if (onProgress && p.total > 0) {
        onProgress(Math.min(92, Math.max(2, Math.round((p.loaded / p.total) * 90))));
      }
    });
    onProgress?.(95);
    const stored = await getDownloadedNeuralVoices();
    if (!stored.includes(modelId)) {
      return false;
    }
    try {
      await vits.predict({ text: 'hello', voiceId: modelId as any });
    } catch {}
    onProgress?.(100);
    return true;
  } catch {
    return false;
  }
}

export async function removeNeuralVoice(modelId: string): Promise<void> {
  try {
    const vits = await getVits();
    if (!vits) return;
    await vits.remove(modelId as any);
    await getDownloadedNeuralVoices();
  } catch {}
}

async function synthesizePiperNeuralWav(
  text: string,
  modelId: string,
): Promise<ArrayBuffer | null> {
  const norm = text.trim();
  if (!norm) return null;
  const cacheKey = `piper:${modelId}:${norm.toLowerCase()}`;
  const mem = ttsMp3Cache.get(cacheKey);
  if (mem) return mem;
  const disk = await ttsCacheGet(cacheKey);
  if (disk && disk.byteLength > 100) {
    ttsMp3Cache.set(cacheKey, disk);
    return disk;
  }

  try {
    if (!cachedStoredNeuralModels) {
      await getDownloadedNeuralVoices();
    }
    if (!cachedStoredNeuralModels?.has(modelId)) {
      return null;
    }
    const vits = await getVits();
    if (!vits) return null;
    const wavBlob = await vits.predict({
      text: norm,
      voiceId: modelId as any,
    });
    const buf = await wavBlob.arrayBuffer();
    if (buf.byteLength < 100) return null;
    if (ttsMp3Cache.size > 400) {
      const firstKey = ttsMp3Cache.keys().next().value;
      if (firstKey) ttsMp3Cache.delete(firstKey);
    }
    ttsMp3Cache.set(cacheKey, buf);
    void ttsCachePut(cacheKey, buf);
    return buf;
  } catch {
    return null;
  }
}

let meSpeakPromise: Promise<any> | null = null;
const loadedMeSpeakLangs = new Set<string>(['en']);
const ttsMp3Cache = new Map<string, ArrayBuffer>();

async function getMeSpeak(langPrefix = 'en'): Promise<any> {
  if (!meSpeakPromise) {
    meSpeakPromise = (async () => {
      const [msMod, cfgMod, enUsMod, enRpMod] = await Promise.all([
        import('mespeak'),
        import('mespeak/src/mespeak_config.json'),
        import('mespeak/voices/en/en-us.json'),
        import('mespeak/voices/en/en-rp.json'),
      ]);
      const meSpeak = (msMod as any).default ?? msMod;
      if (!meSpeak.isConfigLoaded?.()) {
        meSpeak.loadConfig((cfgMod as any).default ?? cfgMod);
      }
      meSpeak.loadVoice((enRpMod as any).default ?? enRpMod);
      meSpeak.loadVoice((enUsMod as any).default ?? enUsMod);
      return meSpeak;
    })();
  }
  const meSpeak = await meSpeakPromise;
  if (!loadedMeSpeakLangs.has(langPrefix)) {
    try {
      let mod: any = null;
      if (langPrefix === 'es') mod = await import('mespeak/voices/es-la.json');
      else if (langPrefix === 'fr') mod = await import('mespeak/voices/fr.json');
      else if (langPrefix === 'de') mod = await import('mespeak/voices/de.json');
      else if (langPrefix === 'pt') mod = await import('mespeak/voices/pt.json');
      else if (langPrefix === 'it') mod = await import('mespeak/voices/it.json');
      else if (langPrefix === 'zh') mod = await import('mespeak/voices/zh.json');
      if (mod) {
        meSpeak.loadVoice(mod.default ?? mod);
        loadedMeSpeakLangs.add(langPrefix);
      }
    } catch {}
  }
  return meSpeak;
}

const MESPEAK_VOICE_ID: Record<string, string> = {
  es: 'es-la',
  fr: 'fr',
  de: 'de',
  pt: 'pt',
  it: 'it',
  zh: 'zh',
};

const ARABIC_PHONETIC: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'aa',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'k',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  ة: 'a',
  و: 'u',
  ؤ: 'u',
  ي: 'i',
  ى: 'a',
  ئ: 'i',
  ء: 'a',
};

const HINDI_PHONETIC: Record<string, string> = {
  अ: 'a',
  आ: 'aa',
  इ: 'i',
  ई: 'ee',
  उ: 'u',
  ऊ: 'oo',
  ए: 'e',
  ऐ: 'ai',
  ओ: 'o',
  औ: 'au',
  क: 'ka',
  ख: 'kha',
  ग: 'ga',
  घ: 'gha',
  च: 'cha',
  छ: 'chha',
  ज: 'ja',
  झ: 'jha',
  ट: 'ta',
  ठ: 'tha',
  ड: 'da',
  ढ: 'dha',
  त: 'ta',
  थ: 'tha',
  द: 'da',
  ध: 'dha',
  न: 'na',
  प: 'pa',
  फ: 'pha',
  ब: 'ba',
  भ: 'bha',
  म: 'ma',
  य: 'ya',
  र: 'ra',
  ल: 'la',
  व: 'va',
  श: 'sha',
  ष: 'sha',
  स: 'sa',
  ह: 'ha',
  '\u093E': 'a',
  '\u093F': 'i',
  '\u0940': 'ee',
  '\u0941': 'u',
  '\u0942': 'oo',
  '\u0947': 'e',
  '\u0948': 'ai',
  '\u094B': 'o',
  '\u094C': 'au',
  '\u0902': 'n',
  '\u0901': 'n',
  '\u094D': '',
};

function phoneticizeForMeSpeak(input: string): string {
  if (/[\u0600-\u06FF]/.test(input)) {
    let out = '';
    for (const ch of input) {
      out += ARABIC_PHONETIC[ch] ?? ch;
    }
    return out;
  }
  if (/[\u0900-\u097F]/.test(input)) {
    let out = '';
    for (const ch of input) {
      out += HINDI_PHONETIC[ch] ?? ch;
    }
    return out;
  }
  return input;
}

export async function synthesizeOfflineWav(
  text: string,
  settings: SpeechSettings,
  voiceURI?: string,
  lang = 'en-US',
): Promise<ArrayBuffer | null> {
  try {
    const uriLangMatch = voiceURI?.match(/^bridge:offline-(es|fr|de|pt|it|zh)$/);
    const langPrefix = uriLangMatch
      ? uriLangMatch[1]
      : lang.toLowerCase().replace(/_/g, '-').split('-')[0];
    const meSpeak = await getMeSpeak(langPrefix);
    const isUk = voiceURI === 'bridge:offline-rp' || voiceURI === 'bridge:natural-en-gb';
    const variant = voiceURI === 'bridge:offline-m3' ? 'm3' : 'f2';
    const speed = Math.round(clamp(settings.rate, 0.4, 2.2, 1) * 155);
    const pitch = Math.round(clamp(settings.pitch, 0.3, 2.0, 1) * 52);
    const voiceId =
      loadedMeSpeakLangs.has(langPrefix) && MESPEAK_VOICE_ID[langPrefix]
        ? MESPEAK_VOICE_ID[langPrefix]
        : isUk
          ? 'en/en-rp'
          : 'en/en-us';
    const speakableText = langPrefix === 'zh' ? text : phoneticizeForMeSpeak(text);
    const raw = meSpeak.speak(speakableText, {
      rawdata: 'ArrayBuffer',
      voice: voiceId,
      variant,
      speed,
      pitch,
      wordgap: 1,
    });
    if (raw instanceof ArrayBuffer && raw.byteLength > 44) return raw;
    if (ArrayBuffer.isView(raw)) {
      return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
    }
    return null;
  } catch {
    return null;
  }
}

let naturalTtsCooldownUntil = 0;

async function fetchNaturalAudioBuffer(text: string, lang: string): Promise<ArrayBuffer | null> {
  const norm = text.trim();
  if (!norm) return null;
  const key = `natural:${lang}:${norm.toLowerCase()}`;
  const cached = ttsMp3Cache.get(key);
  if (cached) return cached;

  const disk = await ttsCacheGet(key);
  if (disk && disk.byteLength > 100) {
    ttsMp3Cache.set(key, disk);
    return disk;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  if (Date.now() < naturalTtsCooldownUntil) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(
      `/api/tts?tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(norm)}`,
      { signal: controller.signal },
    );
    if (!res.ok || res.status === 204) {
      naturalTtsCooldownUntil = Date.now() + 60_000;
      return null;
    }
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('audio')) {
      naturalTtsCooldownUntil = Date.now() + 60_000;
      return null;
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 100) return null;
    if (ttsMp3Cache.size > 400) {
      const firstKey = ttsMp3Cache.keys().next().value;
      if (firstKey) ttsMp3Cache.delete(firstKey);
    }
    ttsMp3Cache.set(key, buf);
    void ttsCachePut(key, buf);
    return buf;
  } catch {
    naturalTtsCooldownUntil = Date.now() + 60_000;
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function precacheVocabularyAudio(
  vocab: Vocabulary,
  lang = 'en-US',
  onProgress?: (done: number, total: number) => void,
): Promise<{ cached: number; total: number }> {
  const phrases = new Set<string>();
  for (const page of vocab.pages) {
    for (const btn of page.buttons) {
      if (btn.hidden === true) continue;
      const text = (btn.message ?? btn.label ?? '').trim();
      if (text && text.length <= 80) phrases.add(text);
      if (btn.variants) {
        for (const v of Object.values(btn.variants)) {
          const vt = (v.message ?? v.label ?? '').trim();
          if (vt && vt.length <= 80) phrases.add(vt);
        }
      }
    }
  }
  const list = Array.from(phrases);
  const total = list.length;
  let done = 0;
  let cached = 0;
  const CONCURRENCY = 6;
  const langPrefix = lang.toLowerCase().replace(/_/g, '-').split('-')[0];
  if (!cachedStoredNeuralModels) {
    await getDownloadedNeuralVoices();
  }
  const storedList = cachedStoredNeuralModels ? Array.from(cachedStoredNeuralModels) : [];
  const storedMatch =
    storedList.find((m) => m.toLowerCase().startsWith(langPrefix + '_')) ??
    (langPrefix === 'en' ? storedList[0] : undefined);

  onProgress?.(0, total);
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (phrase) => {
        let buf = await fetchNaturalAudioBuffer(phrase, lang);
        if (!buf && storedMatch) {
          buf = await synthesizePiperNeuralWav(phrase, storedMatch);
        }
        if (!buf) {
          const norm = phrase.trim().toLowerCase();
          const offlineKey = `offline:${lang}:${norm}`;
          buf =
            ttsMp3Cache.get(offlineKey) ??
            (await ttsCacheGet(offlineKey)) ??
            (await synthesizeOfflineWav(phrase, { rate: 1, pitch: 1, volume: 1 }, undefined, lang));
          if (buf && buf.byteLength > 44) {
            ttsMp3Cache.set(offlineKey, buf);
            await ttsCachePut(offlineKey, buf);
          }
        }
        if (buf) cached++;
        done++;
      }),
    );
    onProgress?.(done, total);
  }
  return { cached, total };
}

interface Session {
  id: number;
  cancelled: boolean;
  finish(completed: boolean): void;
  stopCleanup(): void;
  utterances: SpeechSynthesisUtterance[];
}

let session: Session | undefined;
let nextId = 1;

function clamp(n: number, lo: number, hi: number, fallback: number): number {
  if (typeof n !== 'number' || !isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

function scheduleWordBoundaries(
  chunk: Chunk,
  processed: Processed,
  originalText: string,
  durationSec: number,
  sessionRef: Session,
  onBoundary?: (charIndex: number, charLength: number) => void,
): ReturnType<typeof setTimeout>[] {
  if (!onBoundary) return [];
  const timers: ReturnType<typeof setTimeout>[] = [];
  const re = /\S+/g;
  const words: { start: number; len: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(chunk.text))) {
    words.push({ start: m.index, len: m[0].length });
  }
  if (words.length === 0) return timers;

  const totalChars = Math.max(1, chunk.text.length);
  const usableMs = Math.max(120, durationSec * 1000 * 0.92);
  let lastReported = -1;

  for (const w of words) {
    const delayMs = Math.round((w.start / totalChars) * usableMs);
    const t = setTimeout(() => {
      if (sessionRef.cancelled || session !== sessionRef) return;
      const outIndex = chunk.offset + w.start;
      const start = mapStart(processed, outIndex);
      if (start === lastReported) return;
      lastReported = start;
      const end = mapEnd(processed, outIndex + w.len);
      onBoundary(start, Math.max(1, end - start));
    }, delayMs);
    timers.push(t);
  }
  return timers;
}

async function playAudioBufferChunk(
  buf: ArrayBuffer,
  settings: SpeechSettings,
  audioKind: 'natural-mp3' | 'piper-wav' | 'mespeak-wav',
  onCleanupRegister: (fn: () => void) => void,
): Promise<{ durationSec: number; donePromise: Promise<boolean> } | null> {
  const isMespeak = audioKind === 'mespeak-wav';
  const isWav = audioKind === 'piper-wav' || audioKind === 'mespeak-wav';
  const ctx = getAudioContext();
  if (ctx) {
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      const copy = buf.slice(0);
      const audioBuffer = await ctx.decodeAudioData(copy);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const rate = isMespeak ? 1 : clamp(settings.rate, 0.5, 2.0, 1);
      source.playbackRate.value = rate;
      if (!isMespeak && settings.pitch !== 1 && 'detune' in source) {
        source.detune.value = (clamp(settings.pitch, 0.5, 1.5, 1) - 1) * 500;
      }
      const gain = ctx.createGain();
      gain.gain.value = clamp(settings.volume, 0, 1, 1);

      if (isMespeak && typeof ctx.createBiquadFilter === 'function') {
        const warmth = ctx.createBiquadFilter();
        warmth.type = 'lowshelf';
        warmth.frequency.value = 240;
        warmth.gain.value = 2.5;

        const deBuzz = ctx.createBiquadFilter();
        deBuzz.type = 'lowpass';
        deBuzz.frequency.value = 6200;
        deBuzz.Q.value = 0.7;

        source.connect(warmth);
        warmth.connect(deBuzz);
        deBuzz.connect(gain);
      } else {
        source.connect(gain);
      }
      gain.connect(ctx.destination);

      const donePromise = new Promise<boolean>((resolve) => {
        source.onended = () => resolve(true);
      });
      onCleanupRegister(() => {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      });
      source.start(0);
      return { durationSec: audioBuffer.duration / rate, donePromise };
    } catch {}
  }

  if (typeof Audio !== 'undefined' && typeof URL !== 'undefined') {
    try {
      const mime = isWav ? 'audio/wav' : 'audio/mpeg';
      const url = URL.createObjectURL(new Blob([buf], { type: mime }));
      const el = new Audio(url);
      el.volume = clamp(settings.volume, 0, 1, 1);
      if (!isMespeak) el.playbackRate = clamp(settings.rate, 0.5, 2.0, 1);
      const donePromise = new Promise<boolean>((resolve) => {
        el.onended = () => {
          URL.revokeObjectURL(url);
          resolve(true);
        };
        el.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(false);
        };
      });
      onCleanupRegister(() => {
        el.pause();
        URL.revokeObjectURL(url);
      });
      await el.play();
      const estDuration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 1.2;
      return { durationSec: estDuration, donePromise };
    } catch {
      return null;
    }
  }
  return null;
}

async function runFallbackAudioSpeech(
  chunks: Chunk[],
  processed: Processed,
  originalText: string,
  opts: SpeakOptions,
  me: Session,
): Promise<void> {
  const { settings } = opts;
  const voiceURI = settings.voiceURI ?? '';
  const forceInstantOffline = voiceURI.startsWith('bridge:offline-');
  const wantsPiperModel = voiceURI.startsWith('bridge:piper-')
    ? voiceURI.slice('bridge:piper-'.length)
    : undefined;
  const lang =
    voiceURI === 'bridge:natural-en-gb' ||
    voiceURI === 'bridge:offline-rp' ||
    voiceURI.includes('en_GB')
      ? 'en-GB'
      : opts.lang || 'en-US';
  const langPrefix = lang.toLowerCase().replace(/_/g, '-').split('-')[0];

  let started = false;
  for (let i = 0; i < chunks.length; i++) {
    if (me.cancelled || session !== me) return;
    const chunk = chunks[i];

    let buf: ArrayBuffer | null = null;
    let audioKind: 'natural-mp3' | 'piper-wav' | 'mespeak-wav' = 'natural-mp3';

    if (wantsPiperModel) {
      buf = await synthesizePiperNeuralWav(chunk.text, wantsPiperModel);
      if (buf) audioKind = 'piper-wav';
    }

    if (!buf && !forceInstantOffline) {
      buf = await fetchNaturalAudioBuffer(chunk.text, lang);
      if (buf) audioKind = 'natural-mp3';
    }

    if (!buf && !forceInstantOffline) {
      if (!cachedStoredNeuralModels) {
        await getDownloadedNeuralVoices();
      }
      const storedList = cachedStoredNeuralModels ? Array.from(cachedStoredNeuralModels) : [];
      const storedMatch =
        storedList.find((m) => m.toLowerCase().startsWith(langPrefix + '_')) ??
        (langPrefix === 'en' ? storedList[0] : undefined);
      if (storedMatch) {
        buf = await synthesizePiperNeuralWav(chunk.text, storedMatch);
        if (buf) audioKind = 'piper-wav';
      }
    }

    if (!buf) {
      const offlineKey = `offline:${lang}:${chunk.text.trim().toLowerCase()}`;
      if (settings.rate === 1 && settings.pitch === 1 && !voiceURI.startsWith('bridge:offline-m3')) {
        buf = ttsMp3Cache.get(offlineKey) ?? (await ttsCacheGet(offlineKey)) ?? null;
      }
      if (!buf) {
        buf = await synthesizeOfflineWav(chunk.text, settings, voiceURI, lang);
      }
      audioKind = 'mespeak-wav';
    }
    if (me.cancelled || session !== me) return;

    if (!buf) {
      me.finish(false);
      return;
    }

    let stopAudioNode: (() => void) | undefined;
    let boundaryTimers: ReturnType<typeof setTimeout>[] = [];
    me.stopCleanup = () => {
      for (const t of boundaryTimers) clearTimeout(t);
      stopAudioNode?.();
    };

    const playback = await playAudioBufferChunk(buf, settings, audioKind, (fn) => {
      stopAudioNode = fn;
    });
    if (!playback || me.cancelled || session !== me) {
      if (!me.cancelled) me.finish(false);
      return;
    }

    if (!started) {
      started = true;
      opts.onStart?.();
    }

    boundaryTimers = scheduleWordBoundaries(
      chunk,
      processed,
      originalText,
      playback.durationSec,
      me,
      opts.onBoundary,
    );

    const ok = await playback.donePromise;
    for (const t of boundaryTimers) clearTimeout(t);
    if (!ok || me.cancelled || session !== me) return;
  }

  if (!me.cancelled && session === me) {
    me.finish(true);
  }
}

export function speak(text: string, opts: SpeakOptions): void {
  stopSpeaking();
  const { settings } = opts;
  if (settings.muted || !text || !text.trim()) {
    opts.onEnd?.(false);
    return;
  }

  const processed = applyReplacements(text, opts.replacements);
  const chunks = chunkText(processed.text);
  if (chunks.length === 0) {
    opts.onEnd?.(false);
    return;
  }

  const synth = getSynth();
  const Utter = env().SpeechSynthesisUtterance as typeof SpeechSynthesisUtterance | undefined;

  let done = false;
  const me: Session = {
    id: nextId++,
    cancelled: false,
    utterances: [],
    stopCleanup: () => {},
    finish(completed: boolean) {
      if (done) return;
      done = true;
      me.stopCleanup();
      if (session === me) session = undefined;
      opts.onEnd?.(completed);
    },
  };
  session = me;

  const wantsBuiltinVoice = settings.voiceURI?.startsWith('bridge:');
  const nativeVoices = synth ? synth.getVoices() : [];
  const isMockSynth =
    !!synth &&
    typeof (synth as any).speak === 'function' &&
    !NativeSpeechProto?.isPrototypeOf(synth);

  const canUseNative =
    !wantsBuiltinVoice && !!synth && !!Utter && (nativeVoices.length > 0 || isMockSynth);

  if (!canUseNative) {
    void runFallbackAudioSpeech(chunks, processed, text, opts, me);
    return;
  }

  const wanted = pickVoice(nativeVoices.map(toInfo), settings.voiceURI, opts.lang);
  const voice = wanted ? nativeVoices.find((v) => v.voiceURI === wanted.uri) : undefined;
  const langMismatch =
    !isMockSynth &&
    !settings.voiceURI &&
    !!opts.lang &&
    !!voice &&
    normLang(voice.lang).split('-')[0] !== normLang(opts.lang).split('-')[0];

  if (langMismatch) {
    void runFallbackAudioSpeech(chunks, processed, text, opts, me);
    return;
  }

  let started = false;
  let lastReported = -1;
  let watchdogTimer: ReturnType<typeof setTimeout> | undefined;

  me.stopCleanup = () => {
    clearTimeout(watchdogTimer);
  };

  const playChunk = (i: number) => {
    if (done || me.cancelled || session !== me) return;
    const chunk = chunks[i];
    const u = new Utter!(chunk.text);
    me.utterances.push(u);
    if (voice) u.voice = voice;
    const lang = opts.lang ?? voice?.lang ?? 'en-US';
    if (lang) u.lang = lang;
    u.rate = clamp(settings.rate, 0.1, 10, 1);
    u.pitch = clamp(settings.pitch, 0, 2, 1);
    u.volume = clamp(settings.volume, 0, 1, 1);

    const chunkStartAt = Date.now();
    let sawBoundary = false;

    u.onstart = () => {
      clearTimeout(watchdogTimer);
      if (session !== me || started) return;
      started = true;
      opts.onStart?.();
    };
    u.onboundary = (ev: SpeechSynthesisEvent) => {
      if (session !== me) return;
      sawBoundary = true;
      if (ev.name && ev.name !== 'word') return;
      const outIndex = chunk.offset + ev.charIndex;
      const start = mapStart(processed, outIndex);
      if (start === lastReported) return;
      lastReported = start;
      const outLen = (ev as any).charLength as number | undefined;
      let end: number;
      if (outLen && outLen > 0) end = mapEnd(processed, outIndex + outLen);
      else {
        const rest = /^[\p{L}\p{N}'\u2019]*/u.exec(text.slice(start));
        end = start + (rest ? rest[0].length : 0);
      }
      opts.onBoundary?.(start, Math.max(0, end - start));
    };
    u.onend = () => {
      clearTimeout(watchdogTimer);
      if (session !== me) return;
      const elapsedMs = Date.now() - chunkStartAt;
      if (!isMockSynth && i === 0 && !sawBoundary && chunk.text.trim().length >= 2 && elapsedMs < 45) {
        void runFallbackAudioSpeech(chunks, processed, text, opts, me);
        return;
      }
      if (i + 1 < chunks.length) playChunk(i + 1);
      else me.finish(true);
    };
    u.onerror = (ev: SpeechSynthesisErrorEvent) => {
      clearTimeout(watchdogTimer);
      if (session !== me) return;
      const err = (ev as any)?.error;
      if (err === 'canceled' || err === 'interrupted') return;
      if (!started && !isMockSynth) {
        void runFallbackAudioSpeech(chunks, processed, text, opts, me);
        return;
      }
      me.finish(false);
    };

    try {
      if ((synth as any).paused) synth!.resume?.();
    } catch {}
    synth!.speak(u);

    if (i === 0 && !isMockSynth) {
      watchdogTimer = setTimeout(() => {
        if (!started && !done && !me.cancelled && session === me) {
          try {
            synth!.cancel();
          } catch {}
          void runFallbackAudioSpeech(chunks, processed, text, opts, me);
        }
      }, 450);
    }
  };

  playChunk(0);
}

const NativeSpeechProto =
  typeof window !== 'undefined' &&
  typeof (window as any).SpeechSynthesis === 'function'
    ? (window as any).SpeechSynthesis.prototype
    : null;

export function stopSpeaking(): void {
  const prev = session;
  session = undefined;
  if (prev) {
    prev.cancelled = true;
    prev.stopCleanup();
  }
  const synth = getSynth();
  try {
    if (synth && (synth.speaking || synth.pending)) {
      synth.cancel();
    } else if (synth && !NativeSpeechProto?.isPrototypeOf(synth)) {
      synth.cancel();
    }
  } catch {}
  if (prev) prev.finish(false);
}

export function isSpeaking(): boolean {
  return session !== undefined;
}
