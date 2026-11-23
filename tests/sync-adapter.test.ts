import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpSyncAdapter } from '../src/sync/HttpSyncAdapter';
import { SyncError, type QrEnrollmentPayload } from '../src/sync/RemoteSyncAdapter';
import { memorySyncStore, type SyncStore } from '../src/sync/store';
import { initSync, leaveDistrict, syncStatus, voiceStatus, stopHeartbeats } from '../src/sync/runtime';
import { sha256Hex } from '../src/sync/crypto';
import { updateSettings, DEFAULT_SETTINGS } from '../src/settings';

const API = 'https://sync.example.org';
const TENANT = '2f1c8a3e-4b5d-4e6f-8a7b-9c0d1e2f3a4b';
const QR: QrEnrollmentPayload = { v: 1, api_base: API, tenant_id: TENANT, token: 'A'.repeat(43) };

function b64urlDecode(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

class FakeApi {
  publicJwk: JsonWebKey | null = null;
  issued = 0;
  revoked = false;
  rejectNextBearer = false;
  usedJtis = new Set<string>();
  calls: string[] = [];
  heartbeatRevoked = false;

  fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));
    const path = url.pathname;
    this.calls.push(`${init?.method ?? 'GET'} ${path}`);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const auth = (init?.headers as Record<string, string> | undefined)?.authorization;
    const json = (status: number, data: unknown) =>
      new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

    if (path === '/v1/enroll') {
      if (body.token !== QR.token) return json(401, { error: 'token_invalid' });
      this.publicJwk = body.public_key_jwk;
      return json(201, {
        device_id: 'dev_00112233445566aa',
        tenant_name: 'Lincoln USD',
        label: 'Room 104 - Tablet 3',
        board_set: null,
        access_token: this.mint(),
        access_expires_at: Math.floor(Date.now() / 1000) + 900,
        server_hlc: '1795000000000-0000-srv',
      });
    }
    if (path === '/v1/devices/token') {
      const [h, c, sig] = String(body.assertion).split('.');
      const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(c!)));
      const key = await crypto.subtle.importKey('jwk', this.publicJwk!, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      const ok = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        b64urlDecode(sig!) as BufferSource,
        new TextEncoder().encode(`${h}.${c}`),
      );
      if (!ok || claims.aud !== `${API}/v1/devices/token` || claims.tid !== TENANT || this.usedJtis.has(claims.jti)) {
        return json(401, { error: 'token_invalid' });
      }
      if (claims.exp - claims.iat > 60) return json(401, { error: 'token_invalid' });
      this.usedJtis.add(claims.jti);
      if (this.revoked) return json(403, { error: 'revoked' });
      return json(200, { access_token: this.mint(), access_expires_at: Math.floor(Date.now() / 1000) + 900, board_set: null });
    }
    if (!auth?.startsWith('Bearer tok-')) return json(401, { error: 'token_invalid' });
    if (this.rejectNextBearer) {
      this.rejectNextBearer = false;
      return json(401, { error: 'token_invalid' });
    }
    if (path.endsWith('/heartbeat')) {
      return json(200, this.heartbeatRevoked ? { next_in_s: 900, revoked: true } : { next_in_s: 900 });
    }
    if (path === '/v1/blobs/presign') return json(200, { blobs: [{ sha256: body.blobs[0].sha256, status: 'exists' }] });
    return json(404, { error: 'not_found' });
  };

  private mint(): string {
    this.issued += 1;
    return `tok-${this.issued}`;
  }
}

const heartbeat = {
  app_version: '1.0.0',
  platform: 'ipados' as const,
  voice: { engine: 'piper' as const, offline_ready: true },
  pending_ops: 0,
};

