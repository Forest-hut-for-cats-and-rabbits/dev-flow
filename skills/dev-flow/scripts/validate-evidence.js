#!/usr/bin/env node
'use strict';

// dev-flow 证据记录机械校验。
// 只判断能确定性核对的部分：字段形态、引用是否存在、日志文件是否存在、
// 声明是否超出证据。不能证明命令真的被执行过，也不能替代实际测试。

const fs = require('fs');
const path = require('path');

const USAGE = [
  '用法: node validate-evidence.js <文件...> [--root <项目根目录>] [--json]',
  '',
  '文件可以是 Markdown 记录（自动提取 ```json 围栏块）或纯 JSON 文件。',
  '校验不通过时退出码为 1，参数或解析错误为 2。',
].join('\n');

const SCHEMAS = new Set([
  'dev-flow.capability.v1',
  'dev-flow.verification.v1',
  'dev-flow.claims.v1',
  'dev-flow.findings.v1',
  'dev-flow.learnings.v1',
]);

const STATUSES = new Set(['passed', 'failed', 'degraded', 'not-run']);
const VERIFIERS = new Set(['main', 'subagent']);
const CODE_STATES = new Set(['committed', 'uncommitted', 'mixed', 'unknown']);
const CLAIM_STATUSES = new Set(['verified', 'partial', 'unverified', 'unsupported']);
const LENSES = new Set(['product', 'test', 'code', 'other']);
const SEVERITIES = new Set(['blocking', 'clarify', 'suggestion']);
const DISPOSITIONS = new Set(['resolved', 'deferred', 'accepted', 'open']);
const SUBAGENT_STATES = new Set(['available', 'missing', 'unknown']);
const ISOLATION_STATES = new Set(['isolated', 'inherited', 'unknown']);
const PROBE_STATES = new Set(['attempted', 'unavailable', 'not_applicable']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isInt(value) {
  return typeof value === 'number' && Number.isInteger(value);
}

function parseArgs(argv) {
  const files = [];
  let root = process.cwd();
  let json = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') {
      i += 1;
      if (i >= argv.length) throw new Error('--root 缺少路径参数');
      root = path.resolve(argv[i]);
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '-h' || arg === '--help') {
      return { help: true, files, root, json };
    } else if (arg.startsWith('-')) {
      throw new Error(`未知参数: ${arg}`);
    } else {
      files.push(arg);
    }
  }

  return { help: false, files, root, json };
}

function extractBlocks(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (path.extname(file).toLowerCase() === '.json') {
    return [{ file, line: 1, text }];
  }

  const lines = text.split(/\r?\n/);
  const blocks = [];
  let open = null;

  lines.forEach((line, index) => {
    if (open === null) {
      const start = /^\s*```([A-Za-z0-9_+-]*)\s*$/.exec(line);
      if (start) {
        open = { lang: (start[1] || '').toLowerCase(), line: index + 2, body: [] };
      }
      return;
    }

    if (/^\s*```\s*$/.test(line)) {
      if (open.lang === 'json') {
        blocks.push({ file, line: open.line, text: open.body.join('\n') });
      }
      open = null;
      return;
    }

    open.body.push(line);
  });

  return blocks;
}

function loadDocuments(files) {
  const docs = [];
  const parseErrors = [];

  files.forEach((file) => {
    if (!fs.existsSync(file)) {
      parseErrors.push({ where: file, code: 'file-missing', message: '文件不存在' });
      return;
    }

    extractBlocks(file).forEach((block) => {
      const where = `${block.file}:${block.line}`;
      let doc;
      try {
        doc = JSON.parse(block.text);
      } catch (error) {
        parseErrors.push({ where, code: 'json-invalid', message: error.message });
        return;
      }

      if (!isObject(doc)) {
        parseErrors.push({ where, code: 'json-not-object', message: '顶层必须是 JSON 对象' });
        return;
      }

      if (!SCHEMAS.has(doc.schema)) {
        parseErrors.push({
          where,
          code: 'schema-unknown',
          message: `未知 schema: ${String(doc.schema)}`,
        });
        return;
      }

      docs.push({ where, doc });
    });
  });

  return { docs, parseErrors };
}

