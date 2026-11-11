const { app, BrowserWindow, ipcMain } = require('electron');
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

function startLocalServer(distDir) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const urlStr = req.url || '/';
      if (urlStr.startsWith('/api/tts')) {
        try {
          const u = new URL(urlStr, 'http://127.0.0.1');
          const q = (u.searchParams.get('q') || '').trim().slice(0, 200);
          const tl = (u.searchParams.get('tl') || 'en-US').trim();
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
            res.writeHead(204);
            res.end();
            return;
          }
          const buf = Buffer.from(await upstream.arrayBuffer());
          res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=604800, immutable',
          });
          res.end(buf);
          return;
        } catch {
          res.writeHead(204);
          res.end();
          return;
        }
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
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve(addr.port);
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
    },
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
