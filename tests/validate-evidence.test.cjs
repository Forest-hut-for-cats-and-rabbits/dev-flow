'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const validatorPath = path.resolve(__dirname, '../skills/dev-flow/scripts/validate-evidence.js');

function createProject(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-flow-evidence-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'logs'));
  fs.writeFileSync(path.join(root, 'logs/check.log'), 'check passed\n');
  return root;
}

function validDocuments() {
  return [
    {
      schema: 'dev-flow.capability.v1',
      task: 'test-task',
      subagent: 'available',
      isolation: 'isolated',
      probe: 'attempted',
      reason_code: '',
    },
    {
      schema: 'dev-flow.verification.v1',
      task: 'test-task',
      checks: [
        {
          id: 'C-001',
          command: 'node test.js',
          ran: true,
          exit_code: 0,
          status: 'passed',
          verifier: 'subagent',
          code_state: 'uncommitted',
          log: 'logs/check.log',
          tested_at: '2026-11-22T10:30:00Z',
          code_fingerprint: 'sha256:abc123',
          reason_code: '',
        },
      ],
    },
    {
      schema: 'dev-flow.claims.v1',
      task: 'test-task',
      overall: 'verified',
      claims: [
        {
          id: 'CL-001',
          claim: 'The behavior is verified.',
          status: 'verified',
          evidence: ['C-001'],
          independence: true,
          reason_code: '',
        },
      ],
    },
  ];
}

function writeMarkdown(root, documents) {
  const reportPath = path.join(root, 'report.md');
  const blocks = documents.map((document) => `\`\`\`json\n${JSON.stringify(document, null, 2)}\n\`\`\``);
  fs.writeFileSync(reportPath, blocks.join('\n\n'));
  return reportPath;
}

function runValidator(root, filePath) {
  const result = spawnSync(process.execPath, [validatorPath, filePath, '--root', root, '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.ifError(result.error);
  return { exitCode: result.status, output: JSON.parse(result.stdout) };
}

test('accepts linked capability, passing check, and independent verified claim', (t) => {
  const root = createProject(t);
  const result = runValidator(root, writeMarkdown(root, validDocuments()));

  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.output.errors, []);
  assert.equal(result.output.ok, true);
});

test('rejects a verified claim without a passing referenced check', (t) => {
  const root = createProject(t);
  const documents = validDocuments();
  documents[1].checks[0].status = 'failed';
  documents[1].checks[0].exit_code = 1;
  documents[2].overall = 'unverified';

  const result = runValidator(root, writeMarkdown(root, documents));

  assert.equal(result.exitCode, 1);
  assert.ok(result.output.errors.some((error) => error.code === 'claim-verified-without-passing-check'));
});

test('rejects verification logs that escape the project root', (t) => {
  const root = createProject(t);
  const documents = validDocuments();
  documents[1].checks[0].log = '../outside.log';

  const result = runValidator(root, writeMarkdown(root, documents));

  assert.equal(result.exitCode, 1);
  assert.ok(result.output.errors.some((error) => error.code === 'log-escapes-root'));
});

test('rejects independence claims when subagent capability is unavailable', (t) => {
  const root = createProject(t);
  const documents = validDocuments();
  documents[0].subagent = 'missing';
  documents[0].isolation = 'unknown';
  documents[0].probe = 'unavailable';
  documents[0].reason_code = 'host-has-no-subagent-tool';

  const result = runValidator(root, writeMarkdown(root, documents));

  assert.equal(result.exitCode, 1);
  assert.ok(result.output.errors.some((error) => error.code === 'check-subagent-conflict'));
  assert.ok(result.output.errors.some((error) => error.code === 'independence-without-subagent'));
});

test('reports malformed JSON fenced blocks', (t) => {
  const root = createProject(t);
  const reportPath = path.join(root, 'malformed.md');
  fs.writeFileSync(reportPath, '```json\n{"schema": broken}\n```\n');

  const result = runValidator(root, reportPath);

  assert.equal(result.exitCode, 1);
  assert.ok(result.output.errors.some((error) => error.code === 'json-invalid'));
});

test('rejects passed checks tied to an unknown code state', (t) => {
  const root = createProject(t);
  const documents = validDocuments();
  documents[1].checks[0].code_state = 'unknown';
  documents[2].claims[0].independence = false;
  documents[0].subagent = 'unknown';
  documents[0].isolation = 'unknown';
  documents[0].probe = 'unavailable';
  documents[0].reason_code = 'capability-probe-unavailable';

  const result = runValidator(root, writeMarkdown(root, documents));

  assert.equal(result.exitCode, 1);
  assert.ok(result.output.errors.some((error) => error.code === 'check-unknown-code-state'));
});
