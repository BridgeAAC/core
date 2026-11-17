import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'beta-report');
fs.mkdirSync(OUT, { recursive: true });
const dist = path.resolve('dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Run npm run build first.');

const types = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.onnx': 'application/octet-stream', '.data': 'application/octet-stream' };
const srv = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const p = path.join(dist, url);
  const fp = p.startsWith(dist) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(dist, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const appUrl = `http://127.0.0.1:${srv.address().port}/`;

const DEVICES = [
  { name: 'iphone-se', width: 375, height: 667, dsf: 2, mobile: true },
  { name: 'iphone-15', width: 393, height: 852, dsf: 3, mobile: true },
  { name: 'iphone-landscape', width: 852, height: 393, dsf: 3, mobile: true },
  { name: 'ipad-portrait', width: 820, height: 1180, dsf: 2, mobile: true },
  { name: 'ipad-landscape', width: 1180, height: 820, dsf: 2, mobile: true },
  { name: 'ipad-slideover', width: 320, height: 1000, dsf: 2, mobile: true },
  { name: 'ipad-split', width: 507, height: 1180, dsf: 2, mobile: true },
  { name: 'desktop', width: 1440, height: 900, dsf: 1, mobile: false },
];
const only = process.argv.find((a) => a.startsWith('--device='));
const devices = only ? DEVICES.filter((d) => only.slice(9).split(',').includes(d.name)) : DEVICES;

const issues = [];
const note = (device, where, kind, detail) => issues.push({ device, where, kind, detail });

async function audit(page, device, where) {
  const r = await page.evaluate(() => {
    const vw = innerWidth;
    const vh = innerHeight;
    const out = { hOverflow: document.scrollingElement.scrollWidth - vw, offscreen: [], clipped: [], small: [], modal: null };
    const vis = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
    };
    const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.title || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
    const inScroller = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowX + s.overflowY) && (p.scrollHeight > p.clientHeight + 2 || p.scrollWidth > p.clientWidth + 2)) return true;
      }
      return false;
    };
    for (const el of document.querySelectorAll('button, a, input, select, textarea, [role="button"]')) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if ((r.right > vw + 1 || r.left < -1 || r.bottom > vh + 1 || r.top < -1) && !inScroller(el)) out.offscreen.push(label(el));
      if (el.tagName === 'BUTTON' && r.width >= 20 && (r.width < 30 || r.height < 30) && !el.closest('.emoji-grid, .swatches, .color-row')) out.small.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    for (const el of document.querySelectorAll('button, .aac-btn .label, .btn-label, h1, h2, h3, label')) {
      if (!vis(el)) continue;
      const s = getComputedStyle(el);
      if (s.overflow === 'visible' && s.textOverflow !== 'ellipsis') continue;
      if (el.scrollWidth > el.clientWidth + 2 && el.textContent.trim()) out.clipped.push(label(el));
    }
    const card = document.querySelector('.modal-card');
    if (card && vis(card)) {
      const r = card.getBoundingClientRect();
      out.modal = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, vw, vh, scrolls: card.scrollHeight > card.clientHeight };
    }
    return out;
  });
  if (r.hOverflow > 1) note(device, where, 'horizontal-scroll', `page is ${r.hOverflow}px wider than the screen`);
  if (r.offscreen.length) note(device, where, 'offscreen', [...new Set(r.offscreen)].slice(0, 12).join(' | '));
  if (r.clipped.length) note(device, where, 'clipped-text', [...new Set(r.clipped)].slice(0, 12).join(' | '));
  if (r.small.length && device !== 'desktop') note(device, where, 'small-target', [...new Set(r.small)].slice(0, 10).join(' | '));
  if (r.modal) {
    const m = r.modal;
    if (m.top < -1 || m.bottom > m.vh + 1 || m.left < -1 || m.right > m.vw + 1) note(device, where, 'modal-outside', `card ${Math.round(m.left)},${Math.round(m.top)} to ${Math.round(m.right)},${Math.round(m.bottom)} in ${m.vw}x${m.vh}`);
  }
}

const shot = async (page, device, name) => page.screenshot({ path: path.join(OUT, `${device}--${name}.png`) });
const closeModal = async (page) => {
  for (let i = 0; i < 3; i++) {
    if (!(await page.locator('.modal-card').count())) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }
  const x = page.locator('.modal-card button[aria-label="Close"], .modal-card .icon-close').first();
  if (await x.count()) await x.click().catch(() => {});
  await page.waitForTimeout(250);
};
const tabs = async (page) => page.$$eval('.modal-card button.tab-btn', (bs) => bs.map((b) => b.textContent.trim()));

