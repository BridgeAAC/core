import { signal, effect } from '@preact/signals';

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
  buttonRadius: 10,
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

export function updateSettings(patch: Partial<Settings>): void {
  settings.value = { ...settings.value, ...patch };
}

export function resetSettings(): void {
  settings.value = { ...DEFAULT_SETTINGS, onboarded: true };
}
