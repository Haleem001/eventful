// Patch Node.js module resolution to normalize Windows path casing in pnpm symlinks.
// pnpm creates symlinks whose targets may have inconsistent casing (e.g. `Desktop` vs `desktop`),
// causing Node.js to create duplicate require.cache entries for the same physical file.
// This file must be loaded with `--require ./patch-pnpm-casing.js` BEFORE any NestJS modules.

const Module = require('module');
const path = require('path');
const fs = require('fs');

const origResolveFilename = Module._resolveFilename;

const realpathCache = new Map();

function normalizeCasing(p) {
  if (!p || typeof p !== 'string') return p;
  if (!p.includes('eventful') && !p.includes('pnpm')) return p;

  const cached = realpathCache.get(p);
  if (cached !== undefined) return cached;

  try {
    const real = fs.realpathSync.native(p);
    if (real !== p) {
      realpathCache.set(p, real);
      return real;
    }
  } catch {
    // path might not exist yet (resolution probing)
  }

  realpathCache.set(p, p);
  return p;
}

Module._resolveFilename = function (request, parent, isMain, options) {
  const resolved = origResolveFilename.call(this, request, parent, isMain, options);
  return normalizeCasing(resolved);
};
