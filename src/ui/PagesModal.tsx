import { useMemo, useState } from 'preact/hooks';
import type { Button, ID, Page, Vocabulary } from '../model';
import {
  currentPage,
  goHome,
  gotoPage,
  mode,
  panel,
  toast,
  vocab,
} from '../state';
import {
  addPage,
  deletePage,
  duplicatePage,
  resizePage,
  searchButtons,
  setHomePage,
  setPageProps,
} from '../edit';
import { guidedPath, type GuidedStep } from './Board';

function computeShortestPaths(v: Vocabulary): Map<ID, GuidedStep[]> {
  const paths = new Map<ID, GuidedStep[]>();
  const homeId = v.homePageId;
  paths.set(homeId, []);
  const pageById = new Map<ID, Page>(v.pages.map((p) => [p.id, p]));
  const queue: ID[] = [homeId];

  while (queue.length > 0) {
    const curId = queue.shift()!;
    const curPage = pageById.get(curId);
    if (!curPage) continue;
    const baseSteps = paths.get(curId)!;

    for (const b of curPage.buttons) {
      if (b.hidden) continue;
      for (const act of b.actions) {
        if (act.type === 'navigate' && !paths.has(act.pageId) && pageById.has(act.pageId)) {
          paths.set(act.pageId, [
            ...baseSteps,
            { pageId: curId, buttonId: b.id, label: b.label || b.message || 'Folder' },
          ]);
          queue.push(act.pageId);
        }
      }
    }
  }
  return paths;
}

