import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const targetDir = path.resolve('Sources/BridgeAAC/Resources/WebBundle');

if (!fs.existsSync(distDir)) {
  console.error('[sync-swift-bundle] dist/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(distDir, targetDir, { recursive: true });

const icon512 = path.resolve('public/icon-512.png');
const appIcon = path.resolve('AppIcon.png');
if (!fs.existsSync(appIcon) && fs.existsSync(icon512)) {
  fs.copyFileSync(icon512, appIcon);
}

console.log(`[sync-swift-bundle] Synced dist/ -> ${targetDir}`);
