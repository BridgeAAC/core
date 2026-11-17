import { chromium } from 'playwright-core';
import { createServer as createViteServer } from 'vite';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ipadHtml, laptopHtml, phoneHtml } from './lib/device-frames.mjs';

const OUT = 'social/youtube';
const AUDIO = path.join(OUT, 'audio');
const STEMS = path.join(OUT, 'stems');
const W = 1920;
const H = 1080;
const FPS = 30;
const XF = 0.45;
const FONT = `'SF Pro Display', 'SF Pro Text', -apple-system, 'Helvetica Neue', Arial, sans-serif`;
const TEXT_FONT = `'SF Pro Text', 'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif`;
const PIPER = process.env.PIPER || 'piper';
const PIPER_MODEL = process.env.PIPER_MODEL || '';
const QUICK = process.argv.includes('--quick');

for (const d of [OUT, AUDIO, STEMS]) fs.mkdirSync(d, { recursive: true });
if (!fs.existsSync('dist/index.html')) throw new Error('Run npm run build first.');

const uri = (f, type = 'image/png') => `data:${type};base64,${fs.readFileSync(f).toString('base64')}`;
const ICON = uri('public/icon-512.png');
const ZH_FONT = uri('scripts/assets/noto-sans-sc-nihao.woff2', 'font/ttf');

const SYMBOL_WORDS = [
  'I', 'want', 'help', 'more', 'stop', 'go', 'eat', 'drink', 'play', 'look', 'open', 'finished',
  'happy', 'sad', 'angry', 'tired', 'hello', 'please', 'thank you', 'love', 'good', 'bad', 'yes', 'no',
  'mom', 'dad', 'friend', 'teacher', 'doctor', 'baby', 'hug', 'wash hands', 'dog', 'cat', 'apple', 'pizza',
  'water', 'milk', 'cookie', 'banana', 'school', 'home', 'bathroom', 'bus', 'car', 'park', 'store', 'hospital',
  'hot', 'cold', 'big', 'little', 'up', 'down', 'in', 'on', 'see', 'give', 'come', 'need',
];
const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { getSymbolSvg, symbolIdForWord } = await vite.ssrLoadModule('/src/data/symbols.ts');
const SYMBOLS = SYMBOL_WORDS.map((w) => {
  const id = symbolIdForWord(w);
  return { w, svg: id ? getSymbolSvg(id) : null };
}).filter((s) => s.svg);
await vite.close();

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-yt-'));
const framesDir = path.join(tmp, 'frames');
fs.mkdirSync(framesDir);
const composeRef = { html: '' };
const dist = path.resolve('dist');
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
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'max-age=3600' });
      fs.createReadStream(fp).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }
  const p = path.join(dist, url);
  const fp = p.startsWith(dist) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(dist, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const appUrl = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

const BASE_SETTINGS = { onboarded: true, speakButtons: false, theme: 'light', onlineSpeech: false, returnHomeAfterWord: true };
async function storageFor(settings) {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  const page = await ctx.newPage();
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.evaluate((s) => localStorage.setItem('bridgeaac.settings.v2', JSON.stringify(s)), settings);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}
const baseState = await storageFor(BASE_SETTINGS);
const scanState = await storageFor({ ...BASE_SETTINGS, access: 'scan', scanPattern: 'row-column', scanMode: 'auto', scanIntervalMs: 850, scanFirstDelayMs: 500, scanLoops: 9 });

const TAP_CSS = `
  .tap-dot{position:fixed;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;background:rgba(40,60,90,.22);border:2px solid rgba(40,60,90,.45);pointer-events:none;z-index:99999;animation:tapdot .55s ease-out forwards}
  @keyframes tapdot{from{transform:scale(.45);opacity:1}to{transform:scale(1.3);opacity:0}}
`;

const word = (page, w) => page.locator(`button.aac-btn[aria-label="${w}" i]`).first();
const modalBtn = (page, re) => page.locator('.modal-card button', { hasText: re }).first();
const toolsBtn = (page) => page.getByRole('button', { name: /^Planner, moods/ });
const exact = (s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

const CLIPS = {
  talk: { run: async ({ page, tap, until, say }) => {
    await until(2.0); await tap('i', word(page, 'I'));
    await until(3.8); await tap('want', word(page, 'want'));
    await until(5.6); await tap('to', word(page, 'to'));
    await until(7.4); await tap('play', word(page, 'play'));
    await until(9.8); await tap('speak', page.getByRole('button', { name: 'Speak message' })); say('I want to play.', 0.12);
    await until(14);
  } },
  folder: { run: async ({ page, tap, until, say }) => {
    await until(1.5); await tap('i', word(page, 'I'));
    await until(3.0); await tap('want', word(page, 'want'));
    await until(4.6); await tap('food', word(page, 'Food'));
    await until(6.8); await tap('pizza', word(page, 'pizza'));
    await until(8.8); await tap('speak', page.getByRole('button', { name: 'Speak message' })); say('I want pizza.', 0.12);
    await until(12.5);
  } },
  keyboard: { run: async ({ page, tap, until, say, mark }) => {
    await until(1.2); await tap('kb', page.getByRole('button', { name: 'Keyboard', exact: true }).first());
    await until(2.6); await tap('q1', modalBtn(page, /^I$/));
    await until(3.5); await tap('q2', modalBtn(page, /^want$/));
    let t = 4.5;
    const key = async (k) => { await until(t); await tap(`k${t}`, modalBtn(page, exact(k))); t += 0.42; };
    const space = async () => { await until(t); await tap(`sp${t}`, page.locator('.modal-card').getByRole('button', { name: 'Space bar' })); t += 0.5; };
    await key('t'); await key('o'); await space();
    t += 0.2; await until(t); await tap('q3', modalBtn(page, /^go$/)); t += 0.9;
    const target = 'swimming';
    let picked = false;
    for (let i = 0; i < target.length; i++) {
      await key(target[i]);
      if (i >= 2) {
        const pred = modalBtn(page, new RegExp(`^${target}$`, 'i'));
        if (await pred.count()) { t += 0.5; await until(t); await tap('pred', pred); picked = true; t += 0.8; break; }
      }
    }
    if (!picked) { await space(); mark('pred'); t += 0.4; }
    await until(t + 0.4);
    const text = await page.locator('.modal-card input, .modal-card textarea').first().inputValue({ timeout: 1500 }).catch(() => 'I want to go swimming');
    await tap('speak', page.locator('.modal-card').getByRole('button', { name: /Speak/ }).first());
    say(`${text.trim().replace(/[.!?]?$/, '.')}`, 0.12);
    await until(t + 4.2);
  } },
  voices: { run: async ({ page, tap, until }) => {
    await until(1.2); await tap('settings', page.getByRole('button', { name: 'Settings' }));
    await until(3.6);
    const box = await page.locator('.modal-card').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.6);
    for (let i = 0; i < 44; i++) { await page.mouse.wheel(0, 14); await page.waitForTimeout(40); }
    await until(9.5);
    for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, 14); await page.waitForTimeout(40); }
    await until(16);
  } },
  edit: { run: async ({ page, tap, until }) => {
    await until(1.4); await tap('edit', page.getByRole('button', { name: 'Edit', exact: true }));
    await until(3.6); await tap('button', word(page, 'play'));
    await until(6.2);
    for (const e of ['⚽', '🧸', '🐶', '🍎']) {
      const b = modalBtn(page, exact(e));
      if (await b.count()) { await tap('emoji', b); break; }
    }
    await until(8.6);
    const swatch = page.locator('.modal-card button[style*="background"]').filter({ hasText: /^$/ }).nth(3);
    if (await swatch.count()) await tap('color', swatch).catch(() => {});
    await until(11.0); await tap('save', modalBtn(page, /^Save Button$/));
    await until(13.2);
    const done = page.getByRole('button', { name: /^(Done|Edit)$/ }).first();
    if (await done.count()) await tap('done', done).catch(() => {});
    await until(17);
  } },
  vocab: { run: async ({ page, tap, until }) => {
    await until(1.0); await tap('vocab', page.getByRole('button', { name: 'BridgeWords 60' }));
    await until(14);
  } },
  planner: { run: async ({ page, tap, until, say }) => {
    await until(1.2); await tap('tools', toolsBtn(page));
    await until(3.6); await tap('check', page.locator('.modal-card input[type="checkbox"]').first());
    say('Nice work! Wake Up and Stretch is done. You earned a star.', 0.15);
    await until(10);
  } },
  mood: { run: async ({ page, tap, until, say }) => {
    await until(1.2); await tap('tools', toolsBtn(page));
    await until(2.8); await tap('tab', page.locator('.modal-card button.tab-btn', { hasText: 'Moods' }));
    await until(5.0); await tap('happy', modalBtn(page, /Happy/)); say('I feel happy!', 0.12);
    await until(10);
  } },
  games: { run: async ({ page, tap, until, say }) => {
    await until(1.2); await tap('tools', toolsBtn(page));
    await until(2.8); await tap('tab', page.locator('.modal-card button.tab-btn', { hasText: 'Games' }));
    await until(5.0); await tap('w1', modalBtn(page, /^I$/));
    await until(6.4); await tap('w2', modalBtn(page, /^want$/));
    await until(7.8); await tap('w3', modalBtn(page, /^water$/));
    await until(9.2); await tap('please', modalBtn(page, /^please$/)); say('Awesome! I want water please.', 0.45);
    await until(14);
  } },
  themes: { run: async ({ page, until, mark }) => {
    const theme = (t) => page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), t);
    await until(4.0); await theme('calm'); mark('calm');
    await until(6.3); await theme('dark'); mark('dark');
    await until(8.6); await theme('contrast'); mark('contrast');
    await until(11.5);
  } },
  scan: { state: 'scan', run: async ({ until }) => { await until(11); } },
};