export function PagesModal() {
  const v = vocab.value;
  const cur = currentPage.value;
  if (!v) return null;

  const [tab, setTab] = useState<'find' | 'pages'>('find');
  const [wordQuery, setWordQuery] = useState('');
  const [pageQuery, setPageQuery] = useState('');
  const [showHiddenPages, setShowHiddenPages] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  const shortestPaths = useMemo(() => computeShortestPaths(v), [v]);
  const wordHits = useMemo(() => searchButtons(wordQuery, 50), [v, wordQuery]);

  const filteredPages = useMemo(() => {
    const q = pageQuery.trim().toLowerCase();
    return v.pages.filter((p) => {
      if (!showHiddenPages && p.hidden && p.id !== v.homePageId) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [v, pageQuery, showHiddenPages]);

  function close() {
    panel.value = null;
  }

  function startGuide(page: Page, button: Button) {
    const prefix = shortestPaths.get(page.id);
    if (!prefix) {
      gotoPage(page.id);
      guidedPath.value = [
        { pageId: page.id, buttonId: button.id, label: button.label || button.message || '' },
      ];
    } else {
      goHome();
      guidedPath.value = [
        ...prefix,
        { pageId: page.id, buttonId: button.id, label: button.label || button.message || '' },
      ];
    }
    close();
  }

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Find a Word and Page Browser"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <div class="tab-strip">
            <button
              type="button"
              class={`tab-btn ${tab === 'find' ? 'active' : ''}`}
              onClick={() => setTab('find')}
            >
              Find a Word
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'pages' ? 'active' : ''}`}
              onClick={() => setTab('pages')}
            >
              All Pages ({v.pages.length})
            </button>
          </div>
          <button type="button" class="icon-close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>

        <div class="modal-body">
          {tab === 'find' ? (
            <div>
              <label class="field">
                <span>Search for a word to see the button sequence from Home:</span>
                <input
                  type="search"
                  value={wordQuery}
                  onInput={(e) => setWordQuery((e.target as HTMLInputElement).value)}
                  placeholder="Search word or phrase..."
                  autoFocus
                />
              </label>

              {wordQuery.trim() === '' ? (
                <p class="hint" style={{ marginTop: '12px' }}>
                  Enter a word above to search across {v.pages.length.toLocaleString()} pages in "
                  {v.name}".
                </p>
              ) : wordHits.length === 0 ? (
                <p class="hint" style={{ marginTop: '12px' }}>
                  No buttons matching "{wordQuery}" were found.
                </p>
              ) : (
                <div class="find-results">
                  {wordHits.map(({ page, button }) => {
                    const navSteps = shortestPaths.get(page.id);
                    const fullSteps = navSteps
                      ? [...navSteps.map((s) => s.label), button.label || button.message || '']
                      : null;
                    return (
                      <div key={`${page.id}:${button.id}`} class="find-row">
                        <div class="find-info">
                          <div class="find-word">
                            <strong>{button.label}</strong>
                            {button.message && button.message !== button.label && (
                              <span class="find-msg"> ("{button.message}")</span>
                            )}
                            <span class="find-page-badge">on {page.name}</span>
                          </div>
                          <div class="find-path">
                            {fullSteps ? (
                              <span>
                                Home &gt;{' '}
                                {fullSteps.map((lbl, idx) => (
                                  <span key={idx} class="path-pill">
                                    {idx > 0 ? ' > ' : ''}
                                    {lbl}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span class="hint">Page "{page.name}"</span>
                            )}
                          </div>
                        </div>
                        <div class="find-actions">
                          <button
                            type="button"
                            class="btn primary sm"
                            onClick={() => startGuide(page, button)}
                            title="Go to Home and highlight each button step by step"
                          >
                            Guide Me
                          </button>
                          <button
                            type="button"
                            class="sm-btn"
                            onClick={() => {
                              gotoPage(page.id);
                              close();
                            }}
                          >
                            Open Page
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div class="inline-row" style={{ marginBottom: '10px' }}>
                <input
                  type="search"
                  placeholder="Filter pages by name..."
                  value={pageQuery}
                  onInput={(e) => setPageQuery((e.target as HTMLInputElement).value)}
                />
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={showHiddenPages}
                    onChange={(e) => setShowHiddenPages((e.target as HTMLInputElement).checked)}
                  />
                  Show template/hidden pages
                </label>
              </div>

              <div class="inline-row" style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="New page name..."
                  value={newPageTitle}
                  onInput={(e) => setNewPageTitle((e.target as HTMLInputElement).value)}
                />
                <button
                  type="button"
                  class="btn secondary sm"
                  onClick={() => {
                    const name = newPageTitle.trim() || 'New Page';
                    const id = addPage(name, cur?.rows ?? 6, cur?.cols ?? 8, {
                      linkFromCurrent: mode.value === 'edit',
                    });
                    setNewPageTitle('');
                    gotoPage(id);
                    toast(`Created page "${name}"`, 'success');
                    close();
                  }}
                >
                  + Add Page
                </button>
              </div>

              <div class="page-list">
                {filteredPages.map((p) => {
                  const isHome = p.id === v.homePageId;
                  const isCurrent = p.id === cur?.id;
                  return (
                    <div key={p.id} class={`vocab-row ${isCurrent ? 'current' : ''}`}>
                      <div class="vocab-info">
                        <div class="vocab-title">
                          <strong>{p.name}</strong>
                          {isHome && <span class="active-pill">Home</span>}
                          {p.hidden && <span class="source-tag">Hidden</span>}
                        </div>
                        <div class="vocab-meta">
                          {p.cols}×{p.rows} grid, {p.buttons.length} buttons
                        </div>
                      </div>
                      <div class="vocab-actions">
                        <button
                          type="button"
                          class="btn primary sm"
                          onClick={() => {
                            gotoPage(p.id);
                            close();
                          }}
                        >
                          Open
                        </button>
                        {!isHome && mode.value === 'edit' && (
                          <button
                            type="button"
                            class="sm-btn"
                            onClick={() => {
                              setHomePage(p.id);
                              toast(`Set "${p.name}" as Home page`, 'success');
                            }}
                          >
                            Set Home
                          </button>
                        )}
                        {mode.value === 'edit' && (
                          <>
                            <button
                              type="button"
                              class="sm-btn"
                              onClick={() => {
                                const copyId = duplicatePage(p.id);
                                if (copyId) toast(`Duplicated "${p.name}"`, 'success');
                              }}
                            >
                              Duplicate
                            </button>
                            {v.pages.length > 1 && (
                              <button
                                type="button"
                                class="sm-btn danger-text"
                                onClick={() => {
                                  deletePage(p.id);
                                  toast(`Deleted page "${p.name}"`, 'info');
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageSettingsModal() {
  const pg = currentPage.value;
  if (!pg) return null;

  const [name, setName] = useState(pg.name);
  const [cols, setCols] = useState(pg.cols);
  const [rows, setRows] = useState(pg.rows);
  const [bg, setBg] = useState(pg.bg || '#e8edf5');

  function close() {
    panel.value = null;
  }

  function handleSave(e: Event) {
    e.preventDefault();
    setPageProps(pg!.id, { name: name.trim() || pg!.name, bg });
    if (cols !== pg!.cols || rows !== pg!.rows) {
      resizePage(pg!.id, rows, cols);
    }
    toast('Page settings updated', 'success');
    close();
  }

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Page Grid Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2>Page & Grid Settings</h2>
          <button type="button" class="icon-close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>

        <form class="modal-body" onSubmit={handleSave}>
          <label class="field">
            <span>Page Name</span>
            <input
              type="text"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
            />
          </label>

          <div class="inline-row" style={{ marginTop: '12px' }}>
            <label class="field" style={{ flex: 1 }}>
              <span>Columns (1-30)</span>
              <input
                type="number"
                min={1}
                max={30}
                value={cols}
                onInput={(e) => setCols(Number((e.target as HTMLInputElement).value) || pg.cols)}
              />
            </label>
            <label class="field" style={{ flex: 1 }}>
              <span>Rows (1-30)</span>
              <input
                type="number"
                min={1}
                max={30}
                value={rows}
                onInput={(e) => setRows(Number((e.target as HTMLInputElement).value) || pg.rows)}
              />
            </label>
          </div>

          <label class="field" style={{ marginTop: '12px' }}>
            <span>Page Background Color</span>
            <div class="inline-row">
              <input
                type="color"
                value={bg}
                onInput={(e) => setBg((e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="sm-btn"
                onClick={() => {
                  setPageProps(pg.id, { bg: undefined });
                  close();
                }}
              >
                Reset to Default
              </button>
            </div>
          </label>

          <div class="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" class="btn secondary" onClick={close}>
              Cancel
            </button>
            <button type="submit" class="btn primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
