import {
  SyncError,
  isAllowedApiBase,
  type EnrollmentInfo,
  type EnrollmentSource,
  type Heartbeat,
  type HeartbeatResponse,
  type PullRequest,
  type PullResponse,
  type PushRequest,
  type PushResponse,
  type RemoteSyncAdapter,
  type Sha256Hex,
  type SyncStatus,
  type DevicePlatform,
  type wire,
} from './RemoteSyncAdapter';
import { exportPublicJwk, generateDeviceKey, randomUuid, sha256Hex, signJws } from './crypto';
import type { PersistedSync, SyncStore } from './store';

export interface HttpSyncAdapterOptions {
  store: SyncStore;
  platform: DevicePlatform;
  appVersion: string;
  fetch?: typeof fetch;
  now?: () => number;
}

interface AccessToken {
  token: string;
  expiresAt: number;
}

const RENEW_MARGIN_MS = 60_000;

export class HttpSyncAdapter implements RemoteSyncAdapter {
  private readonly store: SyncStore;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private access: AccessToken | null = null;
  private renewing: Promise<AccessToken> | null = null;

  constructor(private readonly opts: HttpSyncAdapterOptions) {
    this.store = opts.store;
    this.fetchImpl = opts.fetch ?? ((input, init) => fetch(input, init));
    this.now = opts.now ?? Date.now;
  }

  async status(): Promise<SyncStatus> {
    const s = await this.store.load();
    if (!s) return { state: 'unenrolled' };
    if (s.revoked) return { state: 'revoked', tenant_name: s.info.tenant_name };
    return { state: 'enrolled', info: s.info, last_sync_at: s.last_sync_at };
  }

  async enroll(source: EnrollmentSource): Promise<EnrollmentInfo> {
    const target =
      source.method === 'qr'
        ? { api: source.payload.api_base, tenant: source.payload.tenant_id, token: source.payload.token, hint: undefined }
        : {
            api: source.config.api_base,
            tenant: source.config.tenant_id,
            token: source.config.provisioning_token,
            hint: source.config.label_hint,
          };
    if (!isAllowedApiBase(target.api)) throw new SyncError('protocol', 'The district server address is not secure.');
    const api = new URL(target.api).origin;

    const keys = await generateDeviceKey();
    const body: wire.EnrollRequest = {
      method: source.method,
      tenant_id: target.tenant,
      token: target.token,
      public_key_jwk: await exportPublicJwk(keys),
      platform: this.opts.platform,
      app_version: this.opts.appVersion,
      ...(target.hint ? { label_hint: target.hint } : {}),
    };
    const res = await this.request<wire.EnrollResponse>(`${api}/v1/enroll`, { method: 'POST', body });

    const info: EnrollmentInfo = {
      device_id: res.device_id,
      tenant_id: target.tenant,
      tenant_name: res.tenant_name,
      label: res.label,
      board_set: res.board_set,
      api_base: api,
    };
    await this.store.save({ info, keys, revoked: false, last_sync_at: null });
    this.access = { token: res.access_token, expiresAt: res.access_expires_at * 1000 };
    return info;
  }

  async push(req: PushRequest): Promise<PushResponse> {
    const res = await this.authed<PushResponse>('/v1/sync/push', { method: 'POST', body: req });
    await this.markSynced();
    return res;
  }

  async pull(req: PullRequest): Promise<PullResponse> {
    const q = new URLSearchParams({ board_set: req.board_set });
    if (req.cursor) q.set('cursor', req.cursor);
    if (req.limit) q.set('limit', String(req.limit));
    const res = await this.authed<PullResponse>(`/v1/sync/pull?${q}`, { method: 'GET' });
    await this.markSynced();
    return res;
  }

  async putBlob(sha256: Sha256Hex, bytes: Uint8Array, contentType: string): Promise<void> {
    if ((await sha256Hex(bytes)) !== sha256) throw new SyncError('protocol', 'Blob bytes do not match their hash.');
    const res = await this.authed<wire.PresignResponse>('/v1/blobs/presign', {
      method: 'POST',
      body: { blobs: [{ sha256, byte_size: bytes.length, content_type: contentType, intent: 'upload' }] },
    });
    const item = res.blobs[0];
    if (!item) throw new SyncError('protocol');
    if (item.status === 'exists') return;
    if (item.status !== 'upload') throw new SyncError('protocol', `Unexpected presign status ${item.status}`);
    const put = await this.raw(item.url, { method: 'PUT', headers: item.headers, body: bytes as BodyInit });
    if (!put.ok) throw this.httpError(put.status, null);
  }

