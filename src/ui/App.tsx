import { useEffect, useState } from 'preact/hooks';
import {
  boot,
  booted,
  editTarget,
  fatalError,
  keyboardOpen,
  mode,
  openVocab,
  panel,
  pinRequest,
  redo,
  refreshVocabList,
  requireUnlock,
  toast,
  toasts,
  undo,
  vocab,
} from '../state';
import { settings } from '../settings';
import { verifySecret } from '../store/secure';
import { getLanguageInfo, resolveActiveLang } from '../i18n';
import { importAnyFile } from '../io/detect';
import { putAssets, saveVocab } from '../store/db';
import { TopBar } from './TopBar';
import { Board } from './Board';
import { ButtonEditorModal } from './ButtonEditorModal';
import { VocabModal } from './VocabModal';
import { PagesModal, PageSettingsModal } from './PagesModal';
import { SettingsModal } from './SettingsModal';
import { MessagesModal } from './MessagesModal';
import { KeyboardModal } from './KeyboardModal';
import { InstallModal } from './InstallModal';
import { ToolsModal } from './ToolsModal';
import { PageSetModal } from './PageSetModal';

function PinModal() {
  const req = pinRequest.value;
  const [entered, setEntered] = useState('');
  const [err, setErr] = useState(false);
  const [checking, setChecking] = useState(false);
  if (!req) return null;

  async function submit(e: Event) {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    const ok = await verifySecret(entered.trim(), settings.value.pin);
    setChecking(false);
    if (ok) {
      pinRequest.value = null;
      setEntered('');
      setErr(false);
      req!.run();
    } else {
      setErr(true);
    }
  }

  return (
    <div class="modal-backdrop" onClick={() => (pinRequest.value = null)}>
      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Enter PIN"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2>Enter PIN</h2>
          <button
            type="button"
            class="icon-close"
            onClick={() => (pinRequest.value = null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form class="modal-body" onSubmit={(e) => void submit(e)}>
          <label class="field">
            <span>Enter your PIN to unlock:</span>
            <input
              type="password"
              value={entered}
              onInput={(e) => {
                setEntered((e.target as HTMLInputElement).value);
                setErr(false);
              }}
              autoFocus
            />
          </label>
          {err && <p class="alert-box error">Incorrect PIN. Try again.</p>}
          <div class="modal-footer" style={{ marginTop: '12px' }}>
            <button type="button" class="btn secondary" onClick={() => (pinRequest.value = null)}>
              Cancel
            </button>
            <button type="submit" class="btn primary" disabled={checking}>
              {checking ? 'Checking…' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FONT_STACKS: Record<string, string> = {
  system:
    "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, sans-serif, 'Apple Color Emoji', 'Noto Color Emoji'",
  rounded:
    "ui-rounded, 'SF Pro Rounded', 'Nunito', 'Quicksand', 'Varela Round', system-ui, sans-serif, 'Apple Color Emoji'",
  dyslexic:
    "'OpenDyslexic', 'Atkinson Hyperlegible', 'Comic Sans MS', 'Trebuchet MS', Verdana, sans-serif, 'Apple Color Emoji'",
  serif: "Georgia, 'Iowan Old Style', 'Palatino Linotype', Cambria, serif, 'Apple Color Emoji'",
  mono: "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Menlo, Consolas, monospace, 'Apple Color Emoji'",
};

export function App() {
  const s = settings.value;
  const theme = s.theme;
  const lang = resolveActiveLang(vocab.value?.locale);
  const dir = getLanguageInfo(lang).dir;

  useEffect(() => {
    void boot();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-color-coding', s.colorCoding || 'default');
    root.setAttribute('data-reduced-motion', s.reducedMotion ? 'true' : 'false');
    root.setAttribute('data-high-focus', s.highContrastFocus ? 'true' : 'false');
    root.setAttribute('data-font', s.fontFamily || 'system');
    root.style.setProperty('--app-font', FONT_STACKS[s.fontFamily] || FONT_STACKS.system);
    if (s.accentColor && theme !== 'contrast') {
      root.style.setProperty('--accent', s.accentColor);
    } else {
      root.style.removeProperty('--accent');
    }
    if (s.scanColor && theme !== 'contrast') {
      root.style.setProperty('--scan-outline', s.scanColor);
    } else {
      root.style.removeProperty('--scan-outline');
    }
    root.style.setProperty('--btn-radius', `${s.buttonRadius ?? 10}px`);
    root.style.setProperty('--icon-scale', String(s.iconScale ?? 1));
  }, [
    theme,
    s.colorCoding,
    s.reducedMotion,
    s.highContrastFocus,
    s.fontFamily,
    s.accentColor,
    s.scanColor,
    s.buttonRadius,
    s.iconScale,
  ]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }, [lang, dir]);

  useEffect(() => {
    function onDragOver(e: DragEvent) {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
    }
    async function onDrop(e: DragEvent) {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (panel.value === 'vocabs') return;
      e.preventDefault();
      try {
        toast(`Importing ${file.name}...`, 'info');
        const bytes = new Uint8Array(await file.arrayBuffer());
        const res = await importAnyFile({ name: file.name, bytes }, { filename: file.name });
        await putAssets(res.assets);
        await saveVocab(res.vocab);
        await refreshVocabList();
        await openVocab(res.vocab.id);
        toast(
          `Loaded "${res.vocab.name}" (${res.stats.pages} pages, ${res.stats.buttons} buttons)`,
          'success',
        );
      } catch (err) {
        toast(err instanceof Error ? err.message : String(err), 'error');
      }
    }
    const anyWin = window as any;
    if (anyWin.launchQueue?.setConsumer) {
      anyWin.launchQueue.setConsumer(async (launchParams: any) => {
        const handle = launchParams?.files?.[0];
        if (!handle?.getFile) return;
        const file: File = await handle.getFile();
        const bytes = new Uint8Array(await file.arrayBuffer());
        const res = await importAnyFile({ name: file.name, bytes }, { filename: file.name });
        await putAssets(res.assets);
        await saveVocab(res.vocab);
        await refreshVocabList();
        await openVocab(res.vocab.id);
        toast(`Opened "${res.vocab.name}"`, 'success');
      });
    }
    if (anyWin.bridgeDesktop?.onOpenFile) {
      anyWin.bridgeDesktop.onOpenFile(async (payload: { name: string; bytes: Uint8Array }) => {
        try {
          const res = await importAnyFile(payload, { filename: payload.name });
          await putAssets(res.assets);
          await saveVocab(res.vocab);
          await refreshVocabList();
          await openVocab(res.vocab.id);
          toast(`Opened "${res.vocab.name}"`, 'success');
        } catch (err) {
          toast(err instanceof Error ? err.message : String(err), 'error');
        }
      });
    }
    anyWin.__bridgeOpenFileFromNative = async (name: string, base64: string) => {
      try {
        toast(`Importing ${name}...`, 'info');
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const res = await importAnyFile({ name, bytes }, { filename: name });
        await putAssets(res.assets);
        await saveVocab(res.vocab);
        await refreshVocabList();
        await openVocab(res.vocab.id);
        toast(
          `Loaded "${res.vocab.name}" (${res.stats.pages} pages, ${res.stats.buttons} buttons)`,
          'success',
        );
      } catch (err) {
        toast(err instanceof Error ? err.message : String(err), 'error');
      }
    };
    try {
      anyWin.webkit?.messageHandlers?.bridgeSwift?.postMessage?.({ action: 'ready' });
    } catch {}

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (pinRequest.value) {
          pinRequest.value = null;
          e.preventDefault();
        } else if (editTarget.value) {
          editTarget.value = null;
          e.preventDefault();
        } else if (keyboardOpen.value) {
          keyboardOpen.value = false;
          e.preventDefault();
        } else if (panel.value) {
          panel.value = null;
          e.preventDefault();
        }
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (mode.value === 'edit' && (e.ctrlKey || e.metaKey) && !panel.value && !editTarget.value) {
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    }

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (fatalError.value) {
    return (
      <div class="boot-screen error">
        <h1>BridgeAAC Error</h1>
        <p>{fatalError.value}</p>
      </div>
    );
  }

  if (!booted.value) {
    return (
      <div class="boot-screen">
        <div class="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div class="app-shell">
      <TopBar onQuickImport={() => requireUnlock(() => (panel.value = 'vocabs'))} />
      <Board />

      {panel.value === 'vocabs' && <VocabModal />}
      {panel.value === 'pages' && <PagesModal />}
      {panel.value === 'pageSettings' && <PageSettingsModal />}
      {panel.value === 'settings' && <SettingsModal />}
      {panel.value === 'messages' && <MessagesModal />}
      {panel.value === 'tools' && <ToolsModal />}
      {panel.value === 'help' && <InstallModal />}
      {(!s.onboarded || panel.value === 'pageset') && (
        <PageSetModal isOnboarding={!s.onboarded} />
      )}
      <KeyboardModal />
      {editTarget.value && <ButtonEditorModal />}
      <PinModal />

      <div class="toast-stack" aria-live="polite">
        {toasts.value.map((t) => (
          <div key={t.id} class={`toast toast-${t.kind}`}>
            <span>{t.text}</span>
            {t.action && (
              <button type="button" class="toast-action" onClick={t.action.run}>
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