describe('HttpSyncAdapter', () => {
  let api: FakeApi;
  let store: SyncStore;
  let now: number;
  let adapter: HttpSyncAdapter;

  beforeEach(() => {
    api = new FakeApi();
    store = memorySyncStore();
    now = Date.now();
    adapter = new HttpSyncAdapter({ store, platform: 'ipados', appVersion: '1.0.0', fetch: api.fetch, now: () => now });
  });

  it('enrolls with a non-extractable device key and sends only the public half', async () => {
    const info = await adapter.enroll({ method: 'qr', payload: QR });
    expect(info).toMatchObject({ device_id: 'dev_00112233445566aa', tenant_name: 'Lincoln USD', api_base: API });
    expect(api.publicJwk).toEqual({ kty: 'EC', crv: 'P-256', x: expect.any(String), y: expect.any(String) });
    expect(api.publicJwk).not.toHaveProperty('d');
    const saved = await store.load();
    expect(saved?.keys?.privateKey.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('jwk', saved!.keys!.privateKey)).rejects.toThrow();
    expect(await adapter.status()).toMatchObject({ state: 'enrolled' });
  });

  it('maps a bad pairing code to token_invalid', async () => {
    await expect(adapter.enroll({ method: 'qr', payload: { ...QR, token: 'B'.repeat(43) } })).rejects.toMatchObject({
      code: 'token_invalid',
    });
    expect(await adapter.status()).toEqual({ state: 'unenrolled' });
  });

  it('refuses insecure server addresses before any request', async () => {
    await expect(adapter.enroll({ method: 'qr', payload: { ...QR, api_base: 'http://evil.example' } })).rejects.toMatchObject({
      code: 'protocol',
    });
    expect(api.calls).toEqual([]);
  });

  it('renews the access token with a signed assertion when it is about to expire', async () => {
    await adapter.enroll({ method: 'qr', payload: QR });
    await adapter.heartbeat(heartbeat);
    expect(api.calls).toEqual(['POST /v1/enroll', 'POST /v1/devices/dev_00112233445566aa/heartbeat']);
    now += 15 * 60_000;
    await adapter.heartbeat(heartbeat);
    expect(api.calls.slice(2)).toEqual(['POST /v1/devices/token', 'POST /v1/devices/dev_00112233445566aa/heartbeat']);
  });

  it('retries once with a fresh token after a 401', async () => {
    await adapter.enroll({ method: 'qr', payload: QR });
    api.rejectNextBearer = true;
    await adapter.heartbeat(heartbeat);
    expect(api.calls.slice(1)).toEqual([
      'POST /v1/devices/dev_00112233445566aa/heartbeat',
      'POST /v1/devices/token',
      'POST /v1/devices/dev_00112233445566aa/heartbeat',
    ]);
  });

  it('wipes credentials but keeps the district name when the district revokes the device', async () => {
    await adapter.enroll({ method: 'qr', payload: QR });
    api.revoked = true;
    now += 15 * 60_000;
    await expect(adapter.heartbeat(heartbeat)).rejects.toMatchObject({ code: 'revoked' });
    expect(await adapter.status()).toEqual({ state: 'revoked', tenant_name: 'Lincoln USD' });
    expect((await store.load())?.keys).toBeNull();
  });

  it('treats a heartbeat reply of revoked: true the same way', async () => {
    await adapter.enroll({ method: 'qr', payload: QR });
    api.heartbeatRevoked = true;
    await adapter.heartbeat(heartbeat);
    expect(await adapter.status()).toMatchObject({ state: 'revoked' });
  });

  it('reports network failures as retryable offline errors', async () => {
    await adapter.enroll({ method: 'qr', payload: QR });
    const offline = new HttpSyncAdapter({
      store,
      platform: 'ipados',
      appVersion: '1.0.0',
      fetch: async () => {
        throw new TypeError('Failed to fetch');
      },
    });
    const err = await offline.heartbeat(heartbeat).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SyncError);
    expect((err as SyncError).code).toBe('offline');
    expect((err as SyncError).retryable).toBe(true);
  });

  it('checks blob bytes against their hash before uploading', async () => {
    await adapter.enroll({ method: 'qr', payload: QR });
    const bytes = new TextEncoder().encode('picture');
    await expect(adapter.putBlob('0'.repeat(64), bytes, 'image/png')).rejects.toMatchObject({ code: 'protocol' });
    await expect(adapter.putBlob(await sha256Hex(bytes), bytes, 'image/png')).resolves.toBeUndefined();
  });

  it('forgets everything on unenroll', async () => {
    await adapter.enroll({ method: 'qr', payload: QR });
    await adapter.unenroll();
    expect(await adapter.status()).toEqual({ state: 'unenrolled' });
    await expect(adapter.heartbeat(heartbeat)).rejects.toMatchObject({ code: 'not_enrolled' });
  });
});

describe('sync runtime', () => {
  afterEach(() => {
    stopHeartbeats();
    vi.restoreAllMocks();
    updateSettings({ voiceURI: DEFAULT_SETTINGS.voiceURI });
  });

  it('makes zero network calls when the device is not enrolled', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    vi.useFakeTimers();
    await initSync(memorySyncStore());
    vi.advanceTimersByTime(60 * 60_000);
    vi.useRealTimers();
    expect(spy).not.toHaveBeenCalled();
    expect(syncStatus.value).toEqual({ state: 'unenrolled' });
  });

  it('leaving a district returns to the unenrolled state', async () => {
    await initSync(memorySyncStore());
    await leaveDistrict();
    expect(syncStatus.value).toEqual({ state: 'unenrolled' });
  });

  it('reports which voice engine is in use and whether it works offline', () => {
    updateSettings({ voiceURI: 'bridge:natural-en' });
    expect(voiceStatus()).toEqual({ engine: 'online', offline_ready: false, voice_id: 'natural-en' });
    updateSettings({ voiceURI: 'bridge:piper-en_US-amy-low' });
    expect(voiceStatus()).toMatchObject({ engine: 'piper', voice_id: 'en_US-amy-low' });
    updateSettings({ voiceURI: '' });
    expect(voiceStatus()).toEqual({ engine: 'system', offline_ready: true });
  });
});