async function recordClip(id, def) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1.5, hasTouch: true, storageState: def.state === 'scan' ? scanState : baseState });
  const page = await ctx.newPage();
  await page.addInitScript((css) => {
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
    });
    addEventListener('pointerdown', (e) => {
      const d = document.createElement('div');
      d.className = 'tap-dot';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 700);
    }, true);
  }, TAP_CSS);
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', (ev) => {
    frames.push({ t: ev.metadata.timestamp, data: ev.data });
    void cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1770, maxHeight: 1230, everyNthFrame: 1 });
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const t0 = Date.now() / 1000;
  const now = () => Date.now() / 1000 - t0;
  const marks = {};
  const speech = [];
  const taps = [];
  const until = async (t) => { const w = (t - now()) * 1000; if (w > 0) await page.waitForTimeout(w); };
  const mark = (name) => { marks[name] = now(); };
  const tap = async (name, locator) => {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    marks[name] = now();
    taps.push(marks[name]);
    await locator.tap({ timeout: 8000 });
  };
  const say = (text, delay = 0.1) => speech.push({ t: now() + delay, text });
  await def.run({ page, tap, until, say, mark });
  const len = now();
  await cdp.send('Page.stopScreencast');
  await ctx.close();
  const kept = [];
  frames.forEach((f, i) => {
    const name = `${id}-${String(i).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(framesDir, name), Buffer.from(f.data, 'base64'));
    kept.push({ t: f.t - t0, name });
  });
  console.log(`clip ${id}: ${kept.length} frames, ${len.toFixed(1)}s, marks ${Object.keys(marks).join(' ')}`);
  return { id, frames: kept, marks, speech, taps, len };
}

const clips = {};
for (const [id, def] of Object.entries(CLIPS)) clips[id] = await recordClip(id, def);

async function still(vw, vh, dsf, prep, extraCss = '') {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dsf, hasTouch: true, storageState: baseState });
  const page = await ctx.newPage();
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  if (extraCss) await page.addStyleTag({ content: extraCss });
  await page.waitForTimeout(700);
  await prep(page);
  await page.waitForTimeout(400);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  await ctx.close();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}
const PHONE_CSS = '.topbar{padding-top:54px!important}.board-wrap{padding-bottom:30px!important}.toast-stack{display:none!important}';
const tapWords = (words) => async (page) => { for (const w of words) { await word(page, w).tap(); await page.waitForTimeout(120); } };
const stills = {
  phone: await still(393, 852, 2, tapWords(['I', 'need', 'help']), PHONE_CSS),
  mac: await still(1280, 800, 1.5, tapWords(['I', 'like', 'to', 'play'])),
  ipad: await still(1180, 820, 1.5, tapWords(['I', 'want', 'more'])),
};
{
  const dev = ipadHtml(`<img src="${stills.ipad}" style="display:block;width:100%;height:100%;object-fit:cover">`, 760, 'left:560px;top:150px', 1180 / 820);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 1280px; height: 720px; overflow: hidden; font-family: ${FONT}; -webkit-font-smoothing: antialiased; color: #f5f5f7; position: relative;
      background: radial-gradient(700px 500px at 82% 60%, #1f2a44 0%, rgba(31,42,68,0) 70%), radial-gradient(600px 400px at 10% 100%, #2a1838 0%, rgba(42,24,56,0) 70%), #000; }
    .brand { position: absolute; left: 64px; top: 56px; display: flex; align-items: center; gap: 16px; font-size: 34px; font-weight: 700; letter-spacing: -0.03em; }
    .brand img { width: 64px; height: 64px; border-radius: 15px; }
    h1 { position: absolute; left: 60px; top: 190px; font-size: 128px; font-weight: 800; letter-spacing: -0.055em; line-height: 0.95; }
    .grad { background: linear-gradient(92deg, #3b82f6 0%, #8b5cf6 55%, #ec4899 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .sub { position: absolute; left: 64px; top: 500px; font-size: 38px; font-weight: 600; color: #a1a1a6; letter-spacing: -0.02em; line-height: 1.25; }
  </style></head><body>
    <div class="brand"><img src="${ICON}">BridgeAAC</div>
    <h1><span class="grad">Free</span><br>AAC app</h1>
    <div class="sub">Works offline.<br>On every device.</div>
    ${dev.html}
  </body></html>`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'thumbnail.png') });
  await ctx.close();
}
await browser.close();

