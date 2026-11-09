import { unzipSync, zipSync } from 'fflate';
import type {
  Action,
  AssetBlob,
  Button,
  ID,
  ImportOptions,
  ImportResult,
  Page,
  Vocabulary,
} from '../model';
import {
  bytesToBase64,
  clamp,
  extForMime,
  isZip,
  mimeForExt,
  newId,
  parseCssColor,
  parseDataUrl,
} from './util';

interface ObfButton {
  id: string | number;
  label?: string;
  vocalization?: string;
  image_id?: string | number;
  sound_id?: string | number;
  background_color?: string;
  border_color?: string;
  text_color?: string;
  hidden?: boolean;
  load_board?: { id?: string | number; path?: string; name?: string };
  action?: string;
  actions?: string[];
}

interface ObfImage {
  id: string | number;
  url?: string;
  data?: string;
  path?: string;
  content_type?: string;
}

interface ObfSound {
  id: string | number;
  url?: string;
  data?: string;
  path?: string;
  content_type?: string;
}

interface ObfBoard {
  format?: string;
  id?: string | number;
  locale?: string;
  name?: string;
  description_html?: string;
  buttons?: ObfButton[];
  grid?: {
    rows?: number;
    columns?: number;
    order?: Array<Array<string | number | null>>;
  };
  images?: ObfImage[];
  sounds?: ObfSound[];
}

interface ObzManifest {
  format?: string;
  root?: string;
  paths?: {
    boards?: Record<string, string>;
    images?: Record<string, string>;
    sounds?: Record<string, string>;
  };
}