function buildIndex(docs, errors) {
  const checks = new Map();
  const claims = new Map();
  const findings = new Map();
  const capabilities = new Map();
  const checkEntries = [];
  const claimEntries = [];
  const findingEntries = [];
  const claimDocs = new Map();

  const scoped = (task, id) => `${String(task)}::${String(id)}`;

  const register = (map, task, id, entry, entries, where, code) => {
    if (!isText(id)) {
      errors.push({ where, code, message: '缺少非空 id' });
      return false;
    }
    const key = scoped(task, id);
    if (map.has(key)) {
      errors.push({ where, code: `${code}-duplicate`, message: `id 重复: ${id}` });
      return false;
    }
    map.set(key, entry);
    entries.push(entry);
    return true;
  };

  docs.forEach(({ where, doc }) => {
    if (!isText(doc.task)) {
      errors.push({ where, code: 'task-missing', message: `${doc.schema} 缺少非空 task` });
      return;
    }

    if (doc.schema === 'dev-flow.capability.v1') {
      const task = doc.task;
      if (capabilities.has(task)) {
        errors.push({ where, code: 'capability-duplicate', message: `同一 task 出现多个能力块: ${String(task)}` });
        return;
      }
      capabilities.set(task, { where, doc });
      return;
    }

    const list = doc.schema === 'dev-flow.verification.v1' ? doc.checks
      : doc.schema === 'dev-flow.claims.v1' ? doc.claims
        : doc.schema === 'dev-flow.findings.v1' ? doc.findings
          : doc.learnings;

    if (!Array.isArray(list) || list.length === 0) {
      errors.push({ where, code: 'list-empty', message: `${doc.schema} 的列表字段缺失或为空` });
      return;
    }

    list.forEach((item) => {
      if (!isObject(item)) {
        errors.push({ where, code: 'item-not-object', message: `${doc.schema} 列表项必须是对象` });
        return;
      }
      const entry = { where, doc, item };
      if (doc.schema === 'dev-flow.verification.v1') {
        register(checks, doc.task, item.id, entry, checkEntries, where, 'check-id');
      } else if (doc.schema === 'dev-flow.claims.v1') {
        register(claims, doc.task, item.id, entry, claimEntries, where, 'claim-id');
        const list = claimDocs.get(doc.task) || [];
        if (!list.includes(doc)) list.push(doc);
        claimDocs.set(doc.task, list);
      } else if (doc.schema === 'dev-flow.findings.v1') {
        register(findings, doc.task, item.id, entry, findingEntries, where, 'finding-id');
      } else {
        register(findings, doc.task, `learning:${item.id}`, entry, findingEntries, where, 'learning-id');
      }
    });
  });

  const lookupCheck = (task, ref) => checks.get(scoped(task, ref));

  return {
    checks,
    claims,
    findings,
    capabilities,
    checkEntries,
    claimEntries,
    findingEntries,
    claimDocs,
    lookupCheck,
  };
}

function resolveLog(root, logPath) {
  if (!isText(logPath)) return { ok: false, code: 'log-missing', message: '缺少 log 路径' };
  if (path.isAbsolute(logPath) || /^[a-zA-Z]:[\\/]/.test(logPath)) {
    return { ok: false, code: 'log-not-relative', message: `log 必须是仓库内相对路径: ${logPath}` };
  }

  const full = path.resolve(root, logPath);
  const base = root.endsWith(path.sep) ? root : root + path.sep;
  if (!full.startsWith(base) && full !== root) {
    return { ok: false, code: 'log-escapes-root', message: `log 落在项目根目录之外: ${logPath}` };
  }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return { ok: false, code: 'log-not-found', message: `log 文件不存在: ${logPath}` };
  }
  if (fs.statSync(full).size === 0) {
    return { ok: false, code: 'log-empty', message: `log 文件为空: ${logPath}` };
  }
  return { ok: true, full };
}

function isInsideRoot(root, fullPath) {
  try {
    const realRoot = fs.realpathSync(path.resolve(root));
    const realFile = fs.realpathSync(path.resolve(fullPath));
    const base = realRoot.endsWith(path.sep) ? realRoot : realRoot + path.sep;
    return realFile.startsWith(base);
  } catch {
    return false;
  }
}

