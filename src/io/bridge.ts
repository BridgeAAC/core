import { unzipSync, zipSync } from 'fflate';
import type {
  Action,
  AssetBlob,
  ImportOptions,
  ImportResult,
  Vocabulary,
} from '../model';
import { isZip, newId } from './util';

interface BridgeMeta {
  format: 'bridgeaac-backup-1';
  exportedAt: number;
  assets: Array<{
    key: string;
    originalId: string;
    kind: 'image' | 'sound';
    mime: string;
  }>;
}

export function exportBridge(vocab: Vocabulary, assets: AssetBlob[]): Uint8Array {
  const enc = new TextEncoder();
  const files: Record<string, Uint8Array> = {};
  const assetMeta: BridgeMeta['assets'] = [];

  assets.forEach((a, idx) => {
    const key = `asset_${idx + 1}`;
    files[`assets/${key}`] = a.data;
    assetMeta.push({
      key,
      originalId: a.id,
      kind: a.kind,
      mime: a.mime,
    });
  });

  const meta: BridgeMeta = {
    format: 'bridgeaac-backup-1',
    exportedAt: Date.now(),
    assets: assetMeta,
  };

  files['vocabulary.json'] = enc.encode(JSON.stringify(vocab, null, 2));
  files['meta.json'] = enc.encode(JSON.stringify(meta, null, 2));

  return zipSync(files);
}

function remapActions(actions: Action[], idMap: Map<string, string>): Action[] {
  return actions.map((a) => {
    if (a.type === 'playSound') {
      return { ...a, assetId: idMap.get(a.assetId) ?? a.assetId };
    }
    return a;
  });
}

function remapImageRef(ref: string | undefined, idMap: Map<string, string>): string | undefined {
  if (!ref || !ref.startsWith('img:')) return ref;
  const oldId = ref.slice(4);
  const newAssetId = idMap.get(oldId);
  return newAssetId ? `img:${newAssetId}` : ref;
}

export async function importBridge(
  data: Uint8Array,
  opts: ImportOptions = {},
): Promise<ImportResult> {
  if (!isZip(data)) {
    throw new Error('Not a valid BridgeAAC (.bridge) archive.');
  }
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(data);
  } catch (e) {
    throw new Error(
      `Could not unpack BridgeAAC backup (${e instanceof Error ? e.message : 'corrupt zip'}).`,
    );
  }

  const vocabBytes = entries['vocabulary.json'];
  if (!vocabBytes) {
    throw new Error('This archive is missing vocabulary.json and is not a BridgeAAC backup.');
  }

  const dec = new TextDecoder('utf-8');
  let rawVocab: Vocabulary;
  try {
    rawVocab = JSON.parse(dec.decode(vocabBytes)) as Vocabulary;
  } catch (e) {
    throw new Error(
      `Invalid vocabulary.json in backup (${e instanceof Error ? e.message : 'parse error'}).`,
    );
  }
  if (!rawVocab || !Array.isArray(rawVocab.pages)) {
    throw new Error('Backup vocabulary.json is missing pages.');
  }

  const newVocabId = opts.vocabId ?? `br-${newId()}`;
  const idMap = new Map<string, string>();
  const assets: AssetBlob[] = [];
  let imageCount = 0;
  let soundCount = 0;

  const metaBytes = entries['meta.json'];
  if (metaBytes) {
    try {
      const meta = JSON.parse(dec.decode(metaBytes)) as BridgeMeta;
      for (const item of meta.assets ?? []) {
        const bytes = entries[`assets/${item.key}`];
        if (!bytes) continue;
        const nextId =
          item.kind === 'image'
            ? `${newVocabId}:img:${++imageCount}`
            : `${newVocabId}:snd:${++soundCount}`;
        idMap.set(item.originalId, nextId);
        assets.push({
          id: nextId,
          vocabId: newVocabId,
          kind: item.kind,
          mime: item.mime,
          data: bytes,
        });
      }
    } catch {}
  }

  let totalButtons = 0;
  const pages = rawVocab.pages.map((p) => {
    const buttons = p.buttons.map((b) => {
      totalButtons++;
      let variants = b.variants;
      if (variants) {
        const nextVars: NonNullable<typeof b.variants> = {};
        for (const [k, v] of Object.entries(variants)) {
          nextVars[Number(k)] = {
            ...v,
            image: remapImageRef(v.image, idMap),
            actions: v.actions ? remapActions(v.actions, idMap) : undefined,
          };
        }
        variants = nextVars;
      }
      return {
        ...b,
        image: remapImageRef(b.image, idMap),
        actions: remapActions(b.actions ?? [], idMap),
        variants,
      };
    });
    return { ...p, buttons };
  });

  const now = Date.now();
  const vocab: Vocabulary = {
    ...rawVocab,
    id: newVocabId,
    source: {
      kind: 'bridge',
      filename: opts.filename ?? rawVocab.source?.filename,
      importedAt: now,
    },
    pages,
    updatedAt: now,
    schema: 1,
  };

  return {
    vocab,
    assets,
    warnings: [],
    stats: {
      pages: pages.length,
      buttons: totalButtons,
      images: imageCount,
      sounds: soundCount,
    },
  };
}
