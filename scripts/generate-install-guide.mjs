import { chromium } from 'playwright-core';
import fs from 'node:fs';

const icon = `data:image/png;base64,${fs.readFileSync('public/icon-512.png').toString('base64')}`;
const FONT = `'SF Pro Display', 'SF Pro Text', -apple-system, 'Helvetica Neue', Arial, sans-serif`;
const BLUE = '#007aff';

const shareIcon = (s = 34, c = BLUE) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M6 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"/></svg>`;
const plusSquare = (s = 28, c = '#1c1c1e') =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;
const bookmark = (s = 26) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-5-7 5z"/></svg>`;
const copy = (s = 26) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>`;
const find = (s = 26) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`;
const lock = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#8e8e93"><rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#8e8e93" stroke-width="2.4" stroke-linecap="round"/></svg>`;
const chevron = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const tabs = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2" stroke-linejoin="round"><rect x="3" y="7" width="14" height="14" rx="2.5"/><path d="M7 4h12a2 2 0 0 1 2 2v12"/></svg>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1080px; height: 1350px; }
body { font-family: ${FONT}; background: #f4f5f9; color: #0b1220; -webkit-font-smoothing: antialiased; position: relative; overflow: hidden; }
.brand { position: absolute; left: 64px; top: 56px; display: flex; align-items: center; gap: 14px; }
.brand img { width: 52px; height: 52px; border-radius: 13px; box-shadow: 0 1px 2px rgba(0,0,0,.18), 0 0 0 .5px rgba(0,0,0,.08); }
.brand span { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; }
h1 { position: absolute; left: 64px; top: 140px; width: 950px; font-size: 76px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.02; }
.sub { position: absolute; left: 64px; top: 318px; font-size: 32px; color: #475569; letter-spacing: -0.015em; }
.grid { position: absolute; left: 64px; right: 64px; top: 392px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.card { background: #fff; border-radius: 28px; padding: 26px 26px 24px; box-shadow: 0 1px 2px rgba(15,23,42,.06), 0 0 0 .5px rgba(15,23,42,.08); height: 400px; display: flex; flex-direction: column; }
.head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.n { width: 44px; height: 44px; border-radius: 50%; background: ${BLUE}; color: #fff; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: 0 0 44px; }
.t { font-size: 28px; font-weight: 650; letter-spacing: -0.02em; line-height: 1.15; }
.t b { color: ${BLUE}; font-weight: 650; }
.mock { flex: 1; background: #f2f2f7; border-radius: 20px; padding: 18px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; }
.pill { background: #e5e5ea; border-radius: 14px; height: 52px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 24px; color: #1c1c1e; font-weight: 500; }
.bar { display: flex; align-items: center; gap: 14px; }
.ring { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
.ring::before { content: ''; position: absolute; inset: -2px; border-radius: 50%; border: 4px solid ${BLUE}; background: rgba(0,122,255,.12); }
.ring svg { position: relative; }
.note { margin-top: 14px; font-size: 21px; color: #6b7280; text-align: center; line-height: 1.3; }
.list { background: #fff; border-radius: 16px; overflow: hidden; }
.row { display: flex; align-items: center; justify-content: space-between; padding: 0 18px; height: 56px; font-size: 22px; color: #1c1c1e; border-bottom: 1px solid #ececf0; }
.row:last-child { border-bottom: none; }
.row.hi { background: ${BLUE}; color: #fff; font-weight: 600; }
.row.hi svg * { stroke: #fff; }
.dlg { background: #fff; border-radius: 16px; overflow: hidden; }
.dh { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 14px; height: 52px; font-size: 18px; border-bottom: 1px solid #ececf0; white-space: nowrap; }
.dh .c { color: ${BLUE}; }
.dh .m { font-weight: 600; }
.add { background: ${BLUE}; color: #fff; font-weight: 700; padding: 5px 15px; border-radius: 99px; }
.db { display: flex; align-items: center; gap: 16px; padding: 18px; }
.db img { width: 76px; height: 76px; border-radius: 18px; box-shadow: 0 0 0 .5px rgba(0,0,0,.15); }
.db .nm { font-size: 24px; font-weight: 600; }
.db .u { font-size: 19px; color: #8e8e93; margin-top: 2px; }
.foot { position: absolute; left: 64px; right: 64px; bottom: 44px; display: flex; justify-content: space-between; align-items: center; }
.foot .u { font-size: 30px; font-weight: 650; color: #2563eb; letter-spacing: -0.015em; }
.foot .s { font-size: 19px; color: #94a3b8; }
</style></head><body>
  <div class="brand"><img src="${icon}"><span>BridgeAAC</span></div>
  <h1>Install BridgeAAC on iPad and iPhone.</h1>
  <div class="sub">Free. No App Store needed. About 30 seconds.</div>
  <div class="grid">
    <div class="card"><div class="head"><div class="n">1</div><div class="t">Open <b>Safari</b> and go to bridgeaac.org</div></div>
      <div class="mock"><div class="pill">${lock}bridgeaac.org</div><div class="note">Use Safari for this. It's the blue compass icon.</div></div></div>
    <div class="card"><div class="head"><div class="n">2</div><div class="t">Tap the <b>Share</b> button</div></div>
      <div class="mock"><div class="bar">${chevron('M15 5l-7 7 7 7')}${chevron('M9 5l7 7-7 7')}<div class="pill" style="flex:1;height:48px;font-size:21px">${lock}bridgeaac.org</div><div class="ring">${shareIcon(34)}</div>${tabs}</div><div class="note">iPad: top right of the screen.<br>iPhone: bottom of the screen.</div></div></div>
    <div class="card"><div class="head"><div class="n">3</div><div class="t">Scroll down and tap <b>Add to Home Screen</b></div></div>
      <div class="mock"><div class="list">
        <div class="row"><span>Copy</span>${copy()}</div>
        <div class="row"><span>Add to Bookmarks</span>${bookmark()}</div>
        <div class="row hi"><span>Add to Home Screen</span>${plusSquare()}</div>
        <div class="row"><span>Find on Page</span>${find()}</div></div></div></div>
    <div class="card"><div class="head"><div class="n">4</div><div class="t">Tap <b>Add</b>. That's it.</div></div>
      <div class="mock"><div class="dlg"><div class="dh"><span class="c">Cancel</span><span class="m">Add to Home Screen</span><span class="add">Add</span></div>
        <div class="db"><img src="${icon}"><div><div class="nm">BridgeAAC</div><div class="u">bridgeaac.org</div></div></div></div></div></div>
  </div>
  <div class="foot"><div class="u">bridgeaac.org</div><div class="s">Illustration. Your screen may look slightly different.</div></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(250);
await page.screenshot({ path: 'social/facebook/install-on-ios.png' });
console.log('Generated social/facebook/install-on-ios.png');
await browser.close();
