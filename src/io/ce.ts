import { unzipSync, zipSync } from 'fflate';
import type { Database } from 'sql.js';
import {
  type Action,
  type AssetBlob,
  type Button,
  type ButtonStyle,
  type ButtonVariant,
  type ID,
  type ImportOptions,
  type ImportResult,
  type Page,
  type Vocabulary,
  FORM_DEFAULT,
} from '../model';
import { getSql } from './sql';
import {
  clamp,
  colorrefToHex,
  decodeImagePayload,
  isZip,
  newId,
  sniffSound,
  tick,
} from './util';
import { resolveIconForButton } from '../data/icons';

function isSqliteHeader(d: Uint8Array): boolean {
  if (d.length < 16) return false;
  const head = new TextDecoder('ascii').decode(d.subarray(0, 15));
  return head === 'SQLite format 3';
}

function tableSet(db: Database): Set<string> {
  const out = new Set<string>();
  const res = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  if (res[0]) {
    for (const row of res[0].values) {
      if (typeof row[0] === 'string') out.add(row[0]);
    }
  }
  return out;
}

function columnSet(db: Database, table: string): Set<string> {
  const out = new Set<string>();
  try {
    const res = db.exec(`PRAGMA table_info("${table}")`);
    if (res[0]) {
      for (const row of res[0].values) {
        if (typeof row[1] === 'string') out.add(row[1]);
      }
    }
  } catch {
    return out;
  }
  return out;
}

interface RawActionEntry {
  rank: number;
  code: number;
  params: Map<number, string>;
}

interface RawButtonRow {
  id: number;
  resourceId: number;
  label: string;
  message?: string;
  pronunciation?: string;
  symbolLinkId: number | null;
  visible: boolean;
  styleId: number;
}

