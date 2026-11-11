import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const wikiSource = path.resolve('wiki');
const targetArg = process.argv[2] || process.env.WIKI_DIR;
const wikiGitUrl = 'https://github.com/BridgeAAC/core.wiki.git';

let targetDir = targetArg ? path.resolve(targetArg) : path.resolve('.wiki_repo');

if (!fs.existsSync(targetDir)) {
  console.log(`Cloning ${wikiGitUrl} into ${targetDir}...`);
  try {
    execSync(`git clone ${wikiGitUrl} "${targetDir}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Could not clone ${wikiGitUrl}. Make sure the wiki is enabled on GitHub.`);
    process.exit(1);
  }
} else {
  try {
    execSync('git pull --rebase', { cwd: targetDir, stdio: 'inherit' });
  } catch {}
}

const copyRecursive = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  const srcFiles = new Set(fs.readdirSync(src));
  for (const existing of fs.readdirSync(dest)) {
    if (existing === '.git') continue;
    if (!srcFiles.has(existing)) {
      const p = path.join(dest, existing);
      fs.rmSync(p, { recursive: true, force: true });
    }
  }
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
};

copyRecursive(wikiSource, targetDir);

console.log(`Copied wiki files from ${wikiSource} to ${targetDir}`);

try {
  execSync('git add -A', { cwd: targetDir, stdio: 'inherit' });
  const status = execSync('git status --porcelain', { cwd: targetDir }).toString().trim();
  if (!status) {
    console.log('Wiki repository is already up to date. Nothing to commit.');
  } else {
    execSync('git commit -m "Update BridgeAAC documentation wiki"', { cwd: targetDir, stdio: 'inherit' });
    console.log('Pushing to GitHub Wiki...');
    execSync('git push origin master || git push origin main', { cwd: targetDir, stdio: 'inherit' });
    console.log('Successfully updated GitHub Wiki!');
  }
} catch (err) {
  console.log('Note: To push manually:');
  console.log(`  cd "${targetDir}"`);
  console.log('  git add -A');
  console.log('  git commit -m "Update BridgeAAC documentation wiki"');
  console.log('  git push origin master');
}
