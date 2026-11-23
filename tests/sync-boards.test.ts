import { describe, expect, it } from 'vitest';
import { createStarterVocabulary } from '../src/data/starter';
import type { Page } from '../src/model';
import {
  buttonKey,
  canonicalJson,
  decodeId,
  diffElements,
  elementsToPage,
  encodeId,
  imageKey,
  pageToElements,
  type DecodeContext,
  type EncodeContext,
} from '../src/sync/boards';
import { BOARD_ID_RE, ELEMENT_KEY_RE, SHA256_RE } from '../src/sync/RemoteSyncAdapter';

function fakeSha(id: string): string {
  let h = '';
  for (let i = 0; h.length < 64; i++) h += ((id.charCodeAt(i % id.length) * 31 + i) % 16).toString(16);
  return h;
}

function contexts(mimes: Record<string, string>): { enc: EncodeContext; dec: DecodeContext } {
  const byHash = new Map(Object.keys(mimes).map((id) => [fakeSha(id), id]));
  return {
    enc: { assetHash: (id) => (mimes[id] ? { sha256: fakeSha(id), mime: mimes[id] } : undefined) },
    dec: { assetIdForHash: (sha) => byHash.get(sha) ?? `sync-${sha}` },
  };
}

const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[0-9.]+%?\s*,\s*[0-9.]+%?\s*,\s*[0-9.]+%?\s*(,\s*[0-9.]+\s*)?\)|[a-z]{3,20})$/;

