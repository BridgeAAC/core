declare module 'mespeak' {
  const meSpeak: {
    isConfigLoaded?: () => boolean;
    loadConfig: (cfg: unknown) => void;
    loadVoice: (voice: unknown) => void;
    speak: (
      text: string,
      opts?: {
        rawdata?: 'ArrayBuffer' | boolean | string;
        voice?: string;
        variant?: string;
        speed?: number;
        pitch?: number;
        amplitude?: number;
        wordgap?: number;
      },
    ) => ArrayBuffer | Uint8Array | null;
  };
  export default meSpeak;
}

declare module 'mespeak/src/mespeak_config.json' {
  const cfg: Record<string, unknown>;
  export default cfg;
}

declare module 'mespeak/voices/en/en-us.json' {
  const voice: Record<string, unknown>;
  export default voice;
}

declare module 'mespeak/voices/en/en-rp.json' {
  const voice: Record<string, unknown>;
  export default voice;
}

declare module 'sql.js/dist/sql-wasm-inline.js' {
  import type { SqlJsStatic } from 'sql.js';
  const initSqlJs: (config?: Record<string, unknown>) => Promise<SqlJsStatic>;
  export default initSqlJs;
}