export async function importCe(data: Uint8Array, opts: ImportOptions = {}): Promise<ImportResult> {
  const progress = opts.onProgress ?? (() => {});
  const vocabId = opts.vocabId ?? `tc-${newId()}`;
  const warnings: string[] = [];
  const assets: AssetBlob[] = [];

  progress(0.05, 'Unpacking TouchChat archive…');
  await tick();

  let c4vBytes: Uint8Array | null = null;
  let c4vEntryName = '';
  let imagesBytes: Uint8Array | null = null;

  if (isZip(data)) {
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(data, {
        filter: (file) => {
          const lower = file.name.toLowerCase();
          return lower.endsWith('.c4v') || lower.endsWith('.c4s');
        },
      });
    } catch (e) {
      throw new Error(
        `Could not read TouchChat archive (${e instanceof Error ? e.message : 'corrupt ZIP file'}).`,
      );
    }
    for (const [name, bytes] of Object.entries(entries)) {
      const lower = name.toLowerCase();
      if (lower.endsWith('.c4v') && !c4vBytes) {
        c4vBytes = bytes;
        c4vEntryName = name;
      } else if (lower.endsWith('images.c4s') || (lower.endsWith('.c4s') && !imagesBytes)) {
        imagesBytes = bytes;
      }
    }
    if (!c4vBytes) {
      throw new Error('This archive does not contain a TouchChat vocabulary (.c4v) database.');
    }
  } else if (isSqliteHeader(data)) {
    c4vBytes = data;
    c4vEntryName = opts.filename ?? 'Vocabulary.c4v';
  } else {
    throw new Error(
      'Not a valid TouchChat (.ce / .c4v) file. Expected a TouchChat ZIP archive or SQLite vocabulary database.',
    );
  }

  if (!isSqliteHeader(c4vBytes)) {
    throw new Error('The vocabulary database inside this TouchChat file is corrupt or not a SQLite 3 file.');
  }

  progress(0.15, 'Initializing SQLite engine…');
  const SQL = await getSql();
  await tick();

  let db: Database;
  try {
    db = new SQL.Database(c4vBytes);
  } catch (e) {
    throw new Error(`Could not open TouchChat SQLite database: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const tables = tableSet(db);
    if (!tables.has('pages') || !tables.has('buttons')) {
      throw new Error('This SQLite database is missing required TouchChat tables (pages, buttons).');
    }

    progress(0.25, 'Reading vocabulary metadata and styles…');

    const vars = new Map<string, string>();
    if (tables.has('variables')) {
      const res = db.exec('SELECT name, value FROM variables');
      if (res[0]) {
        for (const [k, v] of res[0].values) {
          if (typeof k === 'string' && v != null) vars.set(k, String(v));
        }
      }
    }

    const resCols = columnSet(db, 'resources');
    const hasRid = resCols.has('rid');
    const resourceById = new Map<number, { rid: string; name: string; type: number }>();
    const resourceIdByRid = new Map<string, number>();
    if (tables.has('resources')) {
      const res = db.exec(`SELECT id, ${hasRid ? 'rid' : "''"}, name, type FROM resources`);
      if (res[0]) {
        for (const row of res[0].values) {
          const id = Number(row[0]);
          const rid = row[1] ? String(row[1]) : '';
          const name = row[2] != null ? String(row[2]) : '';
          const type = Number(row[3] ?? 0);
          resourceById.set(id, { rid, name, type });
          if (rid) resourceIdByRid.set(rid, id);
        }
      }
    }

    const symbolRidByLinkId = new Map<number, string>();
    if (tables.has('symbol_links')) {
      const res = db.exec('SELECT id, rid FROM symbol_links');
      if (res[0]) {
        for (const [id, rid] of res[0].values) {
          if (id != null && typeof rid === 'string') symbolRidByLinkId.set(Number(id), rid);
        }
      }
    }

    const imageAssetBySymbolRid = new Map<string, ID>();
    let unsupportedSymbolFormats = 0;
    if (imagesBytes && isSqliteHeader(imagesBytes)) {
      let imgDb: Database | null = null;
      try {
        imgDb = new SQL.Database(imagesBytes);
        const imgTables = tableSet(imgDb);
        const symTable = imgTables.has('symbols') ? 'symbols' : imgTables.has('Symbols') ? 'Symbols' : null;
        if (symTable) {
          const symCols = columnSet(imgDb, symTable);
          const hasCompressed = symCols.has('compressed');
          const res = imgDb.exec(
            `SELECT rid, ${hasCompressed ? 'compressed' : '0'}, data FROM "${symTable}" WHERE data IS NOT NULL`,
          );
          if (res[0]) {
            let imgCounter = 0;
            for (const row of res[0].values) {
              const rid = typeof row[0] === 'string' ? row[0] : '';
              const compressed = Boolean(Number(row[1] ?? 0));
              const raw = row[2];
              if (!rid || !(raw instanceof Uint8Array) || raw.byteLength === 0) continue;
              const decoded = decodeImagePayload(raw, compressed);
              if (!decoded) {
                unsupportedSymbolFormats++;
                continue;
              }
              if (decoded.sniff.kind === 'wmf' || decoded.sniff.kind === 'emf') {
                unsupportedSymbolFormats++;
                continue;
              }
              const assetId = `${vocabId}:img:${++imgCounter}`;
              assets.push({
                id: assetId,
                vocabId,
                kind: 'image',
                mime: decoded.sniff.mime,
                data: decoded.data,
              });
              imageAssetBySymbolRid.set(rid, assetId);
            }
          }
        }
      } catch {
        warnings.push('Could not read embedded Images.c4s symbol database.');
      } finally {
        imgDb?.close();
      }
    }

    const soundAssetByResourceId = new Map<number, ID>();
    const soundAssetByRid = new Map<string, ID>();
    let soundCount = 0;
    if (tables.has('sounds')) {
      const res = db.exec('SELECT id, resource_id, data FROM sounds WHERE data IS NOT NULL');
      if (res[0]) {
        for (const row of res[0].values) {
          const resourceId = Number(row[1]);
          const raw = row[2];
          if (!(raw instanceof Uint8Array) || raw.byteLength === 0) continue;
          const sniff = sniffSound(raw);
          const assetId = `${vocabId}:snd:${++soundCount}`;
          assets.push({
            id: assetId,
            vocabId,
            kind: 'sound',
            mime: sniff.mime,
            data: new Uint8Array(raw),
          });
          soundAssetByResourceId.set(resourceId, assetId);
          const rInfo = resourceById.get(resourceId);
          if (rInfo?.rid) soundAssetByRid.set(rInfo.rid, assetId);
        }
      }
    }

    const buttonStyles = new Map<number, ButtonStyle>();
    if (tables.has('button_styles')) {
      const res = db.exec(
        'SELECT id, label_on_top, transparent, font_color, body_color, border_color, border_width, font_name, font_bold, font_underline, font_italic, font_height FROM button_styles',
      );
      if (res[0]) {
        for (const row of res[0].values) {
          const id = Number(row[0]);
          const labelOnTop = row[1] != null ? Boolean(Number(row[1])) : undefined;
          const transparent = row[2] != null && Number(row[2]) !== 0 ? true : undefined;
          const fontColor = row[3] != null ? colorrefToHex(Number(row[3])) : undefined;
          const bodyRaw = row[4] != null ? Number(row[4]) : 0;
          const bodyColor = bodyRaw !== 0 ? colorrefToHex(bodyRaw) : undefined;
          const borderRaw = row[5] != null ? Number(row[5]) : null;
          const borderColor = borderRaw != null && borderRaw !== 0 ? colorrefToHex(borderRaw) : undefined;
          const borderWidth = row[6] != null ? clamp(Number(row[6]), 0, 8) : undefined;
          const fontFamily = typeof row[7] === 'string' && row[7].trim() ? row[7].trim() : undefined;
          const bold = row[8] != null && Number(row[8]) !== 0 ? true : undefined;
          const underline = row[9] != null && Number(row[9]) !== 0 ? true : undefined;
          const italic = row[10] != null && Number(row[10]) !== 0 ? true : undefined;
          const fh = row[11] != null ? Number(row[11]) : 0;
          const fontScale = fh > 0 ? +clamp(fh / 16, 0.5, 3).toFixed(2) : undefined;

          buttonStyles.set(id, {
            bg: bodyColor,
            fg: fontColor,
            border: borderColor,
            borderWidth,
            fontScale,
            bold,
            italic,
            underline,
            fontFamily,
            labelOnTop,
            transparent,
          });
        }
      }
    }

    const pageBgByStyleId = new Map<number, string>();
    if (tables.has('page_styles')) {
      const res = db.exec('SELECT id, bg_color FROM page_styles');
      if (res[0]) {
        for (const [id, bg] of res[0].values) {
          if (id != null && bg != null && Number(bg) !== 0) {
            pageBgByStyleId.set(Number(id), colorrefToHex(Number(bg)));
          }
        }
      }
    }

    progress(0.4, 'Loading pages and navigation targets…');
    await tick();

    const specialByPageNumId = new Map<number, string>();
    let homePageNumId: number | null = null;
    if (tables.has('special_pages')) {
      const res = db.exec('SELECT name, page_id FROM special_pages');
      if (res[0]) {
        for (const [name, pid] of res[0].values) {
          const n = String(name ?? '').toUpperCase();
          const numPid = Number(pid);
          specialByPageNumId.set(numPid, n);
          if (n === 'HOME') homePageNumId = numPid;
        }
      }
    }

    interface PageMeta {
      numId: number;
      resourceId: number;
      id: ID;
      name: string;
      bg?: string;
      hidden?: boolean;
    }
    const pageMetaByNumId = new Map<number, PageMeta>();
    const pageIdByRid = new Map<string, ID>();
    const pageIdByResourceId = new Map<number, ID>();
    const pageCols = columnSet(db, 'pages');
    const hasPageStyle = pageCols.has('page_style_id');

    {
      const res = db.exec(
        `SELECT id, resource_id, ${hasPageStyle ? 'page_style_id' : '0'} FROM pages ORDER BY id`,
      );
      if (res[0]) {
        for (const row of res[0].values) {
          const numId = Number(row[0]);
          const resourceId = Number(row[1]);
          const styleId = Number(row[2] ?? 0);
          const rInfo = resourceById.get(resourceId);
          const rid = rInfo?.rid || '';
          const id: ID = rid || `p${numId}`;
          const rawName = rInfo?.name || `Page ${numId}`;
          const special = specialByPageNumId.get(numId);
          const isHidden =
            (special != null && special !== 'HOME') ||
            (rawName.startsWith('.') && numId !== homePageNumId);
          const cleanName = rawName.startsWith('.') ? rawName.replace(/^\.+/, '').trim() || rawName : rawName;

          const meta: PageMeta = {
            numId,
            resourceId,
            id,
            name: cleanName,
            bg: pageBgByStyleId.get(styleId),
            hidden: isHidden ? true : undefined,
          };
          pageMetaByNumId.set(numId, meta);
          pageIdByResourceId.set(resourceId, id);
          if (rid) pageIdByRid.set(rid, id);
        }
      }
    }

    progress(0.55, 'Loading actions…');
    await tick();

    const actionsByResourceId = new Map<number, RawActionEntry[]>();
    if (tables.has('actions')) {
      const hasActionData = tables.has('action_data');
      const query = hasActionData
        ? 'SELECT a.id, a.resource_id, a.rank, a.code, ad.key, ad.value FROM actions a LEFT JOIN action_data ad ON ad.action_id = a.id ORDER BY a.resource_id, a.rank, a.id, ad.key'
        : 'SELECT a.id, a.resource_id, a.rank, a.code, NULL, NULL FROM actions a ORDER BY a.resource_id, a.rank, a.id';
      const res = db.exec(query);
      if (res[0]) {
        const byActionId = new Map<number, { resourceId: number; entry: RawActionEntry }>();
        for (const row of res[0].values) {
          const actionId = Number(row[0]);
          const resourceId = Number(row[1]);
          const rank = Number(row[2] ?? 0);
          const code = Number(row[3] ?? 0);
          let rec = byActionId.get(actionId);
          if (!rec) {
            const entry: RawActionEntry = { rank, code, params: new Map() };
            rec = { resourceId, entry };
            byActionId.set(actionId, rec);
            let list = actionsByResourceId.get(resourceId);
            if (!list) {
              list = [];
              actionsByResourceId.set(resourceId, list);
            }
            list.push(entry);
          }
          if (row[4] != null && row[5] != null) {
            rec.entry.params.set(Number(row[4]), String(row[5]));
          }
        }
      }
    }

    function convertButtonActions(
      resourceId: number,
      label: string,
      message: string | undefined,
    ): Action[] {
      const rawList = actionsByResourceId.get(resourceId) ?? [];
      if (rawList.length === 0) {
        return [];
      }

      const codes = new Set<number>(rawList.map((r) => r.code));
      const hasNav = codes.has(8) || codes.has(9) || codes.has(73) || codes.has(6);
      const hasExplicitInsert = codes.has(10) || codes.has(16);
      const hasCode60 = codes.has(60);
      const hasCode65 = codes.has(65);

      const trimmedLabel = label.trim();
      const isDashSuffix = /^-[a-zA-Z]+$/.test(trimmedLabel) && (!message || message.trim() === '');

      const out: Action[] = [];
      let emittedInsert = false;

      for (const item of rawList) {
        const c = item.code;
        switch (c) {
          case 60:
            break;
          case 53:
            break;
          case 10: {
            if (!emittedInsert) {
              const attach = hasCode60 || codes.has(16);
              out.push(attach ? { type: 'insert', attach: true } : { type: 'insert' });
              emittedInsert = true;
            }
            break;
          }
          case 16: {
            if (!emittedInsert) {
              const text = (message && message.length > 0 ? message : label) || '.';
              out.push({ type: 'insert', text, attach: true });
              emittedInsert = true;
            }
            break;
          }
          case 65: {
            if (isDashSuffix && !emittedInsert) {
              out.push({ type: 'insert', text: trimmedLabel.slice(1), attach: true });
              emittedInsert = true;
            }
            break;
          }
          case 3:
          case 42:
            out.push({ type: 'speakWindow' });
            break;
          case 8:
          case 9:
          case 73: {
            const rawTarget = (item.params.get(0) ?? '').replace(/^'+|'+$/g, '').trim();
            let targetPageId: ID | undefined =
              pageIdByRid.get(rawTarget) ??
              ( /^\d+$/.test(rawTarget)
                ? pageMetaByNumId.get(Number(rawTarget))?.id ?? pageIdByResourceId.get(Number(rawTarget))
                : undefined );
            if (!targetPageId && rawTarget) {
              for (const pm of pageMetaByNumId.values()) {
                if (pm.name === rawTarget) {
                  targetPageId = pm.id;
                  break;
                }
              }
            }
            if (targetPageId) {
              out.push({ type: 'navigate', pageId: targetPageId });
            }
            break;
          }
          case 6:
            out.push({ type: 'back' });
            break;
          case 28:
          case 77:
            out.push({ type: 'clear' });
            break;
          case 43:
            out.push({ type: 'deleteWord' });
            break;
          case 71: {
            const rawForm = (item.params.get(0) ?? '').replace(/^'+|'+$/g, '').trim();
            const formNum = parseInt(rawForm, 10);
            if (!Number.isNaN(formNum)) {
              out.push({ type: 'setForm', form: formNum });
            }
            break;
          }
          case 4: {
            const rawSnd = (item.params.get(0) ?? '').replace(/^'+|'+$/g, '').trim();
            const assetId =
              soundAssetByRid.get(rawSnd) ??
              (/^\d+$/.test(rawSnd) ? soundAssetByResourceId.get(Number(rawSnd)) : undefined);
            if (assetId) out.push({ type: 'playSound', assetId });
            break;
          }
          case 23:
            out.push({ type: 'toggleMute' });
            break;
          case 40:
            out.push({ type: 'volumeUp' });
            break;
          case 41:
            out.push({ type: 'volumeDown' });
            break;
          case 45:
            out.push({ type: 'speakTime' });
            break;
          case 24:
            out.push({ type: 'saveMessage' });
            break;
          case 66:
            out.push({ type: 'copy' });
            break;
          case 68:
            out.push({ type: 'share' });
            break;
          default:
            out.push({ type: 'unsupported', source: 'touchchat', code: c });
            break;
        }
      }

      if (!emittedInsert && isDashSuffix && (hasCode60 || hasCode65) && !hasNav) {
        out.unshift({ type: 'insert', text: trimmedLabel.slice(1), attach: true });
        emittedInsert = true;
      }

      if (!emittedInsert && hasCode60 && !hasExplicitInsert && !hasNav && (message || trimmedLabel)) {
        out.unshift({ type: 'insert', attach: true });
      }

      const actionable = out.filter((a) => a.type !== 'unsupported');
      const onlySetForm = actionable.length > 0 && actionable.every((a) => a.type === 'setForm');
      if ((actionable.length === 0 || onlySetForm) && (trimmedLabel || (message && message.trim()))) {
        out.unshift({ type: 'insert', attach: hasCode60 ? true : undefined });
      }

      return out;
    }

    progress(0.7, 'Loading buttons and grammar sets…');
    await tick();

    const btnCols = columnSet(db, 'buttons');
    const hasPronunciation = btnCols.has('pronunciation');
    const hasVisible = btnCols.has('visible');
    const hasSymLink = btnCols.has('symbol_link_id');
    const hasBtnStyle = btnCols.has('button_style_id');

    const buttonById = new Map<number, RawButtonRow>();
    const buttonByResourceId = new Map<number, RawButtonRow>();
    let missingSymbolRefs = 0;

    {
      const res = db.exec(
        `SELECT id, resource_id, label, message, ${hasPronunciation ? 'pronunciation' : 'NULL'}, ${
          hasSymLink ? 'symbol_link_id' : 'NULL'
        }, ${hasVisible ? 'visible' : '1'}, ${hasBtnStyle ? 'button_style_id' : '0'} FROM buttons`,
      );
      if (res[0]) {
        for (const row of res[0].values) {
          const b: RawButtonRow = {
            id: Number(row[0]),
            resourceId: Number(row[1]),
            label: row[2] != null ? String(row[2]) : '',
            message: row[3] != null && String(row[3]) !== '' ? String(row[3]) : undefined,
            pronunciation:
              row[4] != null && String(row[4]).trim() !== '' ? String(row[4]).trim() : undefined,
            symbolLinkId: row[5] != null ? Number(row[5]) : null,
            visible: row[6] == null ? true : Number(row[6]) !== 0,
            styleId: Number(row[7] ?? 0),
          };
          buttonById.set(b.id, b);
          buttonByResourceId.set(b.resourceId, b);
        }
      }
    }

    function resolveSymbolImage(symbolLinkId: number | null): string | undefined {
      if (symbolLinkId == null) return undefined;
      const symRid = symbolRidByLinkId.get(symbolLinkId);
      if (!symRid) return undefined;
      const assetId = imageAssetBySymbolRid.get(symRid);
      if (assetId) return `img:${assetId}`;
      missingSymbolRefs++;
      return undefined;
    }

    const buttonSetModifiersByResourceId = new Map<number, Array<{ modifier: number; button: RawButtonRow }>>();
    if (tables.has('button_sets') && tables.has('button_set_modifiers')) {
      const res = db.exec(
        'SELECT bs.resource_id, bsm.modifier, bsm.button_id FROM button_sets bs JOIN button_set_modifiers bsm ON bsm.button_set_id = bs.id ORDER BY bs.resource_id, bsm.modifier',
      );
      if (res[0]) {
        for (const row of res[0].values) {
          const setResId = Number(row[0]);
          const modifier = Number(row[1] ?? 0);
          const btnId = Number(row[2]);
          const btn = buttonById.get(btnId);
          if (!btn) continue;
          let list = buttonSetModifiersByResourceId.get(setResId);
          if (!list) {
            list = [];
            buttonSetModifiersByResourceId.set(setResId, list);
          }
          list.push({ modifier, button: btn });
        }
      }
    }

    progress(0.85, 'Assembling page grids…');
    await tick();

    interface RawBox {
      id: number;
      cols: number;
      rows: number;
      cells: Array<{
        cellId: number;
        resourceId: number;
        location: number;
        spanX: number;
        spanY: number;
      }>;
    }

    const boxesById = new Map<number, RawBox>();
    if (tables.has('button_boxes')) {
      const res = db.exec('SELECT id, layout_x, layout_y FROM button_boxes');
      if (res[0]) {
        for (const [id, lx, ly] of res[0].values) {
          boxesById.set(Number(id), {
            id: Number(id),
            cols: clamp(Number(lx) || 10, 1, 40),
            rows: clamp(Number(ly) || 6, 1, 40),
            cells: [],
          });
        }
      }
    }

    if (tables.has('button_box_cells')) {
      const res = db.exec(
        'SELECT id, button_box_id, resource_id, location, span_x, span_y FROM button_box_cells ORDER BY button_box_id, location, id',
      );
      if (res[0]) {
        for (const row of res[0].values) {
          const box = boxesById.get(Number(row[1]));
          if (!box) continue;
          box.cells.push({
            cellId: Number(row[0]),
            resourceId: Number(row[2]),
            location: Math.max(0, Number(row[3] ?? 0)),
            spanX: Math.max(1, Number(row[4] ?? 1)),
            spanY: Math.max(1, Number(row[5] ?? 1)),
          });
        }
      }
    }

    interface BoxInstance {
      boxId: number;
      posX: number;
      posY: number;
      sizeX: number;
      sizeY: number;
    }
    const instancesByPageNumId = new Map<number, BoxInstance[]>();
    if (tables.has('button_box_instances')) {
      const res = db.exec(
        'SELECT page_id, button_box_id, position_x, position_y, size_x, size_y FROM button_box_instances ORDER BY id',
      );
      if (res[0]) {
        for (const row of res[0].values) {
          const pid = Number(row[0]);
          let list = instancesByPageNumId.get(pid);
          if (!list) {
            list = [];
            instancesByPageNumId.set(pid, list);
          }
          list.push({
            boxId: Number(row[1]),
            posX: Number(row[2] ?? 0),
            posY: Number(row[3] ?? 0),
            sizeX: Number(row[4] ?? 10000) || 10000,
            sizeY: Number(row[5] ?? 10000) || 10000,
          });
        }
      }
    }

    function buildButtonFromCell(
      cellId: number,
      resourceId: number,
      row: number,
      col: number,
      rowSpan: number,
      colSpan: number,
    ): Button | null {
      const directBtn = buttonByResourceId.get(resourceId);
      const modList = buttonSetModifiersByResourceId.get(resourceId);

      if (modList && modList.length > 0) {
        const baseEntry = modList.find((m) => m.modifier === FORM_DEFAULT) ?? modList[0];
        const baseRaw = baseEntry.button;
        const baseActions = convertButtonActions(baseRaw.resourceId, baseRaw.label, baseRaw.message);
        const baseImage =
          resolveSymbolImage(baseRaw.symbolLinkId) ??
          resolveIconForButton(baseRaw.label, baseRaw.message, baseActions);
        const baseStyle = buttonStyles.get(baseRaw.styleId) ?? {};
        const baseSig = JSON.stringify({
          l: baseRaw.label,
          m: baseRaw.message,
          a: baseActions,
          h: !baseRaw.visible,
        });

        const variants: Record<number, ButtonVariant> = {};
        let variantCount = 0;
        for (const { modifier, button: vRaw } of modList) {
          if (modifier === FORM_DEFAULT) continue;
          const vActions = convertButtonActions(vRaw.resourceId, vRaw.label, vRaw.message);
          const vSig = JSON.stringify({
            l: vRaw.label,
            m: vRaw.message,
            a: vActions,
            h: !vRaw.visible,
          });
          if (vSig === baseSig) continue;
          const vImg =
            resolveSymbolImage(vRaw.symbolLinkId) ??
            resolveIconForButton(vRaw.label, vRaw.message, vActions);
          variants[modifier] = {
            label: vRaw.label,
            message: vRaw.message !== vRaw.label ? vRaw.message : undefined,
            image: vImg !== baseImage ? vImg : undefined,
            actions: vActions,
            hidden: !vRaw.visible ? true : undefined,
          };
          variantCount++;
        }

        const rInfo = resourceById.get(resourceId);
        return {
          id: rInfo?.rid || `b${baseRaw.id}_${cellId}`,
          label: baseRaw.label,
          message: baseRaw.message !== baseRaw.label ? baseRaw.message : undefined,
          pronunciation: baseRaw.pronunciation,
          image: baseImage,
          style: { ...baseStyle },
          actions: baseActions,
          variants: variantCount > 0 ? variants : undefined,
          row,
          col,
          rowSpan,
          colSpan,
          hidden: !baseRaw.visible ? true : undefined,
        };
      }

      if (directBtn) {
        const actions = convertButtonActions(directBtn.resourceId, directBtn.label, directBtn.message);
        const image =
          resolveSymbolImage(directBtn.symbolLinkId) ??
          resolveIconForButton(directBtn.label, directBtn.message, actions);
        const style = buttonStyles.get(directBtn.styleId) ?? {};
        const rInfo = resourceById.get(resourceId);
        return {
          id: rInfo?.rid || `b${directBtn.id}_${cellId}`,
          label: directBtn.label,
          message: directBtn.message !== directBtn.label ? directBtn.message : undefined,
          pronunciation: directBtn.pronunciation,
          image,
          style: { ...style },
          actions,
          row,
          col,
          rowSpan,
          colSpan,
          hidden: !directBtn.visible ? true : undefined,
        };
      }

      return null;
    }

    const pages: Page[] = [];
    let totalButtons = 0;

    for (const meta of pageMetaByNumId.values()) {
      const instances = instancesByPageNumId.get(meta.numId) ?? [];
      let pageCols = 10;
      let pageRows = 6;
      const buttons: Button[] = [];

      if (instances.length === 1) {
        const box = boxesById.get(instances[0].boxId);
        if (box) {
          pageCols = box.cols;
          pageRows = box.rows;
          for (const cell of box.cells) {
            const c = cell.location % box.cols;
            const r = Math.floor(cell.location / box.cols);
            if (r >= pageRows || c >= pageCols) continue;
            const rs = Math.min(cell.spanY, pageRows - r);
            const cs = Math.min(cell.spanX, pageCols - c);
            const btn = buildButtonFromCell(cell.cellId, cell.resourceId, r, c, rs, cs);
            if (btn) buttons.push(btn);
          }
        }
      } else if (instances.length > 1) {
        let estCols = 1;
        let estRows = 1;
        for (const inst of instances) {
          const box = boxesById.get(inst.boxId);
          if (!box) continue;
          const fracW = clamp(inst.sizeX / 10000, 0.05, 1);
          const fracH = clamp(inst.sizeY / 10000, 0.05, 1);
          estCols = Math.max(estCols, Math.round(box.cols / fracW));
          estRows = Math.max(estRows, Math.round(box.rows / fracH));
        }
        pageCols = clamp(estCols, 1, 40);
        pageRows = clamp(estRows, 1, 40);

        for (const inst of instances) {
          const box = boxesById.get(inst.boxId);
          if (!box) continue;
          const baseCol = Math.round((clamp(inst.posX, 0, 10000) / 10000) * pageCols);
          const baseRow = Math.round((clamp(inst.posY, 0, 10000) / 10000) * pageRows);
          const spanCols = Math.max(1, Math.round((clamp(inst.sizeX, 0, 10000) / 10000) * pageCols));
          const spanRows = Math.max(1, Math.round((clamp(inst.sizeY, 0, 10000) / 10000) * pageRows));

          for (const cell of box.cells) {
            const localCol = cell.location % box.cols;
            const localRow = Math.floor(cell.location / box.cols);
            const c = clamp(baseCol + Math.floor((localCol * spanCols) / box.cols), 0, pageCols - 1);
            const r = clamp(baseRow + Math.floor((localRow * spanRows) / box.rows), 0, pageRows - 1);
            const cs = clamp(Math.round((cell.spanX * spanCols) / box.cols), 1, pageCols - c);
            const rs = clamp(Math.round((cell.spanY * spanRows) / box.rows), 1, pageRows - r);
            const btn = buildButtonFromCell(cell.cellId, cell.resourceId, r, c, rs, cs);
            if (btn) buttons.push(btn);
          }
        }
      }

      totalButtons += buttons.length;
      pages.push({
        id: meta.id,
        name: meta.name,
        rows: pageRows,
        cols: pageCols,
        bg: meta.bg,
        buttons,
        hidden: meta.hidden,
      });
    }

    if (pages.length === 0) {
      throw new Error('No pages were found in this TouchChat vocabulary.');
    }

    let homePageId: ID =
      (homePageNumId != null ? pageMetaByNumId.get(homePageNumId)?.id : undefined) ??
      pages.find((p) => !p.hidden)?.id ??
      pages[0].id;
    if (!pages.some((p) => p.id === homePageId)) {
      homePageId = pages[0].id;
    }

    const homePageObj = pages.find((p) => p.id === homePageId);
    if (homePageObj && homePageObj.hidden) {
      delete homePageObj.hidden;
    }

    const homeIdx = pages.findIndex((p) => p.id === homePageId);
    if (homeIdx > 0) {
      const [hp] = pages.splice(homeIdx, 1);
      pages.unshift(hp);
    }

    if (missingSymbolRefs > 0) {
      warnings.push(
        `${missingSymbolRefs.toLocaleString()} button symbols referenced proprietary TouchChat symbol libraries (e.g. SymbolStix / PCS) that are not embedded in .ce files, so those buttons display text only.`,
      );
    }
    if (unsupportedSymbolFormats > 0) {
      warnings.push(
        `${unsupportedSymbolFormats} embedded symbol(s) used a legacy Windows Metafile (WMF/EMF) format and were skipped.`,
      );
    }

    const fallbackName = (opts.filename || c4vEntryName || 'TouchChat Vocabulary')
      .replace(/^.*[/\\]/, '')
      .replace(/\.(ce|wf|c4v)$/i, '');
    const vocabName = vars.get('Name')?.trim() || fallbackName || 'TouchChat Vocabulary';
    const locale = vars.get('Locale')?.trim() || 'en';
    const description = vars.get('Description')?.trim() || undefined;
    const now = Date.now();

    const vocab: Vocabulary = {
      id: vocabId,
      name: vocabName,
      description,
      locale,
      source: {
        kind: 'touchchat',
        filename: opts.filename,
        importedAt: now,
      },
      homePageId,
      pages,
      createdAt: now,
      updatedAt: now,
      schema: 1,
    };

    const imageAssetsCount = assets.filter((a) => a.kind === 'image').length;
    progress(1, 'Import complete');

    return {
      vocab,
      assets,
      warnings,
      stats: {
        pages: pages.length,
        buttons: totalButtons,
        images: imageAssetsCount,
        sounds: soundCount,
      },
    };
  } finally {
    db.close();
  }
}

function hexToColorref(hex: string | undefined): number | null {
  if (!hex) return null;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return (b << 16) | (g << 8) | r;
}

export async function exportCe(
  vocab: Vocabulary,
  assetsById: Map<string, AssetBlob> = new Map(),
): Promise<Uint8Array> {
  const SQL = await getSql();
  const c4v = new SQL.Database();
  const imgDb = new SQL.Database();
  const manDb = new SQL.Database();

  try {
    c4v.run(`
      CREATE TABLE variables (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, value VARCHAR NOT NULL);
      CREATE TABLE resources (id INTEGER PRIMARY KEY AUTOINCREMENT, rid TEXT NOT NULL UNIQUE, name TEXT NOT NULL, type INTEGER NOT NULL);
      CREATE TABLE sounds (id INTEGER PRIMARY KEY AUTOINCREMENT, resource_id INTEGER NOT NULL, data BLOB);
      CREATE TABLE button_styles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label_on_top INTEGER, force_label_on_top INTEGER DEFAULT 0,
        transparent INTEGER, force_transparent INTEGER DEFAULT 0,
        font_color INTEGER, force_font_color INTEGER DEFAULT 0,
        body_color INTEGER, force_body_color INTEGER DEFAULT 0,
        border_color INTEGER, force_border_color INTEGER DEFAULT 0,
        border_width INTEGER, force_border_width INTEGER DEFAULT 0,
        font_name TEXT, font_bold INTEGER, font_underline INTEGER, font_italic INTEGER, font_height INTEGER, force_font INTEGER DEFAULT 0
      );
      CREATE TABLE page_styles (id INTEGER PRIMARY KEY AUTOINCREMENT, bg_color INTEGER, force_bg_color INTEGER DEFAULT 0, bg_alignment INTEGER DEFAULT 3, force_bg_alignment INTEGER DEFAULT 0);
      CREATE TABLE pages (id INTEGER PRIMARY KEY AUTOINCREMENT, resource_id INTEGER NOT NULL UNIQUE, symbol_link_id INTEGER, page_style_id INTEGER NOT NULL, button_style_id INTEGER NOT NULL, feature INTEGER);
      CREATE TABLE special_pages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, page_id INTEGER NOT NULL);
      CREATE TABLE button_boxes (id INTEGER PRIMARY KEY AUTOINCREMENT, resource_id INTEGER NOT NULL, layout_x INTEGER, layout_y INTEGER, init_size_x INTEGER, init_size_y INTEGER, scan_pattern_id INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE button_box_instances (id INTEGER PRIMARY KEY AUTOINCREMENT, page_id INTEGER NOT NULL, button_box_id INTEGER NOT NULL, position_x INTEGER, position_y INTEGER, size_x INTEGER, size_y INTEGER);
      CREATE TABLE button_box_cells (id INTEGER PRIMARY KEY AUTOINCREMENT, button_box_id INTEGER NOT NULL, resource_id INTEGER NOT NULL, location INTEGER NOT NULL, span_x INTEGER NOT NULL, span_y INTEGER NOT NULL);
      CREATE TABLE symbol_links (id INTEGER PRIMARY KEY AUTOINCREMENT, rid TEXT NOT NULL, feature INTEGER NOT NULL DEFAULT 14);
      CREATE TABLE buttons (id INTEGER PRIMARY KEY AUTOINCREMENT, resource_id INTEGER NOT NULL, label TEXT, message TEXT, symbol_link_id INTEGER, visible INTEGER, button_style_id INTEGER NOT NULL, pronunciation TEXT DEFAULT NULL, skin_tone_override INTEGER DEFAULT NULL);
      CREATE TABLE button_sets (id INTEGER PRIMARY KEY AUTOINCREMENT, resource_id INTEGER NOT NULL);
      CREATE TABLE button_set_modifiers (id INTEGER PRIMARY KEY AUTOINCREMENT, button_set_id INTEGER NOT NULL, button_id INTEGER NOT NULL, modifier INTEGER NOT NULL);
      CREATE TABLE actions (id INTEGER PRIMARY KEY AUTOINCREMENT, resource_id INTEGER NOT NULL, rank INTEGER NOT NULL, code INTEGER NOT NULL);
      CREATE TABLE action_data (id INTEGER PRIMARY KEY AUTOINCREMENT, action_id INTEGER NOT NULL, key INTEGER NOT NULL, value VARCHAR NOT NULL);
    `);

    imgDb.run(`
      CREATE TABLE variables (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, value VARCHAR NOT NULL);
      CREATE TABLE symbols (id INTEGER PRIMARY KEY AUTOINCREMENT, rid TEXT NOT NULL UNIQUE, compressed INTEGER NOT NULL, type INTEGER NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, data BLOB NOT NULL);
      INSERT INTO variables (name, value) VALUES ('FeatureID', '145'), ('ReadOnly', 'false'), ('Name', 'Export Symbols Symbols');
    `);

    manDb.run(`
      CREATE TABLE variables (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, value VARCHAR NOT NULL);
      INSERT INTO variables (name, value) VALUES ('Origin', 'ChatEditor');
    `);

    c4v.run('INSERT INTO variables (name, value) VALUES (?, ?)', ['Name', vocab.name]);
    c4v.run('INSERT INTO variables (name, value) VALUES (?, ?)', ['Locale', vocab.locale ?? 'en']);
    if (vocab.description) {
      c4v.run('INSERT INTO variables (name, value) VALUES (?, ?)', ['Description', vocab.description]);
    }

    let nextResId = 1;
    let nextPageStyleId = 1;
    let nextBtnStyleId = 1;
    let nextPageId = 1;
    let nextBoxId = 1;
    let nextBtnId = 1;
    let nextBtnSetId = 1;
    let nextSymLinkId = 1;
    let nextActionId = 1;

    c4v.run('INSERT INTO page_styles (id, bg_color) VALUES (1, 0)');
    c4v.run(
      'INSERT INTO button_styles (id, label_on_top, transparent, font_color, body_color, border_color, border_width, font_name, font_bold, font_underline, font_italic, font_height) VALUES (1, 1, 0, 0, 16777215, 6710886, 2, "Ubuntu", 1, 0, 0, 16)',
    );

    const makeGuid = (seed: string, n: number): string => {
      if (/^\{[0-9A-Fa-f-]+\}$/.test(seed)) return seed.toUpperCase();
      const hex = (n.toString(16).padStart(8, '0') + newId().replace(/[^0-9a-f]/gi, '').padEnd(24, '0'))
        .slice(0, 32)
        .toUpperCase();
      return `{${hex.slice(0, 8)}-${hex.slice(8, 16)}-${hex.slice(16, 24)}-${hex.slice(24, 32)}}`;
    };

    const pageRidByPageId = new Map<ID, string>();
    const pageNumByPageId = new Map<ID, number>();

    for (const p of vocab.pages) {
      const numId = nextPageId++;
      pageNumByPageId.set(p.id, numId);
      pageRidByPageId.set(p.id, makeGuid(p.id, numId));
    }

    const symLinkByAssetId = new Map<string, number>();
    const soundRidByAssetId = new Map<string, string>();

    for (const [aid, blob] of assetsById) {
      if (blob.kind === 'image') {
        const symId = nextSymLinkId++;
        const rid = makeGuid(aid, symId);
        imgDb.run(
          'INSERT INTO symbols (rid, compressed, type, width, height, data) VALUES (?, 0, 1, 300, 300, ?)',
          [rid, blob.data],
        );
        c4v.run('INSERT INTO symbol_links (id, rid, feature) VALUES (?, ?, 14)', [symId, rid]);
        symLinkByAssetId.set(aid, symId);
      } else if (blob.kind === 'sound') {
        const resId = nextResId++;
        const rid = makeGuid(aid, resId);
        c4v.run('INSERT INTO resources (id, rid, name, type) VALUES (?, ?, ?, 3)', [resId, rid, aid]);
        c4v.run('INSERT INTO sounds (resource_id, data) VALUES (?, ?)', [resId, blob.data]);
        soundRidByAssetId.set(aid, rid);
      }
    }

    const writeButtonRecord = (
      b: {
        label: string;
        message?: string;
        pronunciation?: string;
        image?: string;
        style: ButtonStyle;
        actions: Action[];
        hidden?: boolean;
      },
      seedId: string,
    ): { btnId: number; resId: number } => {
      const resId = nextResId++;
      const btnId = nextBtnId++;
      const rid = makeGuid(seedId, resId);
      c4v.run('INSERT INTO resources (id, rid, name, type) VALUES (?, ?, ?, 4)', [
        resId,
        rid,
        b.label || `btn_${btnId}`,
      ]);

      const st = b.style ?? {};
      const stId = ++nextBtnStyleId;
      c4v.run(
        'INSERT INTO button_styles (id, label_on_top, transparent, font_color, body_color, border_color, border_width, font_name, font_bold, font_underline, font_italic, font_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          stId,
          st.labelOnTop === false ? 0 : 1,
          st.transparent ? 1 : 0,
          hexToColorref(st.fg) ?? 0,
          hexToColorref(st.bg) ?? 0,
          hexToColorref(st.border) ?? 0x666666,
          st.borderWidth ?? 2,
          st.fontFamily ?? 'Ubuntu',
          st.bold ? 1 : 0,
          st.underline ? 1 : 0,
          st.italic ? 1 : 0,
          Math.round((st.fontScale ?? 1) * 16),
        ],
      );

      let symLink: number | null = null;
      if (b.image?.startsWith('img:')) {
        symLink = symLinkByAssetId.get(b.image.slice(4)) ?? null;
      }

      c4v.run(
        'INSERT INTO buttons (id, resource_id, label, message, symbol_link_id, visible, button_style_id, pronunciation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          btnId,
          resId,
          b.label,
          b.message ?? null,
          symLink,
          b.hidden ? 0 : 1,
          stId,
          b.pronunciation ?? null,
        ],
      );

      let rank = 0;
      const emitAct = (code: number, params?: Record<number, string>) => {
        const aid = nextActionId++;
        c4v.run('INSERT INTO actions (id, resource_id, rank, code) VALUES (?, ?, ?, ?)', [
          aid,
          resId,
          rank++,
          code,
        ]);
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            c4v.run('INSERT INTO action_data (action_id, key, value) VALUES (?, ?, ?)', [
              aid,
              Number(k),
              v,
            ]);
          }
        }
      };

      const acts = b.actions?.length ? b.actions : [{ type: 'insert' as const }];
      for (const act of acts) {
        switch (act.type) {
          case 'insert':
            if (act.attach && /^-[a-zA-Z]+$/.test(b.label.trim()) && act.text === b.label.trim().slice(1)) {
              emitAct(65);
            } else {
              if (act.attach) emitAct(60);
              emitAct(10);
            }
            break;
          case 'speakWindow':
          case 'speak':
            emitAct(3);
            break;
          case 'navigate': {
            const targetRid = pageRidByPageId.get(act.pageId);
            if (targetRid) emitAct(9, { 0: targetRid, 1: '0' });
            break;
          }
          case 'back':
            emitAct(6);
            break;
          case 'clear':
            emitAct(28);
            break;
          case 'deleteWord':
            emitAct(43);
            break;
          case 'setForm':
            emitAct(71, { 0: String(act.form) });
            break;
          case 'playSound': {
            const sRid = soundRidByAssetId.get(act.assetId);
            if (sRid) emitAct(4, { 0: sRid });
            break;
          }
          case 'toggleMute':
            emitAct(23);
            break;
          case 'volumeUp':
            emitAct(40);
            break;
          case 'volumeDown':
            emitAct(41);
            break;
          case 'speakTime':
          case 'speakDate':
            emitAct(45);
            break;
          case 'saveMessage':
            emitAct(24);
            break;
          case 'copy':
            emitAct(66);
            break;
          case 'share':
            emitAct(68);
            break;
          default:
            break;
        }
      }

      return { btnId, resId };
    };

    for (const p of vocab.pages) {
      const pNumId = pageNumByPageId.get(p.id)!;
      const pRid = pageRidByPageId.get(p.id)!;
      const pResId = nextResId++;
      const pName = p.hidden && !p.name.startsWith('.') ? `.${p.name}` : p.name;
      c4v.run('INSERT INTO resources (id, rid, name, type) VALUES (?, ?, ?, 7)', [
        pResId,
        pRid,
        pName,
      ]);

      let pStyleId = 1;
      if (p.bg) {
        pStyleId = ++nextPageStyleId;
        c4v.run('INSERT INTO page_styles (id, bg_color) VALUES (?, ?)', [
          pStyleId,
          hexToColorref(p.bg) ?? 0,
        ]);
      }

      c4v.run(
        'INSERT INTO pages (id, resource_id, page_style_id, button_style_id) VALUES (?, ?, ?, 1)',
        [pNumId, pResId, pStyleId],
      );

      if (p.id === vocab.homePageId) {
        c4v.run("INSERT INTO special_pages (name, page_id) VALUES ('HOME', ?)", [pNumId]);
      }

      const boxId = nextBoxId++;
      const boxResId = nextResId++;
      c4v.run('INSERT INTO resources (id, rid, name, type) VALUES (?, ?, ?, 6)', [
        boxResId,
        makeGuid(`box_${boxId}`, boxResId),
        `${p.name}_box`,
      ]);
      c4v.run(
        'INSERT INTO button_boxes (id, resource_id, layout_x, layout_y, init_size_x, init_size_y, scan_pattern_id) VALUES (?, ?, ?, ?, 1000, 600, 0)',
        [boxId, boxResId, p.cols, p.rows],
      );
      c4v.run(
        'INSERT INTO button_box_instances (page_id, button_box_id, position_x, position_y, size_x, size_y) VALUES (?, ?, 0, 0, 10000, 10000)',
        [pNumId, boxId],
      );

      for (const b of p.buttons) {
        const location = b.row * p.cols + b.col;
        const variantEntries = b.variants ? Object.entries(b.variants) : [];
        let cellResId: number;
        if (variantEntries.length > 0) {
          const setResId = nextResId++;
          const setId = nextBtnSetId++;
          const setRid = makeGuid(b.id, setResId);
          c4v.run('INSERT INTO resources (id, rid, name, type) VALUES (?, ?, ?, 5)', [
            setResId,
            setRid,
            `${b.label || 'set'}_set`,
          ]);
          c4v.run('INSERT INTO button_sets (id, resource_id) VALUES (?, ?)', [setId, setResId]);

          const baseRec = writeButtonRecord(b, `${b.id}_base`);
          c4v.run(
            'INSERT INTO button_set_modifiers (button_set_id, button_id, modifier) VALUES (?, ?, ?)',
            [setId, baseRec.btnId, FORM_DEFAULT],
          );

          for (const [modKey, vr] of variantEntries) {
            const modNum = Number(modKey);
            if (Number.isNaN(modNum) || modNum === FORM_DEFAULT) continue;
            const varRec = writeButtonRecord(
              {
                label: vr.label,
                message: vr.message ?? vr.label,
                image: vr.image ?? b.image,
                style: b.style,
                actions: vr.actions?.length ? vr.actions : b.actions,
                hidden: vr.hidden ?? b.hidden,
              },
              `${b.id}_mod_${modNum}`,
            );
            c4v.run(
              'INSERT INTO button_set_modifiers (button_set_id, button_id, modifier) VALUES (?, ?, ?)',
              [setId, varRec.btnId, modNum],
            );
          }
          cellResId = setResId;
        } else {
          const { resId } = writeButtonRecord(b, b.id);
          cellResId = resId;
        }
        c4v.run(
          'INSERT INTO button_box_cells (button_box_id, resource_id, location, span_x, span_y) VALUES (?, ?, ?, ?, ?)',
          [boxId, cellResId, location, b.colSpan, b.rowSpan],
        );
      }
    }

    const safeFileBase = (vocab.name || 'Vocabulary').replace(/[^a-zA-Z0-9 _-]/g, '_').trim() || 'Vocabulary';
    return zipSync({
      [`${safeFileBase}.c4v`]: c4v.export(),
      'Images.c4s': imgDb.export(),
      'Manifest.c4i': manDb.export(),
      'version.txt': new TextEncoder().encode('4\n'),
    });
  } finally {
    c4v.close();
    imgDb.close();
    manDb.close();
  }
}

