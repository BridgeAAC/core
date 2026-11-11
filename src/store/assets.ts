import { signal } from '@preact/signals';
import { getAsset, putAssets } from './db';
import type { ImageRef, Vocabulary } from '../model';

export type ResolvedImage = { kind: 'emoji'; text: string } | { kind: 'src'; url: string } | null;

const urlCache = new Map<string, string>();
const pending = new Map<string, Promise<string | undefined>>();
export const assetsVersion = signal(0);

export function arasaacUrl(id: number | string, size: 300 | 500 = 300): string {
  return `https://static.arasaac.org/pictograms/${id}/${id}_${size}.png`;
}

export function loadArasaacUrl(id: number | string): Promise<string | undefined> {
  const key = `arasaac:${id}`;
  const cached = urlCache.get(key);
  if (cached) return Promise.resolve(cached);

  let p = pending.get(key);
  if (!p) {
    p = (async () => {
      try {
        const stored = await getAsset(key);
        if (stored && stored.data) {
          const blob = new Blob([stored.data as BlobPart], { type: stored.mime || 'image/png' });
          const url = URL.createObjectURL(blob);
          urlCache.set(key, url);
          return url;
        }

        if (typeof caches !== 'undefined') {
          try {
            const cache = await caches.open('arasaac');
            const match = await cache.match(arasaacUrl(id));
            if (match) {
              const buf = await match.arrayBuffer();
              const uint8 = new Uint8Array(buf);
              await putAssets([
                {
                  id: key,
                  vocabId: '__arasaac__',
                  kind: 'image',
                  mime: 'image/png',
                  data: uint8,
                },
              ]);
              const blob = new Blob([uint8], { type: 'image/png' });
              const url = URL.createObjectURL(blob);
              urlCache.set(key, url);
              return url;
            }
          } catch {}
        }

        if (typeof fetch !== 'undefined') {
          const remoteUrl = arasaacUrl(id);
          const res = await fetch(remoteUrl);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            const uint8 = new Uint8Array(buf);
            await putAssets([
              {
                id: key,
                vocabId: '__arasaac__',
                kind: 'image',
                mime: 'image/png',
                data: uint8,
              },
            ]);
            if (typeof caches !== 'undefined') {
              try {
                const cache = await caches.open('arasaac');
                await cache.put(
                  remoteUrl,
                  new Response(buf.slice(0), {
                    headers: { 'Content-Type': 'image/png' },
                  }),
                );
              } catch {}
            }
            const blob = new Blob([uint8], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            urlCache.set(key, url);
            return url;
          }
        }
      } catch {}
      return undefined;
    })().finally(() => {
      pending.delete(key);
    });
    pending.set(key, p);
  }
  return p;
}

export function cacheArasaacPictogram(id: number | string): Promise<string | undefined> {
  return loadArasaacUrl(id);
}

export function collectArasaacIds(v: Vocabulary): string[] {
  const ids = new Set<string>();
  for (const p of v.pages) {
    for (const b of p.buttons) {
      if (b.image && b.image.startsWith('arasaac:')) {
        ids.add(b.image.slice(8));
      }
      if (b.variants) {
        for (const variant of Object.values(b.variants)) {
          if (variant?.image && variant.image.startsWith('arasaac:')) {
            ids.add(variant.image.slice(8));
          }
        }
      }
    }
  }
  return Array.from(ids);
}

export async function preloadArasaacForVocabulary(v: Vocabulary): Promise<void> {
  const ids = collectArasaacIds(v);
  if (!ids.length) return;
  const BATCH_SIZE = 8;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(chunk.map((id) => loadArasaacUrl(id)));
  }
}

export function resolveImageSync(ref: ImageRef | undefined): ResolvedImage | 'loading' {
  if (!ref) return null;
  const i = ref.indexOf(':');
  if (i < 0) return null;
  const scheme = ref.slice(0, i);
  const value = ref.slice(i + 1);
  switch (scheme) {
    case 'emoji':
      return { kind: 'emoji', text: value };
    case 'url':
      return { kind: 'src', url: value };
    case 'arasaac': {
      const cached = urlCache.get(`arasaac:${value}`);
      if (cached) return { kind: 'src', url: cached };
      void loadArasaacUrl(value);
      return { kind: 'src', url: arasaacUrl(value) };
    }
    case 'img': {
      const cached = urlCache.get(value);
      return cached ? { kind: 'src', url: cached } : 'loading';
    }
    default:
      return null;
  }
}

export function loadAssetUrl(assetId: string): Promise<string | undefined> {
  const cached = urlCache.get(assetId);
  if (cached) return Promise.resolve(cached);
  let p = pending.get(assetId);
  if (!p) {
    p = getAsset(assetId)
      .then((a) => {
        if (!a) return undefined;
        const blob = new Blob([a.data as BlobPart], { type: a.mime });
        const url = URL.createObjectURL(blob);
        urlCache.set(assetId, url);
        return url;
      })
      .catch(() => undefined)
      .finally(() => pending.delete(assetId));
    pending.set(assetId, p);
  }
  return p;
}

export function forgetAsset(assetId: string): void {
  const u = urlCache.get(assetId);
  if (u) URL.revokeObjectURL(u);
  urlCache.delete(assetId);
  assetsVersion.value++;
}

export function forgetAssetsWithPrefix(prefix: string): void {
  for (const [k, u] of urlCache) {
    if (k.startsWith(prefix)) {
      URL.revokeObjectURL(u);
      urlCache.delete(k);
    }
  }
  assetsVersion.value++;
}

let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;

function cleanupCurrentAudio(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {}
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

export async function playAsset(assetId: string, volume = 1): Promise<void> {
  const a = await getAsset(assetId);
  if (!a) return;
  cleanupCurrentAudio();
  const url = URL.createObjectURL(new Blob([a.data as BlobPart], { type: a.mime }));
  const el = new Audio(url);
  el.volume = Math.max(0, Math.min(1, volume));
  currentAudio = el;
  currentAudioUrl = url;
  el.onended = () => {
    if (currentAudioUrl === url) {
      URL.revokeObjectURL(url);
      currentAudioUrl = null;
      currentAudio = null;
    } else {
      URL.revokeObjectURL(url);
    }
  };
  try {
    await el.play();
  } catch {
    if (currentAudioUrl === url) {
      cleanupCurrentAudio();
    } else {
      URL.revokeObjectURL(url);
    }
  }
}

export function stopAudio(): void {
  cleanupCurrentAudio();
}
