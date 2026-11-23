export type TenantId = string;
export type DeviceId = `dev_${string}`;
export type BoardSetId = string;
export type BoardId = string;
export type Sha256Hex = string;

export const DEVICE_ID_RE = /^dev_[0-9a-f]{16}$/;
export const BOARD_ID_RE = /^[A-Za-z0-9_.-]{1,64}$/;
export const SHA256_RE = /^[0-9a-f]{64}$/;

export type HlcString = string;

export const HLC_RE = /^\d{13}-[0-9a-f]{4}-[a-z0-9_]{1,40}$/;

export const HLC_MAX_DRIFT_MS = 5 * 60_000;

export interface HlcParts {
  wall: number;
  counter: number;
  node: string;
}

export function encodeHlc(p: HlcParts): HlcString {
  if (!Number.isSafeInteger(p.wall) || p.wall < 0 || p.wall > 9_999_999_999_999) {
    throw new RangeError('HLC wall clock out of range');
  }
  if (!Number.isInteger(p.counter) || p.counter < 0 || p.counter > 0xffff) {
    throw new RangeError('HLC counter out of range');
  }
  return `${String(p.wall).padStart(13, '0')}-${p.counter.toString(16).padStart(4, '0')}-${p.node}`;
}

export function decodeHlc(s: HlcString): HlcParts {
  if (!HLC_RE.test(s)) throw new SyntaxError(`Malformed HLC: ${s}`);
  return {
    wall: Number(s.slice(0, 13)),
    counter: parseInt(s.slice(14, 18), 16),
    node: s.slice(19),
  };
}

export function compareHlc(a: HlcString, b: HlcString): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class HybridLogicalClock {
  private wall: number;
  private counter: number;

  constructor(
    readonly node: string,
    last?: HlcString | null,
    private readonly now: () => number = Date.now,
  ) {
    if (!/^[a-z0-9_]{1,40}$/.test(node)) throw new SyntaxError('Invalid HLC node id');
    const p = last ? decodeHlc(last) : null;
    this.wall = p ? p.wall : 0;
    this.counter = p ? p.counter : 0;
  }

  tick(): HlcString {
    const pt = this.now();
    if (pt > this.wall) {
      this.wall = pt;
      this.counter = 0;
    } else {
      this.bump();
    }
    return this.current();
  }

  receive(remote: HlcString): HlcString {
    const r = decodeHlc(remote);
    const pt = this.now();
    if (r.wall - pt > HLC_MAX_DRIFT_MS) {
      throw new RangeError(`Remote HLC leads local clock by ${r.wall - pt} ms`);
    }
    const maxWall = Math.max(this.wall, r.wall, pt);
    if (maxWall === this.wall && maxWall === r.wall) {
      this.counter = Math.max(this.counter, r.counter);
      this.bump();
    } else if (maxWall === this.wall) {
      this.bump();
    } else if (maxWall === r.wall) {
      this.wall = r.wall;
      this.counter = r.counter;
      this.bump();
    } else {
      this.wall = pt;
      this.counter = 0;
    }
    return this.current();
  }

  current(): HlcString {
    return encodeHlc({ wall: this.wall, counter: this.counter, node: this.node });
  }

  private bump(): void {
    if (this.counter === 0xffff) {
      this.wall += 1;
      this.counter = 0;
    } else {
      this.counter += 1;
    }
  }
}

export type ElementKey = 'meta' | 'grid' | `button:${string}` | `image:${string}`;

export const ELEMENT_KEY_RE = /^(meta|grid|button:[A-Za-z0-9_.-]{1,64}|image:[A-Za-z0-9_.-]{1,64})$/;

export type ObfExtensions = Record<`ext_${string}`, unknown>;

export interface BoardMetaValue {
  name: string;
  locale?: string;
  description_html?: string;
  background_color?: string;
  hidden?: boolean;
  ext?: ObfExtensions;
}

export interface BoardGridValue {
  rows: number;
  columns: number;
}

export interface ButtonValue {
  label?: string;
  vocalization?: string;
  image_id?: string;
  background_color?: string;
  border_color?: string;
  text_color?: string;
  hidden?: boolean;
  load_board?: { id: BoardId };
  actions?: string[];
  row: number;
  col: number;
  row_span?: number;
  col_span?: number;
  ext?: ObfExtensions;
}

export type ImageValue = {
  content_type: string;
  width?: number;
  height?: number;
  ext?: ObfExtensions;
} & ({ sha256: Sha256Hex; url?: never } | { url: string; sha256?: never });

export type ElementValue = BoardMetaValue | BoardGridValue | ButtonValue | ImageValue;

export interface BoardSetManifest {
  name: string;
  root_board: BoardId;
  locale?: string;
}

export interface ElementOp {
  board: BoardId;
  key: ElementKey;
  hlc: HlcString;
  value: ElementValue | null;
}

export interface ElementState extends ElementOp {
  origin: { kind: 'device'; id: DeviceId } | { kind: 'staff' } | { kind: 'system' };
}

export interface BoardPolicy {
  board: BoardId;
  locked_by_org: boolean;
}

export interface BoardSetPolicy {
  board_set: BoardSetId;
  locked_by_org: boolean;
  manifest: BoardSetManifest;
  manifest_hlc: HlcString;
}

export interface PushRequest {
  batch_id: string;
  board_set: BoardSetId;
  ops: ElementOp[];
}

export type OpResult =
  | { status: 'applied' }
  | { status: 'superseded'; current: ElementState }
  | {
      status: 'rejected';
      reason: 'locked_by_org' | 'clock_drift' | 'invalid' | 'forbidden';
      current: ElementState | null;
    };

export interface PushResponse {
  results: OpResult[];
  server_hlc: HlcString;
}

