import { chromium } from 'playwright-core';
import fs from 'node:fs';

const icon = `data:image/png;base64,${fs.readFileSync('public/icon-512.png').toString('base64')}`;
const FONT = `'Google Sans', 'Roboto', 'Noto Sans', 'Helvetica Neue', Arial, sans-serif`;
const BLUE = '#1a73e8';
const GREEN = '#01875f';

const people = `<svg width="30" height="30" viewBox="0 0 24 24" fill="${BLUE}"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 19c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6z"/><circle cx="17.4" cy="9" r="2.6"/><path d="M17 13.4c2.6 0 4.5 1.6 4.5 4.1V19H17.5c0-2-.5-4-2-5.4.5-.1 1-.2 1.5-.2z"/></svg>`;
const link = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>`;
const lock = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368"><rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#5f6368" stroke-width="2.6" stroke-linecap="round"/></svg>`;
const check = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1080px; height: 1350px; }
body { font-family: ${FONT}; color: #0f172a; -webkit-font-smoothing: antialiased; position: relative; overflow: hidden;
  background: radial-gradient(900px 520px at 100% -8%, #dbe9ff 0%, rgba(219,233,255,0) 70%), radial-gradient(700px 480px at -10% 28%, #dcf5e9 0%, rgba(220,245,233,0) 70%), #f6f8fc; }
.brand { position: absolute; left: 64px; top: 56px; display: flex; align-items: center; gap: 14px; }
.brand img { width: 54px; height: 54px; border-radius: 14px; box-shadow: 0 2px 8px rgba(15,23,42,.18); }
.brand span { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
.tag { position: absolute; right: 64px; top: 60px; background: ${GREEN}; color: #fff; font-size: 22px; font-weight: 700; padding: 10px 22px; border-radius: 99px; letter-spacing: .01em; }
h1 { position: absolute; left: 64px; top: 150px; width: 950px; font-size: 88px; font-weight: 800; letter-spacing: -0.045em; line-height: .98; }
h1 em { font-style: normal; color: ${BLUE}; }
.sub { position: absolute; left: 64px; top: 352px; font-size: 32px; color: #475569; letter-spacing: -0.01em; }
.grid { position: absolute; left: 64px; right: 64px; top: 428px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.card { background: rgba(255,255,255,.92); border-radius: 30px; padding: 26px; box-shadow: 0 1px 2px rgba(15,23,42,.06), 0 10px 30px rgba(15,23,42,.07), 0 0 0 1px rgba(15,23,42,.05); height: 380px; display: flex; flex-direction: column; }
.head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.n { width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #3b8cff, ${BLUE}); color: #fff; font-size: 24px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex: 0 0 46px; box-shadow: 0 4px 10px rgba(26,115,232,.35); }
.t { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
.t b { color: ${BLUE}; font-weight: 700; }
.mock { flex: 1; background: #f1f4f9; border-radius: 22px; padding: 18px; display: flex; flex-direction: column; justify-content: center; gap: 14px; overflow: hidden; }
.panel { background: #fff; border-radius: 18px; box-shadow: 0 1px 3px rgba(15,23,42,.1); padding: 18px; }
.row { display: flex; align-items: center; gap: 14px; }
.av { width: 56px; height: 56px; border-radius: 16px; background: #e8f0fe; display: flex; align-items: center; justify-content: center; flex: 0 0 56px; }
.gn { font-size: 23px; font-weight: 700; letter-spacing: -0.01em; }
.gs { font-size: 18px; color: #5f6368; margin-top: 2px; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 99px; font-weight: 700; font-size: 22px; padding: 12px 26px; }
.btn.blue { background: ${BLUE}; color: #fff; }
.btn.green { background: ${GREEN}; color: #fff; }
.btn.full { width: 100%; }
.url { background: #fff; border-radius: 99px; height: 54px; padding: 0 18px; display: flex; align-items: center; gap: 10px; font-size: 21px; color: #202124; box-shadow: 0 1px 3px rgba(15,23,42,.12); white-space: nowrap; overflow: hidden; }
.chip { display: inline-flex; align-items: center; gap: 8px; background: #fff3d6; color: #7a5200; font-weight: 600; font-size: 19px; padding: 9px 16px; border-radius: 12px; align-self: flex-start; }
.note { font-size: 20px; color: #5f6368; line-height: 1.3; }
.ph { text-align: center; font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 4px; }
.app { display: flex; align-items: center; gap: 16px; }
.app img { width: 84px; height: 84px; border-radius: 20px; box-shadow: 0 2px 8px rgba(15,23,42,.2); }
.app .nm { font-size: 26px; font-weight: 700; }
.app .by { font-size: 18px; color: ${GREEN}; font-weight: 600; margin-top: 2px; }
.meta { display: flex; align-items: center; gap: 6px; font-size: 18px; color: #5f6368; margin-top: 4px; }
.foot { position: absolute; left: 64px; right: 64px; bottom: 42px; display: flex; justify-content: space-between; align-items: center; }
.foot .u { font-size: 32px; font-weight: 800; color: ${BLUE}; letter-spacing: -0.015em; }
.foot .s { font-size: 19px; color: #94a3b8; }
</style></head><body>
  <div class="brand"><img src="${icon}" alt=""><span>BridgeAAC</span></div>
  <div class="tag">Free early access</div>
  <h1>Try BridgeAAC<br>on <em>Android.</em></h1>
  <div class="sub">Four quick steps. About 2 minutes.</div>
  <div class="grid">
    <div class="card"><div class="head"><div class="n">1</div><div class="t">Join the <b>Google Group</b></div></div>
      <div class="mock">
        <div class="panel"><div class="row"><div class="av">${people}</div><div><div class="gn">BridgeAAC testers</div><div class="gs">Google Groups</div></div></div></div>
        <div class="btn blue full">Join group</div>
        <div class="note">Use the group link in the post.</div>
      </div></div>
    <div class="card"><div class="head"><div class="n">2</div><div class="t">Open the <b>test link</b></div></div>
      <div class="mock">
        <div class="url">${lock}<span>play.google.com</span><span style="margin-left:auto">${link}</span></div>
        <div class="chip">Same Gmail as step 1</div>
        <div class="note">Open it on your Android phone.</div>
      </div></div>
    <div class="card"><div class="head"><div class="n">3</div><div class="t">Tap <b>Become a tester</b></div></div>
      <div class="mock">
        <div class="panel"><div class="ph">You're invited to test</div>
          <div class="app" style="margin-top:12px"><img src="${icon}" alt=""><div><div class="nm">BridgeAAC</div><div class="by">Early access</div></div></div></div>
        <div class="btn green full">Become a tester</div>
      </div></div>
    <div class="card"><div class="head"><div class="n">4</div><div class="t">Install from <b>Google Play</b></div></div>
      <div class="mock">
        <div class="panel"><div class="app"><img src="${icon}" alt=""><div><div class="nm">BridgeAAC</div><div class="by">BridgeAAC</div><div class="meta"><span>Free, no ads</span></div></div></div></div>
        <div class="btn green full">${check} Install</div>
        <div class="note">It opens like any other app.</div>
      </div></div>
  </div>
  <div class="foot"><div class="u">bridgeaac.org</div><div class="s">Android phones and tablets. Screens may look slightly different.</div></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(250);
await page.screenshot({ path: 'social/facebook/install-on-android.png' });
console.log('Generated social/facebook/install-on-android.png');
await browser.close();
