const { app, BrowserWindow, ipcMain, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

let mainWindow = null;
let pendingFilePath = null;

function extractFileArg(argv) {
  for (const arg of argv.slice(1)) {
    if (arg.startsWith('-')) continue;
    if (/\.(ce|c4v|wf|obf|obz|bridge)$/i.test(arg) && fs.existsSync(arg)) {
      return path.resolve(arg);
    }
  }
  return null;
}

function sendFileToRenderer(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  if (!mainWindow || mainWindow.isDestroyed()) {
    pendingFilePath = filePath;
    return;
  }
  try {
    const bytes = new Uint8Array(fs.readFileSync(filePath));
    mainWindow.webContents.send('bridge:open-file', {
      name: path.basename(filePath),
      bytes,
    });
  } catch {}
}

const NO_STORE = { 'Cache-Control': 'private, no-store' };

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleTts(req, res, port) {
  const origin = req.headers.origin;
  if (req.method !== 'POST' || (origin && origin !== `http://127.0.0.1:${port}`)) {
    res.writeHead(403, NO_STORE);
    res.end();
    return;
  }
  try {
    const body = JSON.parse((await readBody(req, 4096)) || '{}');
    const q = String(body.q || '').trim().slice(0, 200);
    const tl = String(body.tl || 'en-US').trim().slice(0, 16);
    if (!q || !/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(tl)) {
      res.writeHead(400, NO_STORE);
      res.end();
      return;
    }
    const target = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
      tl,
    )}&q=${encodeURIComponent(q)}`;
    const upstream = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });
    if (!upstream.ok) {
      res.writeHead(204, NO_STORE);
      res.end();
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', ...NO_STORE });
    res.end(buf);
  } catch {
    res.writeHead(204, NO_STORE);
    res.end();
  }
}

function startLocalServer(distDir) {
  return new Promise((resolve) => {
    let port = 0;
    const server = http.createServer(async (req, res) => {
      const urlStr = req.url || '/';
      if (urlStr.startsWith('/api/tts')) {
        handleTts(req, res, port);
        return;
      }

      const rawPath = urlStr.split('?')[0];
      const safeRelative = path.posix.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '');
      const candidate = path.resolve(distDir, '.' + path.sep + safeRelative);
      const rel = path.relative(distDir, candidate);
      let filePath = path.join(distDir, 'index.html');
      if (rel && !rel.startsWith('..') && !path.isAbsolute(rel) && candidate.startsWith(distDir + path.sep)) {
        try {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            filePath = candidate;
          }
        } catch {}
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      resolve(port);
    });
  });
}

async function createWindow() {
  const distDir = path.join(__dirname, '..', 'dist');
  const port = await startLocalServer(distDir);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 480,
    minHeight: 400,
    title: 'BridgeAAC',
    icon: path.join(distDir, 'icon-512.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  const appOrigin = `http://127.0.0.1:${port}`;
  const openOutside = (url) => {
    if (/^(https?:|mailto:)/i.test(url)) void shell.openExternal(url);
  };
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin === appOrigin) return;
    event.preventDefault();
    openOutside(url);
  });
  mainWindow.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'clipboard-sanitized-write');
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  const initialFile = pendingFilePath || extractFileArg(process.argv);
  if (initialFile) {
    pendingFilePath = null;
    setTimeout(() => sendFileToRenderer(initialFile), 600);
  }
}

ipcMain.on('bridge:renderer-ready', () => {
  if (pendingFilePath) {
    const f = pendingFilePath;
    pendingFilePath = null;
    sendFileToRenderer(f);
  }
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  sendFileToRenderer(filePath);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
