import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { zipSync, strToU8, zlibSync } from 'fflate';
import { getSql } from '../src/io/sql';
import { colorrefToHex, parseCssColor } from '../src/io/util';
import { importCe, exportCe } from '../src/io/ce';
import { importObf, exportObz } from '../src/io/obf';
import { exportBridge } from '../src/io/bridge';
import { importAnyFile } from '../src/io/detect';

const TINY_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe('color & binary helpers', () => {
  it('converts Windows COLORREF (0x00BBGGRR) to CSS hex', () => {
    expect(colorrefToHex(10079487)).toBe('#ffcc99');
    expect(colorrefToHex(16777215)).toBe('#ffffff');
    expect(colorrefToHex(0)).toBe('#000000');
  });

  it('parses CSS hex and rgb() colors', () => {
    expect(parseCssColor('#fa0')).toBe('#ffaa00');
    expect(parseCssColor('rgb(255, 128, 0)')).toBe('#ff8000');
  });
});

describe('synthetic .ce format import & export round-trip', () => {
  it('imports a synthetic .ce with BGR colors, navigation, suffix attachment, grammar sets, and embedded symbols', async () => {
    const SQL = await getSql();
    const db = new SQL.Database();

    db.run(`
      CREATE TABLE variables (name TEXT, value TEXT);
      CREATE TABLE resources (id INTEGER PRIMARY KEY, rid TEXT, name TEXT, type INTEGER);
      CREATE TABLE pages (id INTEGER PRIMARY KEY, resource_id INTEGER, page_style_id INTEGER, feature INTEGER);
      CREATE TABLE page_styles (id INTEGER PRIMARY KEY, resource_id INTEGER, bg_color INTEGER);
      CREATE TABLE special_pages (name TEXT, page_id INTEGER);
      CREATE TABLE button_boxes (id INTEGER PRIMARY KEY, resource_id INTEGER, layout_x INTEGER, layout_y INTEGER, init_size_x INTEGER, init_size_y INTEGER);
      CREATE TABLE button_box_instances (id INTEGER PRIMARY KEY, page_id INTEGER, button_box_id INTEGER, position_x INTEGER, position_y INTEGER, size_x INTEGER, size_y INTEGER, order_index INTEGER);
      CREATE TABLE button_box_cells (id INTEGER PRIMARY KEY, resource_id INTEGER, button_box_id INTEGER, location INTEGER, span_x INTEGER, span_y INTEGER, button_style_override_id INTEGER);
      CREATE TABLE buttons (id INTEGER PRIMARY KEY, resource_id INTEGER, label TEXT, message TEXT, button_style_id INTEGER, symbol_link_id INTEGER, visible INTEGER, pronunciation TEXT);
      CREATE TABLE button_styles (
        id INTEGER PRIMARY KEY,
        resource_id INTEGER,
        label_on_top INTEGER,
        transparent INTEGER,
        font_color INTEGER,
        body_color INTEGER,
        border_color INTEGER,
        border_width REAL,
        font_name TEXT,
        font_bold INTEGER,
        font_underline INTEGER,
        font_italic INTEGER,
        font_height REAL
      );
      CREATE TABLE button_sets (id INTEGER PRIMARY KEY, resource_id INTEGER);
      CREATE TABLE button_set_modifiers (button_set_id INTEGER, modifier INTEGER, button_id INTEGER);
      CREATE TABLE actions (id INTEGER PRIMARY KEY, resource_id INTEGER, rank INTEGER, code INTEGER);
      CREATE TABLE action_data (action_id INTEGER, key INTEGER, value TEXT);
      CREATE TABLE symbol_links (id INTEGER PRIMARY KEY, rid TEXT, type INTEGER);
      CREATE TABLE sounds (id INTEGER PRIMARY KEY, resource_id INTEGER, data BLOB);
    `);

    db.run(`INSERT INTO variables VALUES ('Name', 'Test Vocab'), ('Locale', 'en_US')`);

    db.run(`INSERT INTO button_styles VALUES (1, 10, 1, 0, 0, ${0x0080ffff}, 0, 2, 'Arial', 1, 0, 0, 18)`);
    db.run(`INSERT INTO button_styles VALUES (2, 11, 0, 0, 0, ${0x0080ff80}, 0, 1, 'Arial', 0, 0, 0, 16)`);

    db.run(`INSERT INTO resources VALUES (100, 'p-home', 'Main Page', 3)`);
    db.run(`INSERT INTO resources VALUES (101, 'p-food', 'Food Page', 3)`);
    db.run(`INSERT INTO resources VALUES (102, 'p-tmpl', '.Template', 3)`);
    db.run(`INSERT INTO pages VALUES (1, 100, NULL, 1), (2, 101, NULL, 1), (3, 102, NULL, 1)`);
    db.run(`INSERT INTO special_pages VALUES ('HOME', 1), ('TEMPLATE', 3)`);

    db.run(`INSERT INTO button_boxes VALUES (1, 200, 4, 3, 10000, 10000)`);
    db.run(`INSERT INTO button_box_instances VALUES (1, 1, 1, 0, 0, 10000, 10000, 0)`);

    db.run(`INSERT INTO symbol_links VALUES (1, '{SYM-1}', 2)`);

    db.run(`INSERT INTO resources VALUES (301, 'b-i', 'I', 4)`);
    db.run(`INSERT INTO buttons VALUES (1, 301, 'I', 'I ', 1, 1, 1, NULL)`);
    db.run(`INSERT INTO actions VALUES (1, 301, 0, 1)`);

    db.run(`INSERT INTO resources VALUES (302, 'b-food', 'FOOD', 4)`);
    db.run(`INSERT INTO buttons VALUES (2, 302, 'FOOD', '', 2, NULL, 1, NULL)`);
    db.run(`INSERT INTO actions VALUES (2, 302, 0, 8)`);
    db.run(`INSERT INTO action_data VALUES (2, 0, 'p-food')`);

    db.run(`INSERT INTO resources VALUES (303, 'b-ing', '-ing', 4)`);
    db.run(`INSERT INTO buttons VALUES (3, 303, '-ing', NULL, 2, NULL, 1, NULL)`);
    db.run(`INSERT INTO actions VALUES (3, 303, 0, 65), (4, 303, 1, 71)`);
    db.run(`INSERT INTO action_data VALUES (4, 0, '2')`);

    db.run(`INSERT INTO resources VALUES (304, 'b-eat', 'eat', 4)`);
    db.run(`INSERT INTO buttons VALUES (4, 304, 'eat', 'eat ', 2, NULL, 1, NULL)`);
    db.run(`INSERT INTO actions VALUES (5, 304, 0, 1)`);

    db.run(`INSERT INTO resources VALUES (305, 'b-eating', 'eating', 4)`);
    db.run(`INSERT INTO buttons VALUES (5, 305, 'eating', 'eating ', 2, NULL, 1, NULL)`);
    db.run(`INSERT INTO actions VALUES (6, 305, 0, 1)`);

    db.run(`INSERT INTO resources VALUES (400, 'bs-eat', 'eat-set', 5)`);
    db.run(`INSERT INTO button_sets VALUES (1, 400)`);
    db.run(`INSERT INTO button_set_modifiers VALUES (1, 0, 4), (1, 2, 5)`);

    db.run(`
      INSERT INTO button_box_cells VALUES
        (1, 301, 1, 0, 1, 1, NULL),
        (2, 302, 1, 1, 1, 1, NULL),
        (3, 303, 1, 2, 1, 1, NULL),
        (4, 400, 1, 4, 1, 1, NULL);
    `);

    const c4vBytes = db.export();
    db.close();

    const imgDb = new SQL.Database();
    imgDb.run(`CREATE TABLE symbols (id INTEGER PRIMARY KEY, rid TEXT, compressed INTEGER, type INTEGER, width INTEGER, height INTEGER, data BLOB)`);
    const compressedPng = zlibSync(TINY_PNG);
    imgDb.run(`INSERT INTO symbols VALUES (1, '{SYM-1}', 1, 6, 1, 1, ?)`, [compressedPng]);
    const c4sBytes = imgDb.export();
    imgDb.close();

    const ceZip = zipSync({
      'Test.c4v': c4vBytes,
      'Images.c4s': c4sBytes,
      'version.txt': strToU8('2.50.1\n'),
    });

    const res = await importCe(ceZip, { filename: 'Test.ce' });
    expect(res.vocab.name).toBe('Test Vocab');
    expect(res.vocab.homePageId).toBe('p-home');

    const tmpl = res.vocab.pages.find((p) => p.id === 'p-tmpl')!;
    expect(tmpl.hidden).toBe(true);

    const home = res.vocab.pages.find((p) => p.id === 'p-home')!;
    expect(home.rows).toBe(3);
    expect(home.cols).toBe(4);

    const btnI = home.buttons.find((b) => b.row === 0 && b.col === 0)!;
    expect(btnI.label).toBe('I');
    expect(btnI.style.bg).toBe('#ffff80');
    expect(btnI.style.labelOnTop).toBe(true);
    expect(btnI.image?.startsWith('img:')).toBe(true);
    expect(res.assets.length).toBe(1);
    expect(res.assets[0].mime).toBe('image/png');

    const btnFood = home.buttons.find((b) => b.row === 0 && b.col === 1)!;
    expect(btnFood.actions).toEqual([{ type: 'navigate', pageId: 'p-food' }]);

    const btnIng = home.buttons.find((b) => b.row === 0 && b.col === 2)!;
    expect(btnIng.actions).toEqual([
      { type: 'insert', text: 'ing', attach: true },
      { type: 'setForm', form: 2 },
    ]);

    const btnEat = home.buttons.find((b) => b.row === 1 && b.col === 0)!;
    expect(btnEat.label).toBe('eat');
    expect(btnEat.variants?.[2]?.label).toBe('eating');

    const assetMap = new Map(res.assets.map((a) => [a.id, a]));
    const exportedCe = await exportCe(res.vocab, assetMap);
    const reimported = await importCe(exportedCe, { filename: 'Reimported.ce' });
    expect(reimported.vocab.name).toBe('Test Vocab');
    const reHome = reimported.vocab.pages.find((p) => p.id === reimported.vocab.homePageId)!;
    expect(reHome.buttons.length).toBe(4);
    expect(reimported.assets.length).toBe(1);

    const reIng = reHome.buttons.find((b) => b.row === 0 && b.col === 2)!;
    expect(reIng.actions).toEqual([
      { type: 'insert', text: 'ing', attach: true },
      { type: 'setForm', form: 2 },
    ]);

    const reEat = reHome.buttons.find((b) => b.row === 1 && b.col === 0)!;
    expect(reEat.label).toBe('eat');
    expect(reEat.variants?.[2]?.label).toBe('eating');
  });
});

