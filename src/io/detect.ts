import { unzipSync } from 'fflate';
import type { ImportOptions, ImportResult } from '../model';
import { importBridge } from './bridge';
import { importCe } from './ce';
import { importObf, importObz } from './obf';
import { isZip } from './util';

function hasSqliteMagic(d: Uint8Array): boolean {
  if (d.length < 16) return false;
  return new TextDecoder('ascii').decode(d.subarray(0, 15)) === 'SQLite format 3';
}

export async function importAnyFile(
  file: { name: string; bytes: Uint8Array },
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const mergedOpts: ImportOptions = { ...opts, filename: opts.filename ?? file.name };
  const lower = file.name.toLowerCase().trim();
  const bytes = file.bytes;

  if (!bytes || bytes.byteLength === 0) {
    throw new Error('The selected file is empty.');
  }

  if (lower.endsWith('.ce') || lower.endsWith('.wf') || lower.endsWith('.c4v')) {
    return importCe(bytes, mergedOpts);
  }
  if (lower.endsWith('.bridge')) {
    return importBridge(bytes, mergedOpts);
  }
  if (lower.endsWith('.obz')) {
    return importObz(bytes, mergedOpts);
  }
  if (lower.endsWith('.obf')) {
    const text = new TextDecoder('utf-8').decode(bytes);
    return importObf(text, mergedOpts);
  }

  if (hasSqliteMagic(bytes)) {
    return importCe(bytes, mergedOpts);
  }

  if (isZip(bytes)) {
    const names: string[] = [];
    try {
      const entries = unzipSync(bytes, {
        filter: (f) => {
          names.push(f.name.toLowerCase());
          return false;
        },
      });
      void entries;
    } catch (e) {
      throw new Error(
        `Could not read ZIP archive "${file.name}" (${e instanceof Error ? e.message : 'corrupt archive'}).`,
      );
    }

    if (names.some((n) => n.endsWith('.c4v'))) {
      return importCe(bytes, mergedOpts);
    }
    if (names.includes('vocabulary.json')) {
      return importBridge(bytes, mergedOpts);
    }
    if (names.includes('manifest.json') || names.some((n) => n.endsWith('.obf'))) {
      return importObz(bytes, mergedOpts);
    }
    throw new Error(
      `Unsupported ZIP archive "${file.name}". Supported formats: TouchChat (.ce, .wf, .c4v), Open Board (.obz, .obf), and BridgeAAC (.bridge).`,
    );
  }

  const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, 64)).trimStart();
  if (head.startsWith('{')) {
    const text = new TextDecoder('utf-8').decode(bytes);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Could not parse "${file.name}". Supported formats: TouchChat (.ce, .wf, .c4v), Open Board (.obf, .obz), and BridgeAAC (.bridge).`,
      );
    }
    if (typeof parsed.format === 'string' && parsed.format.startsWith('open-board')) {
      return importObf(parsed, mergedOpts);
    }
    if (Array.isArray(parsed.buttons) || parsed.grid) {
      return importObf(parsed, mergedOpts);
    }
  }

  throw new Error(
    `Unsupported file "${file.name}". Supported formats: TouchChat (.ce, .wf, .c4v), Open Board (.obf, .obz), and BridgeAAC (.bridge).`,
  );
}
