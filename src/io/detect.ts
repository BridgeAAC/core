import { unzipSync } from 'fflate';
import type { ImportOptions, ImportResult } from '../model';
import { importBridge } from './bridge';
import { importCe } from './ce';
import { importObf, importObz } from './obf';
import { isZip, safeUnzip } from './util';

function hasSqliteMagic(d: Uint8Array): boolean {
  if (d.length < 16) return false;
  return new TextDecoder('ascii').decode(d.subarray(0, 15)) === 'SQLite format 3';
}

const SUPPORTED =
  'Supported files: .ce, .wf, .c4v, Open Board (.obf, .obz) and BridgeAAC backups (.bridge).';

const INNER_BOARD = /\.(ce|wf|c4v|obz|obf|bridge)$/;

function listZip(bytes: Uint8Array, fileName: string): string[] {
  const names: string[] = [];
  try {
    unzipSync(bytes, {
      filter: (f) => {
        const lower = f.name.toLowerCase();
        if (!lower.includes('__macosx/') && !lower.endsWith('/')) names.push(lower);
        return false;
      },
    });
  } catch {
    throw new Error(
      `"${fileName}" couldn't be opened. It may not have finished copying. Try sending it to the device again.`,
    );
  }
  return names;
}

export async function importAnyFile(
  file: { name: string; bytes: Uint8Array },
  opts: ImportOptions = {},
  depth = 0,
): Promise<ImportResult> {
  const mergedOpts: ImportOptions = { ...opts, filename: opts.filename ?? file.name };
  const lower = file.name.toLowerCase().trim();
  const bytes = file.bytes;

  if (!bytes || bytes.byteLength === 0) {
    throw new Error(`"${file.name}" is empty. If it's stored in iCloud, open it once in Files so it downloads, then try again.`);
  }

  if (hasSqliteMagic(bytes)) {
    return importCe(bytes, mergedOpts);
  }

  if (isZip(bytes)) {
    const names = listZip(bytes, file.name);
    if (names.some((n) => n.endsWith('.c4v'))) return importCe(bytes, mergedOpts);
    if (names.includes('vocabulary.json')) return importBridge(bytes, mergedOpts);
    if (names.includes('manifest.json') || names.some((n) => n.endsWith('.obf'))) {
      return importObz(bytes, mergedOpts);
    }
    const inner = names.filter((n) => INNER_BOARD.test(n));
    if (inner.length === 1 && depth === 0) {
      const entries = safeUnzip(bytes, (n) => n === inner[0]);
      const [innerName, innerBytes] = Object.entries(entries)[0] ?? [];
      if (innerName && innerBytes) {
        const baseName = innerName.split('/').pop() || innerName;
        return importAnyFile({ name: baseName, bytes: innerBytes }, { ...opts, filename: baseName }, 1);
      }
    }
    if (inner.length > 1) {
      const list = inner.map((n) => n.split('/').pop()).slice(0, 4).join(', ');
      throw new Error(
        `"${file.name}" has more than one board inside (${list}). Unzip it and import them one at a time.`,
      );
    }
    throw new Error(`"${file.name}" is a zip file, but there's no board inside it. ${SUPPORTED}`);
  }

  if (lower.endsWith('.ce') || lower.endsWith('.wf') || lower.endsWith('.c4v')) {
    return importCe(bytes, mergedOpts);
  }

  const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, 64)).trimStart();
  if (head.startsWith('{') || lower.endsWith('.obf')) {
    const text = new TextDecoder('utf-8').decode(bytes);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(`"${file.name}" couldn't be read. ${SUPPORTED}`);
    }
    if (
      (typeof parsed.format === 'string' && parsed.format.startsWith('open-board')) ||
      Array.isArray(parsed.buttons) ||
      parsed.grid
    ) {
      return importObf(parsed, mergedOpts);
    }
  }

  throw new Error(`"${file.name}" isn't a board file BridgeAAC can open. ${SUPPORTED}`);
}
