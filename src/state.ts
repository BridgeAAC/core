import { signal, computed, batch } from '@preact/signals';
import {
  type Action,
  type Button,
  type ButtonVariant,
  type ID,
  type Page,
  type Vocabulary,
  FORM_DEFAULT,
} from './model';
import { settings } from './settings';
import {
  kvGet,
  kvSet,
  listVocabs,
  loadVocab,
  requestPersistentStorage,
  saveVocab,
  summarize,
  type VocabSummary,
} from './store/db';
import { playAsset, preloadArasaacForVocabulary, stopAudio } from './store/assets';
import { backspace, deleteWord, insertText } from './engine/message';
import {
  isSpeaking,
  speak as ttsSpeak,
  stopSpeaking,
  unlockAudio,
  warmupOfflineVoice,
} from './engine/speech';
import { Predictor, type PredictorData } from './engine/predict';
import { createStarterVocabulary, type PageSetSize } from './data/starter';
import { ensureButtonImage } from './data/icons';
import { putAssets } from './store/db';

export type Panel =
  | null
  | 'menu'
  | 'vocabs'
  | 'settings'
  | 'pages'
  | 'messages'
  | 'tools'
  | 'help'
  | 'pageSettings'
  | 'pageset';

export const vocabList = signal<VocabSummary[]>([]);
export const vocab = signal<Vocabulary | null>(null);
export const pageId = signal<ID>('');
export const backStack = signal<ID[]>([]);
export const form = signal<number>(FORM_DEFAULT);
export const message = signal('');
export const speaking = signal(false);
export const spokenRange = signal<{ start: number; end: number } | null>(null);
export const mode = signal<'use' | 'edit'>('use');
export const panel = signal<Panel>(null);
export const keyboardOpen = signal(false);
export const booted = signal(false);
export const fatalError = signal<string | null>(null);

export interface EditTarget {
  pageId: ID;
  buttonId?: ID;
  row?: number;
  col?: number;
}
export const editTarget = signal<EditTarget | null>(null);
export const clipboardButton = signal<Button | null>(null);

export const savedMessages = signal<string[]>([]);
export const spokenHistory = signal<string[]>([]);

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'error' | 'success';
  action?: { label: string; run: () => void };
}
export const toasts = signal<Toast[]>([]);
let toastId = 1;
export function toast(
  text: string,
  kind: Toast['kind'] = 'info',
  action?: Toast['action'],
  ms = 4000,
): void {
  const id = toastId++;
  toasts.value = [...toasts.value, { id, text, kind, action }];
  setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), ms);
}

export const pinRequest = signal<{ run: () => void } | null>(null);
export function requireUnlock(run: () => void): void {
  if (!settings.value.pin) run();
  else pinRequest.value = { run };
}

export const currentPage = computed<Page | null>(() => {
  const v = vocab.value;
  if (!v) return null;
  return (
    v.pages.find((p) => p.id === pageId.value) ??
    v.pages.find((p) => p.id === v.homePageId) ??
    v.pages[0] ??
    null
  );
});

export const homePage = computed<Page | null>(() => {
  const v = vocab.value;
  return v ? (v.pages.find((p) => p.id === v.homePageId) ?? v.pages[0] ?? null) : null;
});

export const canGoBack = computed(
  () => backStack.value.length > 0 || currentPage.value?.id !== homePage.value?.id,
);

export let predictor = new Predictor();
let predictorSaveTimer: ReturnType<typeof setTimeout> | undefined;
function schedulePredictorSave(): void {
  clearTimeout(predictorSaveTimer);
  predictorSaveTimer = setTimeout(() => void kvSet('predictor', predictor.toJSON()), 1500);
}

export async function boot(): Promise<void> {
  try {
    void requestPersistentStorage();
    const [pd, saved, hist] = await Promise.all([
      kvGet<PredictorData>('predictor'),
      kvGet<string[]>('savedMessages'),
      kvGet<string[]>('history'),
    ]);
    if (pd) {
      try {
        predictor = Predictor.fromJSON(pd);
      } catch {}
    }
    savedMessages.value = saved ?? [];
    spokenHistory.value = hist ?? [];

    let list = await listVocabs();
    if (list.length === 0) {
      const { vocab: starter } = createStarterVocabulary();
      await saveVocab(starter);
      list = await listVocabs();
    }
    vocabList.value = list;
    const last = (await kvGet<string>('lastVocab')) ?? '';
    const pick = list.find((l) => l.id === last) ?? list[0];
    await openVocab(pick.id);
    warmupOfflineVoice(vocab.value?.locale ?? 'en');
  } catch (e) {
    fatalError.value = e instanceof Error ? e.message : String(e);
  } finally {
    booted.value = true;
  }
}

