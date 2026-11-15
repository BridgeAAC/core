import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const outDir = 'social/instagram';
fs.mkdirSync(outDir, { recursive: true });

const uri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const shots = {
  board: uri('docs/images/01-communication-board.png'),
  planner: uri('docs/images/03-daily-planner-rewards.png'),
  voices: uri('docs/images/06-offline-voices-customization.png'),
  icon: uri('public/icon-512.png'),
};

const FONT = `'SF Pro Display', 'SF Pro Text', -apple-system, 'Helvetica Neue', Arial, sans-serif`;
const METAL = 'linear-gradient(135deg, #e6e7ea 0%, #a2a4aa 26%, #dcdde1 50%, #8f9197 74%, #cfd0d5 100%)';
const TITANIUM = 'linear-gradient(135deg, #cfcbc4 0%, #8e8a84 28%, #bdb9b2 52%, #77746f 76%, #aeaaa3 100%)';

function ipadHtml(img, W, style = '', ar = 2360 / 1640) {
  const rim = Math.max(2, W * 0.0032);
  const bz = W * 0.021;
  const sr = W * 0.022;
  const outer = sr + bz + rim;
  const Ws = W - 2 * (rim + bz);
  const Hs = Ws / ar;
  const H = Hs + 2 * (rim + bz);
  const k = W / 960;
  const html = `<div style="position:absolute;width:${W}px;height:${H}px;${style}">
    <div style="position:absolute;left:${W * 0.74}px;top:${-4 * k}px;width:${46 * k}px;height:${5 * k}px;border-radius:${3 * k}px ${3 * k}px 0 0;background:${METAL}"></div>
    <div style="position:absolute;right:${-3.6 * k}px;top:${H * 0.14}px;width:${4 * k}px;height:${H * 0.07}px;border-radius:0 ${3 * k}px ${3 * k}px 0;background:${METAL}"></div>
    <div style="position:absolute;right:${-3.6 * k}px;top:${H * 0.24}px;width:${4 * k}px;height:${H * 0.07}px;border-radius:0 ${3 * k}px ${3 * k}px 0;background:${METAL}"></div>
    <div style="position:absolute;inset:0;border-radius:${outer}px;background:${METAL};padding:${rim}px;box-shadow:0 50px 90px -30px rgba(0,0,0,.55),0 18px 36px -18px rgba(0,0,0,.4),0 0 0 .5px rgba(0,0,0,.55)">
      <div style="position:relative;width:100%;height:100%;border-radius:${outer - rim}px;background:#040405;padding:${bz}px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)">
        <div style="position:relative;width:100%;height:100%;border-radius:${sr}px;overflow:hidden;background:#fff">
          ${img}
          <div style="position:absolute;inset:0;background:linear-gradient(112deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 40%);pointer-events:none"></div>
        </div>
        <div style="position:absolute;left:50%;top:${(bz - 8 * k) / 2}px;width:${8 * k}px;height:${8 * k}px;margin-left:${-4 * k}px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#2c3140 0%,#0b0c10 60%);box-shadow:0 0 0 ${1.2 * k}px #15161a"></div>
      </div>
    </div>
  </div>`;
  return { html, H };
}