describe('OBF / OBZ & BridgeAAC backup round-trip', () => {
  it('imports an OBF board, exports as OBZ, and re-imports cleanly', async () => {
    const obf = {
      format: 'open-board-0.1',
      id: 'board-1',
      name: 'My OBF Board',
      locale: 'en',
      grid: {
        rows: 2,
        columns: 2,
        order: [
          ['btn-1', 'btn-2'],
          [null, null],
        ],
      },
      buttons: [
        {
          id: 'btn-1',
          label: 'Hello',
          vocalization: 'Hello there',
          background_color: 'rgb(255, 230, 128)',
          image_id: 'img-1',
        },
        {
          id: 'btn-2',
          label: 'Clear',
          actions: [':clear'],
        },
      ],
      images: [
        {
          id: 'img-1',
          content_type: 'image/png',
          data: 'data:image/png;base64,' + Buffer.from(TINY_PNG).toString('base64'),
        },
      ],
    };

    const res = await importObf(obf, { filename: 'sample.obf' });
    expect(res.vocab.name).toBe('My OBF Board');
    expect(res.assets.length).toBe(1);

    const home = res.vocab.pages.find((p) => p.id === res.vocab.homePageId)!;
    expect(home.buttons.length).toBe(2);
    expect(home.buttons[0].style.bg).toBe('#ffe680');
    expect(home.buttons[1].actions).toEqual([{ type: 'clear' }]);

    const assetMap = new Map(res.assets.map((a) => [a.id, a]));
    const obzBytes = exportObz(res.vocab, assetMap);
    const obzRes = await importAnyFile({ name: 'sample.obz', bytes: obzBytes }, { filename: 'sample.obz' });
    expect(obzRes.vocab.name).toBe('My OBF Board');
    expect(obzRes.assets.length).toBe(1);
  });

  it('round-trips a .bridge archive and re-namespaces asset IDs cleanly', async () => {
    const obfRes = await importObf(
      {
        format: 'open-board-0.1',
        id: 'b1',
        name: 'Bridge Test',
        grid: { rows: 1, columns: 1, order: [['1']] },
        buttons: [{ id: '1', label: 'Pic', image_id: 'i1' }],
        images: [
          {
            id: 'i1',
            content_type: 'image/png',
            data: 'data:image/png;base64,' + Buffer.from(TINY_PNG).toString('base64'),
          },
        ],
      },
      { vocabId: 'orig-vocab' },
    );

    const bridgeBytes = exportBridge(obfRes.vocab, obfRes.assets);
    const restored = await importAnyFile(
      { name: 'backup.bridge', bytes: bridgeBytes },
      { vocabId: 'new-vocab' },
    );

    expect(restored.vocab.id).toBe('new-vocab');
    expect(restored.assets.length).toBe(1);
    expect(restored.assets[0].id.startsWith('new-vocab:')).toBe(true);
    const home = restored.vocab.pages.find((p) => p.id === restored.vocab.homePageId)!;
    const btn = home.buttons[0];
    expect(btn.image).toBe(`img:${restored.assets[0].id}`);
  });

  it('throws friendly errors on corrupt or unrecognized files', async () => {
    await expect(
      importAnyFile({ name: 'broken.ce', bytes: new Uint8Array([1, 2, 3, 4]) }, {}),
    ).rejects.toThrow(/Not a valid.*(\.ce|\.c4v)/i);

    await expect(
      importAnyFile({ name: 'unknown.xyz', bytes: new Uint8Array([9, 9, 9]) }, {}),
    ).rejects.toThrow(/Supported formats/i);
  });
});