export async function refreshVocabList(): Promise<void> {
  vocabList.value = await listVocabs();
}

export async function openVocab(id: ID): Promise<void> {
  const v = await loadVocab(id);
  if (!v) throw new Error('That vocabulary could not be found.');
  batch(() => {
    vocab.value = v;
    pageId.value = v.homePageId;
    backStack.value = [];
    form.value = FORM_DEFAULT;
    undoStack = [];
    redoStack = [];
    mode.value = 'use';
    editTarget.value = null;
  });
  void kvSet('lastVocab', id);
  const labels: string[] = [];
  for (const p of v.pages) {
    for (const b of p.buttons) {
      if (b.label && b.label.length < 24) labels.push(b.label);
    }
  }
  predictor.observeVocabulary(labels);
  void preloadArasaacForVocabulary(v);
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let undoStack: Vocabulary[] = [];
let redoStack: Vocabulary[] = [];
export const undoDepth = signal(0);
export const redoDepth = signal(0);

function scheduleSave(): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flushSave(), 350);
}

export async function flushSave(): Promise<void> {
  clearTimeout(saveTimer);
  const v = vocab.value;
  if (!v) return;
  try {
    await saveVocab(v);
    const idx = vocabList.value.findIndex((s) => s.id === v.id);
    const next = [...vocabList.value];
    if (idx >= 0) next[idx] = summarize(v);
    else next.unshift(summarize(v));
    vocabList.value = next;
  } catch (e) {
    toast('Could not save changes: ' + (e instanceof Error ? e.message : String(e)), 'error');
  }
}

export function commit(fn: (v: Vocabulary) => Vocabulary): void {
  const v = vocab.value;
  if (!v) return;
  const next = fn(v);
  if (next === v) return;
  undoStack.push(v);
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  vocab.value = { ...next, updatedAt: Date.now() };
  undoDepth.value = undoStack.length;
  redoDepth.value = 0;
  scheduleSave();
}

export function undo(): void {
  const prev = undoStack.pop();
  const cur = vocab.value;
  if (!prev || !cur) return;
  redoStack.push(cur);
  vocab.value = { ...prev, updatedAt: Date.now() };
  undoDepth.value = undoStack.length;
  redoDepth.value = redoStack.length;
  ensurePageExists();
  scheduleSave();
}

export function redo(): void {
  const nxt = redoStack.pop();
  const cur = vocab.value;
  if (!nxt || !cur) return;
  undoStack.push(cur);
  vocab.value = { ...nxt, updatedAt: Date.now() };
  undoDepth.value = undoStack.length;
  redoDepth.value = redoStack.length;
  ensurePageExists();
  scheduleSave();
}

function ensurePageExists(): void {
  const v = vocab.value;
  if (!v) return;
  if (!v.pages.some((p) => p.id === pageId.value)) pageId.value = v.homePageId;
  backStack.value = backStack.value.filter((id) => v.pages.some((p) => p.id === id));
}

export function replaceVocabInPlace(v: Vocabulary): void {
  vocab.value = v;
  scheduleSave();
}

export function gotoPage(id: ID, opts: { push?: boolean } = {}): void {
  const v = vocab.value;
  if (!v || !v.pages.some((p) => p.id === id)) return;
  const cur = pageId.value;
  if (id === cur) return;
  batch(() => {
    if (id === v.homePageId) {
      backStack.value = [];
    } else if (opts.push !== false && cur) {
      const next = [...backStack.value, cur];
      backStack.value = next.length > 60 ? next.slice(-60) : next;
    }
    pageId.value = id;
  });
}

export function goHome(): void {
  const v = vocab.value;
  if (!v) return;
  batch(() => {
    backStack.value = [];
    pageId.value = v.homePageId;
  });
}