for (const d of devices) {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: d.dsf, isMobile: d.mobile, hasTouch: d.mobile, userAgent: d.mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' : undefined });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') note(d.name, 'console', 'console-error', m.text().slice(0, 200)); });
  page.on('pageerror', (e) => note(d.name, 'page', 'page-error', String(e.message).slice(0, 200)));
  page.on('requestfailed', (r) => { if (!r.url().startsWith('data:')) note(d.name, 'network', 'request-failed', `${r.url().slice(0, 120)} ${r.failure()?.errorText}`); });
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, d.name, '00-first-run');
  await audit(page, d.name, 'first-run');
  const onboarding = page.locator('.modal-card');
  if (await onboarding.count()) {
    for (let i = 0; i < 8 && (await page.locator('.modal-card').count()); i++) {
      const next = page.locator('.modal-card button', { hasText: /^(Next|Get started|Start|Done|Continue|Skip|Let's go|Finish)/i }).last();
      if (await next.count()) await next.click().catch(() => {});
      else await closeModal(page);
      await page.waitForTimeout(300);
    }
  }
  await shot(page, d.name, '01-board');
  await audit(page, d.name, 'board');

  for (const w of ['I', 'want', 'to', 'play']) {
    const b = page.locator(`button.aac-btn[aria-label="${w}" i]`).first();
    if (await b.count()) await b.click();
    else note(d.name, 'board', 'missing-word', w);
    await page.waitForTimeout(120);
  }
  await shot(page, d.name, '02-message');
  await audit(page, d.name, 'message');

  const openers = [
    ['vocab', page.getByRole('button', { name: /BridgeWords|Vocabular/ }).first()],
    ['keyboard', page.getByRole('button', { name: 'Keyboard', exact: true }).first()],
    ['phrases', page.getByRole('button', { name: /^Phrases/ }).first()],
    ['pages', page.getByRole('button', { name: /^Page:/ }).first()],
    ['tools', page.getByRole('button', { name: /^Planner, moods/ }).first()],
    ['install', page.getByRole('button', { name: /^Install/ }).first()],
    ['settings', page.getByRole('button', { name: 'Settings', exact: true }).first()],
  ];
  for (const [name, loc] of openers) {
    if (!(await loc.count())) { note(d.name, name, 'missing-control', `no ${name} button`); continue; }
    if (!(await loc.isVisible())) {
      const more = page.getByRole('button', { name: /More|Menu/ }).first();
      if (await more.count()) await more.click().catch(() => {});
    }
    await loc.click().catch((e) => note(d.name, name, 'click-failed', e.message.split('\n')[0]));
    await page.waitForTimeout(450);
    await shot(page, d.name, `10-${name}`);
    await audit(page, d.name, name);
    for (const tab of await tabs(page)) {
      await page.locator('.modal-card button.tab-btn', { hasText: tab }).first().click().catch(() => {});
      await page.waitForTimeout(350);
      const slug = tab.toLowerCase().replace(/[^a-z]+/g, '-');
      await shot(page, d.name, `11-${name}-${slug}`);
      await audit(page, d.name, `${name}/${tab}`);
      const card = page.locator('.modal-card').first();
      if (await card.count()) {
        await card.evaluate((c) => { const s = [c, ...c.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)); if (s) s.scrollTop = s.scrollHeight; });
        await page.waitForTimeout(200);
        await shot(page, d.name, `12-${name}-${slug}-bottom`);
      }
    }
    await closeModal(page);
  }

  const edit = page.getByRole('button', { name: 'Edit', exact: true }).first();
  if (await edit.count()) {
    await edit.click();
    await page.waitForTimeout(400);
    await shot(page, d.name, '20-edit-mode');
    await audit(page, d.name, 'edit-mode');
    await page.locator('button.aac-btn[aria-label="play" i]').first().click().catch(() => {});
    await page.waitForTimeout(450);
    await shot(page, d.name, '21-button-editor');
    await audit(page, d.name, 'button-editor');
    await closeModal(page);
    const done = page.getByRole('button', { name: /^(Done|Edit)$/ }).first();
    if (await done.count()) await done.click().catch(() => {});
  }

  const food = page.locator('button.aac-btn[aria-label="Food" i]').first();
  if (await food.count()) {
    await food.click();
    await page.waitForTimeout(350);
    await shot(page, d.name, '30-folder');
    await audit(page, d.name, 'folder');
  }
  await ctx.close();
  await browser.close();
  console.log(`${d.name}: done`);
}
srv.close();

const byKey = new Map();
for (const i of issues) {
  const k = `${i.kind}|${i.where}|${i.detail}`;
  if (!byKey.has(k)) byKey.set(k, { ...i, devices: [] });
  byKey.get(k).devices.push(i.device);
}
const rows = [...byKey.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.where.localeCompare(b.where));
const report = rows.map((r) => `- [${r.kind}] ${r.where} (${[...new Set(r.devices)].join(', ')}): ${r.detail}`).join('\n');
fs.writeFileSync(path.join(OUT, 'report.md'), `# Beta test\n\n${rows.length} issues\n\n${report}\n`);
console.log(`${rows.length} issues. Report: ${path.join(OUT, 'report.md')}`);
