import fs from 'node:fs';

// 1. Ensure mespeak ESpeak.js is valid UTF-8 for Rollup/Rolldown bundlers
try {
  const espeakPath = 'node_modules/mespeak/src/ESpeak.js';
  if (fs.existsSync(espeakPath)) {
    const buf = fs.readFileSync(espeakPath);
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch {
      fs.writeFileSync(espeakPath, buf.toString('latin1'), 'utf8');
    }
  }
} catch {}

// 2. Patch @diffusionstudio/vits-web so download() awaits OPFS writes, stores WASM/data
// in OPFS, caches InferenceSession in memory, and uses local OPFS Blob URLs offline.
try {
  const vitsPath = 'node_modules/@diffusionstudio/vits-web/dist/vits-web.js';
  if (fs.existsSync(vitsPath)) {
    let code = fs.readFileSync(vitsPath, 'utf8');
    if (!code.includes('ensureRuntimeBlobs')) {
      code = code
        .replace(
          /if \(e\.match\("https:\/\/huggingface\.co"\)\)/g,
          'if (e.match(/huggingface\\.co|jsdelivr\\.net|cloudflare\\.com/))',
        )
        .replace(
          'return await (await n.getFileHandle(o)).getFile();',
          'const file = await (await n.getFileHandle(o)).getFile(); if (file && file.size > 0) return file;',
        )
        .replace(
          /let h, _;\nasync function N\(e, m\) \{[\s\S]*?async function L\(\) \{/,
          `let h, _, wasmBlobUrl, dataBlobUrl, ortBlobUrl;
const sessionCache = new Map();
async function ensureRuntimeBlobs() {
  if (!wasmBlobUrl) {
    const wFile = await f(\`\${x}.wasm\`);
    wasmBlobUrl = URL.createObjectURL(wFile);
  }
  if (!dataBlobUrl) {
    const dFile = await f(\`\${x}.data\`);
    dataBlobUrl = URL.createObjectURL(dFile);
  }
  if (!ortBlobUrl) {
    const oFile = await f(\`\${B}ort-wasm-simd.wasm\`);
    ortBlobUrl = URL.createObjectURL(oFile);
  }
}
async function N(e, m) {
  h = h ?? await import("./piper-DeOu3H9E.js"), _ = _ ?? await import("onnxruntime-web");
  await ensureRuntimeBlobs();
  const n = c[e.voiceId], o = JSON.stringify([{ text: e.text.trim() }]);
  _.env.allowLocalModels = !1, _.env.wasm.numThreads = 1, _.env.wasm.wasmPaths = {
    "ort-wasm-simd.wasm": ortBlobUrl,
    "ort-wasm.wasm": ortBlobUrl,
    "ort-wasm-simd-threaded.wasm": ortBlobUrl,
    "ort-wasm-threaded.wasm": ortBlobUrl
  };
  const a = await f(\`\${u}/\${n}.json\`), i = JSON.parse(await a.text()), t = await new Promise(async (v, rej) => {
    try {
      (await h.createPiperPhonemize({
        print: (l) => {
          v(JSON.parse(l).phoneme_ids);
        },
        printErr: (l) => {
          rej(new Error(l));
        },
        locateFile: (l) => l.endsWith(".wasm") ? wasmBlobUrl : l.endsWith(".data") ? dataBlobUrl : l
      })).callMain([
        "-l",
        i.espeak.voice,
        "--input",
        o,
        "--espeak_data",
        "/espeak-ng-data"
      ]);
    } catch (err) {
      rej(err);
    }
  }), r = 0, s = i.audio.sample_rate, d = i.inference.noise_scale, g = i.inference.length_scale, U = i.inference.noise_w;
  let y = sessionCache.get(e.voiceId);
  if (!y) {
    const k = await f(\`\${u}/\${n}\`, m);
    y = await _.InferenceSession.create(await k.arrayBuffer());
    sessionCache.set(e.voiceId, y);
  }
  const w = {
    input: new _.Tensor("int64", t, [1, t.length]),
    input_lengths: new _.Tensor("int64", [t.length]),
    scales: new _.Tensor("float32", [d, g, U])
  };
  Object.keys(i.speaker_id_map).length && Object.assign(w, { sid: new _.Tensor("int64", [r]) });
  const {
    output: { data: E }
  } = await y.run(w);
  return new Blob([b(E, 1, s)], { type: "audio/x-wav" });
}
async function f(e, m) {
  let n = await D(e);
  return n || (n = await S(e, m), await p(e, n)), n;
}
async function I(e, m) {
  const n = c[e], o = [\`\${u}/\${n}\`, \`\${u}/\${n}.json\`, \`\${x}.wasm\`, \`\${x}.data\`, \`\${B}ort-wasm-simd.wasm\`];
  await Promise.all(
    o.map(async (a) => {
      const existing = await D(a);
      if (existing && !a.endsWith(".onnx")) return;
      await p(a, await S(a, a.endsWith(".onnx") ? m : void 0));
    })
  );
}
async function F(e) {
  sessionCache.delete(e);
  const m = c[e], n = [\`\${u}/\${m}\`, \`\${u}/\${m}.json\`];
  await Promise.all(n.map((o) => R(o)));
}
async function L() {`,
        );
      fs.writeFileSync(vitsPath, code, 'utf8');
    }
  }
} catch {}
