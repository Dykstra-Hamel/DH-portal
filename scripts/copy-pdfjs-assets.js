#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const pdfjsRoot = path.join(projectRoot, 'node_modules', 'pdfjs-dist');
const destRoot = path.join(projectRoot, 'public', 'pdfjs');

const subdirs = ['standard_fonts', 'cmaps'];

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(pdfjsRoot)) {
  // pdfjs-dist may not be installed yet (e.g. during a partial install). Skip silently.
  process.exit(0);
}

for (const dir of subdirs) {
  const src = path.join(pdfjsRoot, dir);
  const dest = path.join(destRoot, dir);
  if (!fs.existsSync(src)) continue;
  fs.rmSync(dest, { recursive: true, force: true });
  copyRecursive(src, dest);
}