function normPath(p: string): string {
  return p.replace(/^\.?\//, '').replace(/\\/g, '/');
}

function mapObfActionStrings(
  rawActions: string[],
  loadBoardTarget: ID | undefined,
  soundAssetId: ID | undefined,
): Action[] {
  const out: Action[] = [];
  for (const raw of rawActions) {
    const a = String(raw).trim();
    if (!a) continue;
    if (a.startsWith('+')) {
      out.push({ type: 'insert', text: a.slice(1) });
      continue;
    }
    switch (a.toLowerCase()) {
      case ':clear':
        out.push({ type: 'clear' });
        break;
      case ':backspace':
        out.push({ type: 'backspace' });
        break;
      case ':space':
        out.push({ type: 'insert', text: ' ' });
        break;
      case ':speak':
        out.push({ type: 'speakWindow' });
        break;
      case ':home':
        out.push({ type: 'home' });
        break;
      case ':back':
        out.push({ type: 'back' });
        break;
      case ':delete_word':
        out.push({ type: 'deleteWord' });
        break;
      default:
        out.push({ type: 'unsupported', source: 'obf' });
        break;
    }
  }
  if (soundAssetId) out.push({ type: 'playSound', assetId: soundAssetId });
  if (loadBoardTarget) out.push({ type: 'navigate', pageId: loadBoardTarget });
  return out;
}

function convertOneBoard(
  board: ObfBoard,
  boardId: ID,
  resolveBoardTarget: (lb: ObfButton['load_board']) => ID | undefined,
  resolveImageRef: (img: ObfImage | undefined) => string | undefined,
  resolveSoundAsset: (snd: ObfSound | undefined) => ID | undefined,
): Page {
  const buttonsById = new Map<string, ObfButton>();
  for (const b of board.buttons ?? []) {
    if (b && b.id != null) buttonsById.set(String(b.id), b);
  }
  const imagesById = new Map<string, ObfImage>();
  for (const img of board.images ?? []) {
    if (img && img.id != null) imagesById.set(String(img.id), img);
  }
  const soundsById = new Map<string, ObfSound>();
  for (const snd of board.sounds ?? []) {
    if (snd && snd.id != null) soundsById.set(String(snd.id), snd);
  }

  const order = board.grid?.order;
  const rows = clamp(
    Number(board.grid?.rows ?? (Array.isArray(order) ? order.length : 4)) || 4,
    1,
    40,
  );
  const cols = clamp(
    Number(
      board.grid?.columns ??
        (Array.isArray(order) && Array.isArray(order[0])
          ? order[0].length
          : Math.ceil(Math.sqrt(buttonsById.size || 1))),
    ) || 4,
    1,
    40,
  );

  const placements = new Map<string, { row: number; col: number; rowSpan: number; colSpan: number }>();
  if (Array.isArray(order) && order.length > 0) {
    for (let r = 0; r < Math.min(rows, order.length); r++) {
      const rowArr = order[r];
      if (!Array.isArray(rowArr)) continue;
      for (let c = 0; c < Math.min(cols, rowArr.length); c++) {
        const cell = rowArr[c];
        if (cell == null) continue;
        const key = String(cell);
        const existing = placements.get(key);
        if (!existing) {
          placements.set(key, { row: r, col: c, rowSpan: 1, colSpan: 1 });
        } else {
          const maxR = Math.max(existing.row + existing.rowSpan, r + 1);
          const maxC = Math.max(existing.col + existing.colSpan, c + 1);
          existing.row = Math.min(existing.row, r);
          existing.col = Math.min(existing.col, c);
          existing.rowSpan = maxR - existing.row;
          existing.colSpan = maxC - existing.col;
        }
      }
    }
  } else {
    let idx = 0;
    for (const key of buttonsById.keys()) {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      if (r < rows) placements.set(key, { row: r, col: c, rowSpan: 1, colSpan: 1 });
      idx++;
    }
  }

  const buttons: Button[] = [];
  for (const [key, pos] of placements) {
    const raw = buttonsById.get(key);
    if (!raw) continue;
    const label = raw.label != null ? String(raw.label) : '';
    const vocal =
      raw.vocalization != null && String(raw.vocalization) !== label
        ? String(raw.vocalization)
        : undefined;
    const imgObj = raw.image_id != null ? imagesById.get(String(raw.image_id)) : undefined;
    const sndObj = raw.sound_id != null ? soundsById.get(String(raw.sound_id)) : undefined;
    const image = resolveImageRef(imgObj);
    const soundAssetId = resolveSoundAsset(sndObj);
    const targetPageId = raw.load_board ? resolveBoardTarget(raw.load_board) : undefined;
    const actionList: string[] = Array.isArray(raw.actions)
      ? raw.actions
      : raw.action
        ? [raw.action]
        : [];
    const actions = mapObfActionStrings(actionList, targetPageId, soundAssetId);

    buttons.push({
      id: `${boardId}:${key}`,
      label,
      message: vocal,
      image,
      style: {
        bg: parseCssColor(raw.background_color),
        border: parseCssColor(raw.border_color),
        fg: parseCssColor(raw.text_color),
      },
      actions,
      row: pos.row,
      col: pos.col,
      rowSpan: pos.rowSpan,
      colSpan: pos.colSpan,
      hidden: raw.hidden ? true : undefined,
    });
  }

  return {
    id: boardId,
    name: board.name?.trim() || String(board.id ?? 'Board'),
    rows,
    cols,
    buttons,
  };
}

export async function importObf(
  jsonTextOrObj: string | object,
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const vocabId = opts.vocabId ?? `obf-${newId()}`;
  let board: ObfBoard;
  try {
    board = (
      typeof jsonTextOrObj === 'string' ? JSON.parse(jsonTextOrObj) : jsonTextOrObj
    ) as ObfBoard;
  } catch (e) {
    throw new Error(`Invalid OBF JSON (${e instanceof Error ? e.message : 'parse error'}).`);
  }
  if (!board || typeof board !== 'object' || (!Array.isArray(board.buttons) && !board.grid)) {
    throw new Error('This file is not a valid Open Board Format (.obf) board.');
  }

  const assets: AssetBlob[] = [];
  let imgSeq = 0;
  let sndSeq = 0;

  const pageId = String(board.id ?? 'root');
  const page = convertOneBoard(
    board,
    pageId,
    () => undefined,
    (img) => {
      if (!img) return undefined;
      if (img.data) {
        const parsed = parseDataUrl(img.data);
        if (parsed) {
          const aid = `${vocabId}:img:${++imgSeq}`;
          assets.push({ id: aid, vocabId, kind: 'image', mime: parsed.mime, data: parsed.data });
          return `img:${aid}`;
        }
      }
      if (img.url && /^https?:\/\//i.test(img.url)) return `url:${img.url}`;
      return undefined;
    },
    (snd) => {
      if (!snd?.data) return undefined;
      const parsed = parseDataUrl(snd.data);
      if (!parsed) return undefined;
      const aid = `${vocabId}:snd:${++sndSeq}`;
      assets.push({ id: aid, vocabId, kind: 'sound', mime: parsed.mime, data: parsed.data });
      return aid;
    },
  );

  const now = Date.now();
  const vocab: Vocabulary = {
    id: vocabId,
    name: board.name?.trim() || opts.filename?.replace(/\.obf$/i, '') || 'OBF Board',
    locale: board.locale || 'en',
    source: { kind: 'obf', filename: opts.filename, importedAt: now },
    homePageId: page.id,
    pages: [page],
    createdAt: now,
    updatedAt: now,
    schema: 1,
  };

  return {
    vocab,
    assets,
    warnings: [],
    stats: {
      pages: 1,
      buttons: page.buttons.length,
      images: imgSeq,
      sounds: sndSeq,
    },
  };
}

export async function importObz(data: Uint8Array, opts: ImportOptions = {}): Promise<ImportResult> {
  if (!isZip(data)) {
    throw new Error('Not a valid .obz ZIP archive.');
  }
  const vocabId = opts.vocabId ?? `obz-${newId()}`;
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(data);
  } catch (e) {
    throw new Error(`Could not unpack .obz archive (${e instanceof Error ? e.message : 'corrupt zip'}).`);
  }

  const byNormPath = new Map<string, Uint8Array>();
  for (const [k, v] of Object.entries(entries)) byNormPath.set(normPath(k), v);

  const dec = new TextDecoder('utf-8');
  let manifest: ObzManifest | null = null;
  const manifestBytes = byNormPath.get('manifest.json');
  if (manifestBytes) {
    try {
      manifest = JSON.parse(dec.decode(manifestBytes)) as ObzManifest;
    } catch {
      manifest = null;
    }
  }

  const rawBoards = new Map<string, { path: string; board: ObfBoard; id: ID }>();
  const boardIdByPath = new Map<string, ID>();

  for (const [path, bytes] of byNormPath) {
    if (!path.toLowerCase().endsWith('.obf')) continue;
    try {
      const b = JSON.parse(dec.decode(bytes)) as ObfBoard;
      const id = String(b.id ?? path.replace(/\.obf$/i, ''));
      rawBoards.set(id, { path, board: b, id });
      boardIdByPath.set(path, id);
    } catch {
      continue;
    }
  }

  if (rawBoards.size === 0) {
    throw new Error('No .obf boards were found inside this .obz archive.');
  }

  if (manifest?.paths?.boards) {
    for (const [id, p] of Object.entries(manifest.paths.boards)) {
      const np = normPath(p);
      const found = boardIdByPath.get(np);
      if (found) boardIdByPath.set(np, found);
      else if (rawBoards.has(id)) boardIdByPath.set(np, id);
    }
  }

  const assets: AssetBlob[] = [];
  const assetByZipPath = new Map<string, ID>();
  let imgSeq = 0;
  let sndSeq = 0;

  function loadZipImage(relPath: string, mimeHint?: string): ID | undefined {
    const np = normPath(relPath);
    const existing = assetByZipPath.get(np);
    if (existing) return existing;
    const bytes = byNormPath.get(np);
    if (!bytes) return undefined;
    const aid = `${vocabId}:img:${++imgSeq}`;
    assets.push({
      id: aid,
      vocabId,
      kind: 'image',
      mime: mimeHint || mimeForExt(np),
      data: bytes,
    });
    assetByZipPath.set(np, aid);
    return aid;
  }

  function loadZipSound(relPath: string, mimeHint?: string): ID | undefined {
    const np = normPath(relPath);
    const existing = assetByZipPath.get(np);
    if (existing) return existing;
    const bytes = byNormPath.get(np);
    if (!bytes) return undefined;
    const aid = `${vocabId}:snd:${++sndSeq}`;
    assets.push({
      id: aid,
      vocabId,
      kind: 'sound',
      mime: mimeHint || mimeForExt(np),
      data: bytes,
    });
    assetByZipPath.set(np, aid);
    return aid;
  }

  const pages: Page[] = [];
  let totalButtons = 0;

  for (const { board, id } of rawBoards.values()) {
    const page = convertOneBoard(
      board,
      id,
      (lb) => {
        if (!lb) return undefined;
        if (lb.id != null && rawBoards.has(String(lb.id))) return String(lb.id);
        if (lb.path) {
          const np = normPath(lb.path);
          return boardIdByPath.get(np);
        }
        return undefined;
      },
      (img) => {
        if (!img) return undefined;
        if (img.path) {
          const aid = loadZipImage(img.path, img.content_type);
          if (aid) return `img:${aid}`;
        }
        if (img.data) {
          const parsed = parseDataUrl(img.data);
          if (parsed) {
            const aid = `${vocabId}:img:${++imgSeq}`;
            assets.push({ id: aid, vocabId, kind: 'image', mime: parsed.mime, data: parsed.data });
            return `img:${aid}`;
          }
        }
        if (img.url && /^https?:\/\//i.test(img.url)) return `url:${img.url}`;
        return undefined;
      },
      (snd) => {
        if (!snd) return undefined;
        if (snd.path) return loadZipSound(snd.path, snd.content_type);
        if (snd.data) {
          const parsed = parseDataUrl(snd.data);
          if (parsed) {
            const aid = `${vocabId}:snd:${++sndSeq}`;
            assets.push({ id: aid, vocabId, kind: 'sound', mime: parsed.mime, data: parsed.data });
            return aid;
          }
        }
        return undefined;
      },
    );
    totalButtons += page.buttons.length;
    pages.push(page);
  }

  let homePageId = pages[0].id;
  if (manifest?.root) {
    const byPath = boardIdByPath.get(normPath(manifest.root));
    if (byPath && pages.some((p) => p.id === byPath)) homePageId = byPath;
    else if (pages.some((p) => p.id === manifest.root)) homePageId = manifest.root;
  }

  const homePage = pages.find((p) => p.id === homePageId) ?? pages[0];
  const now = Date.now();
  const vocab: Vocabulary = {
    id: vocabId,
    name: homePage.name || opts.filename?.replace(/\.obz$/i, '') || 'OBZ Board Set',
    locale: rawBoards.get(homePage.id)?.board.locale || 'en',
    source: { kind: 'obf', filename: opts.filename, importedAt: now },
    homePageId: homePage.id,
    pages,
    createdAt: now,
    updatedAt: now,
    schema: 1,
  };

  return {
    vocab,
    assets,
    warnings: [],
    stats: {
      pages: pages.length,
      buttons: totalButtons,
      images: imgSeq,
      sounds: sndSeq,
    },
  };
}

export function exportObz(vocab: Vocabulary, assetsById: Map<string, AssetBlob>): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const enc = new TextEncoder();
  const manifestBoards: Record<string, string> = {};
  const manifestImages: Record<string, string> = {};
  const manifestSounds: Record<string, string> = {};

  vocab.pages.forEach((page, pageIdx) => {
    const boardPath = `boards/board_${pageIdx + 1}.obf`;
    manifestBoards[page.id] = boardPath;
  });

  for (const page of vocab.pages) {
    const boardPath = manifestBoards[page.id];
    const order: Array<Array<string | null>> = Array.from({ length: page.rows }, () =>
      Array<string | null>(page.cols).fill(null),
    );
    const obfButtons: ObfButton[] = [];
    const obfImages: ObfImage[] = [];
    const obfSounds: ObfSound[] = [];

    for (const b of page.buttons) {
      for (let r = b.row; r < Math.min(page.rows, b.row + b.rowSpan); r++) {
        for (let c = b.col; c < Math.min(page.cols, b.col + b.colSpan); c++) {
          order[r][c] = b.id;
        }
      }

      let imageId: string | undefined;
      if (b.image?.startsWith('img:')) {
        const aid = b.image.slice(4);
        const blob = assetsById.get(aid);
        if (blob) {
          const ext = extForMime(blob.mime);
          const zipImgPath = `images/${aid.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
          files[zipImgPath] = blob.data;
          manifestImages[aid] = zipImgPath;
          imageId = aid;
          obfImages.push({
            id: aid,
            path: zipImgPath,
            content_type: blob.mime,
            data: `data:${blob.mime};base64,${bytesToBase64(blob.data)}`,
          });
        }
      } else if (b.image?.startsWith('url:')) {
        const u = b.image.slice(4);
        imageId = `url_${b.id}`;
        obfImages.push({ id: imageId, url: u });
      }

      let loadBoard: ObfButton['load_board'] | undefined;
      let soundId: string | undefined;
      const actionStrings: string[] = [];

      for (const act of b.actions) {
        switch (act.type) {
          case 'navigate':
            if (manifestBoards[act.pageId]) {
              loadBoard = { id: act.pageId, path: manifestBoards[act.pageId] };
            }
            break;
          case 'clear':
            actionStrings.push(':clear');
            break;
          case 'backspace':
            actionStrings.push(':backspace');
            break;
          case 'deleteWord':
            actionStrings.push(':delete_word');
            break;
          case 'speakWindow':
            actionStrings.push(':speak');
            break;
          case 'home':
            actionStrings.push(':home');
            break;
          case 'back':
            actionStrings.push(':back');
            break;
          case 'insert':
            if (act.text && act.text !== b.label && act.text !== b.message) {
              actionStrings.push(`+${act.text}`);
            }
            break;
          case 'playSound': {
            const blob = assetsById.get(act.assetId);
            if (blob) {
              const ext = extForMime(blob.mime);
              const zipSndPath = `sounds/${act.assetId.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
              files[zipSndPath] = blob.data;
              manifestSounds[act.assetId] = zipSndPath;
              soundId = act.assetId;
              obfSounds.push({ id: act.assetId, path: zipSndPath, content_type: blob.mime });
            }
            break;
          }
          default:
            break;
        }
      }

      obfButtons.push({
        id: b.id,
        label: b.label,
        vocalization: b.message,
        image_id: imageId,
        sound_id: soundId,
        background_color: b.style.bg,
        border_color: b.style.border,
        text_color: b.style.fg,
        hidden: b.hidden,
        load_board: loadBoard,
        actions: actionStrings.length ? actionStrings : undefined,
      });
    }

    const boardJson: ObfBoard = {
      format: 'open-board-0.1',
      id: page.id,
      locale: vocab.locale ?? 'en',
      name: page.name,
      grid: {
        rows: page.rows,
        columns: page.cols,
        order,
      },
      buttons: obfButtons,
      images: obfImages,
      sounds: obfSounds,
    };
    files[boardPath] = enc.encode(JSON.stringify(boardJson, null, 2));
  }

  const rootBoardPath = manifestBoards[vocab.homePageId] ?? Object.values(manifestBoards)[0];
  const manifest: ObzManifest = {
    format: 'open-board-0.1',
    root: rootBoardPath,
    paths: {
      boards: manifestBoards,
      images: manifestImages,
      sounds: manifestSounds,
    },
  };
  files['manifest.json'] = enc.encode(JSON.stringify(manifest, null, 2));

  return zipSync(files);
}