function validateChecks(index, root, errors, notices) {
  index.checkEntries.forEach(({ where, doc, item }) => {
    const id = item.id;
    if (!STATUSES.has(item.status)) {
      errors.push({ where, code: 'check-status-invalid', message: `${id}: status 必须是 passed/failed/degraded/not-run` });
    }
    if (!VERIFIERS.has(item.verifier)) {
      errors.push({ where, code: 'check-verifier-invalid', message: `${id}: verifier 必须是 main 或 subagent` });
    }
    if (!CODE_STATES.has(item.code_state)) {
      errors.push({ where, code: 'check-code-state-invalid', message: `${id}: code_state 必须是 committed/uncommitted/mixed/unknown` });
    }
    if (item.code_state === 'unknown' && item.status === 'passed') {
      errors.push({
        where,
        code: 'check-unknown-code-state',
        message: `${id}: code_state=unknown 无法说明测的是哪版代码，不能标记 passed`,
      });
    }
    if (typeof item.ran !== 'boolean') {
      errors.push({ where, code: 'check-ran-invalid', message: `${id}: ran 必须是布尔值` });
      return;
    }

    if (item.ran === false) {
      if (item.exit_code !== null) {
        errors.push({ where, code: 'check-not-run-exit-code', message: `${id}: 未执行的检查 exit_code 必须为 null` });
      }
      if (!isText(item.reason_code)) {
        errors.push({ where, code: 'check-not-run-reason', message: `${id}: 未执行的检查必须写明 reason_code` });
      }
      if (item.status !== 'not-run') {
        errors.push({ where, code: 'check-not-run-status', message: `${id}: ran=false 时 status 必须是 not-run` });
      }
      return;
    }

    if (!isText(item.command)) {
      errors.push({ where, code: 'check-command-missing', message: `${id}: 已执行检查必须记录实际命令` });
    }
    if (!isInt(item.exit_code)) {
      errors.push({ where, code: 'check-exit-code-missing', message: `${id}: 已执行检查必须记录整数 exit_code` });
    }
    if (item.status === 'not-run') {
      errors.push({ where, code: 'check-ran-not-run', message: `${id}: ran=true 时 status 不能是 not-run` });
    }
    if (item.status === 'passed' && item.exit_code !== 0) {
      errors.push({ where, code: 'check-passed-nonzero', message: `${id}: passed 必须对应 exit_code=0` });
    }
    if (item.status === 'failed' && item.exit_code === 0) {
      errors.push({ where, code: 'check-failed-zero', message: `${id}: failed 必须对应非零 exit_code` });
    }
    if (item.status === 'degraded' && item.exit_code === 0) {
      errors.push({
        where,
        code: 'check-degraded-zero',
        message: `${id}: exit_code=0 与 degraded 冲突；请标记 passed，或提供真实的非零退出结果`,
      });
    }
    if (item.status === 'degraded' && !isText(item.reason_code)) {
      errors.push({ where, code: 'check-degraded-reason', message: `${id}: degraded 必须写明 reason_code` });
    }

    const log = resolveLog(root, item.log);
    if (!log.ok) {
      errors.push({ where, code: log.code, message: `${id}: ${log.message}` });
    } else if (!isInsideRoot(root, log.full)) {
      errors.push({
        where,
        code: 'log-symlink-escapes-root',
        message: `${id}: 日志真实路径落在项目根目录之外`,
      });
    } else if (item.code_state === 'committed') {
      if (!isText(item.commit)) {
        errors.push({
          where,
          code: 'check-commit-missing',
          message: `${id}: committed 检查必须记录 commit，把日志绑定到具体代码版本`,
        });
      }
    } else if (item.code_state === 'uncommitted') {
      if (!isText(item.tested_at)) {
        errors.push({
          where,
          code: 'check-tested-at-missing',
          message: `${id}: uncommitted 检查必须记录 tested_at，避免旧日志冒充新代码结果`,
        });
      } else if (!isText(item.code_fingerprint)) {
        errors.push({
          where,
          code: 'check-fingerprint-missing',
          message: `${id}: uncommitted 检查必须记录 code_fingerprint（如 tree hash 或 diff hash）`,
        });
      }
    } else if (item.code_state === 'mixed') {
      if (!isText(item.tested_at) || !isText(item.code_fingerprint)) {
        errors.push({
          where,
          code: 'check-mixed-stale-risk',
          message: `${id}: mixed 检查需要 tested_at 和 code_fingerprint，否则无法排除旧日志`,
        });
      }
    }

    if (item.verifier === 'subagent') {
      const capability = index.capabilities.get(doc.task);
      if (!capability) {
        notices.push({ where, code: 'capability-not-recorded', message: `${id}: 声称由子代理执行，但未记录 dev-flow.capability.v1` });
      } else if (capability.doc.subagent !== 'available') {
        errors.push({
          where,
          code: 'check-subagent-conflict',
          message: `${id}: 声称由子代理执行，但能力记录为 subagent=${String(capability.doc.subagent)}`,
        });
      }
    }
  });
}

function passingCheckIds(index, task) {
  const passed = new Set();
  index.checkEntries.forEach(({ doc, item }) => {
    if (doc.task !== task || item.ran !== true) return;
    if (item.status !== 'passed') return;
    if (item.code_state === 'unknown') return;
    passed.add(item.id);
  });
  return passed;
}