function laptopHtml(inner, W, style = '', kind = 'mac') {
  const mac = kind === 'mac';
  const bz = W * (mac ? 0.016 : 0.026);
  const rim = Math.max(1.5, W * 0.0022);
  const ar = mac ? 1280 / 800 : 1366 / 768;
  const Ws = W - 2 * (bz + rim);
  const Hs = Ws / ar;
  const lidH = Hs + 2 * (bz + rim);
  const baseH = W * (mac ? 0.017 : 0.022);
  const H = lidH + baseH;
  const lidR = W * 0.011;
  const lidBg = mac ? METAL : 'linear-gradient(135deg,#55585e 0%,#2d2f33 50%,#4a4d52 100%)';
  const baseBg = mac
    ? 'linear-gradient(180deg,#dcdde1 0%,#b6b8bd 55%,#9ea0a6 100%)'
    : 'linear-gradient(180deg,#e3e5e9 0%,#c3c6cb 60%,#a8abb1 100%)';
  const html = `<div style="position:absolute;width:${W}px;height:${H}px;${style}">
    <div style="position:absolute;left:0;top:0;width:${W}px;height:${lidH}px;border-radius:${lidR}px ${lidR}px 0 0;background:${lidBg};padding:${rim}px ${rim}px 0;box-shadow:0 0 0 .5px rgba(0,0,0,.6)">
      <div style="position:relative;width:100%;height:100%;border-radius:${lidR - rim}px ${lidR - rim}px 0 0;background:#040405;padding:${bz}px ${bz}px ${bz}px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)">
        <div style="position:relative;width:100%;height:100%;overflow:hidden;border-radius:${W * 0.003}px;background:#fff">
          ${inner}
          <div style="position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 34%);pointer-events:none"></div>
        </div>
        <div style="position:absolute;left:50%;top:${(bz - W * 0.005) / 2}px;width:${W * 0.005}px;height:${W * 0.005}px;margin-left:${(-W * 0.005) / 2}px;border-radius:50%;background:#16181d;box-shadow:0 0 0 1px #202228"></div>
      </div>
    </div>
    <div style="position:absolute;left:${-W * 0.05}px;top:${lidH}px;width:${W * 1.1}px;height:${baseH}px;border-radius:0 0 ${W * 0.03}px ${W * 0.03}px / 0 0 ${baseH * 1.3}px ${baseH * 1.3}px;background:${baseBg};box-shadow:0 ${W * 0.045}px ${W * 0.07}px -${W * 0.025}px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.4)">
      <div style="position:absolute;left:50%;top:0;width:${W * 0.15}px;height:${baseH * 0.5}px;margin-left:${-W * 0.075}px;border-radius:0 0 ${baseH}px ${baseH}px;background:rgba(0,0,0,.16)"></div>
    </div>
  </div>`;
  return { html, H };
}

function statusSvg(k) {
  return `<svg width="${71 * k}" height="${13 * k}" viewBox="0 0 71 13" fill="currentColor" style="display:block">
    <rect x="0" y="8" width="3" height="4" rx="1"/><rect x="4.5" y="6" width="3" height="6" rx="1"/>
    <rect x="9" y="3.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="1" width="3" height="11" rx="1"/>
    <g transform="translate(22,0)" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round">
      <path d="M0.9 4.4 A10 10 0 0 1 15.1 4.4"/><path d="M3.7 7.1 A6 6 0 0 1 12.3 7.1"/>
      <circle cx="8" cy="10.4" r="1.2" fill="currentColor" stroke="none"/>
    </g>
    <g transform="translate(43,0)">
      <rect x="0.5" y="0.5" width="24" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/>
      <rect x="2" y="2" width="21" height="9" rx="2.2"/>
      <path d="M26 4.5 v4 a2 2 0 0 0 0 -4z" fill="currentColor" fill-opacity=".45"/>
    </g>
  </svg>`;
}