const SCENES = [
  { id: 'open', name: 'Opening', D: 13, dark: true, kind: 'lines', lines: [
    { at: 0.8, end: 5.6, html: 'Everyone has something to say.' },
    { at: 6.0, end: 12.4, html: 'Not everyone can say it <span class="grad">out loud.</span>' },
  ], vo: [[0.8, 'Everyone has something to say.'], [5.2, "But for a lot of people, saying it out loud isn't easy. Or isn't possible at all."]] },
  { id: 'title', D: 10, dark: true, kind: 'title', chapter: 'Meet BridgeAAC',
    vo: [[0.6, 'This is BridgeAAC. A free communication app that speaks for you, one picture at a time.']] },
  { id: 'why', D: 22, dark: true, kind: 'lines', chapter: 'Why I built it', lines: [
    { at: 0.8, end: 6.2, html: 'Built for my sister.' },
    { at: 6.6, end: 13.2, html: 'AAC apps can cost <span class="dim">hundreds.</span><br>Speech devices, <span class="dim">thousands.</span>' },
    { at: 13.6, end: 21.6, html: 'So BridgeAAC is <span class="grad">free.</span>', sub: 'For everyone. No subscriptions, no ads.' },
  ], vo: [[0.8, 'I built BridgeAAC for my sister. She uses an iPad to talk.'], [6.6, 'Apps like this can cost hundreds of dollars, and dedicated speech devices can cost thousands.'], [13.6, 'No family should have to pay for a voice. So BridgeAAC is free, for everyone.']] },
  { id: 'talk', D: 22, kind: 'demo', chapter: 'Talking', kicker: 'Talk', head: 'Tap. Build.<br>Speak.', sub: 'Every button is a word.',
    clips: [{ id: 'talk', align: ['speak', 12.3] }],
    cam: [[0, 1, 0.5, 0.5], [4.6, 1.3, 0.4, 0.4], [11.8, 1.5, 0.4, 0.12], [15.4, 1, 0.5, 0.5]],
    vo: [[0.6, "Here's how it works. Every button is a word."], [4.7, 'Tap the words you want, and they line up in the message bar. Then tap Speak.'], [14.6, 'The buttons are color coded, so people, actions and describing words are quick to find.']] },
  { id: 'folder', D: 18, kind: 'demo', chapter: 'Folders', kicker: 'Find words', head: 'A folder for<br>everything.', sub: 'Food, people, places, feelings and more.',
    clips: [{ id: 'folder', align: ['speak', 9.8] }],
    cam: [[0, 1, 0.5, 0.5], [9.5, 1.5, 0.4, 0.12], [12.6, 1, 0.5, 0.5]],
    vo: [[0.5, 'More specific words live in folders, like food, people and places.'], [11.6, 'Open a folder, pick a word, and BridgeAAC takes you right back home.']] },
  { id: 'keyboard', D: 18, kind: 'demo', chapter: 'Keyboard', kicker: 'Keyboard', head: 'Spell<br>anything.', sub: 'Word prediction helps you finish faster.',
    clips: [{ id: 'keyboard', align: ['speak', 13.2] }],
    cam: [[0, 1, 0.5, 0.5], [3.4, 1.32, 0.5, 0.42], [16.2, 1, 0.5, 0.5]],
    vo: [[0.5, "If a word isn't on the board, open the keyboard and spell it."], [6.4, "Word prediction suggests whole words as you type, so it's faster."]] },
  { id: 'symbols', D: 16, dark: true, kind: 'symbols', chapter: 'Symbols',
    vo: [[0.8, 'Every button has a clear, friendly picture.'], [4.6, 'BridgeAAC comes with hundreds of its own symbols, drawn just for this app, and they all work without the internet.']] },
  { id: 'voices', D: 17, kind: 'demo', chapter: 'Offline voices', kicker: 'Voices', head: 'Voices that<br>work offline.', sub: 'Natural voices run right on the device.',
    clips: [{ id: 'voices', align: ['start', 0.4] }],
    cam: [[0, 1, 0.5, 0.5], [5.2, 1.3, 0.5, 0.6], [15.4, 1, 0.5, 0.5]],
    vo: [[0.6, 'You can choose the voice that fits.'], [4.4, 'Natural voices download once, then run right on the device. So BridgeAAC keeps talking on a plane, at school, or anywhere without Wi-Fi.']] },
  { id: 'edit', D: 21, kind: 'demo', chapter: 'Make it yours', kicker: 'Customize', head: 'Make it<br>yours.', sub: 'Change any word, picture or color.',
    clips: [{ id: 'edit', align: ['start', 0.2] }],
    cam: [[0, 1, 0.5, 0.5], [4.6, 1.22, 0.5, 0.5], [15.6, 1, 0.5, 0.5]],
    vo: [[0.6, 'Every board can be made your own.'], [4.0, 'Tap Edit, pick any button, and change its word, its picture, or its color.'], [11.6, 'You can even add your own photos, like mom, a favorite toy, or the family dog.']] },
  { id: 'import', D: 15, kind: 'demo', chapter: 'Import and export', kicker: 'Import and export', head: 'Bring your<br>boards.', sub: 'Never locked in.',
    clips: [{ id: 'vocab', align: ['start', 0.3] }], chips: true,
    cam: [[0, 1, 0.5, 0.5]],
    vo: [[0.6, 'Already have boards from another AAC app?'], [4.0, "BridgeAAC imports dot-C-E and Open Board files, and it can export them too. So you're never locked in."]] },
  { id: 'planner', D: 20, kind: 'demo', chapter: 'Planner, moods and games', kicker: 'Planner', head: 'Plan the<br>day.', sub: 'Step by step, with a star for every task.',
    clips: [{ id: 'planner', align: ['check', 13.0] }],
    cam: [[0, 1, 0.5, 0.5], [4.6, 1.3, 0.4, 0.45], [18.2, 1, 0.5, 0.5]],
    vo: [[0.6, 'BridgeAAC helps with the rest of the day, too.'], [5.0, "A visual planner shows the day step by step, with a star for every task that's done."]] },
  { id: 'mood', D: 13, kind: 'demo', kicker: 'Moods', head: 'Share how<br>you feel.', sub: 'Check-ins with ideas that help.',
    clips: [{ id: 'mood', align: ['happy', 8.2] }],
    cam: [[0, 1, 0.5, 0.5], [4.0, 1.28, 0.5, 0.42], [11.4, 1, 0.5, 0.5]],
    vo: [[0.6, 'Mood check-ins help people share how they feel, and get ideas for what might help.']] },
  { id: 'games', D: 15, kind: 'demo', kicker: 'Games', head: 'Practice<br>through play.', sub: 'Build sentences, match feelings.',
    clips: [{ id: 'games', align: ['please', 9.6] }],
    cam: [[0, 1, 0.5, 0.5], [4.4, 1.3, 0.42, 0.42], [13.4, 1, 0.5, 0.5]],
    vo: [[0.6, 'And simple games make practicing words and sentences fun.']] },
  { id: 'access', D: 21, kind: 'demo', chapter: 'Accessibility', kicker: 'Accessibility', head: 'Made to fit<br>the person.', sub: 'Calm, dark and high contrast themes. Switch scanning.',
    clips: [{ id: 'themes', align: ['start', 0] }, { id: 'scan', from: 11.0, align: ['start', 11.0] }],
    cam: [[0, 1, 0.5, 0.5]],
    vo: [[0.6, 'BridgeAAC adapts to the person using it.'], [3.8, "There's a calm mode with soft colors, plus dark and high contrast themes."], [10.6, "Touch settings help with shaky hands, and switch scanning lets people speak even if they can't tap at all."]] },
  { id: 'languages', D: 10, dark: true, kind: 'languages', chapter: 'Languages and privacy',
    vo: [[0.6, 'It comes in ten languages, including Spanish, French, Arabic, Chinese and Hindi.']] },
  { id: 'privacy', name: 'Privacy', D: 13, dark: true, kind: 'privacy',
    vo: [[0.6, "And it's private. There are no accounts, no ads, and no tracking."], [6.6, 'Your boards and messages stay on your device.']] },
  { id: 'devices', D: 18, kind: 'devices', chapter: 'Every device',
    vo: [[0.6, 'BridgeAAC runs on the devices families already have. iPad, iPhone, Android, Chromebook, and Windows, Mac and Linux computers.'], [10.4, 'On an iPad, just open bridgeaac.org in Safari and add it to your home screen.']] },
  { id: 'end', D: 13, dark: true, kind: 'end', chapter: 'Try it',
    vo: [[0.8, 'BridgeAAC is free and open source.'], [4.4, 'Try it today at bridgeaac.org. Thanks for watching.']] },
];