const realCePath = path.resolve(__dirname, '../fixtures/real-wordpower60.ce');
describe.skipIf(!fs.existsSync(realCePath))('real .ce fixture', () => {
  it('imports WordPower60 Basic SS Copy.ce cleanly and quickly', async () => {
    const bytes = new Uint8Array(fs.readFileSync(realCePath));
    const t0 = performance.now();
    const res = await importCe(bytes, { filename: 'WordPower60 Basic SS Copy.ce' });
    const elapsedMs = Math.round(performance.now() - t0);

    console.log(
      `[WordPower60] Imported in ${elapsedMs}ms: ${res.stats.pages} pages, ${res.stats.buttons} buttons, ${res.stats.images} embedded images, ${res.stats.sounds} sounds`,
    );

    expect(elapsedMs).toBeLessThan(15000);
    expect(res.stats.pages).toBe(416);
    expect(res.stats.buttons).toBeGreaterThan(20000);
    expect(res.stats.sounds).toBe(55);

    const pageById = new Map(res.vocab.pages.map((p) => [p.id, p]));
    const home = pageById.get(res.vocab.homePageId)!;
    expect(home).toBeDefined();
    expect(home.name).toContain('Home');
    expect(res.warnings.length).toBeGreaterThan(0);

    expect(home.cols).toBe(10);
    expect(home.rows).toBe(6);
    expect(home.buttons.length).toBe(60);
    for (const btn of home.buttons) {
      if (btn.label.trim()) {
        expect(btn.image).toBeTruthy();
      }
    }
    const navButtons = home.buttons.filter((b) => b.actions.some((a) => a.type === 'navigate'));
    expect(navButtons.length).toBeGreaterThan(10);
    for (const btn of navButtons) {
      for (const act of btn.actions) {
        if (act.type === 'navigate') {
          expect(pageById.get(act.pageId)).toBeDefined();
        }
      }
    }
  });
});
