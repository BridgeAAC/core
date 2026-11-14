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
    expect(await hashSecret('1234')).not.toBe(h); // random salt
    expect(await verifySecret('1234', h)).toBe(true);
    expect(await verifySecret('4321', h)).toBe(false);
  });

  it('still verifies legacy plaintext and unsalted SHA-256 values for migration', async () => {
    expect(await verifySecret('abc', 'abc')).toBe(true);
    const sha =
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'; // sha256("abc")
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