export interface PullRequest {
  board_set: BoardSetId;
  cursor?: string;
  limit?: number;
}

export interface PullResponse {
  elements: ElementState[];
  boards: BoardPolicy[];
  board_set: BoardSetPolicy | null;
  cursor: string;
  more: boolean;
  reset?: 'reassigned' | 'cursor_expired';
  server_hlc: HlcString;
}

export type DevicePlatform = 'ios' | 'ipados' | 'android' | 'web' | 'windows' | 'macos' | 'linux';

export type VoiceEngine = 'piper' | 'vits' | 'system' | 'mespeak' | 'online';

export interface Heartbeat {
  app_version: string;
  platform: DevicePlatform;
  os_major?: number;
  battery_pct?: number;
  charging?: boolean;
  storage_free_mb?: number;
  voice: {
    engine: VoiceEngine;
    offline_ready: boolean;
    voice_id?: string;
  };
  pending_ops: number;
  clock_skew_ms?: number;
}

export interface HeartbeatResponse {
  next_in_s: number;
  revoked?: boolean;
}

export type EnrollmentSource =
  | { method: 'qr'; payload: QrEnrollmentPayload }
  | { method: 'mdm'; config: MdmEnrollmentConfig };

export interface EnrollmentInfo {
  device_id: DeviceId;
  tenant_id: TenantId;
  tenant_name: string;
  label: string;
  board_set: BoardSetId | null;
  api_base: string;
}

export type SyncStatus =
  | { state: 'unenrolled' }
  | { state: 'enrolled'; info: EnrollmentInfo; last_sync_at: number | null }
  | { state: 'revoked'; tenant_name: string };

export interface RemoteSyncAdapter {
  status(): Promise<SyncStatus>;
  enroll(source: EnrollmentSource): Promise<EnrollmentInfo>;
  push(req: PushRequest): Promise<PushResponse>;
  pull(req: PullRequest): Promise<PullResponse>;
  putBlob(sha256: Sha256Hex, bytes: Uint8Array, contentType: string): Promise<void>;
  getBlob(sha256: Sha256Hex): Promise<{ bytes: Uint8Array; contentType: string }>;
  heartbeat(h: Heartbeat): Promise<HeartbeatResponse>;
  unenroll(): Promise<void>;
}

export type SyncErrorCode =
  | 'not_enrolled'
  | 'revoked'
  | 'offline'
  | 'token_invalid'
  | 'token_expired'
  | 'token_consumed'
  | 'rate_limited'
  | 'server'
  | 'protocol';

export class SyncError extends Error {
  constructor(
    readonly code: SyncErrorCode,
    message?: string,
    readonly retryAfterS?: number,
  ) {
    super(message ?? code);
    this.name = 'SyncError';
  }

  get retryable(): boolean {
    return this.code === 'offline' || this.code === 'rate_limited' || this.code === 'server';
  }
}

export interface QrEnrollmentPayload {
  v: 1;
  api_base: string;
  tenant_id: TenantId;
  token: string;
}

export interface MdmEnrollmentConfig {
  api_base: string;
  tenant_id: TenantId;
  provisioning_token: string;
  label_hint?: string;
}

export const MDM_CONFIG_KEYS = {
  api_base: 'com.bridgeaac.api_base',
  tenant_id: 'com.bridgeaac.tenant_id',
  provisioning_token: 'com.bridgeaac.provisioning_token',
  label_hint: 'com.bridgeaac.label_hint',
} as const;

export function parseEnrollmentQr(raw: string): QrEnrollmentPayload | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'bridgeaac:' || (u.hostname !== 'enroll' && u.pathname.replace(/^\/+/, '') !== 'enroll')) {
    return null;
  }
  const q = u.searchParams;
  if (q.get('v') !== '1') return null;
  const api = q.get('api') ?? '';
  const tenant = q.get('t') ?? '';
  const token = q.get('k') ?? '';
  if (!isAllowedApiBase(api)) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant)) return null;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return { v: 1, api_base: new URL(api).origin, tenant_id: tenant.toLowerCase(), token };
}

export function isAllowedApiBase(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.username || u.password) return false;
    if (u.protocol === 'https:') return true;
    return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

export namespace wire {
  export interface EnrollRequest {
    method: 'qr' | 'mdm';
    tenant_id: TenantId;
    token: string;
    public_key_jwk: { kty: 'EC'; crv: 'P-256'; x: string; y: string };
    platform: DevicePlatform;
    app_version: string;
    label_hint?: string;
  }

  export interface EnrollResponse {
    device_id: DeviceId;
    tenant_name: string;
    label: string;
    board_set: BoardSetId | null;
    access_token: string;
    access_expires_at: number;
    server_hlc: HlcString;
  }

  export interface DeviceTokenRequest {
    assertion: string;
  }

  export interface DeviceTokenResponse {
    access_token: string;
    access_expires_at: number;
    board_set: BoardSetId | null;
  }

  export interface PresignRequest {
    blobs: Array<{
      sha256: Sha256Hex;
      byte_size?: number;
      content_type?: string;
      intent: 'upload' | 'download';
    }>;
  }

  export interface PresignResponse {
    blobs: Array<
      | { sha256: Sha256Hex; status: 'exists' }
      | { sha256: Sha256Hex; status: 'upload'; url: string; headers: Record<string, string>; expires_at: number }
      | { sha256: Sha256Hex; status: 'download'; url: string; expires_at: number }
      | { sha256: Sha256Hex; status: 'not_found' }
    >;
  }

  export interface ErrorBody {
    error: SyncErrorCode | 'invalid_request' | 'forbidden' | 'not_found';
    message?: string;
  }
}

export type RemoteSyncAdapterFactory = (opts: { stored: EnrollmentInfo | null }) => RemoteSyncAdapter;
