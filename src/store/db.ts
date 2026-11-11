import type { AssetBlob, Vocabulary } from '../model';

const DB_NAME = 'bridgeaac';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('vocabs')) db.createObjectStore('vocabs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('assets')) {
        const s = db.createObjectStore('assets', { keyPath: 'id' });
        s.createIndex('vocabId', 'vocabId', { unique: false });
      }
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('tts_cache')) {
        db.createObjectStore('tts_cache', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Could not open the local database'));
    req.onblocked = () =>
      reject(
        new Error('The local database is blocked by another tab. Close other BridgeAAC tabs and reload.'),
      );
  });
  return dbPromise;
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'));
  });
}

export interface VocabSummary {
  id: string;
  name: string;
  description?: string;
  kind: Vocabulary['source']['kind'];
  filename?: string;
  pages: number;
  buttons: number;
  updatedAt: number;
  createdAt: number;
}

export function summarize(v: Vocabulary): VocabSummary {
  let buttons = 0;
  for (const p of v.pages) buttons += p.buttons.length;
  return {
    id: v.id,
    name: v.name,
    description: v.description,
    kind: v.source.kind,
    filename: v.source.filename,
    pages: v.pages.length,
    buttons,
    updatedAt: v.updatedAt,
    createdAt: v.createdAt,
  };
}

export async function listVocabs(): Promise<VocabSummary[]> {
  const db = await openDb();
  const all = (await wrap(db.transaction('vocabs').objectStore('vocabs').getAll())) as Vocabulary[];
  return all.map(summarize).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadVocab(id: string): Promise<Vocabulary | undefined> {
  const db = await openDb();
  return wrap(db.transaction('vocabs').objectStore('vocabs').get(id)) as Promise<
    Vocabulary | undefined
  >;
}

export async function saveVocab(v: Vocabulary): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('vocabs', 'readwrite');
  tx.objectStore('vocabs').put(v);
  await txDone(tx);
}

export async function deleteVocab(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(['vocabs', 'assets'], 'readwrite');
  tx.objectStore('vocabs').delete(id);
  const idx = tx.objectStore('assets').index('vocabId');
  const keys = await wrap(idx.getAllKeys(id));
  for (const k of keys) tx.objectStore('assets').delete(k);
  await txDone(tx);
}

export async function putAssets(assets: AssetBlob[]): Promise<void> {
  if (!assets.length) return;
  const db = await openDb();
  const CHUNK = 200;
  for (let i = 0; i < assets.length; i += CHUNK) {
    const tx = db.transaction('assets', 'readwrite');
    const store = tx.objectStore('assets');
    for (const a of assets.slice(i, i + CHUNK)) store.put(a);
    await txDone(tx);
  }
}

export async function getAsset(id: string): Promise<AssetBlob | undefined> {
  const db = await openDb();
  return wrap(db.transaction('assets').objectStore('assets').get(id)) as Promise<
    AssetBlob | undefined
  >;
}

export async function getAssetsForVocab(vocabId: string): Promise<AssetBlob[]> {
  const db = await openDb();
  return wrap(
    db.transaction('assets').objectStore('assets').index('vocabId').getAll(vocabId),
  ) as Promise<AssetBlob[]>;
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('assets', 'readwrite');
  tx.objectStore('assets').delete(id);
  await txDone(tx);
}

const memKv = new Map<string, unknown>();

export async function kvGet<T>(key: string): Promise<T | undefined> {
  try {
    if (typeof indexedDB !== 'undefined') {
      const db = await openDb();
      const val = (await wrap(db.transaction('kv').objectStore('kv').get(key))) as T | undefined;
      if (val !== undefined) return val;
    }
  } catch {}
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`bridgeaac.kv.${key}`);
      if (raw !== null) return JSON.parse(raw) as T;
    }
  } catch {}
  return memKv.get(key) as T | undefined;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  memKv.set(key, value);
  const isSensitive = /pass(word|code)|secret|token|credential|pin/i.test(key);
  if (!isSensitive) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`bridgeaac.kv.${key}`, JSON.stringify(value));
      }
    } catch {}
  }
  try {
    if (typeof indexedDB !== 'undefined') {
      const db = await openDb();
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(value, key);
      await txDone(tx);
    }
  } catch {}
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {}
  return false;
}

export interface TtsCacheRecord {
  key: string;
  data: ArrayBuffer;
  updatedAt: number;
}

export async function ttsCacheGet(key: string): Promise<ArrayBuffer | undefined> {
  try {
    if (typeof indexedDB === 'undefined') return undefined;
    const db = await openDb();
    if (!db.objectStoreNames.contains('tts_cache')) return undefined;
    const rec = (await wrap(
      db.transaction('tts_cache').objectStore('tts_cache').get(key),
    )) as TtsCacheRecord | undefined;
    return rec?.data;
  } catch {
    return undefined;
  }
}

export async function ttsCachePut(key: string, data: ArrayBuffer): Promise<void> {
  try {
    if (typeof indexedDB === 'undefined') return;
    const db = await openDb();
    if (!db.objectStoreNames.contains('tts_cache')) return;
    const tx = db.transaction('tts_cache', 'readwrite');
    tx.objectStore('tts_cache').put({ key, data, updatedAt: Date.now() } satisfies TtsCacheRecord);
    await txDone(tx);
  } catch {}
}

export async function ttsCacheCount(): Promise<number> {
  try {
    if (typeof indexedDB === 'undefined') return 0;
    const db = await openDb();
    if (!db.objectStoreNames.contains('tts_cache')) return 0;
    return await wrap(db.transaction('tts_cache').objectStore('tts_cache').count());
  } catch {
    return 0;
  }
}

export async function ttsCacheClear(): Promise<void> {
  try {
    if (typeof indexedDB === 'undefined') return;
    const db = await openDb();
    if (!db.objectStoreNames.contains('tts_cache')) return;
    const tx = db.transaction('tts_cache', 'readwrite');
    tx.objectStore('tts_cache').clear();
    await txDone(tx);
  } catch {}
}

export async function resetAllLocalData(): Promise<void> {
  memKv.clear();
  try {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('bridgeaac.')) keysToRemove.push(k);
      }
      for (const k of keysToRemove) localStorage.removeItem(k);
    }
  } catch {}
  try {
    if (typeof indexedDB !== 'undefined') {
      const db = await openDb();
      for (const storeName of ['vocabs', 'assets', 'kv', 'tts_cache']) {
        if (db.objectStoreNames.contains(storeName)) {
          const tx = db.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).clear();
          await txDone(tx);
        }
      }
    }
  } catch {}
}

