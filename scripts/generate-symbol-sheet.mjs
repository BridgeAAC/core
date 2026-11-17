import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const WORDS = [
  'I', 'want', 'help', 'more', 'stop', 'go', 'eat', 'drink',
  'happy', 'sad', 'angry', 'tired', 'hello', 'please', 'thank you', 'love',
  'mom', 'dad', 'friend', 'teacher', 'doctor', 'baby', 'hug', 'wash hands',
  'dog', 'cat', 'apple', 'pizza', 'water', 'milk', 'cookie', 'banana',
  'school', 'home', 'bathroom', 'bus', 'car', 'park', 'store', 'hospital',
  'good', 'bad', 'yes', 'no', 'hot', 'cold', 'big', 'little',
];

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { getSymbolSvg, symbolIdForWord } = await server.ssrLoadModule('/src/data/symbols.ts');

const tiles = [];
for (const word of WORDS) {
  const id = symbolIdForWord(word);
  const svg = id ? getSymbolSvg(id) : null;
  if (!svg) {
    console.warn(`No symbol for "${word}"`);
    continue;
  }
  tiles.push(`<div class="tile"><div class="art">${svg}</div><div class="lb">${word}</div></div>`);
}
await server.close();

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 1600px; font-family: 'Roboto', 'Noto Sans', 'Helvetica Neue', Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased; background: #f6f8fc; padding: 56px 64px 48px; }
h1 { font-size: 54px; font-weight: 800; letter-spacing: -0.035em; }
p { font-size: 26px; color: #475569; margin: 10px 0 34px; }
.grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 18px; }
.tile { background: #fff; border-radius: 22px; padding: 14px 10px 12px; text-align: center; box-shadow: 0 1px 2px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.06); }
.art { width: 100%; aspect-ratio: 1; display: flex; }
.art svg { width: 100%; height: 100%; }
.lb { font-size: 22px; font-weight: 600; margin-top: 6px; letter-spacing: -0.01em; }
.foot { margin-top: 30px; font-size: 22px; color: #64748b; display: flex; justify-content: space-between; }
.foot b { color: #1d4ed8; font-size: 26px; }
</style></head><body>
<h1>Built-in symbols</h1>
<p>Original BridgeAAC pictures for core words, people, food, feelings, places and more. They work offline.</p>
<div class="grid">${tiles.join('')}</div>
<div class="foot"><b>bridgeaac.org</b><span>A small sample of the built-in set.</span></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(250);
await page.screenshot({ path: 'wiki/images/symbols.png', fullPage: true });
await browser.close();
console.log(`Generated wiki/images/symbols.png with ${tiles.length} symbols`);
