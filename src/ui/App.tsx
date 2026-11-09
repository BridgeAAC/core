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

function PinModal() {
  const req = pinRequest.value;
  const [entered, setEntered] = useState('');
  const [err, setErr] = useState(false);
  if (!req) return null;

  function submit(e: Event) {
    e.preventDefault();
    if (entered.trim() === settings.value.pin) {
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
        <form class="modal-body" onSubmit={submit}>
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
            <button type="submit" class="btn primary">
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function App() {
  const theme = settings.value.theme;
  const lang = resolveActiveLang(vocab.value?.locale);
  const dir = getLanguageInfo(lang).dir;

  useEffect(() => {
    void boot();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      {panel.value === 'help' && <InstallModal />}
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
