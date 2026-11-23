export interface PublicP256Jwk {
  kty: 'EC';
  crv: 'P-256';
  x: string;
  y: string;
}

function subtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) throw new Error('Web Crypto is unavailable');
  return crypto.subtle;
}

export function base64url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlJson(value: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(value)));
}

export async function generateDeviceKey(): Promise<CryptoKeyPair> {
  return subtle().generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
}

export async function exportPublicJwk(pair: CryptoKeyPair): Promise<PublicP256Jwk> {
  const jwk = await subtle().exportKey('jwk', pair.publicKey);
  if (!jwk.x || !jwk.y) throw new Error('Could not export the device public key');
  return { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
}

export async function signJws(
  privateKey: CryptoKey,
  header: Record<string, unknown>,
  claims: Record<string, unknown>,
): Promise<string> {
  const input = `${base64urlJson(header)}.${base64urlJson(claims)}`;
  const signature = await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, new TextEncoder().encode(input));
  return `${input}.${base64url(new Uint8Array(signature))}`;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await subtle().digest('SHA-256', bytes as BufferSource));
  let out = '';
  for (let i = 0; i < digest.length; i++) out += digest[i].toString(16).padStart(2, '0');
  return out;
}

export function randomUuid(): string {
  return crypto.randomUUID();
}
