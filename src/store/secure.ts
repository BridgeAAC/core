export const PBKDF2_ITERATIONS = 310_000;
const HASH_PREFIX = 'pbkdf2-sha256';

function subtle(): SubtleCrypto | undefined {
  try {
    return typeof crypto !== 'undefined' && crypto.subtle ? crypto.subtle : undefined;
  } catch {
    return undefined;
  }
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

export function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function pbkdf2Bits(secret: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const sc = subtle();
  if (!sc) throw new Error('Web Crypto is unavailable in this browser.');
  const base = await sc.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await sc.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    base,
    256,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function isHashedSecret(stored: string | undefined | null): boolean {
  return typeof stored === 'string' && stored.startsWith(HASH_PREFIX + '$');
}

export async function hashSecret(secret: string): Promise<string> {
  if (!secret) return '';
  const salt = randomBytes(16);
  const hash = await pbkdf2Bits(secret, salt, PBKDF2_ITERATIONS);
  return `${HASH_PREFIX}$${PBKDF2_ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(hash)}`;
}

async function legacySha256Hex(secret: string): Promise<string> {
  const sc = subtle();
  if (!sc) return '';
  const buf = await sc.digest('SHA-256', new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifySecret(entered: string, stored: string | undefined | null): Promise<boolean> {
  if (!stored) return false;
  if (isHashedSecret(stored)) {
    const parts = stored.split('$');
    if (parts.length !== 4) return false;
    const iterations = Number(parts[1]);
    if (!Number.isFinite(iterations) || iterations < 1) return false;
    try {
      const salt = b64ToBytes(parts[2]);
      const expected = b64ToBytes(parts[3]);
      const actual = await pbkdf2Bits(entered, salt, iterations);
      return constantTimeEqual(actual, expected);
    } catch {
      return false;
    }
  }
  if (/^[0-9a-f]{64}$/.test(stored)) {
    try {
      if ((await legacySha256Hex(entered)) === stored) return true;
    } catch {}
  }
  return entered === stored;
}

export interface EncryptedEnvelope {
  v: 1;
  alg: 'AES-GCM';
  kdf: 'PBKDF2-SHA256';
  iter: number;
  salt: string;
  iv: string;
  ct: string;
}

export function isEncryptedEnvelope(x: unknown): x is EncryptedEnvelope {
  return (
    !!x &&
    typeof x === 'object' &&
    (x as EncryptedEnvelope).v === 1 &&
    (x as EncryptedEnvelope).alg === 'AES-GCM' &&
    typeof (x as EncryptedEnvelope).ct === 'string'
  );
}

export interface DerivedKey {
  key: CryptoKey;
  salt: Uint8Array;
  iter: number;
}

export async function deriveEncryptionKey(
  passcode: string,
  salt: Uint8Array = randomBytes(16),
  iter = PBKDF2_ITERATIONS,
): Promise<DerivedKey> {
  const sc = subtle();
  if (!sc) throw new Error('Web Crypto is unavailable in this browser.');
  const base = await sc.importKey('raw', new TextEncoder().encode(passcode), 'PBKDF2', false, [
    'deriveKey',
  ]);
  const key = await sc.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: iter },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  return { key, salt, iter };
}

export async function encryptJson(value: unknown, dk: DerivedKey): Promise<EncryptedEnvelope> {
  const sc = subtle();
  if (!sc) throw new Error('Web Crypto is unavailable in this browser.');
  const iv = randomBytes(12);
  const pt = new TextEncoder().encode(JSON.stringify(value));
  const ct = await sc.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, dk.key, pt);
  return {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2-SHA256',
    iter: dk.iter,
    salt: bytesToB64(dk.salt),
    iv: bytesToB64(iv),
    ct: bytesToB64(new Uint8Array(ct)),
  };
}

export async function decryptJsonWithPasscode<T>(
  env: EncryptedEnvelope,
  passcode: string,
): Promise<{ value: T; dk: DerivedKey } | null> {
  const sc = subtle();
  if (!sc) return null;
  try {
    const dk = await deriveEncryptionKey(passcode, b64ToBytes(env.salt), env.iter);
    const pt = await sc.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(env.iv) as BufferSource },
      dk.key,
      b64ToBytes(env.ct) as BufferSource,
    );
    return { value: JSON.parse(new TextDecoder().decode(pt)) as T, dk };
  } catch {
    return null;
  }
}

const failedAttempts = new Map<string, { count: number; until: number }>();

export function lockoutSeconds(key: string): number {
  const f = failedAttempts.get(key);
  if (!f || f.until <= Date.now()) return 0;
  return Math.ceil((f.until - Date.now()) / 1000);
}

export function recordFailedAttempt(key: string): number {
  const f = failedAttempts.get(key) ?? { count: 0, until: 0 };
  f.count++;
  if (f.count >= 5) {
    f.until = Date.now() + Math.min(300, 30 * 2 ** (f.count - 5)) * 1000;
  }
  failedAttempts.set(key, f);
  return lockoutSeconds(key);
}

export function clearFailedAttempts(key: string): void {
  failedAttempts.delete(key);
}
