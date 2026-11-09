export type ID = string;
export type Color = string;
export type ImageRef = string;

export interface ButtonStyle {
  bg?: Color;
  fg?: Color;
  border?: Color;
  borderWidth?: number;
  fontScale?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontFamily?: string;
  labelOnTop?: boolean;
  transparent?: boolean;
}

export type Action =
  | { type: 'insert'; text?: string; attach?: boolean; noSpace?: boolean }
  | { type: 'speak'; text?: string }
  | { type: 'speakWindow' }
  | { type: 'navigate'; pageId: ID }
  | { type: 'back' }
  | { type: 'home' }
  | { type: 'clear' }
  | { type: 'backspace' }
  | { type: 'deleteWord' }
  | { type: 'setForm'; form: number }
  | { type: 'playSound'; assetId: ID }
  | { type: 'volumeUp' }
  | { type: 'volumeDown' }
  | { type: 'toggleMute' }
  | { type: 'speakTime' }
  | { type: 'speakDate' }
  | { type: 'copy' }
  | { type: 'share' }
  | { type: 'saveMessage' }
  | { type: 'openUrl'; url: string }
  | { type: 'keyboard' }
  | { type: 'unsupported'; source: string; code?: number };

export interface ButtonVariant {
  label: string;
  message?: string;
  image?: ImageRef;
  actions?: Action[];
  hidden?: boolean;
}

export interface Button {
  id: ID;
  label: string;
  message?: string;
  pronunciation?: string;
  image?: ImageRef;
  style: ButtonStyle;
  actions: Action[];
  variants?: Record<number, ButtonVariant>;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  hidden?: boolean;
}

export interface Page {
  id: ID;
  name: string;
  rows: number;
  cols: number;
  bg?: Color;
  buttons: Button[];
  hidden?: boolean;
}

export type VocabSourceKind = 'builtin' | 'user' | 'touchchat' | 'obf' | 'bridge';

export interface Vocabulary {
  id: ID;
  name: string;
  description?: string;
  locale?: string;
  source: { kind: VocabSourceKind; filename?: string; importedAt?: number };
  homePageId: ID;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
  schema: 1;
}

export interface AssetBlob {
  id: ID;
  vocabId: ID;
  kind: 'image' | 'sound';
  mime: string;
  data: Uint8Array;
}

export interface ImportResult {
  vocab: Vocabulary;
  assets: AssetBlob[];
  warnings: string[];
  stats: { pages: number; buttons: number; images: number; sounds: number };
}

export type ProgressFn = (fraction: number, message: string) => void;

export interface ImportOptions {
  filename?: string;
  onProgress?: ProgressFn;
  vocabId?: ID;
}

export const FORM_DEFAULT = 0;
