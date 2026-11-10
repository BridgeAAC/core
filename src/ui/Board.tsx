import { signal } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Button } from '../model';
import {
  activateButton,
  clipboardButton,
  currentPage,
  editTarget,
  form,
  mode,
  resolveButton,
  speakText,
  toast,
} from '../state';
import { settings } from '../settings';
import { moveButton, occupancy, pasteButton } from '../edit';
import { readableText } from '../data/palette';
import { Scanner, type ScanLevel } from '../engine/scan';
import { getAudioContext, unlockAudio } from '../engine/speech';
import { ButtonPicture } from './ButtonPicture';

export interface GuidedStep {
  pageId: string;
  buttonId: string;
  label: string;
}
export const guidedPath = signal<GuidedStep[]>([]);

export function Board() {
  const page = currentPage.value;
  const isEdit = mode.value === 'edit';
  const cfg = settings.value;
  const activeForm = form.value;

  const [scanHighlightIds, setScanHighlightIds] = useState<Set<string>>(new Set());
  const [scanLevel, setScanLevel] = useState<ScanLevel>('item');
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dwellBtnId, setDwellBtnId] = useState<string | null>(null);

  const lastActivationRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const pressStateRef = useRef<{ id: string; downAt: number } | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scannerRef = useRef<Scanner | null>(null);

  useEffect(() => {
    if (!page || isEdit || cfg.access !== 'scan') {
      scannerRef.current?.stop();
      setScanHighlightIds(new Set());
      return;
    }

    const visibleTargets = page.buttons
      .filter((b) => !resolveButton(b, activeForm).hidden)
      .map((b) => ({
        id: b.id,
        row: b.row,
        col: b.col,
        rowSpan: b.rowSpan,
        colSpan: b.colSpan,
      }));

    if (!scannerRef.current) {
      scannerRef.current = new Scanner({
        onHighlight: (ids, level) => {
          setScanHighlightIds(new Set(ids));
          setScanLevel(level);
          if (settings.value.auditoryScanning && ids.length === 1) {
            const cur = currentPage.value;
            const btn = cur?.buttons.find((b) => b.id === ids[0]);
            if (btn) {
              const r = resolveButton(btn, form.value);
              const cue = (r.label || r.message || '').trim();
              if (cue) speakText(cue);
            }
          }
        },
        onSelect: (id) => {
          const cur = currentPage.value;
          const btn = cur?.buttons.find((b) => b.id === id);
          if (btn) handleTriggerButton(btn);
        },
        onIdle: () => {
          setScanHighlightIds(new Set());
        },
      });
    }

    scannerRef.current.setTargets(visibleTargets, {
      pattern: cfg.scanPattern,
      mode: cfg.scanMode,
      intervalMs: cfg.scanIntervalMs,
      firstDelayMs: cfg.scanFirstDelayMs,
      maxLoops: cfg.scanLoops,
    });

    if (cfg.scanMode === 'auto') {
      scannerRef.current.start();
    }

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (cfg.switchSelectKeys.includes(e.code)) {
        e.preventDefault();
        scannerRef.current?.select();
      } else if (cfg.switchNextKeys.includes(e.code)) {
        e.preventDefault();
        scannerRef.current?.next();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      scannerRef.current?.stop();
    };
  }, [
    page?.id,
    page?.buttons,
    isEdit,
    cfg.access,
    cfg.scanPattern,
    cfg.scanMode,
    cfg.scanIntervalMs,
    cfg.scanFirstDelayMs,
    cfg.scanLoops,
    activeForm,
  ]);

  if (!page) {
    return <main class="board-empty">No page loaded.</main>;
  }

  function playClickBeep() {
    if (!cfg.soundFeedback) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.value = 0.06;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {}
  }

  function handleTriggerButton(b: Button) {
    const now = Date.now();
    if (
      cfg.ignoreRepeatMs > 0 &&
      lastActivationRef.current.id === b.id &&
      now - lastActivationRef.current.time < cfg.ignoreRepeatMs
    ) {
      return;
    }
    lastActivationRef.current = { id: b.id, time: now };
    unlockAudio();
    playClickBeep();
    try {
      (window as any).webkit?.messageHandlers?.bridgeSwift?.postMessage?.({
        action: 'haptic',
        style: 'light',
      });
    } catch {}

    const gp = guidedPath.value;
    if (gp.length > 0 && gp[0].pageId === page!.id && gp[0].buttonId === b.id) {
      guidedPath.value = gp.slice(1);
    }

    activateButton(b);
  }

  function handlePointerDown(b: Button) {
    unlockAudio();
    pressStateRef.current = { id: b.id, downAt: Date.now() };
    if (isEdit) return;
    clearTimeout(holdTimerRef.current);
    if (!cfg.activateOnRelease) {
      if (cfg.holdMs > 0) {
        holdTimerRef.current = setTimeout(() => {
          if (pressStateRef.current?.id === b.id) {
            handleTriggerButton(b);
          }
        }, cfg.holdMs);
      } else {
        handleTriggerButton(b);
      }
    }
  }

  function handlePointerUp(b: Button) {
    const press = pressStateRef.current;
    pressStateRef.current = null;
    clearTimeout(holdTimerRef.current);
    if (isEdit) {
      if (!press || press.id === b.id) {
        editTarget.value = { pageId: page!.id, buttonId: b.id, row: b.row, col: b.col };
      }
      return;
    }
    if (cfg.activateOnRelease) {
      if (!press || press.id !== b.id) return;
      if (cfg.holdMs > 0 && Date.now() - press.downAt < cfg.holdMs) {
        return;
      }
      handleTriggerButton(b);
    }
  }

  function handlePointerEnter(b: Button) {
    if (isEdit || cfg.dwellMs <= 0) return;
    clearTimeout(dwellTimerRef.current);
    setDwellBtnId(b.id);
    dwellTimerRef.current = setTimeout(() => {
      setDwellBtnId(null);
      handleTriggerButton(b);
    }, cfg.dwellMs);
  }

  function handlePointerLeave() {
    pressStateRef.current = null;
    clearTimeout(holdTimerRef.current);
    clearTimeout(dwellTimerRef.current);
    if (dwellBtnId) setDwellBtnId(null);
  }

  const occ = isEdit ? occupancy(page) : null;
  const emptyCells: { row: number; col: number }[] = [];
  if (isEdit && occ) {
    for (let r = 0; r < page.rows; r++) {
      for (let c = 0; c < page.cols; c++) {
        if (!occ[r][c]) emptyCells.push({ row: r, col: c });
      }
    }
  }

  const nextGuided =
    guidedPath.value.length > 0 && guidedPath.value[0].pageId === page.id
      ? guidedPath.value[0]
      : null;

  return (
    <main class="board-wrap" style={{ backgroundColor: page.bg || undefined }}>
      {guidedPath.value.length > 0 && (
        <div class="guided-banner" role="status">
          <span>
            <strong>Find Word guide:</strong> Tap{' '}
            {guidedPath.value.map((step, i) => (
              <span key={i} class={`guided-step ${i === 0 ? 'current' : ''}`}>
                {i > 0 ? ' > ' : ''}"{step.label}"
              </span>
            ))}
          </span>
          <button type="button" class="sm-btn" onClick={() => (guidedPath.value = [])}>
            Exit Guide
          </button>
        </div>
      )}

      <div
        class={`board-grid ${isEdit ? 'is-edit' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${page.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${page.rows}, minmax(0, 1fr))`,
          gap: `${cfg.buttonGap}px`,
          padding: `${Math.max(4, cfg.buttonGap)}px`,
        }}
      >
        {page.buttons.map((b) => {
          const resolved = resolveButton(b, activeForm);
          if (resolved.hidden && !isEdit) {
            return (
              <div
                key={b.id}
                class="aac-cell-hidden"
                style={{
                  gridColumn: `${b.col + 1} / span ${b.colSpan}`,
                  gridRow: `${b.row + 1} / span ${b.rowSpan}`,
                }}
                aria-hidden="true"
              />
            );
          }

          const st = b.style ?? {};
          const hasNav = resolved.actions.some((a) => a.type === 'navigate');
          const isSpecialAction = resolved.actions.some(
            (a) =>
              a.type === 'clear' ||
              a.type === 'deleteWord' ||
              a.type === 'backspace' ||
              a.type === 'back' ||
              a.type === 'home' ||
              a.type === 'speakWindow',
          );
          const bg = st.transparent ? 'transparent' : st.bg || 'var(--btn-default-bg)';
          const fg = st.fg || readableText(st.bg) || 'var(--btn-default-fg)';
          const borderWidth = cfg.showButtonBorders ? (st.borderWidth ?? 2) : 0;
          const borderColor = st.border || 'var(--btn-default-border)';
          const fontScale = (st.fontScale ?? 1) * cfg.labelScale;
          const labelOnTop =
            cfg.labelPosition === 'top'
              ? true
              : cfg.labelPosition === 'bottom'
                ? false
                : (st.labelOnTop ?? true);
          const isScanned = scanHighlightIds.has(b.id);
          const isGuided = nextGuided?.buttonId === b.id;
          const showImg = cfg.showImages && !!resolved.image;

          return (
            <button
              key={b.id}
              type="button"
              data-btn-id={b.id}
              data-row={b.row}
              data-col={b.col}
              draggable={isEdit}
              onDragStart={() => setDragSourceId(b.id)}
              onDragOver={(e) => {
                if (isEdit) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (isEdit && dragSourceId && dragSourceId !== b.id) {
                  moveButton(page.id, dragSourceId, b.row, b.col);
                }
                setDragSourceId(null);
              }}
              onPointerDown={() => handlePointerDown(b)}
              onPointerUp={() => handlePointerUp(b)}
              onPointerCancel={() => handlePointerLeave()}
              onPointerEnter={() => handlePointerEnter(b)}
              onPointerLeave={() => handlePointerLeave()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (isEdit) {
                    editTarget.value = { pageId: page.id, buttonId: b.id, row: b.row, col: b.col };
                  } else {
                    handleTriggerButton(b);
                  }
                  return;
                }
                if (
                  e.key === 'ArrowRight' ||
                  e.key === 'ArrowLeft' ||
                  e.key === 'ArrowDown' ||
                  e.key === 'ArrowUp'
                ) {
                  e.preventDefault();
                  const grid = (e.currentTarget as HTMLElement).closest('.board-grid');
                  if (!grid) return;
                  const all = Array.from(grid.querySelectorAll<HTMLButtonElement>('button.aac-btn'));
                  if (all.length === 0) return;
                  const dr = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
                  const dc = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                  let best: HTMLButtonElement | null = null;
                  let bestScore = Infinity;
                  for (const cand of all) {
                    if (cand === e.currentTarget) continue;
                    const cr = Number(cand.dataset.row ?? 0);
                    const cc = Number(cand.dataset.col ?? 0);
                    const dRow = cr - b.row;
                    const dCol = cc - b.col;
                    if (dr !== 0 && Math.sign(dRow) !== dr) continue;
                    if (dc !== 0 && Math.sign(dCol) !== dc) continue;
                    const primary = dr !== 0 ? Math.abs(dRow) : Math.abs(dCol);
                    const secondary = dr !== 0 ? Math.abs(dCol) : Math.abs(dRow);
                    const score = primary * 10 + secondary * 25;
                    if (score < bestScore) {
                      bestScore = score;
                      best = cand;
                    }
                  }
                  if (best) best.focus();
                }
              }}
              class={[
                'aac-btn',
                labelOnTop ? 'label-top' : 'label-bottom',
                hasNav ? 'is-folder' : '',
                isSpecialAction ? 'is-action' : '',
                st.transparent ? 'is-transparent' : '',
                resolved.hidden ? 'is-hidden-edit' : '',
                isScanned ? `scan-highlight scan-${scanLevel}` : '',
                isGuided ? 'guided-pulse' : '',
                dwellBtnId === b.id ? 'dwell-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                gridColumn: `${b.col + 1} / span ${b.colSpan}`,
                gridRow: `${b.row + 1} / span ${b.rowSpan}`,
                backgroundColor: bg,
                color: fg,
                borderWidth: `${borderWidth}px`,
                borderColor,
                fontFamily: st.fontFamily || undefined,
              }}
              aria-label={resolved.label || resolved.message || 'Button'}
            >
              {hasNav && <span class="folder-corner" aria-hidden="true" />}
              <span
                class="btn-label"
                style={{
                  fontSize: `clamp(0.54rem, ${(((15.5 / Math.max(4, page.cols)) * fontScale)).toFixed(2)}vw, ${((page.cols <= 5 ? 1.08 : page.cols <= 7 ? 0.98 : 0.92) * fontScale).toFixed(2)}rem)`,
                  fontWeight: st.bold === false ? 500 : 700,
                  fontStyle: st.italic ? 'italic' : undefined,
                  textDecoration: st.underline ? 'underline' : undefined,
                }}
              >
                {resolved.label}
              </span>
              {showImg && (
                <span class="btn-media">
                  <ButtonPicture image={resolved.image} alt={resolved.label} />
                </span>
              )}
              {isEdit && resolved.hidden && <span class="hidden-tag">Hidden</span>}
            </button>
          );
        })}

        {isEdit &&
          emptyCells.map(({ row, col }) => (
            <button
              key={`empty-${row}-${col}`}
              type="button"
              class="aac-empty-cell"
              style={{
                gridColumn: `${col + 1} / span 1`,
                gridRow: `${row + 1} / span 1`,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragSourceId) {
                  moveButton(page.id, dragSourceId, row, col);
                  setDragSourceId(null);
                }
              }}
              onClick={() => {
                if (clipboardButton.value) {
                  pasteButton(page.id, clipboardButton.value, row, col);
                  toast(`Pasted "${clipboardButton.value.label}"`, 'success', {
                    label: 'Clear clipboard',
                    run: () => (clipboardButton.value = null),
                  });
                } else {
                  editTarget.value = { pageId: page.id, row, col };
                }
              }}
              title={
                clipboardButton.value
                  ? `Paste "${clipboardButton.value.label}" at row ${row + 1}, col ${col + 1}`
                  : `Add button at row ${row + 1}, col ${col + 1}`
              }
            >
              <span>{clipboardButton.value ? 'Paste' : '+'}</span>
            </button>
          ))}
      </div>

      {cfg.access === 'scan' && !isEdit && (
        <div class="switch-bar" role="region" aria-label="Switch scanning controls">
          <button
            type="button"
            class="switch-pad select-pad"
            onClick={() => scannerRef.current?.select()}
          >
            Switch 1: Select ({cfg.switchSelectKeys.join(', ')})
          </button>
          {cfg.scanMode === 'step' && (
            <button
              type="button"
              class="switch-pad next-pad"
              onClick={() => scannerRef.current?.next()}
            >
              Switch 2: Step Next ({cfg.switchNextKeys.join(', ')})
            </button>
          )}
        </div>
      )}
    </main>
  );
}