  async getBlob(sha256: Sha256Hex): Promise<{ bytes: Uint8Array; contentType: string }> {
    const res = await this.authed<wire.PresignResponse>('/v1/blobs/presign', {
      method: 'POST',
      body: { blobs: [{ sha256, intent: 'download' }] },
    });
    const item = res.blobs[0];
    if (!item || item.status !== 'download') throw new SyncError('protocol', 'Blob not available');
    const got = await this.raw(item.url, { method: 'GET' });
    if (!got.ok) throw this.httpError(got.status, null);
    const bytes = new Uint8Array(await got.arrayBuffer());
    if ((await sha256Hex(bytes)) !== sha256) throw new SyncError('protocol', 'Downloaded blob failed its hash check.');
    return { bytes, contentType: got.headers.get('content-type') ?? 'application/octet-stream' };
  }

  async heartbeat(h: Heartbeat): Promise<HeartbeatResponse> {
    const s = await this.requireEnrolled();
    const res = await this.authed<HeartbeatResponse>(`/v1/devices/${s.info.device_id}/heartbeat`, {
      method: 'POST',
      body: h,
    });
    if (res.revoked) await this.markRevoked();
    return res;
  }

  async unenroll(): Promise<void> {
    this.access = null;
    await this.store.clear();
  }

  private async requireEnrolled(): Promise<PersistedSync> {
    const s = await this.store.load();
    if (!s) throw new SyncError('not_enrolled');
    if (s.revoked || !s.keys) throw new SyncError('revoked');
    return s;
  }

  private async markSynced(): Promise<void> {
    const s = await this.store.load();
    if (s && !s.revoked) await this.store.save({ ...s, last_sync_at: this.now() });
  }

  private async markRevoked(): Promise<void> {
    this.access = null;
    const s = await this.store.load();
    if (s) await this.store.save({ ...s, keys: null, revoked: true });
  }

  private async token(force = false): Promise<string> {
    if (!force && this.access && this.access.expiresAt - this.now() > RENEW_MARGIN_MS) return this.access.token;
    if (!this.renewing) {
      this.renewing = this.renew().finally(() => {
        this.renewing = null;
      });
    }
    return (await this.renewing).token;
  }

  private async renew(): Promise<AccessToken> {
    const s = await this.requireEnrolled();
    const iat = Math.floor(this.now() / 1000);
    const assertion = await signJws(
      s.keys!.privateKey,
      { alg: 'ES256', kid: s.info.device_id, typ: 'JWT' },
      {
        iss: s.info.device_id,
        sub: s.info.device_id,
        tid: s.info.tenant_id,
        aud: `${s.info.api_base}/v1/devices/token`,
        iat,
        exp: iat + 60,
        jti: randomUuid(),
      },
    );
    try {
      const res = await this.request<wire.DeviceTokenResponse>(`${s.info.api_base}/v1/devices/token`, {
        method: 'POST',
        body: { assertion },
      });
      if (res.board_set !== s.info.board_set) {
        await this.store.save({ ...s, info: { ...s.info, board_set: res.board_set } });
      }
      this.access = { token: res.access_token, expiresAt: res.access_expires_at * 1000 };
      return this.access;
    } catch (err) {
      if (err instanceof SyncError && err.code === 'revoked') await this.markRevoked();
      throw err;
    }
  }

  private async authed<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
    const s = await this.requireEnrolled();
    const url = `${s.info.api_base}${path}`;
    try {
      return await this.request<T>(url, init, await this.token());
    } catch (err) {
      if (err instanceof SyncError && err.code === 'token_invalid') {
        return this.request<T>(url, init, await this.token(true));
      }
      if (err instanceof SyncError && err.code === 'revoked') await this.markRevoked();
      throw err;
    }
  }

  private async request<T>(url: string, init: { method: string; body?: unknown }, bearer?: string): Promise<T> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (init.body !== undefined) headers['content-type'] = 'application/json';
    if (bearer) headers.authorization = `Bearer ${bearer}`;
    const res = await this.raw(url, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const data = (await res.json().catch(() => null)) as (wire.ErrorBody & Record<string, unknown>) | null;
    if (!res.ok) throw this.httpError(res.status, data, res.headers.get('retry-after'));
    return data as T;
  }

  private async raw(url: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetchImpl(url, { ...init, credentials: 'omit', cache: 'no-store', redirect: 'error' });
    } catch {
      throw new SyncError('offline', 'The district server could not be reached.');
    }
  }

  private httpError(status: number, body: wire.ErrorBody | null, retryAfter?: string | null): SyncError {
    const code = body?.error;
    if (status === 429) return new SyncError('rate_limited', body?.message, Number(retryAfter) || 60);
    if (status >= 500) return new SyncError('server', body?.message);
    if (code === 'revoked') return new SyncError('revoked', body?.message);
    if (status === 401) {
      if (code === 'token_expired' || code === 'token_consumed') return new SyncError(code, body?.message);
      return new SyncError('token_invalid', body?.message);
    }
    return new SyncError('protocol', body?.message ?? `HTTP ${status}`);
  }
}
