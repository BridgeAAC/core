import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const outDir = path.resolve('docs/conference-assets');
fs.mkdirSync(outDir, { recursive: true });

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

async function captureConferenceAssets() {
  const ctx = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const initialBackBtn = page.locator('button.pageset-btn-back').first();
  if (await initialBackBtn.count()) {
    await initialBackBtn.click();
    await page.waitForTimeout(300);
  }

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

  await page.screenshot({
    path: path.join(outDir, '01-ipad-communication-board.png'),
  });
  console.log('Saved 01-ipad-communication-board.png');

  const kbBtn = page.locator('button.nav-btn', { hasText: /Keyboard/i }).first();
  if (await kbBtn.count()) {
    await kbBtn.click();
    await page.waitForTimeout(400);

    const keyI = page.locator('.kb-key', { hasText: /^I$/i }).first();
    if (await keyI.count()) await keyI.click().catch(() => {});
    await page.waitForTimeout(60);

    const spaceKey = page.locator('.kb-key-space').first();
    if (await spaceKey.count()) await spaceKey.click().catch(() => {});
    await page.waitForTimeout(60);

    const predPill = page.locator('.kb-pred-btn').first();
    if (await predPill.count()) await predPill.click().catch(() => {});
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(outDir, '03-accessible-keyboard.png'),
    });
    console.log('Saved 03-accessible-keyboard.png');

    const doneBtn = page.locator('button.kb-done-btn, button:has-text("Done")').first();
    if (await doneBtn.count()) await doneBtn.click().catch(() => {});
    await page.waitForTimeout(300);
  }

  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'calm');
  });
  await page.waitForTimeout(200);
  if (await clearBtn.count()) await clearBtn.click().catch(() => {});
  await page.waitForTimeout(100);
  await clickWord('I');
  await clickWord('need');
  await clickWord('help');
  await page.waitForTimeout(300);

  await page.screenshot({
    path: path.join(outDir, '04-calm-sensory-mode.png'),
  });
  console.log('Saved 04-calm-sensory-mode.png');

  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(150);

  const hubBtn = page.locator('button.nav-btn', { hasText: /Tools|Hub/i }).first();
  if (await hubBtn.count()) {
    await hubBtn.click();
    await page.waitForTimeout(350);

    const plannerTab = page.locator('.modal-card button.tab-btn', { hasText: /Planner/i }).first();
    if (await plannerTab.count()) await plannerTab.click();
    await page.waitForTimeout(150);

    const checkInputs = page.locator('.modal-card input[type="checkbox"]');
    const chkCount = await checkInputs.count();
    if (chkCount >= 3) {
      await checkInputs.nth(0).click().catch(() => {});
      await page.waitForTimeout(80);
      await checkInputs.nth(1).click().catch(() => {});
      await page.waitForTimeout(80);
      await checkInputs.nth(2).click().catch(() => {});
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(250);

    await page.screenshot({
      path: path.join(outDir, '06-clinical-tools-planner.png'),
    });
    console.log('Saved 06-clinical-tools-planner.png');

    const closeBtn = page.locator('.modal-card .icon-close').first();
    if (await closeBtn.count()) await closeBtn.click();
    await page.waitForTimeout(250);
  }

  const vocabBtn = page.locator('button.nav-btn.vocab-btn').first();
  if (await vocabBtn.count()) {
    await vocabBtn.click();
    await page.waitForTimeout(350);

    const pageSetsBtn = page.locator('button', { hasText: /Page Sets|Choose Page Set/i }).first();
    if (await pageSetsBtn.count()) {
      await pageSetsBtn.click();
      await page.waitForTimeout(350);

      await page.screenshot({
        path: path.join(outDir, '05-page-set-selection.png'),
      });
      console.log('Saved 05-page-set-selection.png');

      const arasaacCard = page.locator('.pageset-card', { hasText: /ARASAAC Core 50/i }).first();
      if (await arasaacCard.count()) {
        await arasaacCard.click();
        await page.waitForTimeout(150);
        const nextBtn = page.locator('button.pageset-btn-next').first();
        if (await nextBtn.count()) {
          await nextBtn.click();
          await page.waitForTimeout(500);

          await page.screenshot({
            path: path.join(outDir, '02-arasaac-core-50.png'),
          });
          console.log('Saved 02-arasaac-core-50.png');
        }
      }
    } else {
      const closeVocab = page.locator('.modal-card .icon-close').first();
      if (await closeVocab.count()) await closeVocab.click();
    }
  }

  await ctx.close();
}

