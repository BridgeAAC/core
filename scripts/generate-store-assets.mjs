import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { statusSvg } from './lib/device-frames.mjs';

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
      const rawPath = (req.url || '/').split('?')[0];
      const safeRelative = path.posix.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '');
      const candidate = path.resolve(distDir, '.' + path.sep + safeRelative);
      const rel = path.relative(distDir, candidate);
      let fp = path.join(distDir, 'index.html');
      if (rel && !rel.startsWith('..') && !path.isAbsolute(rel) && candidate.startsWith(distDir + path.sep)) {
        try {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            fp = candidate;
          }
        } catch {}
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

const iconSvgRaw = fs.readFileSync(path.resolve('public/icon.svg'), 'utf-8');

const iconHtml = (size, maskable = false, fullBleed = false) => {
  let content = iconSvgRaw;
  if (fullBleed) {
    content = content.replace('rx="225"', 'rx="0"');
  }
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  html, body {
    margin: 0; padding: 0; width: ${size}px; height: ${size}px; overflow: hidden;
    background: #ffffff;
    display: flex; align-items: center; justify-content: center;
  }
  .wrap {
    width: ${maskable ? Math.round(size * 0.82) : size}px;
    height: ${maskable ? Math.round(size * 0.82) : size}px;
    display: flex; align-items: center; justify-content: center;
  }
  svg { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
  <div class="wrap">
    ${content}
  </div>
 </body>
</html>`;
};

await renderHtmlToPng(iconHtml(1024, false, true), 1024, 1024, 'AppIcon.png');
await renderHtmlToPng(iconHtml(1024, false, true), 1024, 1024, 'store-assets/apple-app-store/AppIcon-1024x1024.png');
await renderHtmlToPng(iconHtml(512, false, true), 512, 512, 'store-assets/google-play/hi-res-icon-512x512.png');
await renderHtmlToPng(iconHtml(512, false, true), 512, 512, 'public/icon-512.png');
await renderHtmlToPng(iconHtml(512, true, true), 512, 512, 'public/icon-maskable-512.png');
await renderHtmlToPng(iconHtml(192, false, true), 192, 192, 'public/icon-192.png');
await renderHtmlToPng(iconHtml(180, false, true), 180, 180, 'public/apple-touch-icon.png');

const IPHONE_CHROME = (width) => `
  .topbar { padding-top: 62px !important; }
  .board-wrap { padding-bottom: 34px !important; }
  .modal-backdrop { padding-top: 70px !important; padding-bottom: 40px !important; }
  #ios-status { position: fixed; left: 0; right: 0; top: 0; height: 54px; z-index: 2147483647; pointer-events: none; color: #000; }
  #ios-status .time { position: absolute; left: ${Math.round(width * 0.155)}px; top: 21px; width: 60px; text-align: center; font: 600 17px/1 'SF Pro Text', -apple-system, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.01em; }
  #ios-status .icons { position: absolute; right: ${Math.round(width * 0.075)}px; top: 21px; }
`;

async function captureDeviceScenes(deviceName, width, height, scale, outDir, opts = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });
  const page = await ctx.newPage();
  if (opts.iphone) {
    await page.addInitScript(([css, icons]) => {
      addEventListener('DOMContentLoaded', () => {
        const st = document.createElement('style');
        st.textContent = css;
        document.head.appendChild(st);
        const bar = document.createElement('div');
        bar.id = 'ios-status';
        bar.innerHTML = '<div class="time">9:41</div><div class="icons">' + icons + '</div>';
        document.body.appendChild(bar);
      });
    }, [IPHONE_CHROME(width), statusSvg(1.15)]);
  }
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const key = 'bridgeaac.settings.v2';
    const cur = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...cur, speakButtons: false }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  for (let i = 0; i < 3; i++) {
    const next = page.getByRole('button', { name: /^Continue$/ }).first();
    if (!(await next.count())) break;
    await next.click().catch(() => {});
    await page.waitForTimeout(600);
  }
  await page.addStyleTag({ content: '.toast-stack { display: none !important; }' });
  await page.waitForTimeout(300);

  const clearBtn = page.locator('button.msg-btn.danger-subtle').first();
  if (await clearBtn.count()) await clearBtn.click().catch(() => {});
  await page.waitForTimeout(100);

  const clickWord = async (text) => {
    const btn = page.locator(`button.aac-btn[aria-label="${text}" i]`).first();
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

await captureDeviceScenes('README iPad Landscape', 1180, 820, 2, 'docs/images');
await captureDeviceScenes('iPad Pro 13" Portrait', 1024, 1366, 2, 'store-assets/apple-app-store/ipad-pro-13');
await captureDeviceScenes('iPhone 6.3" Portrait', 402, 874, 3, 'store-assets/apple-app-store/iphone-6.3', { iphone: true });
await captureDeviceScenes('Android Tablet 16:10 Landscape', 960, 600, 2, 'store-assets/google-play/tablet-10in');
await captureDeviceScenes('Android Phone 16:9 Portrait', 360, 640, 3, 'store-assets/google-play/phone');

fs.copyFileSync(
  'store-assets/apple-app-store/iphone-6.3/01-communication-board.png',
  'docs/images/iphone-board.png',
);

await browser.close();
srv.close();