let acc = 0;
for (const s of SCENES) { s.T = acc; acc += s.D; }
const TOTAL = acc + 0.6;
const NFRAMES = Math.round(TOTAL * FPS);

for (const s of SCENES) {
  for (const c of s.clips || []) {
    const clip = clips[c.id];
    const [m, at] = c.align;
    c.offset = at - (m === 'start' ? 0 : clip.marks[m]);
    c.from = c.from ?? -10;
  }
}

const words = (t) => t.split(/\s+/).filter(Boolean).length;
const VO = [];
for (const s of SCENES) for (const [at, text] of s.vo) VO.push({ scene: s.id, start: s.T + at, text });
const APP = [];
const CLICKS = [];
for (const s of SCENES) {
  (s.clips || []).forEach((c, ci) => {
    const until = s.clips[ci + 1] ? s.clips[ci + 1].from : s.D + XF;
    const clip = clips[c.id];
    for (const sp of clip.speech) { const lt = sp.t + c.offset; if (lt >= c.from && lt < until) APP.push({ start: s.T + lt, text: sp.text }); }
    for (const tp of clip.taps) { const lt = tp + c.offset; if (lt >= Math.max(c.from, 0) && lt < until) CLICKS.push(s.T + lt); }
  });
}

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
for (const a of APP) {
  a.file = path.join(AUDIO, `${slug(a.text)}.wav`);
  if (!fs.existsSync(a.file)) {
    if (!PIPER_MODEL) throw new Error(`Missing ${a.file}. Set PIPER and PIPER_MODEL (en_US-hfc_female-medium.onnx) to generate app speech.`);
    execFileSync(PIPER, ['-m', PIPER_MODEL, '-f', a.file], { input: a.text });
  }
  a.end = a.start + dur(a.file);
}

const warnings = [];
for (let i = 0; i < VO.length; i++) {
  const v = VO[i];
  const scene = SCENES.find((s) => s.id === v.scene);
  const nextVo = VO[i + 1] && VO[i + 1].start < scene.T + scene.D ? VO[i + 1].start : scene.T + scene.D;
  const nextApp = APP.find((a) => a.start > v.start + 0.1);
  const limit = Math.min(nextVo, nextApp ? nextApp.start : Infinity) - 0.3;
  v.room = limit - v.start;
  v.wps = words(v.text) / v.room;
  v.end = Math.min(limit, v.start + words(v.text) / 2.3 + 0.6);
  if (v.wps > 2.45) warnings.push(`"${v.text.slice(0, 40)}..." needs ${v.wps.toFixed(2)} words/s`);
}
const clash = APP.filter((a) => VO.some((v) => v.start < a.end && v.start + words(v.text) / 2.3 > a.start));
if (clash.length) warnings.push(`App speech overlaps narration: ${clash.map((c) => c.text).join(' | ')}`);
const timeline = [...VO.map((v) => ({ ...v, kind: 'vo' })), ...APP.map((a) => ({ ...a, kind: 'app' }))].sort((a, b) => a.start - b.start);
console.log(`Timeline ${TOTAL.toFixed(1)}s, ${VO.length} narration lines, ${APP.length} app lines`);
warnings.forEach((w) => console.warn('WARNING', w));

const ipadW = 1080;
const ipadLeft = 742;
const ipad = ipadHtml('<img class="clip" style="display:block;width:100%;height:100%;object-fit:cover;background:#fff">', ipadW, '', 1180 / 820);
const ipadTop = Math.round((H - ipad.H) / 2);
const screenInset = Math.max(2, ipadW * 0.0032) + ipadW * 0.021;
const SCREEN = { x: ipadLeft + screenInset, y: ipadTop + screenInset, w: ipadW - 2 * screenInset, h: ipad.H - 2 * screenInset };

const anim = (kind, at, end, extra = '') => `data-anim="${kind}" data-in="${at}" data-out="${end ?? 999}" ${extra}`;

