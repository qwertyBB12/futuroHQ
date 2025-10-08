// scripts/postinstall.js

const {execSync} = require('child_process');

const pkg = require('../package.json');

if (process.platform === 'linux' && process.arch === 'x64') {
  console.log('Detected Netlify (Linux x64), installing required native modules...');
  try {
    const versions = {...pkg.dependencies, ...pkg.devDependencies};

    const packages = [];

    const esbuildVersion = versions.esbuild;
    if (esbuildVersion) {
      packages.push(`@esbuild/linux-x64@${esbuildVersion}`);
    }

    const rollupVersion = versions.rollup;
    if (rollupVersion) {
      packages.push(`@rollup/rollup-linux-x64-gnu@${rollupVersion}`);
    }

    const lightningcssVersion = versions.lightningcss;
    if (lightningcssVersion) {
      packages.push(`lightningcss-linux-x64-gnu@${lightningcssVersion}`);
    }

    if (packages.length > 0) {
      execSync(`npm install --no-save ${packages.join(' ')}`, {stdio: 'inherit'});
    } else {
      console.log('No additional Linux native modules required.');
    }
  } catch (err) {
    console.error('Failed to install Linux native modules:', err);
    process.exit(1);
  }
} else {
  console.log('Skipping native module install — not running on Linux x64 (Netlify)');
}
