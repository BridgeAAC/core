interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<{ rawValue: string }[]>;
}

interface BarcodeDetectorCtor {
  new (opts: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

const MAX_SIDE = 1600;
const NATIVE_TIMEOUT_MS = 1500;

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

async function loadBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function toImageData(bitmap: ImageBitmap): ImageData {
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is unavailable');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

async function detectNative(bitmap: ImageBitmap): Promise<string | null> {
  const Ctor = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const formats = await withTimeout(Ctor.getSupportedFormats?.() ?? Promise.resolve(['qr_code']), NATIVE_TIMEOUT_MS, []);
    if (!formats.includes('qr_code')) return null;
    const found = await withTimeout(new Ctor({ formats: ['qr_code'] }).detect(bitmap), NATIVE_TIMEOUT_MS, []);
    return found[0]?.rawValue ?? null;
  } catch {
    return null;
  }
}

export async function decodeQrImage(file: Blob): Promise<string | null> {
  const bitmap = await loadBitmap(file);
  try {
    const native = await detectNative(bitmap);
    if (native) return native;
    const data = toImageData(bitmap);
    const { default: jsQR } = await import('jsqr');
    const result = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' });
    return result?.data ?? null;
  } finally {
    bitmap.close();
  }
}
