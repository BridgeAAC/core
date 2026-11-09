import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.BASE_PATH ?? './';

function bridgeTtsPlugin(): Plugin {
  const handler = async (req: any, res: any, next: () => void) => {
    const urlStr: string = req.url ?? '';
    if (!urlStr.startsWith('/api/tts')) {
      next();
      return;
    }
    try {
      const u = new URL(urlStr, 'http://localhost');
      const q = (u.searchParams.get('q') ?? '').trim().slice(0, 200);
      const tl = (u.searchParams.get('tl') ?? 'en').trim();
      if (!q) {
        res.statusCode = 400;
        res.end('Missing q');
        return;
      }
      const target = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
        tl,
      )}&q=${encodeURIComponent(q)}`;
      const upstream = await fetch(target, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });
      if (!upstream.ok) {
        res.statusCode = 204;
        res.end();
        return;
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.statusCode = 200;
      res.end(buf);
    } catch {
      res.statusCode = 204;
      res.end();
    }
  };

  return {
    name: 'bridge-tts-proxy',
    buildStart() {
      try {
        const fs = require('node:fs');
        const p = 'node_modules/mespeak/src/ESpeak.js';
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          try {
            new TextDecoder('utf-8', { fatal: true }).decode(buf);
          } catch {
            fs.writeFileSync(p, buf.toString('latin1'), 'utf8');
          }
        }
        const vitsPath = 'node_modules/@diffusionstudio/vits-web/dist/vits-web.js';
        if (fs.existsSync(vitsPath)) {
          let code = fs.readFileSync(vitsPath, 'utf8');
          if (!code.includes('ensureRuntimeBlobs')) {
            code = code
              .replace(
                /if \(e\.match\("https:\/\/huggingface\.co"\)\)/g,
                'if (e.match(/huggingface\\.co|jsdelivr\\.net|cloudflare\\.com/))',
              )
              .replace(
                'return await (await n.getFileHandle(o)).getFile();',
                'const file = await (await n.getFileHandle(o)).getFile(); if (file && file.size > 0) return file;',
              )
              .replace(
                /let h, _;\nasync function N\(e, m\) \{[\s\S]*?async function L\(\) \{/,
                `let h, _, wasmBlobUrl, dataBlobUrl, ortBlobUrl;
const sessionCache = new Map();
async function ensureRuntimeBlobs() {
  if (!wasmBlobUrl) {
    const wFile = await f(\`\${x}.wasm\`);
    wasmBlobUrl = URL.createObjectURL(wFile);
  }
  if (!dataBlobUrl) {
    const dFile = await f(\`\${x}.data\`);
    dataBlobUrl = URL.createObjectURL(dFile);
  }
  if (!ortBlobUrl) {
    const oFile = await f(\`\${B}ort-wasm-simd.wasm\`);
    ortBlobUrl = URL.createObjectURL(oFile);
  }
}
async function N(e, m) {
  h = h ?? await import("./piper-DeOu3H9E.js"), _ = _ ?? await import("onnxruntime-web");
  await ensureRuntimeBlobs();
  const n = c[e.voiceId], o = JSON.stringify([{ text: e.text.trim() }]);
  _.env.allowLocalModels = !1, _.env.wasm.numThreads = 1, _.env.wasm.wasmPaths = {
    "ort-wasm-simd.wasm": ortBlobUrl,
    "ort-wasm.wasm": ortBlobUrl,
    "ort-wasm-simd-threaded.wasm": ortBlobUrl,
    "ort-wasm-threaded.wasm": ortBlobUrl
  };
  const a = await f(\`\${u}/\${n}.json\`), i = JSON.parse(await a.text()), t = await new Promise(async (v, rej) => {
    try {
      (await h.createPiperPhonemize({
        print: (l) => {
          v(JSON.parse(l).phoneme_ids);
        },
        printErr: (l) => {
          rej(new Error(l));
        },
        locateFile: (l) => l.endsWith(".wasm") ? wasmBlobUrl : l.endsWith(".data") ? dataBlobUrl : l
      })).callMain([
        "-l",
        i.espeak.voice,
        "--input",
        o,
        "--espeak_data",
        "/espeak-ng-data"
      ]);
    } catch (err) {
      rej(err);
    }
  }), r = 0, s = i.audio.sample_rate, d = i.inference.noise_scale, g = i.inference.length_scale, U = i.inference.noise_w;
  let y = sessionCache.get(e.voiceId);
  if (!y) {
    const k = await f(\`\${u}/\${n}\`, m);
    y = await _.InferenceSession.create(await k.arrayBuffer());
    sessionCache.set(e.voiceId, y);
  }
  const w = {
    input: new _.Tensor("int64", t, [1, t.length]),
    input_lengths: new _.Tensor("int64", [t.length]),
    scales: new _.Tensor("float32", [d, g, U])
  };
  Object.keys(i.speaker_id_map).length && Object.assign(w, { sid: new _.Tensor("int64", [r]) });
  const {
    output: { data: E }
  } = await y.run(w);
  return new Blob([b(E, 1, s)], { type: "audio/x-wav" });
}
async function f(e, m) {
  let n = await D(e);
  return n || (n = await S(e, m), await p(e, n)), n;
}
async function I(e, m) {
  const n = c[e], o = [\`\${u}/\${n}\`, \`\${u}/\${n}.json\`, \`\${x}.wasm\`, \`\${x}.data\`, \`\${B}ort-wasm-simd.wasm\`];
  await Promise.all(
    o.map(async (a) => {
      const existing = await D(a);
      if (existing && !a.endsWith(".onnx")) return;
      await p(a, await S(a, a.endsWith(".onnx") ? m : void 0));
    })
  );
}
async function F(e) {
  sessionCache.delete(e);
  const m = c[e], n = [\`\${u}/\${m}\`, \`\${u}/\${m}.json\`];
  await Promise.all(n.map((o) => R(o)));
}
async function L() {`,
              );
            fs.writeFileSync(vitsPath, code, 'utf8');
          }
        }
      } catch {}
    },
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    bridgeTtsPlugin(),
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'CNAME'],
      manifest: {
        id: '/',
        name: 'BridgeAAC',
        short_name: 'BridgeAAC',
        description:
          'Free, open-source AAC communication app. Opens TouchChat (.ce) and Open Board (.obf/.obz) vocabulary files.',
        theme_color: '#1d4ed8',
        background_color: '#f4f6fb',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'any',
        start_url: './',
        scope: './',
        categories: ['education', 'medical', 'utilities', 'accessibility'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
        file_handlers: [
          {
            action: './',
            accept: {
              'application/octet-stream': ['.ce', '.c4v', '.wf', '.bridge'],
              'application/zip': ['.obz'],
              'application/json': ['.obf'],
            },
          },
        ],
      } as any,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,woff2,json}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /(^|\.)arasaac\.org$/.test(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'arasaac',
              expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/tts'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tts-audio',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('huggingface.co') ||
              url.hostname.includes('jsdelivr.net') ||
              url.hostname.includes('cdnjs.cloudflare.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'piper-neural-models',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 2500 },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
