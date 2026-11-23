import { kvGet, kvSet } from '../store/db';
import type { EnrollmentInfo } from './RemoteSyncAdapter';

export interface PersistedSync {
  info: EnrollmentInfo;
  keys: CryptoKeyPair | null;
  revoked: boolean;
  last_sync_at: number | null;
}

export interface SyncStore {
  load(): Promise<PersistedSync | undefined>;
  save(state: PersistedSync): Promise<void>;
  clear(): Promise<void>;
}

const KEY = 'sync.enrollment';

export const indexedDbSyncStore: SyncStore = {
  load: async () => (await kvGet<PersistedSync | null>(KEY)) ?? undefined,
  save: (state) => kvSet(KEY, state),
  clear: () => kvSet(KEY, null),
};

export function memorySyncStore(initial?: PersistedSync): SyncStore {
  let state = initial;
  return {
    load: async () => state,
    save: async (s) => {
      state = s;
    },
    clear: async () => {
      state = undefined;
    },
  };
}