function phoneHtml(screenInner, W, style = '', sbColor = '#000') {
  const rim = W * 0.0085;
  const bz = W * 0.015;
  const Ws = W - 2 * (rim + bz);
  const Hs = (Ws * 852) / 393;
  const H = Hs + 2 * (rim + bz);
  const sr = Ws * 0.14;
  const outer = sr + bz + rim;
  const k = Ws / 393;
  const btn = (top, h, side) =>
    `<div style="position:absolute;${side}:${-3.4 * k}px;top:${top}px;width:${4 * k}px;height:${h}px;border-radius:${side === 'left' ? `${2.5 * k}px 0 0 ${2.5 * k}px` : `0 ${2.5 * k}px ${2.5 * k}px 0`};background:${TITANIUM}"></div>`;
  const html = `<div style="position:absolute;width:${W}px;height:${H}px;${sbColor ? `--sbc:${sbColor};` : ''}${style}">
    ${btn(H * 0.135, H * 0.028, 'left')}${btn(H * 0.195, H * 0.05, 'left')}${btn(H * 0.262, H * 0.05, 'left')}${btn(H * 0.225, H * 0.085, 'right')}
    <div style="position:absolute;inset:0;border-radius:${outer}px;background:${TITANIUM};padding:${rim}px;box-shadow:0 50px 90px -30px rgba(0,0,0,.6),0 18px 36px -18px rgba(0,0,0,.45),0 0 0 .5px rgba(0,0,0,.6)">
      <div style="position:relative;width:100%;height:100%;border-radius:${outer - rim}px;background:#020203;padding:${bz}px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)">
        <div style="position:relative;width:100%;height:100%;border-radius:${sr}px;overflow:hidden;background:#fff">
          ${screenInner}
          <div class="sb-time" style="position:absolute;left:${Ws * 0.105}px;top:${Ws * 0.075}px;transform:translateY(-50%);font:600 ${Ws * 0.043}px/1 ${FONT};color:var(--sbc);letter-spacing:-0.01em">9:41</div>
          <div class="sb-icons" style="position:absolute;right:${Ws * 0.085}px;top:${Ws * 0.075}px;transform:translateY(-50%);color:var(--sbc)">${statusSvg(k)}</div>
          <div style="position:absolute;left:50%;top:${Ws * 0.028}px;width:${Ws * 0.32}px;height:${Ws * 0.094}px;margin-left:${-Ws * 0.16}px;border-radius:${Ws * 0.05}px;background:#000"></div>
          <div class="sb-home" style="position:absolute;left:50%;bottom:${Ws * 0.02}px;width:${Ws * 0.34}px;height:${Ws * 0.0127}px;margin-left:${-Ws * 0.17}px;border-radius:99px;background:var(--sbc);opacity:.92"></div>
          <div style="position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.09) 0%,rgba(255,255,255,0) 36%);pointer-events:none"></div>
        </div>
      </div>
    </div>
  </div>`;
  return { html, H };
}

const SAFE_CSS = `
  .topbar { padding-top: 54px !important; }
  .board-wrap { padding-bottom: 30px !important; }
  .modal-backdrop { padding-top: 64px !important; padding-bottom: 38px !important; }
  .toast-stack { display: none !important; }
`;

