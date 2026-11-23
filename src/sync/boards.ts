import type { Action, Button, ButtonStyle, ButtonVariant, ImageRef, Page } from '../model';
import {
  BOARD_ID_RE,
  type BoardGridValue,
  type BoardMetaValue,
  type ButtonValue,
  type ElementKey,
  type ElementValue,
  type ImageValue,
} from './RemoteSyncAdapter';

export type ElementMap = Map<ElementKey, ElementValue>;

export interface AssetRef {
  sha256: string;
  mime: string;
}

export interface EncodeContext {
  assetHash(assetId: string): AssetRef | undefined;
}

export interface DecodeContext {
  assetIdForHash(sha256: string): string;
}

interface BridgeExt {
  style?: Partial<ButtonStyle>;
  colors?: { bg?: string; fg?: string; border?: string };
  actions?: Action[];
  pronunciation?: string;
  variants?: Record<string, ButtonVariant>;
  image?: string;
  label?: string;
  message?: string;
}

interface BridgeMetaExt {
  bg?: string;
  name?: string;
}

const UPLOADABLE = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const COLOR_RE =
  /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[0-9.]+%?\s*,\s*[0-9.]+%?\s*,\s*[0-9.]+%?\s*(,\s*[0-9.]+\s*)?\)|[a-z]{3,20})$/;
const OBF_ACTION_RE = /^(:[a-z][a-z0-9_-]{0,39}|\+.{1,40})$/;
const GRID_MAX = 32;
const MAX_LABEL = 200;
const MAX_VOCALIZATION = 1000;

export function encodeId(id: string): string {
  if (BOARD_ID_RE.test(id) && !id.startsWith('b64_')) return id;
  const bytes = new TextEncoder().encode(id);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  const encoded = 'b64_' + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (!BOARD_ID_RE.test(encoded)) throw new RangeError(`ID is too long to sync: ${id.slice(0, 20)}…`);
  return encoded;
}

