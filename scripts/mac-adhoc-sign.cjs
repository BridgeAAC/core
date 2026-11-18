const { execFileSync } = require('node:child_process');
const path = require('node:path');

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== 'darwin') return;
  if (process.env.BRIDGE_ADHOC_SIGN !== '1') return;
  if (/-temp$/.test(context.appOutDir)) return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  const entitlements = path.join(__dirname, '..', 'resources', 'mac', 'entitlements.mac.plist');
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', '--entitlements', entitlements, app], {
    stdio: 'inherit',
  });
};
