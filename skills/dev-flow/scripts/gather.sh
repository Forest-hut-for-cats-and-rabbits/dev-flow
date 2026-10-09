#!/usr/bin/env bash
# gather.sh — 为 dev-flow 流水线收集本次会话的代码改动上下文
# 用法: bash gather.sh [auto|staged|all]
#   auto   (默认) 有暂存改动就看暂存区，否则看工作区未暂存改动
#   staged 强制只看暂存区
#   all    看工作区相对 HEAD 的全部改动
# 环境变量: MAX_DIFF_LINES 控制 patch 截断行数，默认 2000

set -eu

MODE="${1:-auto}"
MAX_DIFF_LINES="${MAX_DIFF_LINES:-2000}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: 当前目录不是 git 仓库，dev-flow 需要 git 来定位本次改动"
  exit 2
fi

HAS_HEAD=0
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  HAS_HEAD=1
fi

echo "=== REPO ==="
git rev-parse --show-toplevel 2>/dev/null || true

echo
echo "=== BRANCH ==="
git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(尚无提交)"

echo
echo "=== STAGED FILES (name-status) ==="
git diff --cached --name-status 2>/dev/null || true

STAGED_COUNT=$(git diff --cached --name-only 2>/dev/null | grep -c . || true)

echo
echo "=== UNSTAGED FILES (name-status) ==="
git diff --name-status 2>/dev/null || true

echo
echo "=== UNTRACKED FILES ==="
git ls-files --others --exclude-standard 2>/dev/null || true

echo
echo "=== RECENT COMMITS (最近 8 条，用于理解上下文) ==="
if [ "$HAS_HEAD" -eq 1 ]; then
  git log -8 --pretty=format:'%h %s' 2>/dev/null || echo "(无法读取历史)"
  echo
else
  echo "(尚无历史提交)"
fi

echo
# 决定分析哪份 diff
if [ "$MODE" = "all" ] && [ "$HAS_HEAD" -eq 1 ]; then
  echo "=== DIFF (工作区 vs HEAD, mode=all) ==="
  set -- diff HEAD
elif [ "$MODE" = "staged" ] || [ "${STAGED_COUNT:-0}" -gt 0 ]; then
  echo "=== DIFF (暂存区 staged) ==="
  set -- diff --cached
else
  echo "=== DIFF (未暂存 unstaged —— 暂存区为空) ==="
  set -- diff
fi

echo "--- stat ---"
git "$@" --stat 2>/dev/null || true

echo
echo "--- patch (最多 ${MAX_DIFF_LINES} 行) ---"
TMP=$(mktemp)
git "$@" > "$TMP" 2>/dev/null || true
TOTAL=$(grep -c '' "$TMP" || true)
head -n "$MAX_DIFF_LINES" "$TMP"
if [ "${TOTAL:-0}" -gt "$MAX_DIFF_LINES" ]; then
  echo
  echo "... [已截断: 共 ${TOTAL} 行, 仅显示前 ${MAX_DIFF_LINES} 行。如需细看某文件, 单独跑 git diff <文件>]"
fi
rm -f "$TMP"
