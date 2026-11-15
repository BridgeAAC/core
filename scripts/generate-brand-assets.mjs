import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const need = [
  'docs/images/01-communication-board.png',
  'docs/images/iphone-board.png',
  'public/icon-512.png',
];
for (const f of need) {
  if (!fs.existsSync(f)) {
    console.error(`${f} is missing. Run node scripts/generate-store-assets.mjs first.`);
    process.exit(1);
  }
}

const uri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const ipad = uri('docs/images/01-communication-board.png');
const phone = uri('docs/images/iphone-board.png');
const icon = uri('public/icon-512.png');

const base = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  body {
    font-family: 'SF Pro Display', 'SF Pro Text', -apple-system, 'Helvetica Neue', Arial, sans-serif;
    background:
      radial-gradient(900px 500px at 82% 20%, rgba(37, 99, 235, 0.10), transparent 70%),
      linear-gradient(180deg, #f7f8fb 0%, #eceff6 100%);
    color: #0b1220;
    position: relative;
    -webkit-font-smoothing: antialiased;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 44px; height: 44px; border-radius: 11px; box-shadow: 0 1px 2px rgba(0,0,0,.18), 0 0 0 .5px rgba(0,0,0,.08); }
  .brand span { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
  h1 { font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; }
  p.sub { color: #475569; letter-spacing: -0.01em; line-height: 1.4; }
  .url { color: #2563eb; font-weight: 600; letter-spacing: -0.01em; }
  .ipad {
    position: absolute;
    background: #16181d;
    border-radius: 30px;
    padding: 10px;
    box-shadow: 0 30px 60px -12px rgba(15, 23, 42, 0.38), 0 0 0 1px rgba(15, 23, 42, 0.5);
  }
  .ipad img { display: block; width: 100%; border-radius: 21px; }
  .phone {
    position: absolute;
    background: #16181d;
    border-radius: 38px;
    padding: 7px;
    box-shadow: 0 24px 48px -10px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(15, 23, 42, 0.55);
  }
  .phone .screen { overflow: hidden; border-radius: 31px; }
  .phone img { display: block; width: 100%; }
`;

const feature = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
  .copy { position: absolute; left: 64px; top: 0; bottom: 0; width: 380px; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
  h1 { font-size: 58px; }
  p.sub { font-size: 20px; max-width: 340px; }
  .url { font-size: 17px; }
  .ipad { left: 428px; top: 52px; width: 548px; border-radius: 28px; padding: 9px; }
  .ipad img { border-radius: 20px; }
</style></head><body>
  <div class="copy">
    <div class="brand"><img src="${icon}"><span>BridgeAAC</span></div>
    <h1>Speech for<br>everyone.</h1>
    <p class="sub">A free, open-source AAC app that works offline. No accounts.</p>
    <div class="url">bridgeaac.org</div>
  </div>
  <div class="ipad"><img src="${ipad}"></div>
</body></html>`;

const banner = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
  .copy { position: absolute; left: 270px; top: 0; bottom: 0; width: 430px; display: flex; flex-direction: column; justify-content: center; gap: 24px; }
  .brand img { width: 50px; height: 50px; border-radius: 13px; }
  .brand span { font-size: 25px; }
  h1 { font-size: 72px; }
  p.sub { font-size: 23px; max-width: 400px; }
  .url { font-size: 21px; }
  .ipad { left: 740px; top: 106px; width: 580px; border-radius: 34px; padding: 11px; }
  .ipad img { border-radius: 24px; }
  .phone { left: 1240px; top: 322px; width: 132px; border-radius: 30px; padding: 5px; }
  .phone .screen { border-radius: 25px; }
</style></head><body>
  <div class="copy">
    <div class="brand"><img src="${icon}"><span>BridgeAAC</span></div>
    <h1>Speech for<br>everyone.</h1>
    <p class="sub">A free, open-source AAC app that works offline. No accounts.</p>
    <div class="url">bridgeaac.org</div>
  </div>
  <div class="ipad"><img src="${ipad}"></div>
  <div class="phone"><div class="screen"><img src="${phone}"></div></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });

async function render(html, w, h, scale, ...outs) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(250);
  for (const out of outs) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, type: 'png' });
    console.log(`Generated ${out} (${w * scale}x${h * scale})`);
  }
  await ctx.close();
}

await render(feature, 1024, 500, 1, 'store-assets/google-play/feature-graphic-1024x500.png', 'docs/images/feature-graphic.png');
await render(banner, 1640, 624, 2, 'docs/images/facebook-page-banner-1640x624.png');

await browser.close();
