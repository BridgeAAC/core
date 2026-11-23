import { signal } from '@preact/signals';
import { settings } from '../settings';
import { getCachedDownloadedNeuralVoices } from '../engine/speech';
import { HttpSyncAdapter } from './HttpSyncAdapter';
import {
  SyncError,
  type DevicePlatform,
  type EnrollmentInfo,
  type Heartbeat,
  type QrEnrollmentPayload,
  type SyncStatus,
  type VoiceEngine,
} from './RemoteSyncAdapter';
import { indexedDbSyncStore, type SyncStore } from './store';

export const syncStatus = signal<SyncStatus>({ state: 'unenrolled' });
export const lastHeartbeatAt = signal<number | null>(null);

const FIRST_HEARTBEAT_DELAY_MS = 5_000;
const RETRY_MIN_MS = 30_000;
const RETRY_MAX_MS = 15 * 60_000;

let adapter: HttpSyncAdapter | null = null;
let activeStore: SyncStore = indexedDbSyncStore;
let timer: ReturnType<typeof setTimeout> | null = null;
let failures = 0;
let onlineListener: (() => void) | null = null;

export function appVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '0.0.0';
}

export function detectPlatform(): DevicePlatform {
  if (typeof navigator === 'undefined') return 'web';
  const w = window as unknown as { Capacitor?: { getPlatform?: () => string } };
  const cap = w.Capacitor?.getPlatform?.();
  const ua = navigator.userAgent;
  const iPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (cap === 'android' || /Android/.test(ua)) return 'android';
  if (cap === 'ios' || /iPhone|iPod/.test(ua) || iPad) return iPad ? 'ipados' : 'ios';
  if (/Electron/.test(ua)) {
    if (/Windows/.test(ua)) return 'windows';
    if (/Mac OS X/.test(ua)) return 'macos';
    return 'linux';
  }
  return 'web';
}

function createAdapter(store: SyncStore): HttpSyncAdapter {
  return new HttpSyncAdapter({ store, platform: detectPlatform(), appVersion: appVersion() });
}

export async function initSync(store: SyncStore = indexedDbSyncStore): Promise<void> {
  activeStore = store;
  const persisted = await store.load();
  if (!persisted) {
    syncStatus.value = { state: 'unenrolled' };
    return;
  }
  adapter = createAdapter(store);
  syncStatus.value = await adapter.status();
  if (syncStatus.value.state === 'enrolled') startHeartbeats(FIRST_HEARTBEAT_DELAY_MS);
}

export async function joinDistrict(payload: QrEnrollmentPayload): Promise<EnrollmentInfo> {
  stopHeartbeats();
  adapter = createAdapter(activeStore);
  const info = await adapter.enroll({ method: 'qr', payload });
  syncStatus.value = await adapter.status();
  startHeartbeats(0);
  return info;
}

export async function leaveDistrict(): Promise<void> {
  stopHeartbeats();
  if (adapter) await adapter.unenroll();
  else await activeStore.clear();
  adapter = null;
  lastHeartbeatAt.value = null;
  syncStatus.value = { state: 'unenrolled' };
}

export function sendHeartbeatNow(): void {
  if (adapter && syncStatus.value.state === 'enrolled') startHeartbeats(0);
}

function startHeartbeats(delayMs: number): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void beat(), delayMs);
  if (!onlineListener && typeof window !== 'undefined') {
    onlineListener = () => sendHeartbeatNow();
    window.addEventListener('online', onlineListener);
  }
}

export function stopHeartbeats(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  failures = 0;
  if (onlineListener && typeof window !== 'undefined') {
    window.removeEventListener('online', onlineListener);
    onlineListener = null;
  }
}

async function beat(): Promise<void> {
  timer = null;
  const a = adapter;
  if (!a) return;
  try {
    const res = await a.heartbeat(await collectHeartbeat());
    failures = 0;
    lastHeartbeatAt.value = Date.now();
    syncStatus.value = await a.status();
    if (res.revoked) {
      stopHeartbeats();
      return;
    }
    startHeartbeats(Math.max(60, res.next_in_s) * 1000);
  } catch (err) {
    syncStatus.value = await a.status();
    if (err instanceof SyncError && !err.retryable) {
      if (syncStatus.value.state !== 'enrolled') {
        stopHeartbeats();
        return;
      }
    }
    failures += 1;
    const backoff = Math.min(RETRY_MAX_MS, RETRY_MIN_MS * 2 ** (failures - 1));
    const hinted = err instanceof SyncError && err.retryAfterS ? err.retryAfterS * 1000 : 0;
    startHeartbeats(Math.max(backoff, hinted));
  }
}

interface BatteryManagerLike {
  level: number;
  charging: boolean;
}

export async function collectHeartbeat(): Promise<Heartbeat> {
  const hb: Heartbeat = {
    app_version: appVersion(),
    platform: detectPlatform(),
    voice: voiceStatus(),
    pending_ops: 0,
  };
  try {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    const b = await nav.getBattery?.();
    if (b) {
      hb.battery_pct = Math.round(b.level * 100);
      hb.charging = b.charging;
    }
  } catch {
    hb.battery_pct = undefined;
  }
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.quota !== undefined && est.usage !== undefined) {
      hb.storage_free_mb = Math.max(0, Math.floor((est.quota - est.usage) / 1_048_576));
    }
  } catch {
    hb.storage_free_mb = undefined;
  }
  return hb;
}

export function voiceStatus(): Heartbeat['voice'] {
  const uri = settings.value.voiceURI;
  let engine: VoiceEngine = 'system';
  let offlineReady = true;
  let voiceId: string | undefined;

  if (uri.startsWith('bridge:piper-')) {
    engine = 'piper';
    voiceId = uri.slice('bridge:piper-'.length);
    const downloaded = getCachedDownloadedNeuralVoices();
    offlineReady = downloaded.includes(voiceId) || downloaded.includes(uri);
  } else if (uri.startsWith('bridge:natural-')) {
    engine = 'online';
    voiceId = uri.slice('bridge:'.length);
    offlineReady = false;
  } else if (uri.includes('mespeak')) {
    engine = 'mespeak';
    voiceId = 'mespeak';
  } else if (uri && typeof speechSynthesis !== 'undefined') {
    const v = speechSynthesis.getVoices().find((x) => x.voiceURI === uri);
    if (v) offlineReady = v.localService;
  }
  const safeId = voiceId?.replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 100);
  return { engine, offline_ready: offlineReady, ...(safeId ? { voice_id: safeId } : {}) };
}
