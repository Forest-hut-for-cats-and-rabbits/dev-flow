#!/usr/bin/env node
'use strict';

// 跨平台快照脚本，替代 Bash gather.sh，Windows/Linux/macOS 通用
// 用法: node gather.cjs [auto|staged|all] [MAX_DIFF_LINES=2000]

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MODES = new Set(['auto', 'staged', 'all']);
const MODE = process.argv[2] || 'auto';
const MAX_DIFF_LINES = parseInt(process.argv[3] || '2000', 10) || 2000;

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

if (!run('git rev-parse --is-inside-work-tree')) {
  console.error('ERROR: 当前目录不是 git 仓库，gather.cjs 需要在目标项目的 Git 工作区运行');
  process.exit(2);
}

const HAS_HEAD = !!run('git rev-parse --verify HEAD');
const STAGED_FILES = run('git diff --cached --name-only');
const STAGED_COUNT = STAGED_FILES ? STAGED_FILES.split(/\r?\n/).filter(Boolean).length : 0;

console.log('=== REPO ===');
console.log(run('git rev-parse --show-toplevel') || '(无法读取仓库根目录)');

console.log('\n=== BRANCH ===');
console.log(run('git rev-parse --abbrev-ref HEAD') || '(尚无提交)');

console.log('\n=== STAGED FILES (name-status) ===');
console.log(run('git diff --cached --name-status') || '(无暂存文件)');

console.log('\n=== UNSTAGED FILES (name-status) ===');
console.log(run('git diff --name-status') || '(无未暂存文件)');

console.log('\n=== UNTRACKED FILES ===');
console.log(run('git ls-files --others --exclude-standard') || '(无未跟踪文件)');

console.log('\n=== RECENT COMMITS (最近 8 条，用于理解上下文) ===');
if (HAS_HEAD) {
  console.log(run('git log -8 --pretty=format:\"%h %s\"') || '(无法读取历史)');
} else {
  console.log('(尚无历史提交)');
}

console.log('');

let diffCmd;
let modeName;

if (MODE === 'all' && HAS_HEAD) {
  diffCmd = 'git diff HEAD';
  modeName = '工作区 vs HEAD, mode=all';
} else if (MODE === 'staged' || STAGED_COUNT > 0) {
  diffCmd = 'git diff --cached';
  modeName = '暂存区 staged';
} else {
  diffCmd = 'git diff';
  modeName = '工作区未暂存改动';
}

console.log(`=== DIFF (${modeName}) ===`);
const diff = run(diffCmd);
if (!diff) {
  console.log('(无改动)');
  process.exit(0);
}

const lines = diff.split(/\r?\n/);
if (lines.length > MAX_DIFF_LINES) {
  console.log(lines.slice(0, MAX_DIFF_LINES).join('\n'));
  console.log(`\n... (diff 截断，共 ${lines.length} 行，超过 MAX_DIFF_LINES=${MAX_DIFF_LINES})`);
} else {
  console.log(diff);
}