const base = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  body { font-family: ${FONT}; background: #f4f5f9; color: #0b1220; position: relative; -webkit-font-smoothing: antialiased; }
  .brand { position: absolute; left: 72px; top: 72px; display: flex; align-items: center; gap: 14px; }
  .brand img { width: 52px; height: 52px; border-radius: 13px; box-shadow: 0 1px 2px rgba(0,0,0,.18), 0 0 0 .5px rgba(0,0,0,.08); }
  .brand span { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; }
  h1 { position: absolute; left: 72px; top: 170px; width: 940px; font-size: 116px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.0; }
  p { position: absolute; left: 72px; top: 450px; width: 800px; font-size: 36px; line-height: 1.35; color: #475569; letter-spacing: -0.015em; }
  .blue { color: #2563eb; }
`;

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });

const dist = path.resolve('dist');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-reel-'));
const framesDir = path.join(tmp, 'frames');
fs.mkdirSync(framesDir);
const composeRef = { html: '' };
const types = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/__compose.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(composeRef.html);
    return;
  }
  if (url.startsWith('/__frames/')) {
    const fp = path.join(framesDir, path.basename(url));
    if (fs.existsSync(fp)) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      fs.createReadStream(fp).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end();
    return;
  }
  const p = path.join(dist, url);
  const fp = p.startsWith(dist) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(dist, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const appUrl = `http://127.0.0.1:${srv.address().port}/`;

const VW = 393;
const VH = 852;

const setup = await browser.newContext({ viewport: { width: VW, height: VH } });
const setupPage = await setup.newPage();
await setupPage.goto(appUrl, { waitUntil: 'networkidle' });
await setupPage.evaluate(() => {
  localStorage.setItem('bridgeaac.settings.v2', JSON.stringify({ onboarded: true, speakButtons: false, theme: 'light' }));
});
const state = await setup.storageState();
await setup.close();

const stillCtx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, storageState: state });
const stillPage = await stillCtx.newPage();
await stillPage.goto(appUrl, { waitUntil: 'networkidle' });
await stillPage.addStyleTag({ content: SAFE_CSS });
await stillPage.waitForTimeout(600);
for (const w of ['I', 'want', 'to', 'play']) {
  await stillPage.locator(`button.aac-btn[aria-label="${w}" i]`).first().click();
  await stillPage.waitForTimeout(80);
}
await stillPage.waitForTimeout(300);
const phoneStill = `data:image/png;base64,${(await stillPage.screenshot()).toString('base64')}`;
await stillCtx.close();

const phoneScreen = (src) => `<img src="${src}" style="display:block;width:100%;height:100%;object-fit:cover">`;

const slides = {
  '1-cover': `<style>${base}</style>
    <div class="brand"><img src="${shots.icon}"><span>BridgeAAC</span></div>
    <h1>Speech for<br>everyone.</h1>
    <p>A free, open-source communication app for tablets, phones and computers.</p>
    ${ipadHtml(`<img src="${shots.board}" style="display:block;width:100%;height:100%;object-fit:cover">`, 960, 'left:60px;top:690px').html}`,
  '2-offline': `<style>${base}</style>
    <div class="brand"><img src="${shots.icon}"><span>BridgeAAC</span></div>
    <h1>Talks without<br>Wi-Fi.</h1>
    <p>Download a voice once and it speaks anywhere. Nothing you say leaves the device.</p>
    ${ipadHtml(`<img src="${shots.voices}" style="display:block;width:100%;height:100%;object-fit:cover">`, 960, 'left:60px;top:690px').html}`,
  '3-planner': `<style>${base}</style>
    <div class="brand"><img src="${shots.icon}"><span>BridgeAAC</span></div>
    <h1>Plan the<br>whole day.</h1>
    <p>Visual schedules with spoken steps, mood check-ins, and games that speak every tile.</p>
    ${ipadHtml(`<img src="${shots.planner}" style="display:block;width:100%;height:100%;object-fit:cover">`, 960, 'left:60px;top:690px').html}`,
  '4-free': `<style>${base}
      h1 { font-size: 112px; }
      .list { position: absolute; left: 72px; top: 520px; font-size: 38px; line-height: 1.6; letter-spacing: -0.015em; color: #1f2937; }
      .links { position: absolute; left: 72px; bottom: 96px; font-size: 36px; font-weight: 600; letter-spacing: -0.015em; line-height: 1.5; }
    </style>
    <div class="brand"><img src="${shots.icon}"><span>BridgeAAC</span></div>
    <h1>Free.<br>Open source.</h1>
    <div class="list">No accounts.<br>No ads.<br>No tracking.</div>
    <div class="links"><span class="blue">bridgeaac.org</span><br>github.com/BridgeAAC/core</div>
    ${phoneHtml(phoneScreen(phoneStill), 420, 'left:610px;top:640px').html}`,
};

for (const [name, body] of Object.entries(slides)) {
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`, { waitUntil: 'load' });
  await page.waitForTimeout(200);
  const out = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: out });
  console.log(`Generated ${out}`);
  await ctx.close();
}


const TAP_CSS = `
  .tap-dot{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(120,130,150,.30);border:1.5px solid rgba(120,130,150,.55);pointer-events:none;z-index:9999;animation:tapdot .5s ease-out forwards}
  @keyframes tapdot{from{transform:scale(.5);opacity:1}to{transform:scale(1.35);opacity:0}}
  .toast-stack{display:none!important}
`;

const word = (page, w) => page.locator(`button.aac-btn[aria-label="${w}" i]`).first();
const tools = (page) => page.getByRole('button', { name: /^Planner, moods/ });

const scenes = [
  {
    id: 'phone', kind: 'phone', vw: 393, vh: 852, dsf: 2, touch: true, css: SAFE_CSS, caption: 'On your phone.',
    run: async ({ page, tap }) => {
      await tap('i', word(page, 'I'), 850);
      await tap('want', word(page, 'want'), 850);
      await tap('to', word(page, 'to'), 850);
      await tap('play', word(page, 'play'), 900);
      await tap('speak', page.getByRole('button', { name: 'Speak message' }), 2700);
    },
  },
  {
    id: 'tablet', kind: 'ipad', vw: 834, vh: 1194, dsf: 1.5, touch: true, css: '', caption: 'On your tablet.',
    run: async ({ page, tap }) => {
      await tap('tools', tools(page), 1300);
      await tap('check', page.locator('.modal-card input[type="checkbox"]').nth(0), 4700);
    },
  },
  {
    id: 'laptop', kind: 'mac', vw: 1280, vh: 800, dsf: 1, touch: false, css: '', caption: 'On your laptop.',
    run: async ({ page, tap }) => {
      await tap('tools', tools(page), 1200);
      await tap('moods', page.locator('.modal-card button.tab-btn', { hasText: 'Moods' }), 1100);
      await tap('happy', page.locator('.modal-card button', { hasText: 'Happy' }).first(), 2800);
      await tap('dark', page.locator('.modal-card select').first(), 100);
      await page.locator('.modal-card select').first().selectOption('dark');
      await page.waitForTimeout(1200);
      await tap('close', page.locator('.modal-card .icon-close').first(), 1500);
    },
  },
  {
    id: 'chromebook', kind: 'chrome', vw: 1366, vh: 768, dsf: 1, touch: false, css: '', caption: 'On your Chromebook.',
    run: async ({ page, tap }) => {
      await tap('i', word(page, 'I'), 850);
      await tap('need', word(page, 'need'), 850);
      await tap('help', word(page, 'help'), 900);
      await tap('speak', page.getByRole('button', { name: 'Speak message' }), 2800);
    },
  },
];

async function recordScene(sc) {
  const ctx = await browser.newContext({
    viewport: { width: sc.vw, height: sc.vh },
    deviceScaleFactor: sc.dsf,
    hasTouch: sc.touch,
    storageState: state,
  });
  const page = await ctx.newPage();
  await page.addInitScript((css) => {
    addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    });
    addEventListener('pointerdown', (e) => {
      const d = document.createElement('div');
      d.className = 'tap-dot';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 650);
    }, true);
  }, sc.css + TAP_CSS);

  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  let wall0 = 0;
  cdp.on('Page.screencastFrame', (ev) => {
    if (!frames.length) wall0 = Date.now() / 1000;
    frames.push({ t: ev.metadata.timestamp, data: ev.data });
    void cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: Math.round(sc.vw * sc.dsf), maxHeight: Math.round(sc.vh * sc.dsf), everyNthFrame: 1 });
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);

  const marks = {};
  const tap = async (name, locator, wait) => {
    marks[name] = Date.now() / 1000 - wall0;
    if (sc.touch) await locator.tap();
    else await locator.click();
    await page.waitForTimeout(wait);
  };
  await sc.run({ page, tap });
  marks.end = Date.now() / 1000 - wall0;
  await cdp.send('Page.stopScreencast');
  await ctx.close();

  const f0 = frames[0].t;
  frames.forEach((f, i) => {
    fs.writeFileSync(path.join(framesDir, `${sc.id}-${String(i).padStart(5, '0')}.jpg`), Buffer.from(f.data, 'base64'));
  });
  const times = frames.map((f) => f.t - f0);
  const first = Math.min(...Object.entries(marks).filter(([k]) => k !== 'end').map(([, v]) => v));
  const startRel = Math.max(0, first - 1.0);
  console.log(`${sc.id}: ${frames.length} frames, ${(marks.end - startRel).toFixed(1)}s used`);
  return { ...sc, marks, times, startRel, D: marks.end - startRel + 0.5, nFrames: frames.length };
}

const rs = [];
for (const sc of scenes) rs.push(await recordScene(sc));
await browser.close();

const OVERLAP = 0.45;
let acc = 0;
for (const r of rs) {
  r.T = acc;
  acc += r.D - OVERLAP;
}
const lineupT = acc;
const LINEUP_D = 3.6;
const endT = lineupT + LINEUP_D - 0.4;
const END_D = 3.8;
const total = endT + END_D;
const FPS = 30;
const nFrames = Math.round(total * FPS);
console.log(`Timeline: ${total.toFixed(1)}s`);

const CY0 = 430;
const CH = 1420;
const placed = {};
const sceneDom = rs.map((r, i) => {
  let d;
  const img = `<img id="s${i}" style="display:block;width:100%;height:100%;object-fit:cover;background:#fff">`;
  if (r.kind === 'phone') d = phoneHtml(img, 684, '', null);
  else if (r.kind === 'ipad') d = ipadHtml(img, 760, '', 834 / 1194);
  else if (r.kind === 'mac') d = laptopHtml(img, 900, '', 'mac');
  else d = laptopHtml(img, 880, '', 'chrome');
  const W = r.kind === 'phone' ? 684 : r.kind === 'ipad' ? 760 : r.kind === 'mac' ? 900 : 880;
  const left = (1080 - W) / 2;
  const wide = r.kind === 'mac' || r.kind === 'chrome';
  const groupH = 260 + d.H;
  const top = wide ? (1920 - groupH) / 2 + 260 : CY0 + (CH - d.H) / 2;
  r.capTop = wide ? (1920 - groupH) / 2 : 225;
  placed[i] = { cx: 540, cy: top + d.H / 2 };
  const html = d.html.replace('position:absolute;', `position:absolute;left:${left}px;top:${top}px;`);
  return `<div class="wrap" id="d${i}" style="transform-origin:540px ${top + d.H / 2}px">${html}</div>`;
});

const lineup = [
  { kind: 'mac', W: 560, left: 36, bottom: 1010, src: rs[2], delay: 0.0 },
  { kind: 'chrome', W: 470, left: 580, bottom: 1010, src: rs[3], delay: 0.14 },
  { kind: 'ipad', W: 440, left: 96, bottom: 1740, src: rs[1], delay: 0.28 },
  { kind: 'phone', W: 252, left: 650, bottom: 1740, src: rs[0], delay: 0.42 },
];
const lineupDom = lineup.map((l, i) => {
  const img = `<img id="l${i}" style="display:block;width:100%;height:100%;object-fit:cover;background:#fff">`;
  let d;
  if (l.kind === 'phone') d = phoneHtml(img, l.W, '', null);
  else if (l.kind === 'ipad') d = ipadHtml(img, l.W, '', 834 / 1194);
  else d = laptopHtml(img, l.W, '', l.kind);
  const top = l.bottom - d.H;
  const html = d.html.replace('position:absolute;', `position:absolute;left:${l.left}px;top:${top}px;`);
  return `<div class="wrap lu" id="L${i}">${html}</div>`;
});
const lastFrame = (r) => `/__frames/${r.id}-${String(r.nFrames - 1).padStart(5, '0')}.jpg`;

const cfg = {
  scenes: rs.map((r, i) => ({ T: r.T, D: r.D, cap: r.caption })),
  lineup: { T: lineupT, items: lineup.map((l) => l.delay), srcs: lineup.map((l) => lastFrame(l.src)), cap: 'On every screen.' },
  endT,
  total,
};

composeRef.html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1920px; overflow: hidden; background: #000; }
  body { font-family: ${FONT}; -webkit-font-smoothing: antialiased; position: relative; color: #f5f5f7; }
  .wrap { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; opacity: 0; will-change: transform, opacity; --sbc: #000; }
  .cap { position: absolute; left: 0; right: 0; top: 225px; text-align: center; font-weight: 600; font-size: 90px; letter-spacing: -0.035em; line-height: 1.05; opacity: 0; will-change: transform, opacity; }
  #end { position: absolute; inset: 0; opacity: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; padding-bottom: 60px; }
  #end img { width: 168px; height: 168px; border-radius: 38px; box-shadow: 0 0 0 .5px rgba(255,255,255,.18), 0 30px 60px rgba(0,0,0,.5); margin-bottom: 18px; }
  #end .t { font-size: 124px; font-weight: 700; letter-spacing: -0.04em; }
  #end .s { font-size: 50px; color: #86868b; letter-spacing: -0.02em; font-weight: 500; }
  #end .u { font-size: 44px; color: #2997ff; letter-spacing: -0.015em; margin-top: 26px; font-weight: 500; }
</style></head><body>
  ${rs.map((r, i) => `<div class="cap" id="cap${i}" style="top:${r.capTop}px">${r.caption}</div>`).join('')}
  <div class="cap" id="capL" style="top:290px">On every screen.</div>
  ${sceneDom.join('\n')}
  ${lineupDom.join('\n')}
  <div id="end"><img src="${shots.icon}"><div class="t">BridgeAAC</div><div class="s">Free and open source.</div><div class="u">bridgeaac.org</div></div>
  <script>
    const cfg = ${JSON.stringify(cfg)};
    const clamp = (x) => Math.min(1, Math.max(0, x));
    const outCubic = (x) => 1 - Math.pow(1 - x, 3);
    const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const capStyle = (el, t, s, e) => {
      const a = outCubic(clamp((t - s) / 0.55));
      const b = clamp((t - (e - 0.4)) / 0.4);
      el.style.opacity = String(t < s || t > e ? 0 : a * (1 - b));
      el.style.transform = 'translateY(' + ((1 - a) * 26 - b * 14).toFixed(2) + 'px)';
    };
    window.init = async () => {
      const loads = [];
      cfg.lineup.srcs.forEach((src, i) => {
        const img = document.getElementById('l' + i);
        img.src = src;
        loads.push(img.decode().catch(() => {}));
      });
      await Promise.all(loads);
    };
    window.render = async (t, srcs) => {
      const loads = [];
      cfg.scenes.forEach((sc, i) => {
        const w = document.getElementById('d' + i);
        const src = srcs[i];
        if (src == null) { w.style.opacity = '0'; document.getElementById('cap' + i).style.opacity = '0'; return; }
        const img = document.getElementById('s' + i);
        if (img.dataset.src !== src) { img.dataset.src = src; img.src = src; loads.push(img.decode().catch(() => {})); }
        const enter = outCubic(clamp((t - sc.T) / 0.7));
        const exit = inOut(clamp((t - (sc.T + sc.D - 0.5)) / 0.5));
        const prog = clamp((t - sc.T) / sc.D);
        const scale = (0.95 + 0.05 * enter + 0.014 * prog) * (1 - 0.04 * exit);
        w.style.opacity = String(enter * (1 - exit));
        w.style.transform = 'translateY(' + ((1 - enter) * 60).toFixed(2) + 'px) scale(' + scale.toFixed(4) + ')';
        capStyle(document.getElementById('cap' + i), t, sc.T + 0.25, sc.T + sc.D - 0.3);
      });
      await Promise.all(loads);
      const L = cfg.lineup;
      const exitL = inOut(clamp((t - cfg.endT) / 0.6));
      L.items.forEach((delay, i) => {
        const el = document.getElementById('L' + i);
        const e = outCubic(clamp((t - L.T - delay) / 0.75));
        el.style.opacity = String(e * (1 - exitL));
        el.style.transform = 'translateY(' + ((1 - e) * 70).toFixed(2) + 'px)';
      });
      capStyle(document.getElementById('capL'), t, L.T + 0.2, cfg.endT - 0.1);
      const endEl = document.getElementById('end');
      const eo = outCubic(clamp((t - cfg.endT - 0.45) / 0.8));
      endEl.style.opacity = String(eo);
      endEl.style.transform = 'translateY(' + ((1 - eo) * 30).toFixed(2) + 'px)';
    };
  </script>
</body></html>`;

const rb = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const cctx = await rb.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const cp = await cctx.newPage();
await cp.goto(`http://127.0.0.1:${srv.address().port}/__compose.html`, { waitUntil: 'load' });
await cp.evaluate(() => window.init());
const seqDir = path.join(tmp, 'seq');
fs.mkdirSync(seqDir);
const ptr = rs.map(() => 0);
for (let i = 0; i < nFrames; i++) {
  const t = i / FPS;
  const srcs = rs.map((r, k) => {
    if (t < r.T - 0.02 || t > r.T + r.D + 0.02) return null;
    const rt = r.startRel + Math.min(t - r.T, r.D);
    while (ptr[k] + 1 < r.times.length && r.times[ptr[k] + 1] <= rt) ptr[k]++;
    return `/__frames/${r.id}-${String(ptr[k]).padStart(5, '0')}.jpg`;
  });
  await cp.evaluate(([tt, s]) => window.render(tt, s), [t, srcs]);
  await cp.screenshot({ path: path.join(seqDir, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
  if (i % 90 === 0) console.log(`  rendered ${i}/${nFrames}`);
}
await cctx.close();
await rb.close();
srv.close();

const at = (r, name) => r.T + (r.marks[name] - r.startRel);
const [rPhone, rTablet, rLaptop, rChrome] = rs;
const audioDir = 'social/audio';
const voice = [
  ['i.wav', at(rPhone, 'i') + 0.04],
  ['want.wav', at(rPhone, 'want') + 0.04],
  ['to.wav', at(rPhone, 'to') + 0.04],
  ['play.wav', at(rPhone, 'play') + 0.04],
  ['sentence.wav', at(rPhone, 'speak') + 0.05],
  ['planner.wav', at(rTablet, 'check') + 0.08],
  ['mood.wav', at(rLaptop, 'happy') + 0.08],
  ['i.wav', at(rChrome, 'i') + 0.04],
  ['need.wav', at(rChrome, 'need') + 0.04],
  ['help.wav', at(rChrome, 'help') + 0.04],
  ['sentence2.wav', at(rChrome, 'speak') + 0.05],
];
const ticks = [at(rTablet, 'tools'), at(rLaptop, 'tools'), at(rLaptop, 'moods'), at(rLaptop, 'close')];

const progression = [
  [130.81, 196.0, 329.63, 493.88],
  [110.0, 164.81, 261.63, 392.0],
  [87.31, 130.81, 220.0, 329.63],
  [98.0, 146.83, 246.94, 329.63],
];
const padChords = [];
for (let k = 0; k * 5 < total; k++) padChords.push({ at: k * 5, notes: progression[k % progression.length] });
const padArgs = ['-y', '-loglevel', 'error'];
const padFilters = [];
const padLabels = [];
let pi = 0;
for (const ch of padChords) {
  for (const f of ch.notes) {
    const expr = `0.015*(sin(2*PI*${f.toFixed(2)}*t)+0.7*sin(2*PI*${(f * 1.004).toFixed(3)}*t)+0.16*sin(2*PI*${(f * 2).toFixed(2)}*t))`;
    padArgs.push('-f', 'lavfi', '-i', `aevalsrc=${expr}:s=44100:d=7.5`);
    const ms = Math.round(ch.at * 1000);
    padFilters.push(`[${pi}:a]afade=t=in:d=2.2,afade=t=out:st=5.3:d=2.2,adelay=${ms}|${ms}[p${pi}]`);
    padLabels.push(`[p${pi}]`);
    pi++;
  }
}
const padWav = path.join(tmp, 'pad.wav');
padFilters.push(
  `${padLabels.join('')}amix=inputs=${pi}:normalize=0,lowpass=f=1500,tremolo=f=0.16:d=0.22,aecho=0.8:0.82:90|190:0.32|0.22,atrim=0:${total.toFixed(3)},afade=t=in:d=1.4,afade=t=out:st=${(total - 2.4).toFixed(3)}:d=2.4,aresample=44100,aformat=channel_layouts=stereo[pad]`,
);
padArgs.push('-filter_complex', padFilters.join(';'), '-map', '[pad]', padWav);
execFileSync('ffmpeg', padArgs, { stdio: 'inherit' });

const mixArgs = ['-y', '-loglevel', 'error', '-i', padWav];
const mixFilters = ['[0:a]volume=2.2[pad]'];
const mixLabels = ['[pad]'];
let mi = 1;
for (const [file, when] of voice) {
  mixArgs.push('-i', path.join(audioDir, file));
  const ms = Math.round(when * 1000);
  mixFilters.push(`[${mi}:a]aformat=channel_layouts=stereo,volume=1.35,adelay=${ms}|${ms}[v${mi}]`);
  mixLabels.push(`[v${mi}]`);
  mi++;
}
for (const when of ticks) {
  mixArgs.push('-f', 'lavfi', '-t', '0.09', '-i', 'aevalsrc=0.35*sin(2*PI*1568*t)*exp(-70*t):s=44100:c=stereo');
  const ms = Math.round(when * 1000 + 30);
  mixFilters.push(`[${mi}:a]adelay=${ms}|${ms}[v${mi}]`);
  mixLabels.push(`[v${mi}]`);
  mi++;
}
mixFilters.push(`${mixLabels.join('')}amix=inputs=${mi}:normalize=0,alimiter=limit=0.8,atrim=0:${total.toFixed(3)}[out]`);
mixArgs.push('-filter_complex', mixFilters.join(';'), '-map', '[out]', '-ar', '44100', path.join(tmp, 'mix.wav'));
execFileSync('ffmpeg', mixArgs, { stdio: 'inherit' });

const final = path.join(outDir, 'reel-bridgeaac.mp4');
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-framerate', String(FPS), '-i', path.join(seqDir, '%05d.jpg'),
  '-i', path.join(tmp, 'mix.wav'),
  '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final,
], { stdio: 'inherit' });
console.log(`Generated ${final} (${total.toFixed(1)}s)`);
fs.rmSync(tmp, { recursive: true, force: true });
