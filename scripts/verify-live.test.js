const { test } = require('node:test');
const assert = require('node:assert/strict');
const { urlPathFor, sha256 } = require('./verify-live.js');

test('the homepage maps to /', () => assert.equal(urlPathFor('index.html'), '/'));
test('a subpage maps to its directory with a trailing slash', () => assert.equal(urlPathFor('services/index.html'), '/services/'));
test('a nested subpage maps to its directory', () => assert.equal(urlPathFor('a/b/index.html'), '/a/b/'));
test('an asset maps to its own path', () => assert.equal(urlPathFor('services/hero.webp'), '/services/hero.webp'));
test('a top-level asset maps to its own path', () => assert.equal(urlPathFor('theme.css'), '/theme.css'));
test('sha256 of known input', () => assert.equal(sha256(Buffer.from('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
