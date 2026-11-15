import { signal, effect } from '@preact/signals';
import { hashSecret, isHashedSecret } from './store/secure';

export type ThemeSetting = 'auto' | 'light' | 'dark' | 'calm' | 'contrast';
export type ScanPatternSetting = 'linear' | 'row-column' | 'column-row';
export type FontFamilySetting = 'system' | 'rounded' | 'dyslexic' | 'serif' | 'mono';
export type LabelPositionSetting = 'auto' | 'top' | 'bottom';
export type ColorCodingSetting = 'default' | 'pastel' | 'vivid' | 'monochrome';

export interface Settings {
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
  muted: boolean;
  speakButtons: boolean;
  speakOnTapWindow: boolean;
  clearAfterSpeak: boolean;
  returnHomeAfterWord: boolean;
  autoCapitalize: boolean;
  highlightSpoken: boolean;
  pronunciations: Record<string, string>;
  access: 'touch' | 'scan';
  holdMs: number;
  ignoreRepeatMs: number;
  activateOnRelease: boolean;
  dwellMs: number;
  scanPattern: ScanPatternSetting;
  scanMode: 'auto' | 'step';
  scanIntervalMs: number;
  scanFirstDelayMs: number;
  scanLoops: number;
  scanColor: string;
  auditoryScanning: boolean;
  switchSelectKeys: string[];
  switchNextKeys: string[];
  theme: ThemeSetting;
  fontFamily: FontFamilySetting;
  accentColor: string;
  buttonRadius: number;
  iconScale: number;
  labelPosition: LabelPositionSetting;
  colorCoding: ColorCodingSetting;
  reducedMotion: boolean;
  highContrastFocus: boolean;
  labelScale: number;
  buttonGap: number;
  showImages: boolean;
  messageFontScale: number;
  showButtonBorders: boolean;
  soundFeedback: boolean;
  uiLanguage: string;
  pin: string;
  onlineSpeech: boolean;
  onlineSymbolSearch: boolean;
  useDeviceKeyboard?: boolean;
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  voiceURI: '',
  rate: 1,
  pitch: 1,
  volume: 1,
  muted: false,
  speakButtons: true,
  speakOnTapWindow: true,
  clearAfterSpeak: false,
  returnHomeAfterWord: false,
  autoCapitalize: true,
  highlightSpoken: true,
  pronunciations: {},
  access: 'touch',
  holdMs: 0,
  ignoreRepeatMs: 0,
  activateOnRelease: true,
  dwellMs: 0,
  scanPattern: 'row-column',
  scanMode: 'auto',
  scanIntervalMs: 1200,
  scanFirstDelayMs: 1500,
  scanLoops: 3,
  scanColor: '#f59e0b',
  auditoryScanning: false,
  switchSelectKeys: ['Space'],
  switchNextKeys: ['Enter'],
  theme: 'auto',
  fontFamily: 'system',
  accentColor: '#2563eb',
  buttonRadius: 12,
  iconScale: 1,
  labelPosition: 'auto',
  colorCoding: 'default',
  reducedMotion: false,
  highContrastFocus: true,
  labelScale: 1,
  buttonGap: 4,
  showImages: true,
  messageFontScale: 1,
  showButtonBorders: true,
  soundFeedback: false,
  uiLanguage: 'auto',
  pin: '',
  onlineSpeech: false,
  onlineSymbolSearch: false,
  onboarded: false,
};

const KEY = 'bridgeaac.settings.v2';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export const settings = signal<Settings>(load());

effect(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings.value));
  } catch {}
});

let migratingPin = '';
effect(() => {
  const pin = settings.value.pin;
  if (!pin || isHashedSecret(pin) || migratingPin === pin) return;
  migratingPin = pin;
  void hashSecret(pin)
    .then((hashed) => {
      if (hashed && settings.value.pin === pin) updateSettings({ pin: hashed });
    })
    .catch(() => {})
    .finally(() => {
      migratingPin = '';
    });
});

export async function setSettingsPin(plain: string): Promise<void> {
  const clean = plain.trim();
  updateSettings({ pin: clean ? await hashSecret(clean) : '' });
}

export function updateSettings(patch: Partial<Settings>): void {
  settings.value = { ...settings.value, ...patch };
}

export function resetSettings(): void {
  settings.value = { ...DEFAULT_SETTINGS, onboarded: true };
}

const CHOICES: Partial<Record<keyof Settings, readonly string[]>> = {
  access: ['touch', 'scan'],
  scanPattern: ['linear', 'row-column', 'column-row'],
  scanMode: ['auto', 'step'],
  theme: ['auto', 'light', 'dark', 'calm', 'contrast'],
  fontFamily: ['system', 'rounded', 'dyslexic', 'serif', 'mono'],
  labelPosition: ['auto', 'top', 'bottom'],
  colorCoding: ['default', 'pastel', 'vivid', 'monochrome'],
};

const NEVER_IMPORTED = new Set<keyof Settings>(['pin', 'onboarded']);
const OFF_ONLY = new Set<keyof Settings>(['onlineSpeech', 'onlineSymbolSearch']);
const COLOR = /^#[0-9a-f]{3,8}$/i;

export function sanitizeImportedSettings(input: unknown): Partial<Settings> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const known = { ...DEFAULT_SETTINGS, useDeviceKeyboard: false } as Record<string, unknown>;

  for (const key of Object.keys(known)) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    const k = key as keyof Settings;
    if (NEVER_IMPORTED.has(k)) continue;
    const value = source[key];
    const expected = known[key];

    if (OFF_ONLY.has(k)) {
      if (value === false) out[key] = false;
      continue;
    }
    if (typeof expected === 'boolean') {
      if (typeof value === 'boolean') out[key] = value;
    } else if (typeof expected === 'number') {
      if (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 100000) out[key] = value;
    } else if (typeof expected === 'string') {
      if (typeof value !== 'string' || value.length > 300) continue;
      const choices = CHOICES[k];
      if (choices && !choices.includes(value)) continue;
      if ((k === 'accentColor' || k === 'scanColor') && !COLOR.test(value)) continue;
      out[key] = value;
    } else if (Array.isArray(expected)) {
      if (Array.isArray(value) && value.length <= 20 && value.every((v) => typeof v === 'string' && v.length <= 40)) {
        out[key] = [...value];
      }
    } else if (key === 'pronunciations') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const clean: Record<string, string> = {};
      for (const [word, said] of Object.entries(value as Record<string, unknown>).slice(0, 2000)) {
        if (word === '__proto__' || word === 'constructor' || word === 'prototype') continue;
        if (typeof said === 'string' && word.length <= 100 && said.length <= 300) clean[word] = said;
      }
      out[key] = clean;
    }
  }
  return out as Partial<Settings>;
}
