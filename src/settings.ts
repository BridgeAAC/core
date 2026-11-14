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
  /** Salted PBKDF2 hash of the settings PIN (never plaintext). Empty = no PIN. */
  pin: string;
  /**
   * Opt-in: allow the "Online Natural" voices, which send the text being spoken to the
   * bridgeaac.org /api/tts proxy and on to Google's text-to-speech service. Off by default.
   */
  onlineSpeech: boolean;
  /**
   * Opt-in: allow ARASAAC symbol search and Auto-Enrich, which send search words / button
   * labels to api.arasaac.org. Off by default.
   */
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

// Migrate any plaintext PIN (older versions, or a restored settings backup) to a salted hash.
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

/** Set (or clear, with an empty string) the settings PIN. Stores only a salted hash. */
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
