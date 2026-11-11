import { useRef, useState } from 'preact/hooks';
import {
  installStarter,
  openVocab,
  panel,
  refreshVocabList,
  toast,
  vocab,
  vocabList,
} from '../state';
import {
  deleteVocab,
  getAssetsForVocab,
  loadVocab,
  putAssets,
  saveVocab,
} from '../store/db';
import { forgetAssetsWithPrefix } from '../store/assets';
import { createBlankVocabulary } from '../data/starter';
import { importAnyFile } from '../io/detect';
import { exportBridge } from '../io/bridge';
import { exportObz } from '../io/obf';
import { exportCe } from '../io/ce';
import { SUPPORTED_LANGUAGES, type LangCode } from '../i18n';
import type { ImportResult } from '../model';

function downloadBytes(filename: string, bytes: Uint8Array, mime = 'application/octet-stream') {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function VocabModal() {
  const list = vocabList.value;
  const active = vocab.value;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [importing, setImporting] = useState(false);
  const [progressFrac, setProgressFrac] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newVocabName, setNewVocabName] = useState('');
  const [newRows, setNewRows] = useState(6);
  const [newCols, setNewCols] = useState(8);
  const [newLocale, setNewLocale] = useState<LangCode>('en');
  const [starterLocale, setStarterLocale] = useState<LangCode>('en');
  const [dragOver, setDragOver] = useState(false);

  function close() {
    panel.value = null;
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setErrorMsg(null);
    setLastImport(null);
    setImporting(true);
    setProgressFrac(0.02);
    setProgressMsg(`Reading ${file.name}...`);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const res = await importAnyFile(
        { name: file.name, bytes },
        {
          filename: file.name,
          onProgress: (frac, msg) => {
            setProgressFrac(frac);
            setProgressMsg(msg);
          },
        },
      );
      setProgressMsg('Saving vocabulary...');
      await putAssets(res.assets);
      await saveVocab(res.vocab);
      await refreshVocabList();
      await openVocab(res.vocab.id);
      setLastImport(res);
      toast(`Imported "${res.vocab.name}" (${res.stats.pages} pages)`, 'success');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  }

  async function handleExport(id: string, format: 'ce' | 'obz' | 'bridge') {
    const v = id === active?.id ? active : await loadVocab(id);
    if (!v) return;
    const assets = await getAssetsForVocab(v.id);
    const safeName = (v.name || 'vocabulary').replace(/[^a-zA-Z0-9_-]+/g, '_');

    if (format === 'bridge') {
      const bytes = exportBridge(v, assets);
      downloadBytes(`${safeName}.bridge`, bytes, 'application/zip');
      toast(`Exported ${safeName}.bridge`, 'success');
    } else if (format === 'obz') {
      const map = new Map(assets.map((a) => [a.id, a]));
      const bytes = exportObz(v, map);
      downloadBytes(`${safeName}.obz`, bytes, 'application/zip');
      toast(`Exported ${safeName}.obz`, 'success');
    } else if (format === 'ce') {
      const map = new Map(assets.map((a) => [a.id, a]));
      const bytes = await exportCe(v, map);
      downloadBytes(`${safeName}.ce`, bytes, 'application/zip');
      toast(`Exported ${safeName}.ce`, 'success');
    }
  }

  async function handleCreateBlank(e: Event) {
    e.preventDefault();
    const blank = createBlankVocabulary(
      newVocabName.trim() || 'My Vocabulary',
      newRows,
      newCols,
      newLocale,
    );
    await saveVocab(blank);
    await refreshVocabList();
    await openVocab(blank.id);
    setNewVocabName('');
    toast(`Created "${blank.name}"`, 'success');
    close();
  }

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Vocabularies"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2>Vocabularies & File Formats</h2>
          <button type="button" class="icon-close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>

        <div class="modal-body">
          <div
            class={`import-dropzone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer?.files?.[0];
              if (f) void handleFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".ce,.wf,.c4v,.obz,.obf,.bridge,.zip"
              style={{ display: 'none' }}
              onChange={(e) => void handleFile((e.target as HTMLInputElement).files?.[0])}
            />
            <div class="drop-title">
              <strong>Import compatible archive (.ce, .wf, .c4v)</strong>, Open Board (.obf, .obz), or
              BridgeAAC (.bridge)
            </div>
            <div class="drop-sub">
              Click to select a file or drag and drop it here. Files stay on your device.
            </div>
          </div>

          {importing && (
            <div class="progress-card" role="status">
              <div class="progress-bar-track">
                <div
                  class="progress-bar-fill"
                  style={{ width: `${Math.round(progressFrac * 100)}%` }}
                />
              </div>
              <div class="progress-text">
                {Math.round(progressFrac * 100)}% - {progressMsg}
              </div>
            </div>
          )}

          {errorMsg && (
            <div class="alert-box error" role="alert">
              <strong>Import Error:</strong> {errorMsg}
            </div>
          )}

          {lastImport && (
            <div class="alert-box success" role="status">
              <div>
                <strong>Loaded "{lastImport.vocab.name}"</strong> ({lastImport.stats.pages.toLocaleString()}{' '}
                pages, {lastImport.stats.buttons.toLocaleString()} buttons,{' '}
                {lastImport.stats.images.toLocaleString()} embedded images,{' '}
                {lastImport.stats.sounds.toLocaleString()} sounds)
              </div>
              {lastImport.warnings.map((w, i) => (
                <div key={i} class="import-warning">
                  Note: {w}
                </div>
              ))}
              <div style={{ marginTop: '8px' }}>
                <button type="button" class="btn primary" onClick={close}>
                  Open Board
                </button>
              </div>
            </div>
          )}

          <div class="section-box">
            <div class="section-head" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <strong>Installed Vocabularies ({list.length})</strong>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  aria-label="Starter board language"
                  value={starterLocale}
                  onChange={(e) =>
                    setStarterLocale((e.target as HTMLSelectElement).value as LangCode)
                  }
                  style={{ padding: '5px 8px', borderRadius: '6px', fontSize: '0.84rem' }}
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} ({l.englishName})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  class="sm-btn"
                  onClick={async () => {
                    const id = await installStarter(starterLocale);
                    await openVocab(id);
                    const info = SUPPORTED_LANGUAGES.find((l) => l.code === starterLocale);
                    toast(`Added ${info?.nativeName ?? 'Starter'} Vocabulary`, 'success');
                  }}
                >
                  + Add Starter Board
                </button>
              </div>
            </div>

            <div class="vocab-list">
              {list.map((item) => {
                const isCurrent = item.id === active?.id;
                return (
                  <div key={item.id} class={`vocab-row ${isCurrent ? 'current' : ''}`}>
                    <div class="vocab-info">
                      <div class="vocab-title">
                        <strong>{item.name}</strong>
                        <span class={`source-tag tag-${item.kind}`}>{item.kind}</span>
                        {isCurrent && <span class="active-pill">Active</span>}
                      </div>
                      <div class="vocab-meta">
                        {item.pages.toLocaleString()} pages, {item.buttons.toLocaleString()} buttons
                        {item.filename ? ` (${item.filename})` : ''}
                      </div>
                    </div>

                    <div class="vocab-actions">
                      {!isCurrent && (
                        <button
                          type="button"
                          class="btn primary sm"
                          onClick={async () => {
                            await openVocab(item.id);
                            toast(`Switched to "${item.name}"`, 'info');
                            close();
                          }}
                        >
                          Open
                        </button>
                      )}
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => void handleExport(item.id, 'ce')}
                        title="Export as compatible .ce file"
                      >
                        Export .ce
                      </button>
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => void handleExport(item.id, 'obz')}
                        title="Export as Open Board .obz file"
                      >
                        Export .obz
                      </button>
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => void handleExport(item.id, 'bridge')}
                        title="Export as BridgeAAC .bridge backup"
                      >
                        Export .bridge
                      </button>
                      {list.length > 1 && (
                        <button
                          type="button"
                          class="sm-btn danger-text"
                          onClick={async () => {
                            await deleteVocab(item.id);
                            forgetAssetsWithPrefix(`${item.id}:`);
                            await refreshVocabList();
                            if (isCurrent && vocabList.value[0]) {
                              await openVocab(vocabList.value[0].id);
                            }
                            toast(`Deleted "${item.name}"`, 'info');
                          }}
                          title="Delete vocabulary"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form class="section-box" onSubmit={(e) => void handleCreateBlank(e)}>
            <strong>New Blank Vocabulary</strong>
            <div class="inline-row" style={{ marginTop: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Vocabulary name"
                value={newVocabName}
                onInput={(e) => setNewVocabName((e.target as HTMLInputElement).value)}
              />
              <select
                aria-label="Vocabulary language"
                value={newLocale}
                onChange={(e) => setNewLocale((e.target as HTMLSelectElement).value as LangCode)}
                style={{ padding: '6px 8px', borderRadius: '6px' }}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
              <label class="inline-num">
                Cols:
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newCols}
                  onInput={(e) => setNewCols(Number((e.target as HTMLInputElement).value) || 8)}
                />
              </label>
              <label class="inline-num">
                Rows:
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newRows}
                  onInput={(e) => setNewRows(Number((e.target as HTMLInputElement).value) || 6)}
                />
              </label>
              <button type="submit" class="btn secondary">
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