export function goBack(): void {
  const stack = backStack.value;
  if (stack.length) {
    const prev = stack[stack.length - 1];
    batch(() => {
      backStack.value = stack.slice(0, -1);
      pageId.value = prev;
    });
  } else {
    goHome();
  }
}

export interface ResolvedButton {
  label: string;
  message?: string;
  image?: string;
  actions: Action[];
  hidden: boolean;
  pronunciation?: string;
}

export function resolveButton(b: Button, f: number = form.value): ResolvedButton {
  let v: ButtonVariant | undefined;
  if (b.variants) v = b.variants[f] ?? b.variants[FORM_DEFAULT];
  if (v) {
    const actions = v.actions && v.actions.length ? v.actions : b.actions;
    const rawImg = v.image ?? b.image;
    return {
      label: v.label,
      message: v.message,
      image: ensureButtonImage({ label: v.label, message: v.message, actions, image: rawImg }),
      actions,
      hidden: !!(v.hidden ?? b.hidden),
      pronunciation: b.pronunciation,
    };
  }
  return {
    label: b.label,
    message: b.message,
    image: ensureButtonImage(b),
    actions: b.actions,
    hidden: !!b.hidden,
    pronunciation: b.pronunciation,
  };
}

function speechSettings() {
  const s = settings.value;
  return {
    voiceURI: s.voiceURI || undefined,
    rate: s.rate,
    pitch: s.pitch,
    volume: s.volume,
    muted: s.muted,
  };
}

export function speakText(
  text: string,
  opts: { highlight?: boolean; onDone?: () => void } = {},
): void {
  const clean = text.trim();
  if (!clean) {
    opts.onDone?.();
    return;
  }
  unlockAudio();
  ttsSpeak(clean, {
    settings: speechSettings(),
    lang: vocab.value?.locale,
    replacements: settings.value.pronunciations,
    onStart: () => {
      speaking.value = true;
    },
    onBoundary: (charIndex, len) => {
      if (opts.highlight && settings.value.highlightSpoken) {
        spokenRange.value = { start: charIndex, end: charIndex + len };
      }
    },
    onEnd: (completed) => {
      speaking.value = isSpeaking();
      spokenRange.value = null;
      if (!completed) isMessageSpeaking = false;
      if (completed) opts.onDone?.();
    },
  });
}

let isMessageSpeaking = false;

export function stopAllSpeech(): void {
  isMessageSpeaking = false;
  stopSpeaking();
  stopAudio();
  speaking.value = false;
  spokenRange.value = null;
}

function pushHistory(text: string): void {
  const t = text.trim();
  if (!t) return;
  const next = [t, ...spokenHistory.value.filter((m) => m !== t)].slice(0, 60);
  spokenHistory.value = next;
  void kvSet('history', next);
  predictor.learn(t);
  schedulePredictorSave();
}

export function speakMessage(): void {
  const text = message.value;
  if (!text.trim()) return;
  if (speaking.value && isMessageSpeaking) {
    stopAllSpeech();
    return;
  }
  stopAllSpeech();
  isMessageSpeaking = true;
  pushHistory(text);
  speakText(text, {
    highlight: true,
    onDone: () => {
      isMessageSpeaking = false;
      if (settings.value.clearAfterSpeak) clearMessage();
    },
  });
}

export function clearMessage(): void {
  batch(() => {
    message.value = '';
    form.value = FORM_DEFAULT;
  });
}

export function setMessage(text: string): void {
  message.value = text;
}

export function insertIntoMessage(
  text: string,
  opts: { attach?: boolean; noSpace?: boolean } = {},
): void {
  message.value = insertText(message.value, text, {
    ...opts,
    autoCapitalize: settings.value.autoCapitalize,
  });
}

export function backspaceMessage(): void {
  message.value = backspace(message.value);
}

export function deleteWordFromMessage(): void {
  message.value = deleteWord(message.value);
}

export function saveCurrentMessage(): void {
  const t = message.value.trim();
  if (!t) {
    toast('Nothing to save yet', 'info');
    return;
  }
  const next = [t, ...savedMessages.value.filter((m) => m !== t)];
  savedMessages.value = next;
  void kvSet('savedMessages', next);
  toast('Saved to Phrases', 'success');
}

export function removeSavedMessage(text: string): void {
  const next = savedMessages.value.filter((m) => m !== text);
  savedMessages.value = next;
  void kvSet('savedMessages', next);
}