function sceneHtml(s) {
  if (s.kind === 'lines') {
    return s.lines.map((l) => `<div class="center" ${anim('up', l.at, l.end)}><div class="big">${l.html}</div>${l.sub ? `<div class="bigsub">${l.sub}</div>` : ''}</div>`).join('');
  }
  if (s.kind === 'title') {
    return `<div class="center">
      <img class="logo" src="${ICON}" ${anim('pop', 0.3, 9.4)}>
      <div class="brandname" ${anim('up', 0.9, 9.4)}>BridgeAAC</div>
      <div class="tagline" ${anim('up', 1.7, 9.4)}>Tap a picture. Say what you mean.</div>
    </div>`;
  }
  if (s.kind === 'demo') {
    const chips = s.chips ? ['.ce', '.obf', '.obz', '.bridge'].map((c, i) => `<div class="chip" ${anim('fly', 4.2 + i * 0.75, 999, `data-x0="${150 + (i % 2) * 210}" data-y0="${830 + Math.floor(i / 2) * 100}" data-x1="${SCREEN.x + SCREEN.w * 0.5}" data-y1="${SCREEN.y + SCREEN.h * 0.42}" data-d="1.5"`)}>${c}</div>`).join('') : '';
    return `<div class="col" data-col>
        <div class="kicker" ${anim('up', 0.2, 999)}>${s.kicker}</div>
        <div class="head" ${anim('up', 0.35, 999)}>${s.head}</div>
        <div class="sub" ${anim('up', 0.55, 999)}>${s.sub}</div>
      </div>
      <div class="cam" data-cam><div class="dev" style="left:${ipadLeft}px;top:${ipadTop}px">${ipad.html}</div></div>${chips}`;
  }
  if (s.kind === 'symbols') {
    const cols = 12;
    const tiles = SYMBOLS.slice(0, 60).map((sym, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const d = 1.0 + (r * 0.18 + c * 0.07) + ((i * 37) % 7) * 0.03;
      return `<div class="tile" style="left:${c * 146}px;top:${r * 146}px" ${anim('pop', d.toFixed(2), 999)}>${sym.svg}</div>`;
    }).join('');
    return `<div class="symhead" ${anim('up', 0.3, 999)}>Hundreds of <span class="grad">original symbols.</span></div>
      <div class="symsub" ${anim('up', 0.6, 999)}>Drawn for BridgeAAC. Built in. Always offline.</div>
      <div class="wall" data-drift>${tiles}</div>`;
  }
  if (s.kind === 'languages') {
    const langs = [['Hello', 'English'], ['Hola', 'Español'], ['Bonjour', 'Français'], ['Hallo', 'Deutsch'], ['Olá', 'Português'], ['Ciao', 'Italiano'], ['مرحبا', 'العربية'], ['你好', '中文'], ['नमस्ते', 'हिन्दी'], ['Kumusta', 'Tagalog']];
    const cells = langs.map(([g, n], i) => `<div class="lang" ${anim('up', (0.9 + i * 0.22).toFixed(2), 999)}><div class="g">${g}</div><div class="n">${n}</div></div>`).join('');
    return `<div class="langhead" ${anim('up', 0.3, 999)}>Ten languages.</div><div class="langs">${cells}</div>`;
  }
  if (s.kind === 'privacy') {
    return `<div class="center">
      <div class="big pline" ${anim('up', 0.9, 999)}>No accounts.</div>
      <div class="big pline" ${anim('up', 2.6, 999)}>No ads.</div>
      <div class="big pline" ${anim('up', 4.2, 999)}>No tracking.</div>
      <div class="bigsub" style="margin-top:46px" ${anim('up', 6.6, 999)}>Your boards and messages stay on your device.</div>
    </div>`;
  }
  if (s.kind === 'devices') {
    const mac = laptopHtml(`<img src="${stills.mac}" style="display:block;width:100%;height:100%;object-fit:cover">`, 900, 'left:560px;top:240px', 'mac');
    const ipadS = ipadHtml(`<img src="${stills.ipad}" style="display:block;width:100%;height:100%;object-fit:cover">`, 620, 'left:250px;top:420px', 1180 / 820);
    const phone = phoneHtml(`<img src="${stills.phone}" style="display:block;width:100%;height:100%;object-fit:cover">`, 230, 'left:1380px;top:440px', null);
    return `<div class="devhead" ${anim('up', 0.3, 999)}>On the devices you <span class="grad">already have.</span></div>
      <div class="lu" ${anim('rise', 0.9, 999)}>${mac.html}</div>
      <div class="lu" ${anim('rise', 1.25, 999)}>${ipadS.html}</div>
      <div class="lu" ${anim('rise', 1.95, 999)}>${phone.html}</div>
      <div class="plats" ${anim('up', 2.8, 999)}>iPad · iPhone · Android · Chromebook · Windows · Mac · Linux</div>
      <div class="install" ${anim('up', 10.4, 999)}>On iPad: open <b>bridgeaac.org</b> in Safari, then Share → Add to Home Screen.</div>`;
  }
  if (s.kind === 'end') {
    return `<div class="center">
      <img class="logo" src="${ICON}" ${anim('pop', 0.4, 999)}>
      <div class="brandname" ${anim('up', 0.9, 999)}>BridgeAAC</div>
      <div class="tagline" ${anim('up', 1.5, 999)}>Free and open source.</div>
      <div class="url" ${anim('up', 4.4, 999)}>bridgeaac.org</div>
      <div class="gh" ${anim('up', 5.0, 999)}>github.com/BridgeAAC/core</div>
    </div>`;
  }
  return '';
}

const cfg = {
  total: TOTAL,
  xf: XF,
  screen: SCREEN,
  scenes: SCENES.map((s) => ({ id: s.id, T: s.T, D: s.D, cam: s.cam || null })),
};

