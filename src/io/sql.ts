import type { SqlJsStatic } from 'sql.js';

let sqlPromise: Promise<SqlJsStatic> | null = null;

type InitFn = (config?: Record<string, unknown>) => Promise<SqlJsStatic>;

function unwrapInit(mod: unknown): InitFn {
  const m = mod as Record<string, unknown> & { default?: unknown };
  const candidates: unknown[] = [
    m,
    m?.default,
    (m?.default as Record<string, unknown> | undefined)?.Module,
    m?.Module,
  ];
  for (const c of candidates) if (typeof c === 'function') return c as InitFn;
  throw new Error('Could not load the SQLite engine (sql.js).');
}

interface NodeFs {
  existsSync(p: string): boolean;
  readFileSync(p: string): { buffer: ArrayBufferLike; byteOffset: number; byteLength: number };
}
interface NodePath {
  resolve(...p: string[]): string;
  dirname(p: string): string;
}
interface NodeUrl {
  fileURLToPath(u: string): string;
}

function isNode(): boolean {
  const p = (globalThis as { process?: { versions?: { node?: string } } }).process;
  return !!p?.versions?.node;
}

async function load(): Promise<SqlJsStatic> {
  if (isNode()) {
    const fsName = 'node:fs';
    const pathName = 'node:path';
    const urlName = 'node:url';
    const fs = (await import(/* @vite-ignore */ fsName)) as NodeFs;
    const path = (await import(/* @vite-ignore */ pathName)) as NodePath;
    const url = (await import(/* @vite-ignore */ urlName)) as NodeUrl;
    const cwd = (globalThis as unknown as { process: { cwd(): string } }).process.cwd();
    const here =
      typeof import.meta.url === 'string' && import.meta.url.startsWith('file:')
        ? path.dirname(url.fileURLToPath(import.meta.url))
        : cwd;
    const candidates = [
      path.resolve(cwd, 'node_modules/sql.js/dist/sql-wasm.wasm'),
      path.resolve(here, '../../node_modules/sql.js/dist/sql-wasm.wasm'),
    ];
    const wasmPath = candidates.find((p) => fs.existsSync(p));
    if (!wasmPath) throw new Error('sql-wasm.wasm not found in node_modules/sql.js/dist');
    const buf = fs.readFileSync(wasmPath);
    const wasmBinary = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;
    const init = unwrapInit(await import('sql.js'));
    return init({ wasmBinary });
  }
  const [mod, wasm] = await Promise.all([
    import('sql.js'),
    import('sql.js/dist/sql-wasm-browser.wasm?url'),
  ]);
  const wasmUrl = wasm.default;
  const init = unwrapInit(mod);
  return init({ locateFile: () => wasmUrl });
}

export function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = load().catch((e) => {
      sqlPromise = null;
      throw e;
    });
  }
  return sqlPromise;
}