export function decodeId(id: string): string {
  if (!id.startsWith('b64_')) return id;
  const b64 = id.slice(4).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function toSyncImageRef(ref: ImageRef | undefined, ctx: EncodeContext): string | undefined {
  if (!ref) return undefined;
  if (ref.startsWith('img:')) {
    const a = ctx.assetHash(ref.slice(4));
    return a && UPLOADABLE.has(a.mime) ? `blob:${a.sha256}` : undefined;
  }
  return ref;
}

export function fromSyncImageRef(ref: string | undefined, ctx: DecodeContext): ImageRef | undefined {
  if (!ref) return undefined;
  if (ref.startsWith('blob:')) return `img:${ctx.assetIdForHash(ref.slice(5))}`;
  return ref;
}

function arasaacUrl(id: string): string {
  return `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;
}

function guessContentType(url: string): string {
  const path = url.split('?')[0]!.toLowerCase();
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  return 'image/png';
}

function imageElement(ref: ImageRef | undefined, ctx: EncodeContext): ImageValue | null {
  if (!ref) return null;
  const i = ref.indexOf(':');
  const scheme = ref.slice(0, i);
  const value = ref.slice(i + 1);
  if (scheme === 'img') {
    const a = ctx.assetHash(value);
    return a && UPLOADABLE.has(a.mime) ? { sha256: a.sha256, content_type: a.mime } : null;
  }
  if (scheme === 'arasaac' && /^\d{1,10}$/.test(value)) return { url: arasaacUrl(value), content_type: 'image/png' };
  if (scheme === 'url' && value.startsWith('https://') && value.length <= 2048) {
    return { url: value, content_type: guessContentType(value) };
  }
  return null;
}

function obfActions(actions: Action[], label: string, message: string | undefined): string[] {
  const out: string[] = [];
  for (const a of actions) {
    let s: string | null = null;
    if (a.type === 'clear') s = ':clear';
    else if (a.type === 'backspace') s = ':backspace';
    else if (a.type === 'deleteWord') s = ':delete_word';
    else if (a.type === 'speakWindow') s = ':speak';
    else if (a.type === 'home') s = ':home';
    else if (a.type === 'back') s = ':back';
    else if (a.type === 'insert' && a.text && a.text !== label && a.text !== message) s = `+${a.text}`;
    if (s && OBF_ACTION_RE.test(s)) out.push(s);
  }
  return out.slice(0, 10);
}

function actionsFromObf(strings: string[] | undefined, loadBoard: string | undefined): Action[] {
  const out: Action[] = [];
  for (const raw of strings ?? []) {
    if (raw.startsWith('+')) out.push({ type: 'insert', text: raw.slice(1) });
    else if (raw === ':clear') out.push({ type: 'clear' });
    else if (raw === ':backspace') out.push({ type: 'backspace' });
    else if (raw === ':delete_word') out.push({ type: 'deleteWord' });
    else if (raw === ':speak') out.push({ type: 'speakWindow' });
    else if (raw === ':home') out.push({ type: 'home' });
    else if (raw === ':back') out.push({ type: 'back' });
  }
  if (loadBoard) out.push({ type: 'navigate', pageId: loadBoard });
  return out;
}

function syncableActions(actions: Action[]): Action[] {
  return actions
    .filter((a) => a.type !== 'playSound')
    .map((a) => (a.type === 'navigate' ? { type: 'navigate', pageId: encodeId(a.pageId) } : a));
}

function localActions(actions: Action[]): Action[] {
  return actions.map((a) => (a.type === 'navigate' ? { type: 'navigate', pageId: decodeId(a.pageId) } : a));
}

function color(value: string | undefined): string | undefined {
  return value && COLOR_RE.test(value) ? value : undefined;
}

function clampIndex(n: number): number {
  return Math.max(0, Math.min(GRID_MAX - 1, Math.floor(n)));
}

function clampSpan(n: number): number {
  return Math.max(1, Math.min(GRID_MAX, Math.floor(n)));
}

function stripUndefined<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k];
  return o;
}

function styleExtras(style: ButtonStyle): Partial<ButtonStyle> | undefined {
  const { bg: _bg, fg: _fg, border: _border, ...rest } = style;
  const extras = stripUndefined({ ...rest });
  return Object.keys(extras).length ? extras : undefined;
}

function variantsForSync(b: Button, ctx: EncodeContext): Record<string, ButtonVariant> | undefined {
  if (!b.variants) return undefined;
  const out: Record<string, ButtonVariant> = {};
  for (const [form, v] of Object.entries(b.variants)) {
    out[form] = stripUndefined({
      ...v,
      image: toSyncImageRef(v.image, ctx),
      actions: v.actions ? syncableActions(v.actions) : undefined,
    });
  }
  return out;
}

function variantsFromSync(v: Record<string, ButtonVariant> | undefined, ctx: DecodeContext): Button['variants'] {
  if (!v) return undefined;
  const out: Record<number, ButtonVariant> = {};
  for (const [form, value] of Object.entries(v)) {
    out[Number(form)] = stripUndefined({
      ...value,
      image: fromSyncImageRef(value.image, ctx),
      actions: value.actions ? localActions(value.actions) : undefined,
    });
  }
  return out;
}

export function buttonKey(buttonId: string): ElementKey {
  return `button:${encodeId(buttonId)}`;
}

export function imageKey(buttonId: string): ElementKey {
  return `image:${encodeId(buttonId)}`;
}

export function pageToElements(page: Page, ctx: EncodeContext): ElementMap {
  const out: ElementMap = new Map();
  const metaExt: BridgeMetaExt = stripUndefined({
    bg: page.bg && !color(page.bg) ? page.bg : undefined,
    name: page.name.length > MAX_LABEL ? page.name : undefined,
  });
  const meta: BoardMetaValue = stripUndefined({
    name: page.name.slice(0, MAX_LABEL) || 'Board',
    background_color: color(page.bg),
    hidden: page.hidden || undefined,
    ext: Object.keys(metaExt).length ? { ext_bridge: metaExt } : undefined,
  });
  out.set('meta', meta);
  const grid: BoardGridValue = { rows: clampSpan(page.rows), columns: clampSpan(page.cols) };
  out.set('grid', grid);

  for (const b of page.buttons) {
    const img = imageElement(b.image, ctx);
    if (img) out.set(imageKey(b.id), img);
    const syncRef = toSyncImageRef(b.image, ctx);
    const navigate = b.actions.find((a): a is Extract<Action, { type: 'navigate' }> => a.type === 'navigate');
    const ext: BridgeExt = stripUndefined({
      style: styleExtras(b.style),
      colors:
        (b.style.bg && !color(b.style.bg)) || (b.style.fg && !color(b.style.fg)) || (b.style.border && !color(b.style.border))
          ? stripUndefined({ bg: b.style.bg, fg: b.style.fg, border: b.style.border })
          : undefined,
      actions: syncableActions(b.actions),
      pronunciation: b.pronunciation,
      variants: variantsForSync(b, ctx),
      image: syncRef && (!img || !syncRef.startsWith('blob:')) ? syncRef : undefined,
      label: b.label.length > MAX_LABEL ? b.label : undefined,
      message: b.message && b.message.length > MAX_VOCALIZATION ? b.message : undefined,
    });
    const value: ButtonValue = stripUndefined({
      label: b.label ? b.label.slice(0, MAX_LABEL) : undefined,
      vocalization: b.message ? b.message.slice(0, MAX_VOCALIZATION) : undefined,
      image_id: img ? encodeId(b.id) : undefined,
      background_color: color(b.style.bg),
      border_color: color(b.style.border),
      text_color: color(b.style.fg),
      hidden: b.hidden || undefined,
      load_board: navigate ? { id: encodeId(navigate.pageId) } : undefined,
      actions: (() => {
        const a = obfActions(b.actions, b.label, b.message);
        return a.length ? a : undefined;
      })(),
      row: clampIndex(b.row),
      col: clampIndex(b.col),
      row_span: b.rowSpan > 1 ? clampSpan(b.rowSpan) : undefined,
      col_span: b.colSpan > 1 ? clampSpan(b.colSpan) : undefined,
      ext: { ext_bridge: ext },
    });
    out.set(buttonKey(b.id), value);
  }
  return out;
}

export function elementsToPage(
  boardId: string,
  elements: ElementMap,
  ctx: DecodeContext,
  previous?: Page,
): Page | null {
  const meta = elements.get('meta') as BoardMetaValue | undefined;
  if (!meta) return null;
  const metaExt = (meta.ext?.ext_bridge ?? {}) as BridgeMetaExt;
  const grid = elements.get('grid') as BoardGridValue | undefined;
  const prevButtons = new Map((previous?.buttons ?? []).map((b) => [b.id, b]));

  const buttons: Button[] = [];
  for (const [key, raw] of elements) {
    if (!key.startsWith('button:')) continue;
    const v = raw as ButtonValue;
    const id = decodeId(key.slice('button:'.length));
    const ext = (v.ext?.ext_bridge ?? {}) as BridgeExt;
    const imageEl = v.image_id ? (elements.get(`image:${v.image_id}`) as ImageValue | undefined) : undefined;
    let image: ImageRef | undefined = fromSyncImageRef(ext.image, ctx);
    if (!image && imageEl) {
      image = imageEl.sha256 ? `img:${ctx.assetIdForHash(imageEl.sha256)}` : imageEl.url ? `url:${imageEl.url}` : undefined;
    }
    const actions = ext.actions
      ? localActions(ext.actions)
      : actionsFromObf(v.actions, v.load_board ? decodeId(v.load_board.id) : undefined);
    const localSounds = (prevButtons.get(id)?.actions ?? []).filter((a) => a.type === 'playSound');
    const style: ButtonStyle = stripUndefined({
      ...(ext.style ?? {}),
      bg: v.background_color ?? ext.colors?.bg,
      fg: v.text_color ?? ext.colors?.fg,
      border: v.border_color ?? ext.colors?.border,
    });
    buttons.push(
      stripUndefined({
        id,
        label: ext.label ?? v.label ?? '',
        message: ext.message ?? v.vocalization,
        pronunciation: ext.pronunciation,
        image,
        style,
        actions: [...actions, ...localSounds],
        variants: variantsFromSync(ext.variants, ctx),
        row: v.row,
        col: v.col,
        rowSpan: v.row_span ?? 1,
        colSpan: v.col_span ?? 1,
        hidden: v.hidden || undefined,
      }),
    );
  }

  const order = new Map((previous?.buttons ?? []).map((b, i) => [b.id, i]));
  buttons.sort((a, b) => {
    const ia = order.get(a.id);
    const ib = order.get(b.id);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1;
    if (ib !== undefined) return 1;
    return a.row - b.row || a.col - b.col || (a.id < b.id ? -1 : 1);
  });

  return stripUndefined({
    id: decodeId(boardId),
    name: metaExt.name ?? meta.name,
    rows: grid?.rows ?? previous?.rows ?? 6,
    cols: grid?.columns ?? previous?.cols ?? 8,
    bg: meta.background_color ?? metaExt.bg,
    buttons,
    hidden: meta.hidden || undefined,
  });
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const o = value as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`)
    .join(',')}}`;
}

export function diffElements(
  base: ElementMap,
  next: ElementMap,
): Array<{ key: ElementKey; value: ElementValue | null }> {
  const out: Array<{ key: ElementKey; value: ElementValue | null }> = [];
  for (const [key, value] of next) {
    const prev = base.get(key);
    if (!prev || canonicalJson(prev) !== canonicalJson(value)) out.push({ key, value });
  }
  for (const key of base.keys()) if (!next.has(key)) out.push({ key, value: null });
  return out;
}