composeRef.html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'ZH'; src: url(${ZH_FONT}) format('truetype'); unicode-range: U+4E2D, U+4F60, U+597D, U+6587; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
body { font-family: ${FONT}; -webkit-font-smoothing: antialiased; position: relative; }
.scene { position: absolute; inset: 0; opacity: 0; overflow: hidden; }
.scene.light { background: radial-gradient(1200px 700px at 78% 50%, #ffffff 0%, #f5f5f7 60%, #ececf0 100%); color: #1d1d1f; }
.scene.dark { background: radial-gradient(1100px 650px at 50% 45%, #15161a 0%, #000 70%); color: #f5f5f7; }
.grad { background: linear-gradient(92deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.dim { color: #86868b; }
.center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.big { font-size: 96px; font-weight: 700; letter-spacing: -0.045em; line-height: 1.06; max-width: 1500px; }
.bigsub { font-family: ${TEXT_FONT}; font-size: 36px; font-weight: 400; color: #a1a1a6; margin-top: 28px; letter-spacing: -0.01em; }
.pline { font-size: 110px; line-height: 1.12; }
.logo { width: 184px; height: 184px; border-radius: 42px; box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 40px 80px rgba(0,0,0,.55); margin-bottom: 34px; }
.brandname { font-size: 150px; font-weight: 700; letter-spacing: -0.05em; line-height: 1; }
.tagline { font-size: 46px; font-weight: 500; color: #a1a1a6; letter-spacing: -0.02em; margin-top: 22px; }
.url { font-size: 54px; font-weight: 600; color: #2997ff; letter-spacing: -0.02em; margin-top: 54px; }
.gh { font-family: ${TEXT_FONT}; font-size: 28px; color: #86868b; margin-top: 14px; }
.col { position: absolute; left: 120px; top: 0; bottom: 0; width: 560px; display: flex; flex-direction: column; justify-content: center; }
.kicker { font-size: 28px; font-weight: 600; color: #0071e3; letter-spacing: -0.01em; margin-bottom: 18px; }
.head { font-size: 92px; font-weight: 700; letter-spacing: -0.045em; line-height: 1.02; }
.sub { font-family: ${TEXT_FONT}; font-size: 32px; color: #6e6e73; line-height: 1.32; margin-top: 28px; letter-spacing: -0.012em; max-width: 520px; }
.cam { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; will-change: transform; }
.dev { position: absolute; width: ${ipadW}px; height: ${ipad.H}px; }
.dev > div { left: 0; top: 0; }
.chip { position: absolute; left: 0; top: 0; padding: 18px 30px; border-radius: 20px; background: #fff; color: #1d1d1f; font-size: 40px; font-weight: 700; letter-spacing: -0.02em; box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 18px 40px rgba(0,0,0,.14); opacity: 0; }
.symhead { position: absolute; left: 0; right: 0; top: 84px; text-align: center; font-size: 84px; font-weight: 700; letter-spacing: -0.045em; }
.symsub { position: absolute; left: 0; right: 0; top: 194px; text-align: center; font-family: ${TEXT_FONT}; font-size: 32px; color: #a1a1a6; }
.wall { position: absolute; left: ${(W - 146 * 12 + 16) / 2}px; top: 290px; width: ${146 * 12}px; height: 730px; }
.tile { position: absolute; width: 130px; height: 130px; border-radius: 26px; background: #fff; padding: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.35); opacity: 0; }
.tile svg { width: 100%; height: 100%; display: block; }
.langhead { position: absolute; left: 0; right: 0; top: 150px; text-align: center; font-size: 100px; font-weight: 700; letter-spacing: -0.045em; }
.langs { position: absolute; left: 160px; right: 160px; top: 380px; display: grid; grid-template-columns: repeat(5, 1fr); row-gap: 70px; }
.lang { text-align: center; }
.lang .g { font-family: 'ZH', ${FONT}, 'Noto Sans Arabic', 'Noto Sans Devanagari'; font-size: 68px; font-weight: 600; letter-spacing: -0.02em; }
.lang .n { font-family: 'ZH', ${TEXT_FONT}, 'Noto Sans Arabic', 'Noto Sans Devanagari'; font-size: 26px; color: #86868b; margin-top: 12px; }
.devhead { position: absolute; left: 0; right: 0; top: 90px; text-align: center; font-size: 80px; font-weight: 700; letter-spacing: -0.045em; }
.lu { position: absolute; inset: 0; }
.plats { position: absolute; left: 0; right: 0; bottom: 120px; text-align: center; font-size: 34px; font-weight: 600; letter-spacing: -0.015em; color: #1d1d1f; }
.install { position: absolute; left: 0; right: 0; bottom: 64px; text-align: center; font-family: ${TEXT_FONT}; font-size: 28px; color: #6e6e73; }
.install b { color: #0071e3; font-weight: 600; }
#black { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; }
</style></head><body>
${SCENES.map((s, i) => `<div class="scene ${s.dark ? 'dark' : 'light'}" id="sc${i}">${sceneHtml(s)}</div>`).join('\n')}
<div id="black"></div>
<script>
const cfg = ${JSON.stringify(cfg)};
const clamp = (x) => Math.min(1, Math.max(0, x));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const outQuint = (x) => 1 - Math.pow(1 - x, 5);
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outBack = (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const sceneEls = cfg.scenes.map((s, i) => document.getElementById('sc' + i));
const animEls = sceneEls.map((el) => [...el.querySelectorAll('[data-anim]')].map((e) => ({ e, kind: e.dataset.anim, a: +e.dataset.in, b: +e.dataset.out, d: e.dataset })));
function animate(item, lt) {
  const { e, kind, a, b, d } = item;
  const p = clamp((lt - a) / (kind === 'pop' ? 0.55 : 0.9));
  const q = clamp((lt - b) / 0.5);
  if (kind === 'up') {
    const k = outQuint(p);
    e.style.opacity = (k * (1 - q)).toFixed(3);
    e.style.transform = 'translateY(' + ((1 - k) * 40 - q * 16).toFixed(1) + 'px)';
  } else if (kind === 'pop') {
    const k = p <= 0 ? 0 : outBack(p);
    e.style.opacity = (clamp(p * 2) * (1 - q)).toFixed(3);
    e.style.transform = 'scale(' + (0.7 + 0.3 * k).toFixed(4) + ')';
  } else if (kind === 'rise') {
    const k = outQuint(clamp((lt - a) / 1.2));
    e.style.opacity = k.toFixed(3);
    e.style.transform = 'translateY(' + ((1 - k) * 90).toFixed(1) + 'px)';
  } else if (kind === 'fly') {
    const dd = +d.d;
    const r = (lt - a) / dd;
    if (r <= 0 || r >= 1) { e.style.opacity = '0'; return; }
    const k = inOut(r);
    const x = +d.x0 + (+d.x1 - +d.x0) * k;
    const y = +d.y0 + (+d.y1 - +d.y0) * k - Math.sin(Math.PI * r) * 60;
    e.style.opacity = (r < 0.12 ? r / 0.12 : r > 0.78 ? (1 - r) / 0.22 : 1).toFixed(3);
    e.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) scale(' + (1 - 0.45 * k).toFixed(3) + ')';
  }
}
function camAt(cam, lt) {
  let cur = cam[0];
  for (let i = 1; i < cam.length; i++) {
    const k = cam[i];
    const tr = Math.min(1.5, k[0] - cam[i - 1][0]);
    if (lt >= k[0]) { cur = k; continue; }
    if (lt > k[0] - tr) {
      const e = inOut((lt - (k[0] - tr)) / tr);
      return [0, cur[1] + (k[1] - cur[1]) * e, cur[2] + (k[2] - cur[2]) * e, cur[3] + (k[3] - cur[3]) * e];
    }
    break;
  }
  return cur;
}
window.render = async (t, srcs) => {
  const loads = [];
  cfg.scenes.forEach((s, i) => {
    const el = sceneEls[i];
    const next = cfg.scenes[i + 1];
    const lt = t - s.T;
    const vis = t >= s.T - cfg.xf && (!next || t < next.T + cfg.xf);
    if (!vis) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.opacity = (i === 0 ? outCubic(clamp(t / 1.2)) : inOut(clamp((lt + cfg.xf) / (2 * cfg.xf)))).toFixed(3);
    el.style.zIndex = String(i);
    animEls[i].forEach((it) => animate(it, lt));
    const img = el.querySelector('img.clip');
    if (img && srcs[i]) {
      if (img.dataset.src !== srcs[i]) { img.dataset.src = srcs[i]; img.src = srcs[i]; loads.push(img.decode().catch(() => {})); }
    }
    if (s.cam) {
      const [, z, fx, fy] = camAt(s.cam, lt);
      const S = cfg.screen;
      const px = S.x + fx * S.w;
      const py = S.y + fy * S.h;
      const k = clamp((z - 1) / 0.3);
      const tx = px + (960 - px) * k;
      const ty = py + (540 - py) * k;
      el.querySelector('[data-cam]').style.transform = 'translate(' + (tx - z * px).toFixed(2) + 'px,' + (ty - z * py).toFixed(2) + 'px) scale(' + z.toFixed(4) + ')';
      const col = el.querySelector('[data-col]');
      if (col) col.style.opacity = (1 - clamp((z - 1.04) / 0.16)).toFixed(3);
    }
    const wall = el.querySelector('[data-drift]');
    if (wall) wall.style.transform = 'translateY(' + (-lt * 4).toFixed(2) + 'px) scale(' + (1 + lt * 0.004).toFixed(4) + ')';
  });
  const endT = cfg.total - 1.6;
  document.getElementById('black').style.opacity = clamp((t - endT) / 1.4).toFixed(3);
  await Promise.all(loads);
};
</script></body></html>`;

function frameAt(clip, lt) {
  let lo = 0;
  let hi = clip.frames.length - 1;
  if (lt <= clip.frames[0].t) return clip.frames[0].name;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (clip.frames[mid].t <= lt) lo = mid;
    else hi = mid - 1;
  }
  return clip.frames[lo].name;
}

const seqDir = path.join(tmp, 'seq');
fs.mkdirSync(seqDir);
const rb = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const cctx = await rb.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const cp = await cctx.newPage();
await cp.goto(`http://127.0.0.1:${srv.address().port}/__compose.html`, { waitUntil: 'load' });
await cp.evaluate(() => document.fonts.ready);
const step = QUICK ? 10 : 1;
const only = process.argv.find((a) => a.startsWith('--at='));
const frameList = only ? only.slice(5).split(',').map((s) => Math.round(parseFloat(s) * FPS)) : [...Array(NFRAMES).keys()].filter((i) => i % step === 0);
for (const i of frameList) {
  const t = i / FPS;
  const srcs = SCENES.map((s) => {
    if (!s.clips) return null;
    const lt = t - s.T;
    let c = s.clips[0];
    for (const cc of s.clips) if (lt >= cc.from) c = cc;
    return `/__frames/${frameAt(clips[c.id], Math.max(0, lt - c.offset))}`;
  });
  await cp.evaluate(([tt, s]) => window.render(tt, s), [t, srcs]);
  await cp.screenshot({ path: path.join(seqDir, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
  if (i % 300 === 0) console.log(`  frame ${i}/${NFRAMES}`);
}
if (only || QUICK) {
  const previewDir = path.join(OUT, 'preview');
  fs.rmSync(previewDir, { recursive: true, force: true });
  fs.mkdirSync(previewDir);
  for (const f of fs.readdirSync(seqDir)) fs.copyFileSync(path.join(seqDir, f), path.join(previewDir, f));
  console.log(`Preview frames in ${previewDir}`);
}
await cctx.close();
await rb.close();
srv.close();

const fmt = (t, sep = ',') => {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(ms % 1000).padStart(3, '0')}`;
};
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify({ total: TOTAL, narration: VO.map(({ start, end, text, scene }) => ({ start, end, text, scene })), app: APP.map(({ start, end, text }) => ({ start, end, text })), chapters: SCENES.filter((s) => s.chapter).map((s) => ({ t: s.T, title: s.chapter })) }, null, 2));

const srt = timeline.map((c, i) => `${i + 1}\n${fmt(c.start)} --> ${fmt(c.kind === 'vo' ? c.end : c.end + 0.2)}\n${c.kind === 'app' ? `[BridgeAAC] ${c.text}` : c.text}\n`).join('\n');
fs.writeFileSync(path.join(OUT, 'captions.srt'), srt);

const scriptMd = [
  '# BridgeAAC YouTube video: narration script',
  '',
  `Length: ${mmss(TOTAL)}. Read each line when the timecode comes up. Lines marked APP are spoken by BridgeAAC in the video, so stay quiet for those.`,
  '',
  ...SCENES.map((s) => {
    const rows = timeline.filter((c) => c.start >= s.T && c.start < s.T + s.D).map((c) => (c.kind === 'app' ? `- \`${mmss(c.start)}\` *APP: "${c.text}"*` : `- \`${mmss(c.start)}\` ${c.text}`));
    return `## ${mmss(s.T)} ${s.chapter || s.kicker || s.name || s.id}\n\n${rows.join('\n')}\n`;
  }),
].join('\n');
fs.writeFileSync(path.join(OUT, 'script.md'), scriptMd);

const chapters = ['0:00 Intro', ...SCENES.filter((s) => s.chapter && s.T > 0).map((s) => `${mmss(s.T)} ${s.chapter}`)];
const description = `BridgeAAC is a free, open-source AAC app. Tap pictures to build sentences and hear them spoken. It works offline on iPad, iPhone, Android, Chromebook, Windows, Mac and Linux.

Try it: https://bridgeaac.org
Source code: https://github.com/BridgeAAC/core

Chapters
${chapters.join('\n')}

No accounts, no ads, no tracking. Boards and messages stay on your device.

#AAC #Autism #AssistiveTechnology #SpeechTherapy #OpenSource`;
fs.writeFileSync(path.join(OUT, 'description.txt'), description + '\n');

const cues = timeline.map((c) => ({ s: +c.start.toFixed(2), e: +c.end.toFixed(2), k: c.kind, t: c.text }));
fs.writeFileSync(path.join(OUT, 'teleprompter.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>BridgeAAC Teleprompter</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #000; color: #f5f5f7; font-family: ${FONT}; -webkit-font-smoothing: antialiased; min-height: 100vh; display: grid; grid-template-rows: auto 1fr auto; }
header { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid #1d1d1f; flex-wrap: wrap; }
header h1 { font-size: 18px; font-weight: 600; margin-right: auto; }
button { font: 600 15px ${FONT}; border: 0; border-radius: 99px; padding: 10px 18px; cursor: pointer; background: #1d1d1f; color: #f5f5f7; }
button.rec { background: #ff3b30; }
button:disabled { opacity: .4; cursor: default; }
#status { font-size: 14px; color: #86868b; min-width: 140px; }
main { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 24px; padding: 24px; align-items: start; }
@media (max-width: 1100px) { main { grid-template-columns: 1fr; } }
#prompt { display: flex; flex-direction: column; justify-content: center; min-height: 60vh; }
#now { font-size: clamp(36px, 4.4vw, 64px); font-weight: 700; letter-spacing: -0.03em; line-height: 1.15; transition: color .2s; }
#now.app { color: #ff9f0a; font-style: italic; }
#now.wait { color: #48484a; }
#bar { height: 6px; background: #1d1d1f; border-radius: 99px; margin: 28px 0; overflow: hidden; }
#bar i { display: block; height: 100%; width: 0; background: #2997ff; }
#next { font-size: 26px; color: #6e6e73; line-height: 1.35; }
#next b { color: #a1a1a6; font-weight: 600; }
video { width: 100%; border-radius: 12px; background: #111; }
#clock { font: 600 28px ${FONT}; font-variant-numeric: tabular-nums; margin-top: 12px; }
#dl { display: block; margin-top: 14px; color: #2997ff; font-size: 16px; }
footer { padding: 14px 24px; color: #6e6e73; font-size: 14px; border-top: 1px solid #1d1d1f; }
</style></head><body>
<header><h1>BridgeAAC teleprompter</h1>
<button id="practice">Practice</button><button id="record" class="rec">Record</button><button id="stop" disabled>Stop</button><span id="status">Ready</span></header>
<main>
  <section id="prompt"><div id="now" class="wait">Press Practice or Record.</div><div id="bar"><i></i></div><div id="next"></div></section>
  <aside><video id="v" src="bridgeaac-youtube-no-music.mp4" playsinline></video><div id="clock">0:00</div><a id="dl" hidden></a></aside>
</main>
<footer>Wear headphones so the mic only hears you. Orange lines are spoken by the app, so stay quiet for those. Recording starts with a 3 second countdown.</footer>
<script>
const cues = ${JSON.stringify(cues)};
const v = document.getElementById('v');
const now = document.getElementById('now');
const next = document.getElementById('next');
const bar = document.querySelector('#bar i');
const status = document.getElementById('status');
const dl = document.getElementById('dl');
const btn = { practice: document.getElementById('practice'), record: document.getElementById('record'), stop: document.getElementById('stop') };
let rec = null, chunks = [], recStart = 0, lead = 0, stream = null;
const fmt = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
function tick() {
  const t = v.currentTime;
  document.getElementById('clock').textContent = fmt(t);
  let i = cues.findIndex((c) => t < c.s);
  if (i === -1) i = cues.length;
  const cur = cues[i - 1];
  const upcoming = cues[i];
  if (cur && t < Math.max(cur.e, cur.s + 1.5) + 0.4) {
    now.textContent = cur.k === 'app' ? 'App: "' + cur.t + '"' : cur.t;
    now.className = cur.k === 'app' ? 'app' : '';
  } else if (upcoming) {
    now.textContent = upcoming.k === 'app' ? 'App: "' + upcoming.t + '"' : upcoming.t;
    now.className = 'wait';
  } else { now.textContent = 'Done.'; now.className = 'wait'; }
  if (upcoming) {
    const prev = cur ? cur.s : 0;
    bar.style.width = (100 * Math.min(1, (t - prev) / Math.max(0.1, upcoming.s - prev))) + '%';
    const after = cues[i + (cur && t < cur.e ? 0 : 1)];
    next.innerHTML = after ? '<b>Next in ' + Math.max(0, after.s - t).toFixed(1) + 's</b><br>' + (after.k === 'app' ? '<i>App: "' + after.t + '"</i>' : after.t) : '';
  } else { bar.style.width = '100%'; next.textContent = ''; }
  if (!v.paused) requestAnimationFrame(tick);
}
v.addEventListener('play', () => requestAnimationFrame(tick));
v.addEventListener('ended', () => stop());
function setBusy(b) { btn.practice.disabled = b; btn.record.disabled = b; btn.stop.disabled = !b; }
async function countdown() { for (let n = 3; n > 0; n--) { now.textContent = String(n); now.className = 'wait'; await new Promise((r) => setTimeout(r, 1000)); } }
btn.practice.onclick = async () => { setBusy(true); v.currentTime = 0; status.textContent = 'Practicing'; await countdown(); v.play(); };
btn.record.onclick = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
  } catch (e) { status.textContent = 'Microphone blocked'; return; }
  setBusy(true);
  dl.hidden = true;
  chunks = [];
  rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    dl.href = URL.createObjectURL(blob);
    dl.download = 'my-vocals_lead-' + lead.toFixed(3) + '.webm';
    dl.textContent = 'Save recording (' + dl.download + ')';
    dl.hidden = false;
    stream.getTracks().forEach((tr) => tr.stop());
    status.textContent = 'Saved. Click the link to download.';
  };
  v.currentTime = 0;
  rec.start(1000);
  recStart = performance.now();
  status.textContent = 'Recording';
  await countdown();
  v.addEventListener('playing', () => { lead = (performance.now() - recStart) / 1000 - v.currentTime; }, { once: true });
  v.play();
};
function stop() {
  v.pause();
  if (rec && rec.state !== 'inactive') rec.stop();
  setBusy(false);
  if (!rec) status.textContent = 'Stopped';
  rec = null;
}
btn.stop.onclick = stop;
</script></body></html>
`);

if (only || QUICK) {
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
}

const tones = [
  [130.81, 196.0, 246.94, 329.63],
  [110.0, 164.81, 220.0, 329.63],
  [87.31, 130.81, 220.0, 261.63],
  [98.0, 146.83, 196.0, 293.66],
];
const padArgs = ['-y', '-loglevel', 'error'];
const padFilters = [];
const padLabels = [];
let pi = 0;
const CH = 8;
for (let k = 0; k * CH < TOTAL; k++) {
  for (const f of tones[k % tones.length]) {
    const expr = `0.012*(sin(2*PI*${f.toFixed(2)}*t)+0.6*sin(2*PI*${(f * 1.003).toFixed(3)}*t)+0.12*sin(2*PI*${(f * 2).toFixed(2)}*t))`;
    padArgs.push('-f', 'lavfi', '-i', `aevalsrc=${expr}:s=48000:d=${CH + 3}`);
    const ms = Math.round(k * CH * 1000);
    padFilters.push(`[${pi}:a]afade=t=in:d=3,afade=t=out:st=${CH}:d=3,adelay=${ms}|${ms}[p${pi}]`);
    padLabels.push(`[p${pi}]`);
    pi++;
  }
}
padFilters.push(`${padLabels.join('')}amix=inputs=${pi}:normalize=0,lowpass=f=1400,tremolo=f=0.12:d=0.18,aecho=0.8:0.85:110|230:0.3|0.2,atrim=0:${TOTAL.toFixed(3)},afade=t=in:d=2,afade=t=out:st=${(TOTAL - 3).toFixed(3)}:d=3,aformat=sample_rates=48000:channel_layouts=stereo,volume=1.6[pad]`);
const musicWav = path.join(tmp, 'music.wav');
padArgs.push('-filter_complex', padFilters.join(';'), '-map', '[pad]', musicWav);
execFileSync('ffmpeg', padArgs, { stdio: 'inherit' });

const appArgs = ['-y', '-loglevel', 'error', '-f', 'lavfi', '-t', TOTAL.toFixed(3), '-i', 'anullsrc=r=48000:cl=stereo'];
const appFilters = [];
const appLabels = ['[0:a]'];
let ai = 1;
for (const a of APP) {
  appArgs.push('-i', a.file);
  const ms = Math.round(a.start * 1000);
  appFilters.push(`[${ai}:a]aresample=48000,aformat=channel_layouts=stereo,volume=1.5,adelay=${ms}|${ms}[a${ai}]`);
  appLabels.push(`[a${ai}]`);
  ai++;
}
for (const c of CLICKS) {
  appArgs.push('-f', 'lavfi', '-t', '0.06', '-i', 'aevalsrc=0.16*sin(2*PI*1200*t)*exp(-90*t):s=48000:c=stereo');
  const ms = Math.round(c * 1000 + 20);
  appFilters.push(`[${ai}:a]adelay=${ms}|${ms}[a${ai}]`);
  appLabels.push(`[a${ai}]`);
  ai++;
}
appFilters.push(`${appLabels.join('')}amix=inputs=${ai}:normalize=0,atrim=0:${TOTAL.toFixed(3)}[app]`);
const appWav = path.join(tmp, 'app.wav');
appArgs.push('-filter_complex', appFilters.join(';'), '-map', '[app]', appWav);
execFileSync('ffmpeg', appArgs, { stdio: 'inherit' });

const enc = (f, out) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, '-c:a', 'aac', '-b:a', '256k', out], { stdio: 'inherit' });
enc(musicWav, path.join(STEMS, 'music.m4a'));
enc(appWav, path.join(STEMS, 'app.m4a'));

const video = path.join(tmp, 'video.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(seqDir, '%05d.jpg'), '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', video], { stdio: 'inherit' });
const mux = (audio, out) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
const both = path.join(tmp, 'both.wav');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', musicWav, '-i', appWav, '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0,alimiter=limit=0.9[o]', '-map', '[o]', both], { stdio: 'inherit' });
mux(both, path.join(OUT, 'bridgeaac-youtube.mp4'));
mux(appWav, path.join(OUT, 'bridgeaac-youtube-no-music.mp4'));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Done: ${OUT}/bridgeaac-youtube.mp4 (${mmss(TOTAL)})`);
