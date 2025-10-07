// scripts/postinstall.js

const { execSync } = require('child_process');

if (process.platform === 'linux' && process.arch === 'x64') {
  console.log('Detected Netlify (Linux x64), installing required native modules...');
  try {
    execSync('npm install @esbuild/linux-x64 @rollup/rollup-linux-x64-gnu', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to install Linux native modules:', err);
    process.exit(1);
  }
} else {
  console.log('Skipping native module install — not running on Linux x64 (Netlify)');
}
