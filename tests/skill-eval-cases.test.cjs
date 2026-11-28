'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const casesPath = path.join(__dirname, 'skill-evals', 'cases.json');

test('skill behavior evaluation cases have unique ids and usable rubrics', () => {
  const suite = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  const evalRoot = path.dirname(casesPath);

  assert.equal(suite.schema, 'dev-flow.skill-evals.v1');
  assert.deepEqual(suite.hosts, ['Claude Code', 'Codex']);
  assert.ok(Array.isArray(suite.cases) && suite.cases.length >= 3);

  const ids = new Set();
  for (const scenario of suite.cases) {
    assert.equal(typeof scenario.id, 'string');
    assert.ok(scenario.id.trim());
    assert.ok(!ids.has(scenario.id), `duplicate scenario id: ${scenario.id}`);
    ids.add(scenario.id);
    assert.equal(typeof scenario.fixture, 'string', `${scenario.id} needs a fixture`);
    const fixturePath = path.resolve(evalRoot, scenario.fixture);
    assert.ok(fixturePath.startsWith(`${evalRoot}${path.sep}`), `${scenario.id} fixture must stay inside the eval directory`);
    assert.ok(fs.existsSync(fixturePath), `${scenario.id} fixture does not exist`);
    assert.equal(typeof scenario.setup, 'string');
    assert.equal(typeof scenario.prompt, 'string');
    assert.ok(scenario.setup.trim(), `${scenario.id} needs setup instructions`);
    assert.ok(scenario.prompt.trim(), `${scenario.id} needs a prompt`);
    assert.ok(Array.isArray(scenario.pass_criteria) && scenario.pass_criteria.length > 0, `${scenario.id} needs pass criteria`);
    assert.ok(Array.isArray(scenario.fail_criteria) && scenario.fail_criteria.length > 0, `${scenario.id} needs fail criteria`);
    assert.ok(scenario.pass_criteria.every((criterion) => typeof criterion === 'string' && criterion.trim()));
    assert.ok(scenario.fail_criteria.every((criterion) => typeof criterion === 'string' && criterion.trim()));
  }
});

test('discount bug fixture reproduces a failing test before evaluation', () => {
  const fixturePath = path.join(path.dirname(casesPath), 'fixtures', 'discount-bug');
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ['--test', 'test/discount.test.cjs'], {
    cwd: fixturePath,
    env,
    encoding: 'utf8',
  });

  assert.ifError(result.error);
  assert.notEqual(result.status, 0, 'fixture must fail before the agent fixes the bug');
});