async function renderConferenceSlide() {
  const realBoardPath = path.join(outDir, '01-ipad-communication-board.png');
  const realBoardBase64 = fs.existsSync(realBoardPath)
    ? fs.readFileSync(realBoardPath).toString('base64')
    : '';

  const iconSvgPath = path.resolve('public/icon.svg');
  const iconSvgBase64 = fs.existsSync(iconSvgPath)
    ? fs.readFileSync(iconSvgPath).toString('base64')
    : '';

  const slideHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #090e17;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 64px 84px;
    position: relative;
  }
  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .brand-group {
    display: flex;
    align-items: center;
    gap: 22px;
  }
  .app-icon {
    width: 76px;
    height: 76px;
    border-radius: 20px;
    box-shadow: 0 10px 24px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(255,255,255,0.18);
  }
  .brand-title {
    font-size: 50px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    color: #ffffff;
  }
  .brand-subtitle {
    font-size: 19px;
    font-weight: 500;
    color: #94a3b8;
    margin-top: 6px;
    letter-spacing: -0.01em;
  }
  .badge-row {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .badge {
    padding: 9px 20px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.02em;
    background: rgba(30, 41, 59, 0.9);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    color: #f1f5f9;
  }
  .badge.primary-link {
    background: #2563eb;
    border-color: #3b82f6;
    color: #ffffff;
    font-size: 17px;
    font-weight: 800;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  }
  .badge.mit {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(96, 165, 250, 0.45);
    color: #93c5fd;
  }
  .badge.green {
    background: rgba(22, 163, 74, 0.18);
    border-color: rgba(34, 197, 94, 0.45);
    color: #86efac;
  }
  .main-content {
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    gap: 56px;
    align-items: center;
    margin: auto 0;
  }
  .pitch-headline {
    font-size: 54px;
    font-weight: 800;
    line-height: 1.12;
    letter-spacing: -0.035em;
    color: #ffffff;
    margin-bottom: 20px;
  }
  .pitch-lead {
    font-size: 21px;
    line-height: 1.45;
    color: #cbd5e1;
    margin-bottom: 30px;
    font-weight: 400;
  }
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .feat-card {
    background: #111827;
    border: 1.5px solid #1f2937;
    border-radius: 16px;
    padding: 20px;
  }
  .feat-card h3 {
    font-size: 18px;
    font-weight: 700;
    color: #f3f4f6;
    margin-bottom: 6px;
  }
  .feat-card p {
    font-size: 14.5px;
    line-height: 1.42;
    color: #9ca3af;
  }
  .mockup-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .tablet-frame {
    position: relative;
    background: #1e293b;
    border-radius: 28px;
    padding: 14px;
    box-shadow: 0 35px 75px -15px rgba(0, 0, 0, 0.85), 0 0 0 1.5px rgba(255, 255, 255, 0.15);
    width: 100%;
    max-width: 820px;
  }
  .tablet-camera {
    width: 7px;
    height: 7px;
    background: #334155;
    border-radius: 50%;
    position: absolute;
    top: 5px;
    left: 50%;
    transform: translateX(-50%);
  }
  .real-app-img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 18px;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }
  .footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #1f2937;
    padding-top: 22px;
    color: #6b7280;
    font-size: 16px;
    font-weight: 500;
  }
  .footer-right {
    display: flex;
    gap: 28px;
    color: #9ca3af;
    font-weight: 600;
    align-items: center;
  }
  .footer-url {
    color: #60a5fa;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.01em;
  }
</style>
</head>
<body>
  <div class="top-row">
    <div class="brand-group">
      <img src="data:image/svg+xml;base64,${iconSvgBase64}" class="app-icon" alt="BridgeAAC"/>
      <div>
        <div class="brand-title">BridgeAAC</div>
        <div class="brand-subtitle">Clinical-Grade Augmentative and Alternative Communication</div>
      </div>
    </div>
    <div class="badge-row">
      <span class="badge primary-link">bridgeaac.org</span>
      <span class="badge mit">MIT License</span>
      <span class="badge green">100% Offline Speech</span>
    </div>
  </div>

  <div class="main-content">
    <div class="pitch-left">
      <h1 class="pitch-headline">Voice &amp; Autonomy for Every Communicator.</h1>
      <p class="pitch-lead">
        A fast, accessible AAC communication system built for tablets, computers, and phones. Free and open-source under the MIT license, zero subscriptions, zero telemetry, and fully functional without an internet connection.
      </p>
      <div class="feature-grid">
        <div class="feat-card">
          <h3>Standard Page Sets</h3>
          <p>BridgeWords 42, 60, 84, 108 and Strict ARASAAC Core 50 with clinical Fitzgerald Key color coding.</p>
        </div>
        <div class="feat-card">
          <h3>Open Board &amp; Standard Imports</h3>
          <p>Direct lossless import of Open Board (.obf, .obz), BridgeAAC, and standard AAC formats.</p>
        </div>
        <div class="feat-card">
          <h3>Dual Offline Architecture</h3>
          <p>Local IndexedDB &amp; CacheStorage stores all symbols and neural TTS voices on-device permanently.</p>
        </div>
        <div class="feat-card">
          <h3>Accessible Motor Access</h3>
          <p>Full single/dual-switch scanning, tactile key outlines, sensory calm mode, and predictive typing.</p>
        </div>
      </div>
    </div>

    <div class="pitch-right">
      <div class="mockup-wrap">
        <div class="tablet-frame">
          <div class="tablet-camera"></div>
          <img src="data:image/png;base64,${realBoardBase64}" class="real-app-img" alt="BridgeAAC Real Communication Board" />
        </div>
      </div>
    </div>
  </div>

  <div class="footer-row">
    <div>Standardized for SLPs, Special Educators, AT Specialists &amp; Families</div>
    <div class="footer-right">
      <span class="footer-url">bridgeaac.org</span>
      <span>iPad &bull; iPhone &bull; Mac &bull; Android &bull; Web</span>
      <span>github.com/BridgeAAC/core</span>
    </div>
  </div>
</body>
</html>`;

  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.setContent(slideHtml, { waitUntil: 'load' });
  await page.waitForTimeout(200);

  const slidePath = path.join(outDir, '07-conference-presentation-slide-1080p.png');
  await page.screenshot({ path: slidePath, type: 'png' });
  await ctx.close();
  console.log(`Generated ${slidePath} (1920x1080)`);
}

await captureConferenceAssets();
await renderConferenceSlide();

await browser.close();
srv.close();
console.log('All conference assets successfully generated in docs/conference-assets/');
