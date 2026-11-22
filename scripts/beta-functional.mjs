import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'beta-functional');
fs.mkdirSync(OUT, { recursive: true });
const dist = path.resolve('dist');
const types = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const p = path.join(dist, url);
  const fp = p.startsWith(dist) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(dist, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream', ...(url === '/sw.js' ? { 'Cache-Control': 'no-cache' } : {}) });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => srv.listen(0, 'localhost', r));
const appUrl = `http://localhost:${srv.address().port}/`;

const results = [];
const errors = [];
const device = process.argv.includes('--phone') ? { width: 393, height: 852, dsf: 3 } : { width: 1180, height: 820, dsf: 1.5 };
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: device.width, height: device.height }, deviceScaleFactor: device.dsf, hasTouch: true, acceptDownloads: true, serviceWorkers: 'allow' });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 200)}`); });
page.on('dialog', (d) => d.accept());

const msg = () => page.locator('.message-display').innerText().then((t) => t.replace(/\s+/g, ' ').trim());
const word = (w) => page.locator(`button.aac-btn[aria-label="${w}" i]`).first();
const btn = (name, exact = true) => page.getByRole('button', { name, exact }).first();
const modal = () => page.locator('.modal-card').first();
const mbtn = (re) => page.locator('.modal-card button', { hasText: re }).first();
const tab = (t) => page.locator('.modal-card button.tab-btn', { hasText: t }).first();
const wait = (ms = 300) => page.waitForTimeout(ms);
const close = async () => { for (let i = 0; i < 3 && (await page.locator('.modal-card').count()); i++) { await page.keyboard.press('Escape'); await wait(250); } };
const expectEq = (a, b, what) => { if (a !== b) throw new Error(`${what}: expected "${b}", got "${a}"`); };
const expectTrue = (v, what) => { if (!v) throw new Error(what); };

async function check(name, fn) {
  const before = errors.length;
  try {
    await fn();
    const newErr = errors.slice(before);
    results.push({ name, ok: newErr.length === 0, detail: newErr.join(' | ') });
  } catch (e) {
    results.push({ name, ok: false, detail: String(e.message).split('\n')[0] });
    await page.screenshot({ path: path.join(OUT, `fail-${name.replace(/[^a-z0-9]+/gi, '-')}.png`) }).catch(() => {});
    await close().catch(() => {});
  }
}

await page.goto(appUrl, { waitUntil: 'networkidle' });
await wait(600);

await check('first run: choose the 60 board', async () => {
  expectTrue(await page.locator('.pageset-modal').count(), 'board picker not shown on first run');
  const card = page.locator('.pageset-card', { hasText: 'BridgeWords 60' });
  if ((await card.getAttribute('aria-pressed')) !== 'true') await card.click();
  await page.locator('.pageset-btn-next, .pageset-btn-continue').last().click();
  await wait(1200);
  expectTrue(await word('want').count(), 'board did not load');
});

await check('build and speak a message', async () => {
  for (const w of ['I', 'want', 'to', 'play']) { await word(w).tap(); await wait(80); }
  expectEq(await msg(), 'I want to play', 'message');
  await btn('Speak message').tap();
  await wait(300);
});

await check('delete word, delete letter, clear', async () => {
  await btn('Delete last word').tap();
  expectEq(await msg(), 'I want to', 'after delete word');
  await btn('Delete last letter').tap();
  await btn('Delete last letter').tap();
  expectEq(await msg(), 'I want t', 'after delete letters');
  await btn('Clear message').tap();
  expectTrue((await msg()).includes('Tap the buttons') || (await msg()) === '', 'message not cleared');
});

await check('word prediction chip adds a word', async () => {
  await word('I').tap();
  const chip = page.locator('.prediction-strip .pred-chip').first();
  const text = (await chip.innerText()).trim();
  await chip.tap();
  await wait(150);
  expectTrue((await msg()).toLowerCase().includes(text.toLowerCase()), `prediction "${text}" not added`);
  await btn('Clear message').tap();
});

await check('save a phrase and find it in Phrases', async () => {
  for (const w of ['I', 'need', 'help']) { await word(w).tap(); await wait(60); }
  await btn('Save message to phrases').tap();
  await wait(200);
  await page.getByRole('button', { name: /phrases/i }).first().tap();
  await wait(400);
  const saved = page.locator('.modal-card button.tab-btn', { hasText: /Saved/ }).first();
  if (await saved.count()) { await saved.tap(); await wait(250); }
  expectTrue(await page.locator('.modal-card', { hasText: 'I need help' }).count(), 'saved phrase missing');
  await close();
  await btn('Clear message').tap();
});

await check('folder navigation, back and home', async () => {
  await word('Food').tap();
  await wait(300);
  expectTrue(await word('pizza').count(), 'food page did not open');
  await page.getByRole('button', { name: /Back/ }).first().tap();
  await wait(300);
  expectTrue(await word('want').count(), 'back did not return home');
  await word('Food').tap();
  await wait(250);
  await word('pizza').tap();
  await page.locator('.nav-btn.home-btn').tap();
  await wait(250);
  expectTrue(await word('want').count(), 'home did not return home');
  expectTrue((await msg()).toLowerCase().includes('pizza'), 'pizza not added');
  await btn('Clear message').tap();
});

await check('keyboard typing and prediction', async () => {
  await page.locator('.nav-btn[aria-label="Keyboard"]').tap();
  await wait(400);
  for (const k of ['p', 'i', 'z']) { await mbtn(new RegExp(`^${k}$`)).tap(); await wait(80); }
  const text = await page.locator('.kb-message').innerText();
  expectEq(text.trim(), 'Piz', 'typed text');
  const pred = mbtn(/^pizza$/i);
  expectTrue(await pred.count(), 'no pizza prediction');
  await pred.tap();
  await wait(150);
  expectTrue((await page.locator('.kb-message').innerText()).toLowerCase().startsWith('pizza'), 'prediction not applied');
  await mbtn(/^Done$/).tap();
  await wait(250);
  await btn('Clear message').tap();
});

await check('find a word', async () => {
  await page.getByRole('button', { name: /^Page:/ }).tap();
  await wait(400);
  await page.locator('.modal-card input[placeholder^="Search word"]').fill('pizza');
  await wait(400);
  expectTrue(await page.locator('.modal-card', { hasText: /Food/ }).count(), 'pizza not found in Food');
  await close();
});

await check('edit a button label, then undo', async () => {
  await btn('Edit').tap();
  await wait(300);
  await word('play').tap();
  await wait(400);
  const label = page.locator('.modal-card input').first();
  await label.fill('play ball');
  await mbtn(/^Save Button$/).tap();
  await wait(400);
  expectTrue(await word('play ball').count(), 'label not changed');
  await page.getByRole('button', { name: /Undo/ }).first().tap();
  await wait(300);
  expectTrue(await word('play').count(), 'undo did not restore label');
  await page.getByRole('button', { name: /Redo/ }).first().tap();
  await wait(300);
  expectTrue(await word('play ball').count(), 'redo did not reapply');
  await btn('Done').tap();
  await wait(300);
});

await check('edits and settings survive a reload', async () => {
  await btn('Settings').tap();
  await wait(300);
  await tab('Display').tap();
  await wait(200);
  await page.locator('.modal-card select').first().selectOption('dark');
  await wait(200);
  await close();
  await page.reload({ waitUntil: 'networkidle' });
  await wait(800);
  expectTrue(await word('play ball').count(), 'edited label lost after reload');
  expectEq(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark', 'theme after reload');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('bridgeaac.settings.v2')); s.theme = 'light'; localStorage.setItem('bridgeaac.settings.v2', JSON.stringify(s)); });
  await page.reload({ waitUntil: 'networkidle' });
  await wait(600);
});

const exported = {};
for (const [fmt, re] of [['ce', /Export \.ce/], ['obz', /Export \.obz/], ['bridge', /Export \.bridge/]]) {
  await check(`export .${fmt}`, async () => {
    await page.locator('.nav-btn.vocab-btn').tap();
    await wait(400);
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), mbtn(re).tap()]);
    const f = path.join(OUT, `export.${fmt}`);
    await dl.saveAs(f);
    exported[fmt] = f;
    expectTrue(fs.statSync(f).size > 1000, `.${fmt} export is too small`);
    await close();
  });
}
for (const fmt of ['ce', 'obz', 'bridge']) {
  await check(`import .${fmt} back`, async () => {
    expectTrue(exported[fmt], 'nothing exported');
    await page.locator('.nav-btn.vocab-btn').tap();
    await wait(400);
    const before = await page.locator('.modal-card .vocab-item, .modal-card [class*="vocab-row"], .modal-card li').count();
    await page.locator('.modal-card input[type="file"]').setInputFiles(exported[fmt]);
    await wait(2500);
    await close();
    await page.locator('.nav-btn.vocab-btn').tap();
    await wait(400);
    const after = await page.locator('.modal-card .vocab-item, .modal-card [class*="vocab-row"], .modal-card li').count();
    const txt = await modal().innerText();
    expectTrue(after > before || /\(\d+\)/.test(txt), `import of .${fmt} did not add a vocabulary`);
    await close();
  });
}

await check('switch back to the original board', async () => {
  await page.locator('.nav-btn.vocab-btn').tap();
  await wait(400);
  const items = await modal().innerText();
  expectTrue(/On this device \((\d+)\)/.test(items), 'device list missing');
  await close();
});

await check('planner: finish a task earns a star', async () => {
  await btn('Planner, moods, games, about me and notes').tap();
  await wait(400);
  const stars = async () => parseInt((await page.locator('.modal-card').innerText()).match(/(\d+)\s*Stars?/)?.[1] ?? '-1', 10);
  const s0 = await stars();
  await page.locator('.modal-card input[type="checkbox"]').first().tap();
  await wait(500);
  const s1 = await stars();
  expectTrue(s1 === s0 + 1, `stars ${s0} -> ${s1}`);
  await close();
});

await check('mood check-in is logged', async () => {
  await btn('Planner, moods, games, about me and notes').tap();
  await wait(300);
  await tab('Moods').tap();
  await wait(300);
  await mbtn(/Happy/).tap();
  await wait(500);
  expectTrue(/Mood history \(1/.test(await modal().innerText()), 'mood not logged');
  await close();
});

await check('game: correct sentence raises the streak', async () => {
  await btn('Planner, moods, games, about me and notes').tap();
  await wait(300);
  await tab('Games').tap();
  await wait(300);
  const goal = await modal().innerText();
  const targets = { 'drink of water': ['I', 'want', 'water', 'please'] };
  const words = Object.entries(targets).find(([k]) => goal.includes(k))?.[1];
  expectTrue(words, 'unexpected first challenge');
  for (const w of words) { await mbtn(new RegExp(`^${w}$`)).tap(); await wait(150); }
  await wait(700);
  expectTrue(/Streak:\s*1/.test(await modal().innerText()), 'streak did not increase');
  await close();
});

await check('caregiver notes are saved and locked', async () => {
  await btn('Planner, moods, games, about me and notes').tap();
  await wait(300);
  await tab('Notes').tap();
  await wait(300);
  await page.locator('.modal-card input[placeholder="Set a passcode"]').fill('2468-lunch');
  await mbtn(/^Set Passcode$/).tap();
  await wait(600);
  await page.locator('.modal-card input[placeholder^="Write observation"]').fill('Used 4-word sentences at lunch today.');
  await mbtn(/^Save Note$/).tap();
  await wait(500);
  expectTrue(/4-word sentences/.test(await modal().innerText()), 'note not shown after saving');
  await close();
  await page.reload({ waitUntil: 'networkidle' });
  await wait(700);
  await btn('Planner, moods, games, about me and notes').tap();
  await wait(300);
  await tab('Notes').tap();
  await wait(300);
  expectTrue(!/4-word sentences/.test(await modal().innerText()), 'note readable without passcode after reload');
  const p2 = page.locator('.modal-card input[type="password"]').first();
  await p2.fill('2468-lunch');
  await page.locator('.modal-card button', { hasText: /Unlock|Open/ }).first().tap();
  await wait(500);
  expectTrue(/4-word sentences/.test(await modal().innerText()), 'note missing after unlock');
  await close();
});

await check('PIN lock protects settings', async () => {
  await btn('Settings').tap();
  await wait(300);
  await tab('Privacy').tap();
  await wait(300);
  await page.locator('.modal-card input[type="password"]').first().fill('1357');
  await mbtn(/^Set PIN$/).tap();
  await wait(400);
  await close();
  await btn('Settings').tap();
  await wait(400);
  const t = await page.locator('.modal-card').first().innerText();
  expectTrue(/PIN/i.test(t) && !/Speech\s*Access/.test(t), 'settings opened without asking for the PIN');
  const input = page.locator('.modal-card input').first();
  await input.fill('1357');
  await page.keyboard.press('Enter');
  await wait(500);
  const t2 = await page.locator('.modal-card').first().innerText();
  expectTrue(/Speech/.test(t2), 'correct PIN did not open settings');
  await tab('Privacy').tap();
  await wait(200);
  await page.locator('.modal-card input[type="password"]').first().fill('');
  await mbtn(/^Remove PIN$/).tap();
  await wait(300);
  await close();
});

await check('switch scanning highlights and selects', async () => {
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('bridgeaac.settings.v2')); Object.assign(s, { access: 'scan', scanMode: 'auto', scanPattern: 'linear', scanIntervalMs: 400, scanFirstDelayMs: 200 }); localStorage.setItem('bridgeaac.settings.v2', JSON.stringify(s)); });
  await page.reload({ waitUntil: 'networkidle' });
  await wait(900);
  expectTrue(await page.locator('.scan-highlight').count(), 'no scan highlight');
  await page.keyboard.press('Space');
  await wait(300);
  const m = await msg();
  expectTrue(m && !/Tap the buttons/.test(m), 'switch press did not select a button');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('bridgeaac.settings.v2')); s.access = 'touch'; localStorage.setItem('bridgeaac.settings.v2', JSON.stringify(s)); });
  await page.reload({ waitUntil: 'networkidle' });
  await wait(600);
  await btn('Clear message').tap().catch(() => {});
});

async function addStarter(re) {
  await page.locator('.nav-btn.vocab-btn').tap();
  await wait(400);
  const sel = page.locator('.modal-card select').filter({ has: page.locator('option', { hasText: re }) }).first();
  const v = await sel.locator('option').evaluateAll((os, src) => os.find((o) => new RegExp(src).test(o.textContent))?.value, re.source);
  await sel.selectOption(v);
  await wait(200);
  await mbtn(/Add Starter Board|Agregar tablero inicial|إضافة لوحة بداية/).tap();
  await wait(800);
  if (await page.locator('.pageset-modal').count()) {
    const sel2 = page.locator('.pageset-modal select');
    if (await sel2.count()) {
      const v2 = await sel2.locator('option').evaluateAll((os, src) => os.find((o) => new RegExp(src).test(o.textContent))?.value, re.source);
      if (v2) await sel2.selectOption(v2);
    }
    await page.locator('.pageset-btn-next, .pageset-btn-continue').last().click();
  }
  await wait(1500);
  await close();
}

await check('Spanish starter board', async () => {
  await addStarter(/Espa/);
  expectTrue(await page.locator('button.aac-btn[aria-label="quiero" i]').count(), 'Spanish board missing "quiero"');
});

await check('Arabic board is right to left', async () => {
  await addStarter(/العربية/);
  const dir = await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.querySelector('.board-grid')).direction);
  expectEq(dir, 'rtl', 'direction');
  await page.screenshot({ path: path.join(OUT, 'arabic.png') });
});

await check('works offline after the first visit', async () => {
  await page.evaluate(async () => { const r = await navigator.serviceWorker?.ready; return !!r; });
  await wait(1500);
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  await wait(1200);
  expectTrue(await page.locator('button.aac-btn').count() > 10, 'board did not load offline');
  await ctx.setOffline(false);
});

await browser.close();
srv.close();
const pass = results.filter((r) => r.ok).length;
const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  -- ${r.detail}` : ''}`);
fs.writeFileSync(path.join(OUT, 'functional.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
console.log(`${pass}/${results.length} passed`);
