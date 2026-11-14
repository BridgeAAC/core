import { useState } from 'preact/hooks';
import type { Action, Button, ImageRef } from '../model';
import { clipboardButton, editTarget, toast, vocab } from '../state';
import { addPage, deleteButton, newButton, saveButton, uid } from '../edit';
import { EMOJI_GROUPS, SWATCHES, WORD_CLASS } from '../data/palette';
import { ensureButtonImage, resolveIconForButton } from '../data/icons';
import { getLanguageInfo } from '../i18n';
import { settings, updateSettings } from '../settings';
import { putAssets } from '../store/db';
import { cacheArasaacPictogram } from '../store/assets';
import { ButtonPicture } from './ButtonPicture';

interface ArasaacHit {
  _id: number;
  keywords?: Array<{ keyword: string }>;
}

export function ButtonEditorModal() {
  const target = editTarget.value;
  const v = vocab.value;
  if (!target || !v) return null;

  const page = v.pages.find((p) => p.id === target.pageId);
  if (!page) return null;

  const existing = target.buttonId
    ? page.buttons.find((b) => b.id === target.buttonId)
    : undefined;

  const initial: Button = existing
    ? structuredClone(existing)
    : newButton(target.row ?? 0, target.col ?? 0, {
        label: '',
        style: { bg: '#ffffff', border: '#9aa6ad', borderWidth: 2, bold: true, labelOnTop: true },
        actions: [{ type: 'insert' }],
      });

  const [draft, setDraft] = useState<Button>(initial);
  const [picTab, setPicTab] = useState<'emoji' | 'arasaac' | 'upload'>('emoji');
  const [arasaacQuery, setArasaacQuery] = useState(initial.label || '');
  const [arasaacResults, setArasaacResults] = useState<ArasaacHit[]>([]);
  const [arasaacBusy, setArasaacBusy] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  function close() {
    editTarget.value = null;
  }

  function handleSave(e: Event) {
    e.preventDefault();
    if (draft.image?.startsWith('arasaac:')) {
      void cacheArasaacPictogram(draft.image.slice(8));
    }
    if (draft.variants) {
      for (const variant of Object.values(draft.variants)) {
        if (variant?.image?.startsWith('arasaac:')) {
          void cacheArasaacPictogram(variant.image.slice(8));
        }
      }
    }
    saveButton(page!.id, draft);
    toast(existing ? 'Button updated' : 'Button added', 'success');
    close();
  }

  function updateStyle(patch: Partial<Button['style']>) {
    setDraft({ ...draft, style: { ...draft.style, ...patch } });
  }

  function setPrimaryActionType(kind: string) {
    switch (kind) {
      case 'insert':
        setDraft({ ...draft, actions: [{ type: 'insert' }] });
        break;
      case 'insert_attach':
        setDraft({ ...draft, actions: [{ type: 'insert', attach: true }] });
        break;
      case 'speak':
        setDraft({ ...draft, actions: [{ type: 'speak' }] });
        break;
      case 'navigate': {
        const firstOther = v!.pages.find((p) => p.id !== page!.id) ?? v!.pages[0];
        setDraft({
          ...draft,
          actions: [{ type: 'navigate', pageId: firstOther.id }],
        });
        break;
      }
      case 'insert_and_navigate': {
        const firstOther = v!.pages.find((p) => p.id !== page!.id) ?? v!.pages[0];
        setDraft({
          ...draft,
          actions: [{ type: 'insert' }, { type: 'navigate', pageId: firstOther.id }],
        });
        break;
      }
      case 'back':
        setDraft({ ...draft, actions: [{ type: 'back' }] });
        break;
      case 'home':
        setDraft({ ...draft, actions: [{ type: 'home' }] });
        break;
      case 'clear':
        setDraft({ ...draft, actions: [{ type: 'clear' }] });
        break;
      case 'deleteWord':
        setDraft({ ...draft, actions: [{ type: 'deleteWord' }] });
        break;
      case 'backspace':
        setDraft({ ...draft, actions: [{ type: 'backspace' }] });
        break;
      case 'speakWindow':
        setDraft({ ...draft, actions: [{ type: 'speakWindow' }] });
        break;
      case 'keyboard':
        setDraft({ ...draft, actions: [{ type: 'keyboard' }] });
        break;
      default:
        break;
    }
  }

  function currentActionKind(acts: Action[]): string {
    const hasIns = acts.some((a) => a.type === 'insert');
    const hasNav = acts.some((a) => a.type === 'navigate');
    if (hasIns && hasNav) return 'insert_and_navigate';
    if (hasNav) return 'navigate';
    const first = acts.find((a) => a.type !== 'unsupported');
    if (!first) return 'insert';
    if (first.type === 'insert') return first.attach ? 'insert_attach' : 'insert';
    return first.type;
  }

  const navAction = draft.actions.find(
    (a): a is Extract<Action, { type: 'navigate' }> => a.type === 'navigate',
  );

  async function searchArasaac() {
    const q = (arasaacQuery || draft.label).trim();
    if (!q) return;
    if (!settings.value.onlineSymbolSearch) return;
    setArasaacBusy(true);
    try {
      const arasaacLang = getLanguageInfo(v?.locale).arasaac;
      const resp = await fetch(
        `https://api.arasaac.org/v1/pictograms/${encodeURIComponent(arasaacLang)}/search/${encodeURIComponent(q)}`,
      );
      if (!resp.ok) throw new Error('No symbols found');
      const data = (await resp.json()) as ArasaacHit[];
      const hits = Array.isArray(data) ? data.slice(0, 24) : [];
      setArasaacResults(hits);
      for (const hit of hits.slice(0, 8)) {
        void cacheArasaacPictogram(hit._id);
      }
    } catch {
      setArasaacResults([]);
    } finally {
      setArasaacBusy(false);
    }
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file || !v) return;
    const buf = new Uint8Array(await file.arrayBuffer());
    const assetId = `${v.id}:img:${uid('u')}`;
    await putAssets([
      {
        id: assetId,
        vocabId: v.id,
        kind: 'image',
        mime: file.type || 'image/png',
        data: buf,
      },
    ]);
    const ref: ImageRef = `img:${assetId}`;
    setDraft({ ...draft, image: ref });
  }

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label={existing ? 'Edit Button' : 'Create Button'}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2>{existing ? `Edit Button (${draft.label || 'Untitled'})` : 'Add Button'}</h2>
          <button type="button" class="icon-close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>

        <form class="modal-body editor-form" onSubmit={handleSave}>
          <div class="editor-grid">
            <div class="editor-col">
              <div class="preview-box">
                <div
                  class={`aac-btn preview-aac-btn ${
                    draft.style.labelOnTop === false ? 'label-bottom' : 'label-top'
                  }`}
                  style={{
                    backgroundColor: draft.style.transparent
                      ? 'transparent'
                      : draft.style.bg || '#ffffff',
                    color: draft.style.fg || '#111111',
                    borderColor: draft.style.border || '#666666',
                    borderWidth: `${draft.style.borderWidth ?? 2}px`,
                  }}
                >
                  <span
                    class="btn-label"
                    style={{
                      fontWeight: draft.style.bold === false ? 500 : 700,
                      fontStyle: draft.style.italic ? 'italic' : undefined,
                      textDecoration: draft.style.underline ? 'underline' : undefined,
                    }}
                  >
                    {draft.label || 'Button Label'}
                  </span>
                  {ensureButtonImage(draft) && (
                    <span class="btn-media">
                      <ButtonPicture image={ensureButtonImage(draft)} alt={draft.label} />
                    </span>
                  )}
                </div>
              </div>

              <label class="field">
                <span>Button Label</span>
                <input
                  type="text"
                  value={draft.label}
                  onInput={(e) => setDraft({ ...draft, label: (e.target as HTMLInputElement).value })}
                  placeholder="e.g. want, cookie, PEOPLE"
                  autoFocus
                />
              </label>

              <label class="field">
                <span>Spoken / Inserted Text (optional, defaults to label)</span>
                <input
                  type="text"
                  value={draft.message ?? ''}
                  onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setDraft({ ...draft, message: val ? val : undefined });
                  }}
                  placeholder={draft.label || 'Same as label'}
                />
              </label>

              <label class="field">
                <span>Phonetic Pronunciation (optional)</span>
                <input
                  type="text"
                  value={draft.pronunciation ?? ''}
                  onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setDraft({ ...draft, pronunciation: val ? val : undefined });
                  }}
                  placeholder="Custom phonetic spelling"
                />
              </label>

              <label class="field">
                <span>Button Action</span>
                <select
                  value={currentActionKind(draft.actions)}
                  onChange={(e) => setPrimaryActionType((e.target as HTMLSelectElement).value)}
                >
                  <option value="insert">Add word to Message Window</option>
                  <option value="insert_attach">Attach suffix/punctuation (no space before)</option>
                  <option value="speak">Speak immediately (do not add to window)</option>
                  <option value="navigate">Navigate to Page (Folder)</option>
                  <option value="insert_and_navigate">Add word and Navigate to Page</option>
                  <option value="speakWindow">Speak entire Message Window</option>
                  <option value="back">Go Back to previous page</option>
                  <option value="home">Go to Home page</option>
                  <option value="clear">Clear Message Window</option>
                  <option value="deleteWord">Delete Last Word</option>
                  <option value="backspace">Backspace One Character</option>
                  <option value="keyboard">Open On-Screen Keyboard</option>
                </select>
              </label>

              {navAction && (
                <div class="sub-card">
                  <label class="field">
                    <span>Target Page</span>
                    <select
                      value={navAction.pageId}
                      onChange={(e) => {
                        const pid = (e.target as HTMLSelectElement).value;
                        setDraft({
                          ...draft,
                          actions: draft.actions.map((a) =>
                            a.type === 'navigate' ? { type: 'navigate', pageId: pid } : a,
                          ),
                        });
                      }}
                    >
                      {v.pages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.cols}×{p.rows})
                        </option>
                      ))}
                    </select>
                  </label>
                  <div class="inline-row">
                    <input
                      type="text"
                      placeholder="Or create new page..."
                      value={newPageName}
                      onInput={(e) => setNewPageName((e.target as HTMLInputElement).value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                    />
                    <button
                      type="button"
                      class="sm-btn"
                      onClick={() => {
                        if (!newPageName.trim()) return;
                        const pid = addPage(newPageName.trim(), page.rows, page.cols);
                        setDraft({
                          ...draft,
                          label: draft.label || newPageName.trim(),
                          actions: draft.actions.map((a) =>
                            a.type === 'navigate' ? { type: 'navigate', pageId: pid } : a,
                          ),
                        });
                        setNewPageName('');
                        toast('Created new target page', 'success');
                      }}
                    >
                      + Create & Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div class="editor-col">
              <div class="section-box">
                <div class="section-head">
                  <strong>Picture</strong>
                  <div class="edit-actions">
                    <button
                      type="button"
                      class="sm-btn"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          image: resolveIconForButton(draft.label, draft.message, draft.actions),
                        })
                      }
                    >
                      Auto Icon
                    </button>
                    <button
                      type="button"
                      class="sm-btn"
                      onClick={() => setDraft({ ...draft, image: 'none:' })}
                    >
                      Text Only
                    </button>
                  </div>
                </div>

                <div class="tab-strip">
                  <button
                    type="button"
                    class={`tab-btn ${picTab === 'emoji' ? 'active' : ''}`}
                    onClick={() => setPicTab('emoji')}
                  >
                    Emoji
                  </button>
                  <button
                    type="button"
                    class={`tab-btn ${picTab === 'arasaac' ? 'active' : ''}`}
                    onClick={() => {
                      setPicTab('arasaac');
                      if (!arasaacQuery && draft.label) setArasaacQuery(draft.label);
                    }}
                  >
                    ARASAAC Symbols
                  </button>
                  <button
                    type="button"
                    class={`tab-btn ${picTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setPicTab('upload')}
                  >
                    Upload Photo
                  </button>
                </div>

                {picTab === 'emoji' && (
                  <div class="emoji-picker">
                    {EMOJI_GROUPS.map((g) => (
                      <div key={g.name} class="emoji-group">
                        <div class="emoji-group-title">{g.name}</div>
                        <div class="emoji-row">
                          {g.emoji.map((em) => (
                            <button
                              key={em}
                              type="button"
                              class={`emoji-btn ${draft.image === `emoji:${em}` ? 'selected' : ''}`}
                              onClick={() => setDraft({ ...draft, image: `emoji:${em}` })}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {picTab === 'arasaac' && (
                  <div class="arasaac-Pane">
                    {!settings.value.onlineSymbolSearch ? (
                      <div class="section-box">
                        <p class="hint" style={{ margin: '0 0 8px', lineHeight: 1.5 }}>
                          Symbol search looks words up on ARASAAC (api.arasaac.org), so whatever you type gets sent there. It's off until you turn it on.
                        </p>
                        <button
                          type="button"
                          class="sm-btn"
                          onClick={() => updateSettings({ onlineSymbolSearch: true })}
                        >
                          Turn on symbol search
                        </button>
                      </div>
                    ) : (
                    <p class="hint" style={{ margin: '0 0 6px' }}>
                      Searches go to ARASAAC.
                    </p>
                    )}
                    <div class="inline-row">
                      <input
                        type="text"
                        value={arasaacQuery}
                        onInput={(e) => setArasaacQuery((e.target as HTMLInputElement).value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void searchArasaac();
                          }
                        }}
                        placeholder="Search ARASAAC symbols (e.g. eat, happy)..."
                      />
                      <button
                        type="button"
                        class="sm-btn"
                        disabled={!settings.value.onlineSymbolSearch}
                        onClick={() => void searchArasaac()}
                      >
                        {arasaacBusy ? '...' : 'Search'}
                      </button>
                    </div>
                    <div class="arasaac-grid">
                      {arasaacResults.map((hit) => (
                        <button
                          key={hit._id}
                          type="button"
                          class={`arasaac-item ${
                            draft.image === `arasaac:${hit._id}` ? 'selected' : ''
                          }`}
                          onClick={() => {
                            setDraft({ ...draft, image: `arasaac:${hit._id}` });
                            void cacheArasaacPictogram(hit._id);
                          }}
                        >
                          <img
                            src={`https://static.arasaac.org/pictograms/${hit._id}/${hit._id}_300.png`}
                            alt={hit.keywords?.[0]?.keyword ?? ''}
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {picTab === 'upload' && (
                  <div class="upload-pane">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        void handleImageUpload((e.target as HTMLInputElement).files?.[0])
                      }
                    />
                    <p class="hint">
                      Stored on your device and included when exporting backups.
                    </p>
                  </div>
                )}
              </div>

              <div class="section-box">
                <strong>Color</strong>
                <div class="wordclass-grid">
                  {Object.entries(WORD_CLASS).map(([k, sw]) => (
                    <button
                      key={k}
                      type="button"
                      class="wc-chip"
                      style={{ backgroundColor: sw.bg, borderColor: sw.border }}
                      onClick={() => updateStyle({ bg: sw.bg, border: sw.border, fg: sw.fg })}
                    >
                      {sw.name}
                    </button>
                  ))}
                </div>
                <div class="swatch-row">
                  {SWATCHES.map((sw) => (
                    <button
                      key={sw.name}
                      type="button"
                      class="swatch-dot"
                      style={{ backgroundColor: sw.bg, borderColor: sw.border }}
                      title={sw.name}
                      onClick={() => updateStyle({ bg: sw.bg, border: sw.border, fg: sw.fg })}
                    />
                  ))}
                  <input
                    type="color"
                    value={draft.style.bg || '#ffffff'}
                    onInput={(e) => updateStyle({ bg: (e.target as HTMLInputElement).value })}
                    title="Custom background color"
                  />
                </div>
              </div>

              <div class="section-box inline-options">
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={draft.style.labelOnTop !== false}
                    onChange={(e) =>
                      updateStyle({ labelOnTop: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Label on top
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={draft.style.bold !== false}
                    onChange={(e) => updateStyle({ bold: (e.target as HTMLInputElement).checked })}
                  />
                  Bold
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={!!draft.hidden}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        hidden: (e.target as HTMLInputElement).checked || undefined,
                      })
                    }
                  />
                  Hidden button
                </label>
                <div class="span-controls">
                  <label>
                    Cols:
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, page.cols - draft.col)}
                      value={draft.colSpan}
                      onInput={(e) =>
                        setDraft({
                          ...draft,
                          colSpan: Math.max(1, Number((e.target as HTMLInputElement).value) || 1),
                        })
                      }
                    />
                  </label>
                  <label>
                    Rows:
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, page.rows - draft.row)}
                      value={draft.rowSpan}
                      onInput={(e) =>
                        setDraft({
                          ...draft,
                          rowSpan: Math.max(1, Number((e.target as HTMLInputElement).value) || 1),
                        })
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            {existing && (
              <div class="footer-left">
                <button
                  type="button"
                  class="btn danger"
                  onClick={() => {
                    deleteButton(page.id, existing.id);
                    toast('Button deleted', 'info');
                    close();
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  class="btn secondary"
                  onClick={() => {
                    clipboardButton.value = structuredClone(draft);
                    toast('Copied button. Tap any empty cell to paste.', 'info');
                    close();
                  }}
                >
                  Copy
                </button>
                <button
                  type="button"
                  class="btn secondary"
                  onClick={() => {
                    clipboardButton.value = structuredClone(draft);
                    deleteButton(page.id, existing.id);
                    toast('Cut button. Tap any empty cell to place it.', 'info');
                    close();
                  }}
                >
                  Move
                </button>
              </div>
            )}
            <div class="footer-right">
              <button type="button" class="btn secondary" onClick={close}>
                Cancel
              </button>
              <button type="submit" class="btn primary">
                Save Button
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
