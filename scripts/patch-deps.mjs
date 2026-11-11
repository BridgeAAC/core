import fs from 'node:fs';

try {
  const espeakPath = 'node_modules/mespeak/src/ESpeak.js';
  const buf = fs.readFileSync(espeakPath);
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    fs.writeFileSync(espeakPath, buf.toString('latin1'), 'utf8');
  }
} catch {}

try {
  const ortPath = 'node_modules/onnxruntime-web/dist/esm/ort.min.js';
  let ortCode = fs.readFileSync(ortPath, 'utf8');
  let changed = false;
  const failCheck = 'if(Np)throw new Error("previous call to \'initializeWebAssembly()\' failed.");';
  if (ortCode.includes(failCheck)) {
    ortCode = ortCode.replace(failCheck, 'if(Np){Np=!1;}');
    changed = true;
  }
  const callSite = 'w(v).then(S=>{So=!1,ia=!0,oa=S,d()}';
  const wasmHook = 'if(a.wasmBinary){v.wasmBinary=a.wasmBinary;v.instantiateWasm=(imp,cb)=>{WebAssembly.instantiate(a.wasmBinary,imp).then(res=>cb(res.instance||res,res.module)).catch(T);return{}}}w(v).then(S=>{So=!1,ia=!0,oa=S,d()}';
  if (ortCode.includes(callSite) && !ortCode.includes('v.instantiateWasm=(imp,cb)=>')) {
    ortCode = ortCode.replace(callSite, wasmHook);
    changed = true;
  }
  const directEval = 'var mod=eval("quire".replace(/^/,"re"))(moduleName);';
  const indirectEval = 'var mod=(0,eval)("quire".replace(/^/,"re"))(moduleName);';
  if (ortCode.includes(directEval)) {
    ortCode = ortCode.replace(directEval, indirectEval);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(ortPath, ortCode, 'utf8');
  }
} catch {}

