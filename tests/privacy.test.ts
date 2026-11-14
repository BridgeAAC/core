import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  decryptJsonWithPasscode,
  deriveEncryptionKey,
  encryptJson,
  hashSecret,
  isHashedSecret,
  verifySecret,
} from '../src/store/secure';
import { precacheVocabularyAudio, setOnlineSpeechAllowed } from '../src/engine/speech';
import { fetchArasaacIdOnline } from '../src/data/arasaac';
import { DEFAULT_SETTINGS, settings, updateSettings } from '../src/settings';
import { createBlankVocabulary } from '../src/data/starter';

describe('PIN hashing', () => {
  it('stores a salted hash, never the plaintext', async () => {
    const h = await hashSecret('1234');
    expect(isHashedSecret(h)).toBe(true);
    expect(h).not.toContain('1234');
    expect(await hashSecret('1234')).not.toBe(h);
    expect(await verifySecret('1234', h)).toBe(true);
    expect(await verifySecret('4321', h)).toBe(false);
  });

  it('still verifies legacy plaintext and unsalted SHA-256 values for migration', async () => {
    expect(await verifySecret('abc', 'abc')).toBe(true);
    const sha =
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    expect(await verifySecret('abc', sha)).toBe(true);
    expect(await verifySecret('abd', sha)).toBe(false);
  });

  it('defaults online features to off', () => {
    expect(DEFAULT_SETTINGS.onlineSpeech).toBe(false);
    expect(DEFAULT_SETTINGS.onlineSymbolSearch).toBe(false);
  });
});

describe('caregiver notes encryption', () => {
  it('round-trips with the right passcode and rejects the wrong one', async () => {
    const key = await deriveEncryptionKey('correct horse');
    const env = await encryptJson([{ text: 'private observation' }], key);
    expect(JSON.stringify(env)).not.toContain('private observation');
    const ok = await decryptJsonWithPasscode<{ text: string }[]>(env, 'correct horse');
    expect(ok?.value[0].text).toBe('private observation');
    expect(await decryptJsonWithPasscode(env, 'wrong')).toBeNull();
  });

  it('detects tampering', async () => {
    const key = await deriveEncryptionKey('pw');
    const env = await encryptJson({ a: 1 }, key);
    const bytes = atob(env.ct).split('');
    bytes[0] = String.fromCharCode(bytes[0].charCodeAt(0) ^ 1);
    expect(await decryptJsonWithPasscode({ ...env, ct: btoa(bytes.join('')) }, 'pw')).toBeNull();
  });
});

describe('network privacy gates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setOnlineSpeechAllowed(false);
    updateSettings({ onlineSymbolSearch: false });
  });

  it('never calls /api/tts while online speech is off', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    setOnlineSpeechAllowed(false);
    const v = createBlankVocabulary('Test', 2, 2, 'en');
    v.pages[0].buttons.push({ ...v.pages[0].buttons[0], id: 'b-x', label: 'secret phrase' } as any);
    await precacheVocabularyAudio(v, 'en-US');
    const ttsCalls = fetchSpy.mock.calls.filter(([u]) => String(u).includes('/api/tts'));
    expect(ttsCalls).toHaveLength(0);
  });

  it('never queries api.arasaac.org while online symbol search is off', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'));
    expect(settings.value.onlineSymbolSearch).toBe(false);
    expect(await fetchArasaacIdOnline('zzqx-unmapped-word')).toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('import and input hardening', () => {
  it('rejects archives that claim to unpack too large', async () => {
    const { zipSync } = await import('fflate');
    const { safeUnzip } = await import('../src/io/util');
    const zip = zipSync({ 'a.txt': new Uint8Array(10) }, { level: 0 });
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    for (let i = zip.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x02014b50) {
        view.setUint32(i + 24, 600 * 1024 * 1024, true);
        break;
      }
    }
    expect(() => safeUnzip(zip)).toThrow(/too large/);
    expect(Object.keys(safeUnzip(zipSync({ 'ok.txt': new Uint8Array(4) })))).toEqual(['ok.txt']);
  });

  it('locks out after repeated wrong PINs', async () => {
    const { recordFailedAttempt, lockoutSeconds, clearFailedAttempts } = await import(
      '../src/store/secure'
    );
    for (let i = 0; i < 4; i++) expect(recordFailedAttempt('t')).toBe(0);
    expect(recordFailedAttempt('t')).toBeGreaterThanOrEqual(29);
    expect(lockoutSeconds('t')).toBeGreaterThan(0);
    clearFailedAttempts('t');
    expect(lockoutSeconds('t')).toBe(0);
  });

  it('only accepts http(s) voice server addresses', async () => {
    const { isValidMirrorUrl } = await import('../src/engine/speech');
    expect(isValidMirrorUrl('https://voices.example.org/piper')).toBe(true);
    expect(isValidMirrorUrl('javascript:alert(1)')).toBe(false);
    expect(isValidMirrorUrl('file:///etc/passwd')).toBe(false);
    expect(isValidMirrorUrl('voices.example.org')).toBe(false);
  });
});
