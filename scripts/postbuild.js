#!/usr/bin/env node

/**
 * Removes the Sanity core bridge script from the generated index.html.
 * The bridge loads a second copy of the Studio bundle which triggers
 * duplicate React context warnings in production builds.
 */

const fs = require('fs')
const path = require('path')

const indexPath = path.join(__dirname, '..', 'dist', 'index.html')

if (!fs.existsSync(indexPath)) {
  console.warn(`[postbuild] Skipping bridge removal – "${indexPath}" not found.`)
  process.exit(0)
}

const original = fs.readFileSync(indexPath, 'utf8')
const bridgePattern =
  /\s*<script src="https:\/\/core\.sanity-cdn\.(?:com|work)\/bridge\.js"[^>]*><\/script>\s*/

const updated = original.replace(bridgePattern, '\n')

if (updated === original) {
  console.warn('[postbuild] No core bridge script tag found – nothing to remove.')
  process.exit(0)
}

fs.writeFileSync(indexPath, updated, 'utf8')
console.log('[postbuild] Removed Sanity core bridge script to prevent duplicate context warnings.')
