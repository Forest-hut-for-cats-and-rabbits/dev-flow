'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { discountedPrice } = require('../src/discount');

test('applies a percentage discount', () => {
  assert.equal(discountedPrice(100, 20), 80);
});

test('a zero discount preserves the original price', () => {
  assert.equal(discountedPrice(100, 0), 100);
});