function expectServerAccepts(key: string, value: Record<string, unknown>) {
  expect(key).toMatch(ELEMENT_KEY_RE);
  const json = JSON.stringify(value);
  expect(new TextEncoder().encode(json).length).toBeLessThanOrEqual(16384);
  expect(value).not.toHaveProperty('data');
  expect(value).not.toHaveProperty('sound_id');
  const ext = value.ext as Record<string, unknown> | undefined;
  if (ext) for (const k of Object.keys(ext)) expect(k).toMatch(/^ext_[A-Za-z0-9_]{1,60}$/);
  if (key.startsWith('button:')) {
    expect(value.row).toBeGreaterThanOrEqual(0);
    expect(value.row).toBeLessThanOrEqual(31);
    expect(value.col).toBeLessThanOrEqual(31);
    if (value.label !== undefined) expect(String(value.label).length).toBeLessThanOrEqual(200);
    for (const a of (value.actions as string[] | undefined) ?? []) expect(a).toMatch(/^(:[a-z][a-z0-9_-]{0,39}|\+.{1,40})$/);
    for (const c of ['background_color', 'border_color', 'text_color']) if (value[c]) expect(value[c]).toMatch(COLOR_RE);
    if (value.load_board) expect((value.load_board as { id: string }).id).toMatch(BOARD_ID_RE);
  }
  if (key.startsWith('image:')) {
    if (value.sha256) expect(value.sha256).toMatch(SHA256_RE);
    if (value.url) expect(String(value.url)).toMatch(/^https:\/\//);
    expect(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']).toContain(value.content_type);
  }
  if (key === 'meta') expect(String(value.name).length).toBeGreaterThan(0);
}

describe('board ↔ element mapping', () => {
  for (const size of [42, 50, 60, 84, 108] as const) {
    it(`round-trips every page of the ${size}-word starter set exactly, within server limits`, () => {
      const { vocab, assets } = createStarterVocabulary('en', size);
      const { enc, dec } = contexts(Object.fromEntries(assets.map((a) => [a.id, a.mime])));
      for (const page of vocab.pages) {
        const elements = pageToElements(page, enc);
        for (const [k, v] of elements) expectServerAccepts(k, v as unknown as Record<string, unknown>);
        const back = elementsToPage(encodeId(page.id), elements, dec, page);
        expect(canonicalJson(back)).toBe(canonicalJson(page));
      }
    });
  }

  const page: Page = {
    id: 'page one/ä',
    name: 'Feelings',
    rows: 2,
    cols: 3,
    bg: 'var(--weird)',
    buttons: [
      {
        id: 'b1',
        label: 'happy',
        message: 'I feel happy',
        pronunciation: 'HAP-ee',
        image: 'emoji:😀',
        style: { bg: '#ffeeaa', fg: '#000', border: 'hsl(1,2%,3%)', bold: true, fontScale: 1.2 },
        actions: [{ type: 'insert', text: 'I feel happy and I want to tell you about it right now please' }, { type: 'speakTime' }],
        variants: { 1: { label: 'happier', image: 'img:asset-photo' } },
        row: 0,
        col: 0,
        rowSpan: 1,
        colSpan: 2,
      },
      {
        id: 'b2',
        label: 'more',
        image: 'arasaac:2345',
        style: {},
        actions: [{ type: 'navigate', pageId: 'page two' }, { type: 'clear' }],
        row: 1,
        col: 0,
        rowSpan: 1,
        colSpan: 1,
      },
      {
        id: 'b3',
        label: 'me',
        image: 'img:asset-photo',
        style: {},
        actions: [{ type: 'playSound', assetId: 'snd-1' }],
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        hidden: true,
      },
      {
        id: 'b4',
        label: 'link',
        image: 'url:https://example.org/pics/dog.jpg',
        style: {},
        actions: [],
        row: 1,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
      },
    ],
  };
  const { enc, dec } = contexts({ 'asset-photo': 'image/jpeg' });

  it('keeps core-only details in ext_bridge and standard OBF fields for other tools', () => {
    const el = pageToElements(page, enc);
    for (const [k, v] of el) expectServerAccepts(k, v as unknown as Record<string, unknown>);
    const b1 = el.get(buttonKey('b1')) as unknown as Record<string, unknown>;
    expect(b1).toMatchObject({ label: 'happy', vocalization: 'I feel happy', background_color: '#ffeeaa', text_color: '#000', col_span: 2 });
    expect(b1).not.toHaveProperty('border_color');
    expect(b1).not.toHaveProperty('actions');
    expect(el.get(buttonKey('b2'))).toMatchObject({ load_board: { id: encodeId('page two') }, actions: [':clear'] });
    expect(el.get(imageKey('b2'))).toEqual({ url: 'https://static.arasaac.org/pictograms/2345/2345_300.png', content_type: 'image/png' });
    expect(el.get(imageKey('b3'))).toEqual({ sha256: fakeSha('asset-photo'), content_type: 'image/jpeg' });
    expect(el.get(imageKey('b4'))).toEqual({ url: 'https://example.org/pics/dog.jpg', content_type: 'image/jpeg' });
    expect(el.has(imageKey('b1'))).toBe(false);
  });

  it('never syncs sounds, and keeps a local sound when a remote edit arrives', () => {
    const el = pageToElements(page, enc);
    expect(JSON.stringify([...el.values()])).not.toMatch(/playSound|snd-1/);
    const remote = new Map(el);
    remote.set(buttonKey('b3'), { ...(el.get(buttonKey('b3')) as object), label: 'myself' } as never);
    const merged = elementsToPage(encodeId(page.id), remote, dec, page)!;
    const b3 = merged.buttons.find((b) => b.id === 'b3')!;
    expect(b3.label).toBe('myself');
    expect(b3.actions).toEqual([{ type: 'playSound', assetId: 'snd-1' }]);
  });

  it('round-trips the custom page exactly', () => {
    const back = elementsToPage(encodeId(page.id), pageToElements(page, enc), dec, page);
    expect(canonicalJson(back)).toBe(canonicalJson(page));
  });

  it('reads boards written by other OBF tools (no ext_bridge)', () => {
    const foreign = new Map([
      ['meta', { name: 'Snacks' }],
      ['grid', { rows: 1, columns: 2 }],
      [`button:apple`, { label: 'apple', image_id: 'apple', row: 0, col: 1, actions: ['+apples', ':speak'] }],
      [`image:apple`, { url: 'https://example.org/apple.png', content_type: 'image/png' }],
    ]) as never;
    const p = elementsToPage('snacks', foreign, dec)!;
    expect(p).toMatchObject({ id: 'snacks', name: 'Snacks', rows: 1, cols: 2 });
    expect(p.buttons[0]).toMatchObject({
      id: 'apple',
      label: 'apple',
      image: 'url:https://example.org/apple.png',
      actions: [{ type: 'insert', text: 'apples' }, { type: 'speakWindow' }],
      rowSpan: 1,
      colSpan: 1,
    });
  });

  it('encodes IDs that the protocol would reject, reversibly', () => {
    for (const id of ['page one/ä', 'b64_trick', 'x'.repeat(40), 'ok-id_1.2']) {
      const e = encodeId(id);
      expect(e).toMatch(BOARD_ID_RE);
      expect(decodeId(e)).toBe(id);
    }
    expect(encodeId('ok-id_1.2')).toBe('ok-id_1.2');
    expect(encodeId('y'.repeat(60))).toBe('y'.repeat(60));
    expect(() => encodeId('é'.repeat(40))).toThrow(RangeError);
  });

  it('diffs only what changed, and deletes what was removed', () => {
    const before = pageToElements(page, enc);
    const edited: Page = {
      ...page,
      buttons: page.buttons.filter((b) => b.id !== 'b4').map((b) => (b.id === 'b2' ? { ...b, label: 'more please' } : b)),
    };
    const ops = diffElements(before, pageToElements(edited, enc));
    expect(ops.map((o) => [o.key, o.value === null ? 'delete' : 'put']).sort()).toEqual(
      [
        [buttonKey('b2'), 'put'],
        [buttonKey('b4'), 'delete'],
        [imageKey('b4'), 'delete'],
      ].sort(),
    );
    expect(diffElements(before, pageToElements(page, enc))).toEqual([]);
  });
});
