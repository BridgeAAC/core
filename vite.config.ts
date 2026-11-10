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
    async buildStart() {
      try {
        const modPath = './scripts/patch-deps.mjs';
        await import(/* @vite-ignore */ modPath);
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
  define: {
    'import.meta.env.VITE_GITHUB_REPO': JSON.stringify(
      process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPOSITORY || 'bridgeaac/core',
    ),
  },
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
        navigateFallbackDenylist: [/^\/api\//],
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
              cacheableResponse: { statuses: [200] },
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