function validateClaims(index, errors, notices) {
  const effectiveByDoc = new Map();

  index.claimEntries.forEach(({ where, doc, item }) => {
    const id = item.id;
    const passed = passingCheckIds(index, doc.task);
    let effective = item.status;
    if (!isText(item.claim)) {
      errors.push({ where, code: 'claim-text-missing', message: `${id}: 缺少 claim 描述` });
    }
    if (!CLAIM_STATUSES.has(item.status)) {
      errors.push({ where, code: 'claim-status-invalid', message: `${id}: status 必须是 verified/partial/unverified/unsupported` });
    }
    if (!Array.isArray(item.evidence)) {
      errors.push({ where, code: 'claim-evidence-invalid', message: `${id}: evidence 必须是数组` });
      return;
    }

    const missing = item.evidence.filter((ref) => !index.lookupCheck(doc.task, ref));
    if (missing.length > 0) {
      errors.push({ where, code: 'claim-evidence-unknown', message: `${id}: 引用了不存在的检查 ${missing.join(', ')}` });
    }

    const ownPassing = item.evidence.filter((ref) => passed.has(ref));
    if (item.status === 'verified') {
      if (item.evidence.length === 0) {
        errors.push({ where, code: 'claim-verified-without-evidence', message: `${id}: verified 声明必须关联检查记录` });
        effective = 'unsupported';
      } else if (ownPassing.length === 0) {
        errors.push({ where, code: 'claim-verified-without-passing-check', message: `${id}: verified 声明没有任何通过的检查支撑` });
        effective = 'unverified';
      }
    }

    const list = effectiveByDoc.get(doc) || [];
    list.push(effective);
    effectiveByDoc.set(doc, list);

    if (item.independence === true) {
      const capability = index.capabilities.get(doc.task);
      if (!capability) {
        errors.push({ where, code: 'independence-without-capability', message: `${id}: 声称独立验证，但未记录宿主能力` });
      } else {
        const { subagent, isolation } = capability.doc;
        if (subagent !== 'available') {
          errors.push({ where, code: 'independence-without-subagent', message: `${id}: 声称独立验证，但 subagent=${String(subagent)}` });
        }
        if (isolation !== 'isolated') {
          errors.push({ where, code: 'independence-without-isolation', message: `${id}: 声称独立验证，但 isolation=${String(isolation)}` });
        }
      }

      const independentChecks = item.evidence.filter((ref) => {
        const entry = index.lookupCheck(doc.task, ref);
        return entry && entry.item.verifier === 'subagent' && passed.has(ref);
      });
      if (independentChecks.length === 0) {
        errors.push({
          where,
          code: 'independence-without-subagent-check',
          message: `${id}: 声称独立验证，但引用的通过检查里没有 verifier=subagent 的记录`,
        });
      }
    }
  });

  index.claimDocs.forEach((docs) => {
    const declared = docs[0].overall;
    const statuses = docs.flatMap((d) => effectiveByDoc.get(d) || []);
    let computed;
    if (statuses.every((s) => s === 'verified')) {
      computed = 'verified';
    } else if (statuses.some((s) => s === 'verified' || s === 'partial')) {
      computed = 'partial';
    } else if (statuses.some((s) => s === 'unverified')) {
      computed = 'unverified';
    } else {
      computed = 'unsupported';
    }
    if (declared === undefined) {
      notices.push({ where: 'claims', code: 'overall-missing', message: `建议写明 overall，当前计算为 ${String(computed)}` });
      return;
    }
    if (!CLAIM_STATUSES.has(declared)) {
      errors.push({ where: 'claims', code: 'overall-invalid', message: `overall 取值无效: ${String(declared)}` });
      return;
    }
    if (declared !== computed) {
      errors.push({
        where: 'claims',
        code: 'overall-mismatch',
        message: `overall=${declared}，但按证据修正后的各声明合成结果为 ${String(computed)}`,
      });
    }
  });
}