export function clearHistory(): void {
  spokenHistory.value = [];
  void kvSet('history', []);
}

export function activateButton(b: Button): void {
  const r = resolveButton(b);
  if (r.hidden) return;
  runActions(r, b);
}

export function runActions(r: ResolvedButton, _source?: Button): void {
  const s = settings.value;
  let actions = r.actions.filter((a) => a.type !== 'unsupported');
  const defaultText = (r.message ?? r.label) || '';
  if (actions.length === 0) {
    actions = [{ type: 'insert' }];
  }
  let inserted = '';
  let spokeWindow = false;
  let navigated = false;

  for (const a of actions) {
    switch (a.type) {
      case 'insert': {
        const text = a.text ?? defaultText;
        if (text) {
          insertIntoMessage(text, { attach: a.attach, noSpace: a.noSpace });
          inserted += text;
        }
        break;
      }
      case 'speak': {
        const text = a.text ?? r.pronunciation ?? defaultText;
        speakText(text);
        break;
      }
      case 'speakWindow':
        spokeWindow = true;
        break;
      case 'navigate':
        gotoPage(a.pageId);
        navigated = true;
        break;
      case 'back':
        goBack();
        navigated = true;
        break;
      case 'home':
        goHome();
        navigated = true;
        break;
      case 'clear':
        stopAllSpeech();
        clearMessage();
        break;
      case 'backspace':
        backspaceMessage();
        break;
      case 'deleteWord':
        deleteWordFromMessage();
        break;
      case 'setForm':
        form.value = a.form;
        break;
      case 'playSound':
        void playAsset(a.assetId, s.volume);
        break;
      case 'volumeUp':
        settingsPatchVolume(0.1);
        break;
      case 'volumeDown':
        settingsPatchVolume(-0.1);
        break;
      case 'toggleMute':
        settings.value = { ...settings.value, muted: !settings.value.muted };
        toast(settings.value.muted ? 'Voice muted' : 'Voice on', 'info');
        break;
      case 'speakTime':
        speakText(
          new Date().toLocaleTimeString(vocab.value?.locale || [], {
            hour: 'numeric',
            minute: '2-digit',
          }),
        );
        break;
      case 'speakDate':
        speakText(
          new Date().toLocaleDateString(vocab.value?.locale || [], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }),
        );
        break;
      case 'copy':
        void navigator.clipboard?.writeText(message.value).then(() => toast('Copied', 'success'));
        break;
      case 'share':
        if (navigator.share) void navigator.share({ text: message.value }).catch(() => undefined);
        else {
          void navigator.clipboard
            ?.writeText(message.value)
            .then(() => toast('Copied (sharing not available)', 'info'));
        }
        break;
      case 'saveMessage':
        saveCurrentMessage();
        break;
      case 'openUrl':
        if (/^https?:\/\//i.test(a.url)) window.open(a.url, '_blank', 'noopener');
        break;
      case 'keyboard':
        keyboardOpen.value = true;
        break;
      default:
        break;
    }
  }

  if (spokeWindow) {
    speakMessage();
  } else if (s.speakButtons && inserted.trim()) {
    speakText(r.pronunciation ?? inserted);
  }

  if (!navigated && inserted.trim() && s.returnHomeAfterWord) {
    goHome();
  }
}

function settingsPatchVolume(delta: number): void {
  const s = settings.value;
  const v = Math.max(0, Math.min(1, Math.round((s.volume + delta) * 20) / 20));
  settings.value = { ...s, volume: v, muted: v === 0 };
}

export function enterEditMode(): void {
  requireUnlock(() => {
    mode.value = 'edit';
  });
}

export function exitEditMode(): void {
  mode.value = 'use';
  editTarget.value = null;
  void flushSave();
}

export async function installStarter(locale = 'en', size: PageSetSize = 60): Promise<ID> {
  const { vocab: starter, assets } = createStarterVocabulary(locale, size);
  starter.id = `starter-${size}-${locale}-${Math.random().toString(36).slice(2, 9)}`;
  await putAssets(assets.map((a) => ({ ...a, vocabId: starter.id })));
  await saveVocab(starter);
  await refreshVocabList();
  void preloadArasaacForVocabulary(starter);
  return starter.id;
}
