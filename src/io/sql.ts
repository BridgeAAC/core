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

async function load(): Promise<SqlJsStatic> {
  const mod = await import('sql.js/dist/sql-wasm-inline.js');
  const init = unwrapInit(mod);
  return init();
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