function validateFindings(index, errors) {
  index.findingEntries.forEach(({ where, doc, item }) => {
    const id = item.id;
    if (doc.schema !== 'dev-flow.findings.v1') return;
    const passed = passingCheckIds(index, doc.task);
    if (!LENSES.has(item.lens)) {
      errors.push({ where, code: 'finding-lens-invalid', message: `${id}: lens 必须是 product/test/code/other` });
    }
    if (!SEVERITIES.has(item.severity)) {
      errors.push({ where, code: 'finding-severity-invalid', message: `${id}: severity 必须是 blocking/clarify/suggestion` });
    }
    if (!DISPOSITIONS.has(item.disposition)) {
      errors.push({ where, code: 'finding-disposition-invalid', message: `${id}: disposition 必须是 resolved/deferred/accepted/open` });
    }
    if (!isText(item.evidence)) {
      errors.push({ where, code: 'finding-evidence-missing', message: `${id}: 缺少计划或代码位置依据` });
    }

    if (item.severity === 'blocking') {
      if (item.disposition === 'open' || item.disposition === 'deferred') {
        if (!isText(item.approval)) {
          errors.push({
            where,
            code: 'blocking-finding-unresolved',
            message: `${id}: 阻碍项处于 ${String(item.disposition)}，需要写明用户批准依据 approval`,
          });
        }
      }
    }

    if (item.requires_verification === true) {
      if (!Array.isArray(item.verification) || item.verification.length === 0) {
        errors.push({ where, code: 'finding-verification-missing', message: `${id}: 要求复验但未关联检查` });
        return;
      }
      const unknown = item.verification.filter((ref) => !index.lookupCheck(doc.task, ref));
      if (unknown.length > 0) {
        errors.push({ where, code: 'finding-verification-unknown', message: `${id}: 引用了不存在的检查 ${unknown.join(', ')}` });
      }
      const ok = item.verification.filter((ref) => passed.has(ref));
      if (ok.length === 0 && unknown.length === 0) {
        errors.push({ where, code: 'finding-verification-failed', message: `${id}: 复验没有通过的检查支撑` });
      }
    }
  });
}

function validateLearnings(index, errors) {
  index.findingEntries.forEach(({ where, doc, item }) => {
    if (doc.schema !== 'dev-flow.learnings.v1') return;
    const id = `learning:${item.id}`;
    if (!isText(item.title)) {
      errors.push({ where, code: 'learning-title-missing', message: `${id}: 缺少标题` });
    }
    if (!Array.isArray(item.source_refs) || item.source_refs.length === 0) {
      errors.push({ where, code: 'learning-source-missing', message: `${id}: 可复用经验必须给出 source_refs` });
    }
    if (!isText(item.invalidation_condition)) {
      errors.push({ where, code: 'learning-invalidation-missing', message: `${id}: 可复用经验必须写明失效条件` });
    }
  });
}

function validateCapabilities(index, errors) {
  index.capabilities.forEach(({ where, doc }, task) => {
    if (!SUBAGENT_STATES.has(doc.subagent)) {
      errors.push({ where, code: 'capability-subagent-invalid', message: `${task}: subagent 必须是 available/missing/unknown` });
    }
    if (!ISOLATION_STATES.has(doc.isolation)) {
      errors.push({ where, code: 'capability-isolation-invalid', message: `${task}: isolation 必须是 isolated/inherited/unknown` });
    }
    if (!PROBE_STATES.has(doc.probe)) {
      errors.push({ where, code: 'capability-probe-invalid', message: `${task}: probe 必须是 attempted/unavailable/not_applicable` });
    }
    if (doc.subagent === 'available' && doc.probe !== 'attempted') {
      errors.push({ where, code: 'capability-available-without-probe', message: `${task}: available 需要 probe=attempted` });
    }
    if (doc.subagent !== 'available' && !isText(doc.reason_code)) {
      errors.push({ where, code: 'capability-reason-missing', message: `${task}: 能力不可用时必须写明 reason_code` });
    }
  });
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(USAGE);
    return 2;
  }

  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  if (args.files.length === 0) {
    console.error('未提供待校验文件');
    console.error(USAGE);
    return 2;
  }

  const { docs, parseErrors } = loadDocuments(args.files);
  const errors = [...parseErrors];
  const notices = [];

  if (parseErrors.length === 0) {
    const index = buildIndex(docs, errors);
    validateCapabilities(index, errors);
    validateChecks(index, args.root, errors, notices);
    validateClaims(index, errors, notices);
    validateFindings(index, errors);
    validateLearnings(index, errors);
  }

  if (args.json) {
    console.log(JSON.stringify({ errors, notices, ok: errors.length === 0 }, null, 2));
  } else {
    errors.forEach((e) => console.log(`ERROR ${e.where} ${e.code} ${e.message}`));
    notices.forEach((n) => console.log(`NOTICE ${n.where} ${n.code} ${n.message}`));
    console.log('');
    console.log(`校验结果: ${errors.length === 0 ? '通过' : `${errors.length} 项错误`}，${notices.length} 项提示，共 ${docs.length} 个记录块`);
  }

  if (errors.length > 0) return 1;
  return 0;
}

process.exitCode = main();