try {
  const vitsPath = 'node_modules/@diffusionstudio/vits-web/dist/vits-web.js';
  const code = fs.readFileSync(vitsPath, 'utf8');
    const idbMarker = code.indexOf('const IDB_NAME = "bridgeaac_piper_files";');
    const fnMarker = code.indexOf('async function p(e, m)');
    const markerIndex = idbMarker !== -1 ? idbMarker : fnMarker;
    if (markerIndex !== -1) {
      const prefix = code.slice(0, markerIndex);
      const replacement = `const IDB_NAME = "bridgeaac_piper_files";
const IDB_STORE = "files";
let idbPromise = null;
const memoryBlobCache = new Map();
const configJsonCache = new Map();
const swiftDownloadCallbacks = new Map();
let swiftDownloadSeq = 0;

if (typeof window !== "undefined") {
  window.__bridgeOnPiperDownload = (payload) => {
    if (!payload || !payload.reqId) return;
    const cb = swiftDownloadCallbacks.get(payload.reqId);
    if (cb) {
      swiftDownloadCallbacks.delete(payload.reqId);
      cb(payload);
    }
  };
}

function hasSwiftBridge() {
  return typeof window !== "undefined" && Boolean(window.webkit?.messageHandlers?.bridgeSwift?.postMessage);
}

function openPiperDb() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("No IndexedDB"));
  if (!idbPromise) {
    idbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        idbPromise = null;
        reject(req.error);
      };
    });
  }
  return idbPromise;
}

function minValidSize(name) {
  if (name.endsWith(".onnx")) return 1000000;
  if (name.endsWith(".data")) return 10000000;
  if (name.endsWith(".wasm")) return 100000;
  if (name.endsWith(".json")) return 50;
  return 16;
}

function mimeForName(name) {
  if (name.endsWith(".wasm")) return "application/wasm";
  if (name.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

function fallbackUrlsFor(url) {
  const urls = [];
  const fileName = url.split("/").at(-1) || "";
  let customMirror = "";
  try {
    if (typeof localStorage !== "undefined") {
      customMirror = (localStorage.getItem("bridgeaac.voice_mirror_url") || "").trim();
    }
  } catch {}
  if (customMirror) {
    const cleanMirror = customMirror.replace(/\\/+$/, "");
    if (url.includes("huggingface.co/diffusionstudio/piper-voices/resolve/main/")) {
      const rel = url.split("piper-voices/resolve/main/")[1];
      if (rel) urls.push(\`\${cleanMirror}/\${rel}\`);
    }
    urls.push(\`\${cleanMirror}/\${fileName}\`);
  }
  urls.push(url);
  const httpsProto = ["https", "://"].join("");
  if (url.includes("huggingface.co/diffusionstudio/piper-voices/resolve/main/")) {
    urls.push(
      url.replace(
        "huggingface.co/diffusionstudio/piper-voices/resolve/main/",
        "huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/"
      )
    );
    urls.push(
      url.replace(
        "huggingface.co/diffusionstudio/piper-voices/resolve/main/",
        "huggingface.co/rhasspy/piper-voices/resolve/main/"
      )
    );
    urls.push(
      url.replace(
        httpsProto + "huggingface.co/diffusionstudio/piper-voices/resolve/main/",
        httpsProto + "raw.githubusercontent.com/rhasspy/piper-voices/v1.0.0/"
      )
    );
  } else if (url.includes("cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/")) {
    urls.push(
      url.replace(
        "cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/",
        "cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/"
      )
    );
    urls.push(
      url.replace(
        "cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/",
        "unpkg.com/onnxruntime-web@1.18.0/dist/"
      )
    );
  } else if (url.includes("cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/")) {
    urls.push(
      url.replace(
        "cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/",
        "unpkg.com/@diffusionstudio/piper-wasm@1.0.0/"
      )
    );
  }
  return urls;
}

async function p(e, m) {
  const name = e.split("/").at(-1);
  const ab = m instanceof ArrayBuffer ? m : await m.arrayBuffer();
  if (ab.byteLength < minValidSize(name)) {
    throw new Error(\`Downloaded file \${name} is incomplete (\${ab.byteLength} bytes)\`);
  }
  const mime = mimeForName(name);
  memoryBlobCache.set(name, new Blob([ab], { type: mime }));
  if (hasSwiftBridge()) {
    return;
  }
  let saved = false;
  try {
    const db = await openPiperDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(ab, name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    saved = true;
  } catch (err) {
    console.warn("[BridgeAAC] IndexedDB write fallback to OPFS:", err);
  }
  if (!saved && typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
    try {
      const o = await (await navigator.storage.getDirectory()).getDirectoryHandle("piper", {
        create: true
      });
      const fh = await o.getFileHandle(name, { create: true });
      if (typeof fh.createWritable === "function") {
        const t = await fh.createWritable();
        await t.write(ab);
        await t.close();
      }
    } catch (n) {
      console.error(n);
    }
  }
}

async function R(e) {
  const o = e.split("/").at(-1);
  memoryBlobCache.delete(o);
  configJsonCache.delete(o);
  if (hasSwiftBridge()) {
    try {
      window.webkit.messageHandlers.bridgeSwift.postMessage({
        action: "deletePiperFile",
        filename: o
      });
    } catch {}
  }
  try {
    const db = await openPiperDb();
    await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(o);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
      const n = await (await navigator.storage.getDirectory()).getDirectoryHandle("piper");
      await (await n.getFileHandle(o)).remove();
    }
  } catch {}
}

async function D(e) {
  const o = e.split("/").at(-1);
  const minBytes = minValidSize(o);
  const mime = mimeForName(o);
  const mem = memoryBlobCache.get(o);
  if (mem && mem.size >= minBytes) {
    return mem;
  }
  if (hasSwiftBridge()) {
    try {
      const resp = await fetch(\`/__piper_cache__/\${encodeURIComponent(o)}\`);
      if (resp.ok) {
        const ab = await resp.arrayBuffer();
        if (ab.byteLength >= minBytes) {
          const blob = new Blob([ab], { type: mime });
          memoryBlobCache.set(o, blob);
          return blob;
        }
      }
    } catch {}
  }
  try {
    const db = await openPiperDb();
    const val = await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(o);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
    if (val instanceof ArrayBuffer && val.byteLength >= minBytes) {
      const blob = new Blob([val], { type: mime });
      memoryBlobCache.set(o, blob);
      return blob;
    }
    if (val instanceof Blob && val.size >= minBytes) {
      const blob = new Blob([await val.arrayBuffer()], { type: mime });
      memoryBlobCache.set(o, blob);
      return blob;
    }
  } catch {}
  if (e.match(/huggingface\\.co|jsdelivr\\.net|cloudflare\\.com|unpkg\\.com/)) {
    try {
      if (typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
        const n = await (await navigator.storage.getDirectory()).getDirectoryHandle("piper", {
          create: true
        });
        const file = await (await n.getFileHandle(o)).getFile();
        if (file && file.size >= minBytes) {
          const blob = new Blob([await file.arrayBuffer()], { type: mime });
          memoryBlobCache.set(o, blob);
          return blob;
        }
      }
    } catch {
      return;
    }
  }
}

async function S(e, m) {
  const fileName = e.split("/").at(-1);
  const minBytes = minValidSize(fileName);
  const mime = mimeForName(fileName);
  const candidates = fallbackUrlsFor(e);
  if (hasSwiftBridge()) {
    try {
      const reqId = \`piper_dl_\${++swiftDownloadSeq}_\${Date.now()}\`;
      const result = await new Promise((resolve) => {
        const timer = setTimeout(() => {
          swiftDownloadCallbacks.delete(reqId);
          resolve({ ok: false, error: "Native download timeout" });
        }, 180000);
        swiftDownloadCallbacks.set(reqId, (payload) => {
          clearTimeout(timer);
          resolve(payload);
        });
        window.webkit.messageHandlers.bridgeSwift.postMessage({
          action: "downloadPiperFile",
          reqId,
          filename: fileName,
          urls: candidates,
          minSize: minBytes
        });
      });
      if (result && result.ok) {
        const cached = await D(e);
        if (cached && cached.size >= minBytes) {
          m == null || m({ url: e, total: cached.size, loaded: cached.size });
          return cached;
        }
      }
    } catch {}
  }
  let lastErr = null;
  for (const targetUrl of candidates) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const n = await fetch(targetUrl);
        if (!n.ok) throw new Error(\`HTTP \${n.status} for \${targetUrl}\`);
        const o = n.body == null ? void 0 : n.body.getReader();
        const a = +(n.headers.get("Content-Length") ?? 0);
        if (!o) {
          const ab = await n.arrayBuffer();
          if (ab.byteLength < minBytes) {
            throw new Error(\`Incomplete download (\${ab.byteLength} bytes)\`);
          }
          m == null || m({ url: e, total: ab.byteLength, loaded: ab.byteLength });
          const blob = new Blob([ab], { type: mime });
          memoryBlobCache.set(fileName, blob);
          return blob;
        }
        let i = 0;
        const t = [];
        for (;;) {
          const { done: s, value: d } = await o.read();
          if (s) break;
          t.push(d);
          i += d.length;
          m == null || m({ url: e, total: Math.max(a, i), loaded: i });
        }
        const combined = new Blob(t, { type: mime });
        if (combined.size < minBytes) {
          throw new Error(\`Incomplete download (\${combined.size} bytes)\`);
        }
        memoryBlobCache.set(fileName, combined);
        return combined;
      } catch (err) {
        lastErr = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 450 * (attempt + 1)));
        }
      }
    }
  }
  throw lastErr ?? new Error(\`Failed to download \${e}\`);
}

function b(e, m, n) {
  const o = e.length, a = 44, i = new DataView(new ArrayBuffer(o * m * 2 + a));
  i.setUint32(0, 1179011410, !0), i.setUint32(4, i.buffer.byteLength - 8, !0), i.setUint32(8, 1163280727, !0), i.setUint32(12, 544501094, !0), i.setUint32(16, 16, !0), i.setUint16(20, 1, !0), i.setUint16(22, m, !0), i.setUint32(24, n, !0), i.setUint32(28, m * 2 * n, !0), i.setUint16(32, m * 2, !0), i.setUint16(34, 16, !0), i.setUint32(36, 1635017060, !0), i.setUint32(40, 2 * o, !0);
  let t = a;
  for (let r = 0; r < o; r++) {
    const s = e[r];
    s >= 1 ? i.setInt16(t, 32767, !0) : s <= -1 ? i.setInt16(t, -32768, !0) : i.setInt16(t, s * 32768 | 0, !0), t += 2;
  }
  return i.buffer;
}

let h, _, wasmBytes, phonemizeWasmModule, dataBytes, ortBytes, wasmBlobUrl, dataBlobUrl, ortBlobUrl;
const sessionCache = new Map();
let predictQueue = Promise.resolve();

async function ensureRuntimeBlobs() {
  if (!wasmBytes || !phonemizeWasmModule) {
    const wFile = await f(\`\${x}.wasm\`);
    wasmBytes = await wFile.arrayBuffer();
    phonemizeWasmModule = await WebAssembly.compile(wasmBytes);
    if (!wasmBlobUrl) {
      wasmBlobUrl = URL.createObjectURL(new Blob([wasmBytes], { type: "application/wasm" }));
    }
  }
  if (!dataBytes) {
    const dFile = await f(\`\${x}.data\`);
    dataBytes = await dFile.arrayBuffer();
    if (!dataBlobUrl) {
      dataBlobUrl = URL.createObjectURL(new Blob([dataBytes], { type: "application/octet-stream" }));
    }
  }
  if (!ortBytes) {
    const oFile = await f(\`\${B}ort-wasm-simd.wasm\`);
    ortBytes = await oFile.arrayBuffer();
    if (!ortBlobUrl) {
      ortBlobUrl = URL.createObjectURL(new Blob([ortBytes], { type: "application/wasm" }));
    }
  }
}

async function runPredictOnce(e, m) {
  h = h ?? await import("./piper-DeOu3H9E.js"), _ = _ ?? await import("onnxruntime-web");
  await ensureRuntimeBlobs();
  const n = c[e.voiceId];
  if (!n) throw new Error(\`Unknown Piper voiceId: \${e.voiceId}\`);
  _.env.allowLocalModels = !1;
  _.env.wasm.numThreads = 1;
  _.env.wasm.wasmBinary = ortBytes;
  _.env.wasm.wasmPaths = {
    "ort-wasm-simd.wasm": ortBlobUrl,
    "ort-wasm.wasm": ortBlobUrl,
    "ort-wasm-simd-threaded.wasm": ortBlobUrl,
    "ort-wasm-threaded.wasm": ortBlobUrl
  };
  let i = configJsonCache.get(n);
  if (!i) {
    const a = await f(\`\${u}/\${n}.json\`);
    i = JSON.parse(await a.text());
    configJsonCache.set(n, i);
  }
  let y = sessionCache.get(e.voiceId);
  if (!y) {
    try {
      const k = await f(\`\${u}/\${n}\`, m);
      y = await _.InferenceSession.create(await k.arrayBuffer(), { executionProviders: ["wasm"] });
      sessionCache.set(e.voiceId, y);
    } catch (err) {
      sessionCache.delete(e.voiceId);
      throw err;
    }
  }
  const cleanText = String(e.text ?? "").trim();
  if (!cleanText) {
    return new Blob([b(new Float32Array(1600), 1, 16000)], { type: "audio/x-wav" });
  }
  const o = JSON.stringify([{ text: cleanText }]);
  const t = await new Promise(async (v, rej) => {
    let resolved = false;
    try {
      const inst = await h.createPiperPhonemize({
        wasmBinary: wasmBytes,
        instantiateWasm: (imports, successCallback) => {
          WebAssembly.instantiate(phonemizeWasmModule, imports).then((instance) => {
            successCallback(instance, phonemizeWasmModule);
          }).catch(rej);
          return {};
        },
        getPreloadedPackage: () => dataBytes,
        print: (l) => {
          try {
            const parsed = JSON.parse(l);
            if (parsed && Array.isArray(parsed.phoneme_ids)) {
              resolved = true;
              v(parsed.phoneme_ids);
            }
          } catch {}
        },
        printErr: (l) => {
          if (typeof l === "string" && (l.includes("wasm streaming compile failed") || l.includes("falling back to ArrayBuffer"))) {
            return;
          }
          console.warn("[piper_phonemize]", l);
        },
        locateFile: (l) => l.endsWith(".wasm") ? wasmBlobUrl : l.endsWith(".data") ? dataBlobUrl : l
      });
      inst.callMain([
        "-l",
        i.espeak.voice,
        "--input",
        o,
        "--espeak_data",
        "/espeak-ng-data"
      ]);
      if (!resolved) {
        rej(new Error("piper_phonemize did not return phoneme_ids"));
      }
    } catch (err) {
      if (!resolved) rej(err);
    }
  }), r = 0, s = i.audio.sample_rate || 16000, d = i.inference.noise_scale, g = i.inference.length_scale, U = i.inference.noise_w;
  if (!t || !t.length) {
    return new Blob([b(new Float32Array(Math.round(s * 0.1)), 1, s)], { type: "audio/x-wav" });
  }
  const w = {
    input: new _.Tensor("int64", t, [1, t.length]),
    input_lengths: new _.Tensor("int64", [t.length]),
    scales: new _.Tensor("float32", [d, g, U])
  };
  Object.keys(i.speaker_id_map || {}).length && Object.assign(w, { sid: new _.Tensor("int64", [r]) });
  const {
    output: { data: E }
  } = await y.run(w);
  return new Blob([b(E, 1, s)], { type: "audio/x-wav" });
}

function N(e, m) {
  const next = predictQueue.then(() => {
    return Promise.race([
      runPredictOnce(e, m),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Piper inference timeout after 12000ms")), 12000)
      )
    ]);
  });
  predictQueue = next.catch(() => {});
  return next;
}

async function f(e, m) {
  let n = await D(e);
  return n || (n = await S(e, m), await p(e, n)), n;
}

async function I(e, m) {
  const n = c[e];
  const runtimeFiles = [\`\${x}.wasm\`, \`\${x}.data\`, \`\${B}ort-wasm-simd.wasm\`];
  const modelFiles = [\`\${u}/\${n}.json\`, \`\${u}/\${n}\`];
  const allFiles = [...runtimeFiles, ...modelFiles];
  const progressMap = new Map();
  for (const a of allFiles) {
    const existing = await D(a);
    if (existing) {
      progressMap.set(a, { loaded: existing.size, total: existing.size });
    }
  }
  const report = () => {
    if (!m) return;
    let sumLoaded = 0, sumTotal = 0;
    for (const v of progressMap.values()) {
      sumLoaded += v.loaded;
      sumTotal += v.total;
    }
    m({ url: e, loaded: sumLoaded, total: Math.max(sumTotal, sumLoaded, 28000000) });
  };
  report();
  for (const a of allFiles) {
    if (progressMap.has(a)) continue;
    const blob = await S(a, (prog) => {
      progressMap.set(a, { loaded: prog.loaded, total: prog.total || prog.loaded });
      report();
    });
    await p(a, blob);
    progressMap.set(a, { loaded: blob.size, total: blob.size });
    report();
  }
}

async function F(e) {
  sessionCache.delete(e);
  const m = c[e], n = [\`\${u}/\${m}\`, \`\${u}/\${m}.json\`];
  await Promise.all(n.map((o) => R(o)));
}

async function L() {
  const found = new Set();
  for (const k of memoryBlobCache.keys()) {
    const s = String(k);
    if (s.endsWith(".onnx")) {
      const a = s.slice(0, -5);
      if (a in c) found.add(a);
    }
  }
  if (hasSwiftBridge()) {
    try {
      const resp = await fetch("/__piper_cache__/__list__.json");
      if (resp.ok) {
        const list = await resp.json();
        if (Array.isArray(list)) {
          for (const item of list) {
            if (typeof item === "string" && item in c) {
              found.add(item);
            }
          }
        }
      }
    } catch {}
  }
  try {
    const db = await openPiperDb();
    const keys = await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
    for (const k of keys) {
      const s = String(k);
      if (s.endsWith(".onnx")) {
        const a = s.slice(0, -5);
        if (a in c) found.add(a);
      }
    }
  } catch {}
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
      const m = await (await navigator.storage.getDirectory()).getDirectoryHandle("piper", {
        create: true
      });
      for await (const o of m.keys()) {
        if (o.endsWith(".onnx")) {
          const a = o.slice(0, -5);
          if (a in c) found.add(a);
        }
      }
    }
  } catch {}
  return Array.from(found);
}

async function j() {
  sessionCache.clear();
  memoryBlobCache.clear();
  configJsonCache.clear();
  if (hasSwiftBridge()) {
    try {
      window.webkit.messageHandlers.bridgeSwift.postMessage({
        action: "deletePiperFile",
        filename: "__all__"
      });
    } catch {}
  }
  try {
    const db = await openPiperDb();
    await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
      await (await (await navigator.storage.getDirectory()).getDirectoryHandle("piper")).remove({ recursive: true });
    }
  } catch {}
}

async function P() {
  const e = await fetch(\`\${u}/voices.json\`);
  if (!e.ok)
    throw new Error("Could not retrieve voices file from huggingface");
  return Object.values(await e.json());
}

export {
  u as HF_BASE,
  B as ONNX_BASE,
  c as PATH_MAP,
  x as WASM_BASE,
  I as download,
  j as flush,
  N as predict,
  F as remove,
  L as stored,
  P as voices
};
`;
      fs.writeFileSync(vitsPath, prefix + replacement, 'utf8');
    }
} catch {}
