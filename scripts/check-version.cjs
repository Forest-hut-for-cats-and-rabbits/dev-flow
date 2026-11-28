#!/usr/bin/env node
'use strict';

// 校验 plugin.json、.claude-plugin/plugin.json 与 CHANGELOG.md 的版本一致。
// 不含 README，避免文档提到历史版本时误报。

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

const plugins = [
  { rel: 'plugin.json', version: readJson('plugin.json').version },
  { rel: '.claude-plugin/plugin.json', version: readJson('.claude-plugin/plugin.json').version },
];

const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
const match = /^## \[(\d+\.\d+\.\d+)\]/m.exec(changelog);
const changelogVersion = match ? match[1] : null;

const errors = [];
const versions = new Set(plugins.map((p) => p.version));
if (versions.size > 1) {
  errors.push(`插件清单版本不一致: ${plugins.map((p) => `${p.rel}=${p.version}`).join(', ')}`);
}
if (!changelogVersion) {
  errors.push('CHANGELOG.md 未找到形如 "## [x.y.z]" 的版本标题');
} else if (!versions.has(changelogVersion)) {
  errors.push(`CHANGELOG 最新版本 ${changelogVersion} 与插件清单 ${[...versions].join('/')} 不一致`);
}

if (errors.length > 0) {
  errors.forEach((e) => console.error(`ERROR ${e}`));
  process.exit(1);
}

console.log(`版本一致: ${[...versions][0]}`);
