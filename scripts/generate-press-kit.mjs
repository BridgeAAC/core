import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ipadHtml, laptopHtml, phoneHtml, statusSvg } from './lib/device-frames.mjs';

const OUT = path.resolve(process.argv[2] || 'press-kit');
fs.mkdirSync(OUT, { recursive: true });
const dist = path.resolve('dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Run npm run build first.');

const types = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const p = path.join(dist, url);
  const fp = p.startsWith(dist) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(dist, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const appUrl = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });

const FONT = `'SF Pro Display', 'SF Pro Text', -apple-system, 'Helvetica Neue', Arial, sans-serif`;
const ICON = `data:image/png;base64,${fs.readFileSync('AppIcon.png').toString('base64')}`;
const PHONE_CSS = `.topbar{padding-top:62px!important}.board-wrap{padding-bottom:34px!important}.modal-backdrop{padding-top:70px!important;padding-bottom:40px!important}`;

async function capture({ w, h, dsf, words = [], theme = 'light', size = 60, after, css = '', statusBar = false }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.speak = (u) => setTimeout(() => {
      u.dispatchEvent(new Event('start'));
      u.dispatchEvent(new Event('end'));
    }, 20);
  });
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('bridgeaac.settings.v2', JSON.stringify({ onboarded: true, speakButtons: false, theme: 'light' })));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  if (size !== 60) {
    await page.locator('.nav-btn.vocab-btn').click();
    await page.waitForTimeout(400);
    await page.locator('.modal-card button', { hasText: /Add Starter Board|Choose starting board/ }).first().click();
    await page.waitForTimeout(600);
    const card = page.locator('.pageset-card', { hasText: `BridgeWords ${size}` }).first();
    if ((await card.getAttribute('aria-pressed')) !== 'true') await card.click();
    await page.locator('.pageset-btn-next, .pageset-btn-continue').last().click();
    await page.waitForTimeout(1200);
    for (let i = 0; i < 3 && (await page.locator('.modal-card').count()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
  }
  await page.addStyleTag({ content: `.toast-stack{display:none!important}${css}` });
  if (statusBar) {
    await page.evaluate(([icons, width]) => {
      const bar = document.createElement('div');
      bar.style.cssText = 'position:fixed;left:0;right:0;top:0;height:54px;z-index:2147483647;pointer-events:none;color:#000';
      bar.innerHTML = `<div style="position:absolute;left:${Math.round(width * 0.155)}px;top:21px;width:60px;text-align:center;font:600 17px/1 'SF Pro Text',-apple-system,sans-serif">9:41</div><div style="position:absolute;right:${Math.round(width * 0.075)}px;top:21px">${icons}</div>`;
      document.body.appendChild(bar);
    }, [statusSvg(1.15), w]);
  }
  if (theme !== 'light') await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  for (const word of words) {
    const b = page.locator(`button.aac-btn[aria-label="${word}" i]`).first();
    if (await b.count()) await b.click();
    await page.waitForTimeout(90);
  }
  if (after) await after(page);
  await page.waitForTimeout(500);
  await page.waitForTimeout(400);
  const buf = await page.screenshot({ type: 'png' });
  await ctx.close();
  return buf;
}

const tools = async (page, tab) => {
  await page.getByRole('button', { name: /^Planner, moods/ }).click();
  await page.waitForTimeout(500);
  if (tab) {
    await page.locator('.modal-card button.tab-btn', { hasText: tab }).first().click();
    await page.waitForTimeout(400);
  }
};
const checkTasks = async (page) => {
  const boxes = page.locator('.modal-card input[type="checkbox"]');
  for (let i = 0; i < 2; i++) { await boxes.nth(i).click(); await page.waitForTimeout(300); }
  await page.waitForFunction(() => !document.querySelector('button[aria-label="Stop speaking"]'), null, { timeout: 15000 }).catch(() => {});
};

const shots = {
  board: await capture({ w: 1366, h: 1024, dsf: 2, words: ['I', 'want', 'to', 'play'] }),
  calm: await capture({ w: 1366, h: 1024, dsf: 2, words: ['I', 'need', 'help'], theme: 'calm' }),
  planner: await capture({ w: 1366, h: 1024, dsf: 2, after: async (p) => { await tools(p); await checkTasks(p); } }),
  moods: await capture({ w: 1366, h: 1024, dsf: 2, after: (p) => tools(p, 'Moods') }),
  phone: await capture({ w: 430, h: 932, dsf: 3, size: 42, words: ['I', 'want', 'more'], css: PHONE_CSS }),
  phoneRaw: await capture({ w: 430, h: 932, dsf: 3, size: 42, words: ['I', 'want', 'more'], css: PHONE_CSS, statusBar: true }),
  mac: await capture({ w: 1440, h: 900, dsf: 2, words: ['I', 'like', 'to', 'go'] }),
};

const save = (name, buf) => fs.writeFileSync(path.join(OUT, name), buf);
save('app-screen-board-ipad.png', shots.board);
save('app-screen-calm-mode-ipad.png', shots.calm);
save('app-screen-daily-planner-ipad.png', shots.planner);
save('app-screen-mood-check-in-ipad.png', shots.moods);
save('app-screen-iphone.png', shots.phoneRaw);

const uri = (buf) => `data:image/png;base64,${buf.toString('base64')}`;
const fill = (buf) => `<img src="${uri(buf)}" style="display:block;width:100%;height:100%;object-fit:cover">`;

async function render(name, body, bg) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{width:1920px;height:1080px;overflow:hidden}
    body{font-family:${FONT};-webkit-font-smoothing:antialiased;position:relative;background:${bg}}
  </style></head><body>${body}</body></html>`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 95 });
  await ctx.close();
}

const LIGHT = 'radial-gradient(1400px 800px at 50% 40%, #ffffff 0%, #eef2f8 60%, #e2e8f2 100%)';
const ar = 1366 / 1024;

const placed = (fn, inner, W, cx, cy, extra) => {
  const { H } = fn(inner, W, '', ...extra);
  return fn(inner, W, `left:${Math.round(cx - W / 2)}px;top:${Math.round(cy - H / 2)}px`, ...extra);
};
const hero = placed(ipadHtml, fill(shots.board), 1260, 960, 540, [ar]);
await render('photo-1-bridgeaac-on-ipad.jpg', hero.html, LIGHT);

const pairIpad = placed(ipadHtml, fill(shots.board), 1180, 800, 540, [ar]);
const pairPhone = placed(phoneHtml, fill(shots.phone), 380, 1500, 560, [null]);
await render('photo-2-ipad-and-iphone.jpg', pairIpad.html + pairPhone.html, LIGHT);

const lMac = laptopHtml(fill(shots.mac), 1100, 'left:410px;top:150px', 'mac');
const lIpad = ipadHtml(fill(shots.calm), 760, 'left:120px;top:400px', ar);
const lPhone = phoneHtml(fill(shots.phone), 270, 'left:1480px;top:390px', null);
await render('photo-3-works-on-every-device.jpg', lMac.html + lIpad.html + lPhone.html, LIGHT);

const planner = placed(ipadHtml, fill(shots.planner), 1260, 960, 540, [ar]);
await render('photo-4-daily-planner.jpg', planner.html, LIGHT);

await render('photo-5-logo-card.jpg', `
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px">
    <img src="${ICON}" style="width:300px;height:300px;border-radius:67px;box-shadow:0 30px 70px rgba(15,23,42,.18)">
    <div style="font-size:120px;font-weight:700;letter-spacing:-0.045em;color:#0f172a">BridgeAAC</div>
    <div style="font-size:44px;font-weight:500;color:#475569;letter-spacing:-0.02em">A free app that speaks for people who can't</div>
    <div style="font-size:36px;font-weight:600;color:#2563eb;margin-top:10px">bridgeaac.org</div>
  </div>`, LIGHT);

fs.copyFileSync('AppIcon.png', path.join(OUT, 'bridgeaac-app-icon.png'));
await browser.close();
srv.close();
console.log(`Press kit written to ${OUT}`);
