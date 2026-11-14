import { gunzipSync, inflateSync, unzipSync, unzlibSync } from 'fflate';

const MAX_ZIP_ENTRIES = 50_000;
const MAX_ZIP_ENTRY_BYTES = 512 * 1024 * 1024;
const MAX_ZIP_TOTAL_BYTES = 1024 * 1024 * 1024;

export function safeUnzip(
  data: Uint8Array,
  keep?: (lowerName: string) => boolean,
): Record<string, Uint8Array> {
  let count = 0;
  let total = 0;
  return unzipSync(data, {
    filter: (file) => {
      if (++count > MAX_ZIP_ENTRIES) throw new Error('archive has too many files');
      if (keep && !keep(file.name.toLowerCase())) return false;
      if (file.originalSize > MAX_ZIP_ENTRY_BYTES) throw new Error(`${file.name} is too large`);
      total += file.originalSize;
      if (total > MAX_ZIP_TOTAL_BYTES) throw new Error('archive is too large once unpacked');
      return true;
    },
  });
}

export function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'v' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function tick(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function colorrefToHex(v: number): string {
  const n = v & 0xffffff;
  const r = n & 0xff;
  const g = (n >> 8) & 0xff;
  const b = (n >> 16) & 0xff;
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function parseCssColor(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const s = input.trim().toLowerCase();
  if (!s) return undefined;
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m)
    return (
      '#' +
      m[1]
        .split('')
        .map((c) => c + c)
        .join('')
    );
  m = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(s);
  if (m) return '#' + m[1];
  m =
    /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/.exec(
      s,
    );
  if (m) {
    const ch = (x: string) => clamp(Math.round(parseFloat(x)), 0, 255).toString(16).padStart(2, '0');
    return '#' + ch(m[1]) + ch(m[2]) + ch(m[3]);
  }
  return undefined;
}

export type SniffedKind = 'png' | 'jpeg' | 'gif' | 'webp' | 'bmp' | 'svg' | 'wmf' | 'emf';

export interface Sniffed {
  kind: SniffedKind;
  mime: string;
}

const IMAGE_MIME: Record<SniffedKind, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  wmf: 'image/wmf',
  emf: 'image/emf',
};

export function sniffImage(d: Uint8Array): Sniffed | null {
  if (d.length < 4) return null;
  const k = (kind: SniffedKind): Sniffed => ({ kind, mime: IMAGE_MIME[kind] });
  if (d[0] === 0x89 && d[1] === 0x50 && d[2] === 0x4e && d[3] === 0x47) return k('png');
  if (d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff) return k('jpeg');
  if (d[0] === 0x47 && d[1] === 0x49 && d[2] === 0x46 && d[3] === 0x38) return k('gif');
  if (
    d.length > 12 &&
    d[0] === 0x52 &&
    d[1] === 0x49 &&
    d[2] === 0x46 &&
    d[3] === 0x46 &&
    d[8] === 0x57 &&
    d[9] === 0x45 &&
    d[10] === 0x42 &&
    d[11] === 0x50
  ) {
    return k('webp');
  }
  if (d[0] === 0xd7 && d[1] === 0xcd && d[2] === 0xc6 && d[3] === 0x9a) return k('wmf');
  if ((d[0] === 1 || d[0] === 2) && d[1] === 0 && d[2] === 9 && d[3] === 0) return k('wmf');
  if (
    d.length > 44 &&
    d[0] === 1 &&
    d[1] === 0 &&
    d[2] === 0 &&
    d[3] === 0 &&
    d[40] === 0x20 &&
    d[41] === 0x45 &&
    d[42] === 0x4d &&
    d[43] === 0x46
  ) {
    return k('emf');
  }
  if (d[0] === 0x42 && d[1] === 0x4d && d.length > 30) return k('bmp');
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(d.subarray(0, Math.min(d.length, 600)))
    .trimStart();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return k('svg');
  }
  return null;
}

export interface SoundSniffed {
  mime: string;
}

export function sniffSound(d: Uint8Array): SoundSniffed {
  const s4 = (o: number) =>
    String.fromCharCode(d[o] ?? 0, d[o + 1] ?? 0, d[o + 2] ?? 0, d[o + 3] ?? 0);
  if (s4(0) === 'RIFF') return { mime: 'audio/wav' };
  if (s4(0) === 'OggS') return { mime: 'audio/ogg' };
  if (s4(0) === 'fLaC') return { mime: 'audio/flac' };
  if (s4(4) === 'ftyp') return { mime: 'audio/mp4' };
  if (s4(0).startsWith('ID3') || (d[0] === 0xff && ((d[1] ?? 0) & 0xe0) === 0xe0)) {
    return { mime: 'audio/mpeg' };
  }
  return { mime: 'audio/wav' };
}

export function decodeImagePayload(
  raw: Uint8Array,
  compressedFlag: boolean,
): { data: Uint8Array; sniff: Sniffed } | null {
  const attempts: Array<() => Uint8Array> = [];
  if (!compressedFlag) attempts.push(() => raw);
  attempts.push(
    () => unzlibSync(raw),
    () => unzlibSync(raw.subarray(4)),
    () => inflateSync(raw),
    () => inflateSync(raw.subarray(4)),
    () => gunzipSync(raw),
  );
  if (compressedFlag) attempts.push(() => raw);
  for (const attempt of attempts) {
    try {
      const out = attempt();
      const sniff = sniffImage(out);
      if (sniff) return { data: out, sniff };
    } catch {}
  }
  return null;
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s+/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64(d: Uint8Array): string {
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < d.length; i += CH) s += String.fromCharCode(...d.subarray(i, i + CH));
  return btoa(s);
}

export function parseDataUrl(url: string): { mime: string; data: Uint8Array } | null {
  const m = /^data:([^;,]*)((?:;[^;,]*)*?),(.*)$/s.exec(url);
  if (!m) return null;
  const mime = m[1] || 'application/octet-stream';
  try {
    if (/;base64/i.test(m[2])) return { mime, data: base64ToBytes(m[3]) };
    return { mime, data: new TextEncoder().encode(decodeURIComponent(m[3])) };
  } catch {
    return null;
  }
}

export function extForMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('png')) return 'png';
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  if (m.includes('gif')) return 'gif';
  if (m.includes('svg')) return 'svg';
  if (m.includes('webp')) return 'webp';
  if (m.includes('bmp')) return 'bmp';
  if (m.includes('wav')) return 'wav';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('mp4') || m.includes('m4a')) return 'm4a';
  return 'bin';
}

export function mimeForExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    bmp: 'image/bmp',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
  };
  return map[ext] ?? 'application/octet-stream';
}

export function isZip(d: Uint8Array): boolean {
  return (
    d.length > 4 &&
    d[0] === 0x50 &&
    d[1] === 0x4b &&
    (d[2] === 3 || d[2] === 5) &&
    (d[3] === 4 || d[3] === 6)
  );
}
