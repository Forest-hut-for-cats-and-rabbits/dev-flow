#!/usr/bin/env node
'use strict';

// 校验仓库内 Markdown 的 ```json 围栏块都是合法 JSON。
// 跨平台实现，不依赖 bash/awk。发现非法块时退出码 1。

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules']);

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

function jsonBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let open = null;
  lines.forEach((line, index) => {
    if (open === null) {
      const start = /^\s*```([A-Za-z0-9_+-]*)\s*$/.exec(line);
      if (start) open = { lang: start[1].toLowerCase(), line: index + 2, body: [] };
      return;
    }
    if (/^\s*```\s*$/.test(line)) {
      if (open.lang === 'json') blocks.push({ line: open.line, text: open.body.join('\n') });
      open = null;
      return;
    }
    open.body.push(line);
  });
  return blocks;
}

const files = walk(root, []);
const errors = [];
let checked = 0;

for (const file of files) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  for (const block of jsonBlocks(fs.readFileSync(file, 'utf8'))) {
    checked += 1;
    try {
      JSON.parse(block.text);
    } catch (error) {
      errors.push(`${rel}:${block.line} ${error.message}`);
    }
  }
}

errors.forEach((e) => console.error(`ERROR ${e}`));
console.log(`检查 ${files.length} 个 Markdown，${checked} 个 JSON 块，${errors.length} 个错误`);
process.exit(errors.length > 0 ? 1 : 0);
