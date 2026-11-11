import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const clean = decodeURIComponent((req.url || '/').split('?')[0]);
      let fp = path.join(distDir, clean === '/' ? 'index.html' : clean);
      if (!fp.startsWith(distDir) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        fp = path.join(distDir, 'index.html');
      }
      const ext = path.extname(fp).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => {
      resolve({ srv, port: srv.address().port });
    });
  });
}

const { srv, port } = await startServer();
const baseUrl = `http://127.0.0.1:${port}/`;

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--hide-scrollbars'],
});

async function renderHtmlToPng(html, width, height, outPath) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const p = await ctx.newPage();
  await p.setContent(html, { waitUntil: 'load' });
  await p.waitForTimeout(100);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await p.screenshot({ path: outPath, type: 'png', omitBackground: false });
  await ctx.close();
  console.log(`Generated ${outPath} (${width}x${height})`);
}

const iconHtml = (size, maskable = false) => `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  html, body {
    margin: 0; padding: 0; width: ${size}px; height: ${size}px; overflow: hidden;
    background: linear-gradient(145deg, #1e40af 0%, #2563eb 52%, #0ea5e9 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "San Francisco", -apple-system-body, "Helvetica Neue", Helvetica, Arial, sans-serif;
  }
  .wrap {
    width: ${maskable ? Math.round(size * 0.72) : Math.round(size * 0.82)}px;
    height: ${maskable ? Math.round(size * 0.72) : Math.round(size * 0.82)}px;
    display: flex; align-items: center; justify-content: center; position: relative;
  }
  svg { width: 100%; height: 100%; filter: drop-shadow(0 ${Math.round(size * 0.025)}px ${Math.round(size * 0.05)}px rgba(15, 23, 42, 0.35)); }
</style>
</head>
<body>
  <div class="wrap">
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M36 38C36 25.8497 45.8497 16 58 16H182C194.15 16 204 25.8497 204 38V148C204 160.15 194.15 170 182 170H108L66 208V170H58C45.8497 170 36 160.15 36 148V38Z" fill="#FFFFFF"/>
      <rect x="54" y="34" width="60" height="52" rx="12" fill="#FEF08A" stroke="#EAB308" stroke-width="3.5"/>
      <rect x="126" y="34" width="60" height="52" rx="12" fill="#BBF7D0" stroke="#22C55E" stroke-width="3.5"/>
      <rect x="54" y="98" width="60" height="52" rx="12" fill="#BFDBFE" stroke="#3B82F6" stroke-width="3.5"/>
      <rect x="126" y="98" width="60" height="52" rx="12" fill="#FED7AA" stroke="#F97316" stroke-width="3.5"/>
      <circle cx="84" cy="52" r="8" fill="#854D0E"/>
      <path d="M70 76C70 68 76 64 84 64C92 64 98 68 98 76" stroke="#854D0E" stroke-width="5" stroke-linecap="round"/>
      <path d="M142 54V66H150L159 74V46L150 54H142Z" fill="#166534"/>
      <path d="M166 52C171 56 171 64 166 68" stroke="#166534" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M173 46C181 53 181 67 173 74" stroke="#166534" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M84 138C84 138 69 128 69 117C69 111.5 73.5 108 78 108C81 108 83 109.8 84 112C85 109.8 87 108 90 108C94.5 108 99 111.5 99 117C99 128 84 138 84 138Z" fill="#1D4ED8"/>
      <path d="M156 107L160.9 117.2L172 118.8L164 126.6L165.9 137.7L156 132.4L146.1 137.7L148 126.6L140 118.8L151.1 117.2L156 107Z" fill="#C2410C"/>
    </svg>
  </div>
 </body>
</html>`;

await renderHtmlToPng(iconHtml(1024, false), 1024, 1024, 'AppIcon.png');
await renderHtmlToPng(iconHtml(1024, false), 1024, 1024, 'store-assets/apple-app-store/AppIcon-1024x1024.png');
await renderHtmlToPng(iconHtml(512, false), 512, 512, 'store-assets/google-play/hi-res-icon-512x512.png');
await renderHtmlToPng(iconHtml(512, false), 512, 512, 'public/icon-512.png');
await renderHtmlToPng(iconHtml(512, true), 512, 512, 'public/icon-maskable-512.png');
await renderHtmlToPng(iconHtml(192, false), 192, 192, 'public/icon-192.png');
await renderHtmlToPng(iconHtml(180, false), 180, 180, 'public/apple-touch-icon.png');

const featureHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 1024px; height: 500px; overflow: hidden;
    background: linear-gradient(135deg, #090d16 0%, #0f1f4b 50%, #1d4ed8 100%);
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "San Francisco", -apple-system-body, "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    display: flex; align-items: center; justify-content: space-between;
    padding: 48px 56px;
  }
  .left { max-width: 540px; }
  .badge {
    display: inline-block;
    background: rgba(56, 189, 248, 0.18);
    border: 1px solid rgba(56, 189, 248, 0.55);
    color: #bae6fd;
    padding: 6px 14px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  h1 {
    margin: 0 0 12px;
    font-size: 56px;
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1.05;
    background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p {
    margin: 0 0 22px;
    font-size: 20px;
    line-height: 1.4;
    color: #cbd5e1;
    font-weight: 400;
    letter-spacing: -0.01em;
  }
  .pills { display: flex; flex-wrap: wrap; gap: 10px; }
  .pill {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    padding: 8px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .right {
    width: 350px;
    background: #ffffff;
    color: #0f172a;
    border-radius: 24px;
    padding: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15);
  }
  .bar {
    background: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 700;
    font-size: 17px;
    letter-spacing: -0.02em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .speak {
    background: #16a34a;
    color: #fff;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .cell {
    border-radius: 12px;
    padding: 12px 6px;
    text-align: center;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: -0.015em;
    border: 1.5px solid rgba(0,0,0,0.12);
  }
  .c1 { background: #fef08a; color: #713f12; }
  .c2 { background: #bbf7d0; color: #14532d; }
  .c3 { background: #bfdbfe; color: #1e3a8a; }
  .c4 { background: #fed7aa; color: #7c2d12; }
  .c5 { background: #fbcfe8; color: #831843; }
</style>
</head>
<body>
  <div class="left">
    <div class="badge">100% Free &bull; Offline &bull; Open Source</div>
    <h1>BridgeAAC</h1>
    <p>Voice communication board for everyone. Opens TouchChat (.ce) &amp; Open Board files with offline neural speech.</p>
    <div class="pills">
      <span class="pill">10 Languages</span>
      <span class="pill">Offline Neural Voices</span>
      <span class="pill">Switch Scanning</span>
      <span class="pill">Calm Mode</span>
    </div>
  </div>
  <div class="right">
    <div class="bar">
      <span>I want to play outside</span>
      <span class="speak">Speak</span>
    </div>
    <div class="grid">
      <div class="cell c1">I</div>
      <div class="cell c2">want</div>
      <div class="cell c2">go</div>
      <div class="cell c2">help</div>
      <div class="cell c3">happy</div>
      <div class="cell c4">water</div>
      <div class="cell c2">stop</div>
      <div class="cell c3">more</div>
      <div class="cell c5">love</div>
    </div>
  </div>
 </body>
</html>`;

await renderHtmlToPng(featureHtml, 1024, 500, 'store-assets/google-play/feature-graphic-1024x500.png');

async function captureDeviceScenes(deviceName, width, height, scale, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const clearBtn = page.locator('button.msg-btn.danger-subtle').first();
  if (await clearBtn.count()) await clearBtn.click().catch(() => {});
  await page.waitForTimeout(100);

  const clickWord = async (text) => {
    const btn = page.locator('button.aac-btn', { hasText: new RegExp(`^${text}$`, 'i') }).first();
    if (await btn.count()) await btn.click().catch(() => {});
    await page.waitForTimeout(80);
  };
  await clickWord('I');
  await clickWord('want');
  await clickWord('to');
  await clickWord('play');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '01-communication-board.png') });

  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'calm');
  });
  await page.waitForTimeout(150);
  if (await clearBtn.count()) await clearBtn.click().catch(() => {});
  await page.waitForTimeout(80);
  await clickWord('I');
  await clickWord('need');
  await clickWord('help');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '02-calm-sensory-mode.png') });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(150);

  const hubBtn = page.locator('button', { hasText: /Hub|Tools/i }).first();
  if (await hubBtn.count()) {
    await hubBtn.click();
    await page.waitForTimeout(300);
    const plannerTab = page.locator('.modal-card button.tab-btn', { hasText: /Planner/i }).first();
    if (await plannerTab.count()) await plannerTab.click();
    await page.waitForTimeout(150);

    const checkInputs = page.locator('.modal-card input[type="checkbox"]');
    const chkCount = await checkInputs.count();
    if (chkCount >= 3) {
      await checkInputs.nth(0).click().catch(() => {});
      await page.waitForTimeout(100);
      await checkInputs.nth(1).click().catch(() => {});
      await page.waitForTimeout(100);
      await checkInputs.nth(2).click().catch(() => {});
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(outDir, '03-daily-planner-rewards.png') });

    const moodTab = page.locator('.modal-card button.tab-btn', { hasText: /Mood/i }).first();
    if (await moodTab.count()) {
      await moodTab.click();
      await page.waitForTimeout(200);
      const moodBtn = page.locator('.modal-card button', { hasText: /Calm/i }).first();
      if (await moodBtn.count()) await moodBtn.click().catch(() => {});
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(outDir, '04-mood-tracker-analytics.png') });
    }

    const gamesTab = page.locator('.modal-card button.tab-btn', { hasText: /Games/i }).first();
    if (await gamesTab.count()) {
      await gamesTab.click();
      await page.waitForTimeout(200);
      const wordTile = page.locator('.modal-card button', { hasText: /^I$/i }).first();
      if (await wordTile.count()) await wordTile.click().catch(() => {});
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(outDir, '05-gamified-learning.png') });
    }

    const closeBtn = page.locator('.modal-card .icon-close').first();
    if (await closeBtn.count()) await closeBtn.click();
    await page.waitForTimeout(200);
  }

  const settingsBtn = page.getByRole('button', { name: /settings/i }).first();
  if (await settingsBtn.count()) {
    await settingsBtn.click();
    await page.waitForTimeout(300);
    const speechTab = page.locator('.modal-card button.tab-btn', { hasText: /Speech/i }).first();
    if (await speechTab.count()) await speechTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '06-offline-voices-customization.png') });
  }

  await ctx.close();
  console.log(`Captured 6 screenshots for ${deviceName} (${width * scale}x${height * scale}) -> ${outDir}`);
}

await captureDeviceScenes('iPad Pro 13" Portrait', 1024, 1366, 2, 'store-assets/apple-app-store/ipad-pro-13');
await captureDeviceScenes('iPhone 6.5" Portrait', 428, 926, 3, 'store-assets/apple-app-store/iphone-6.5');
await captureDeviceScenes('Android Tablet 16:10 Landscape', 960, 600, 2, 'store-assets/google-play/tablet-10in');
await captureDeviceScenes('Android Phone 16:9 Portrait', 360, 640, 3, 'store-assets/google-play/phone');

await browser.close();
srv.close();
