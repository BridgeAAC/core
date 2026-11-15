import type { AssetBlob, Vocabulary } from '../model';
import { ensureButtonImage, getSvgPictogram } from '../data/icons';

const SIZE = 300;

export async function rasterizeSvg(markup: string, size = SIZE): Promise<Uint8Array | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const sized = markup.replace('width="100%" height="100%"', `width="${size}" height="${size}"`);
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    const ok = await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 3000);
      img.onload = () => {
        clearTimeout(timer);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
      img.src = url;
    });
    if (!ok) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function embedBuiltInPictures(
  vocab: Vocabulary,
  assetsById: Map<string, AssetBlob>,
): Promise<{ vocab: Vocabulary; assetsById: Map<string, AssetBlob>; embedded: number }> {
  const copy: Vocabulary = JSON.parse(JSON.stringify(vocab));
  const assets = new Map(assetsById);
  const done = new Map<string, string | null>();
  let embedded = 0;
  for (const page of copy.pages) {
    for (const b of page.buttons) {
      const ref = ensureButtonImage(b);
      if (!ref || !ref.startsWith('svg:')) continue;
      if (!done.has(ref)) {
        const markup = getSvgPictogram(ref.slice(4));
        const png = markup ? await rasterizeSvg(markup) : null;
        if (png) {
          const id = `${vocab.id}:builtin:${ref.slice(4)}`;
          assets.set(id, { id, vocabId: vocab.id, kind: 'image', mime: 'image/png', data: png });
          done.set(ref, id);
        } else {
          done.set(ref, null);
        }
      }
      const id = done.get(ref);
      if (id) {
        b.image = `img:${id}`;
        embedded++;
      }
    }
  }
  return { vocab: copy, assetsById: assets, embedded };
}
