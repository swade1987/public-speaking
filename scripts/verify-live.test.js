const { test } = require('node:test');
const assert = require('node:assert/strict');
const { urlPathFor, sha256, stylesheetHrefs } = require('./verify-live.js');

test('the homepage maps to /', () => assert.equal(urlPathFor('index.html'), '/'));
test('a subpage maps to its directory with a trailing slash', () => assert.equal(urlPathFor('services/index.html'), '/services/'));
test('a nested subpage maps to its directory', () => assert.equal(urlPathFor('a/b/index.html'), '/a/b/'));
test('an asset maps to its own path', () => assert.equal(urlPathFor('services/hero.webp'), '/services/hero.webp'));
test('a top-level asset maps to its own path', () => assert.equal(urlPathFor('theme.css'), '/theme.css'));
test('sha256 of known input', () => assert.equal(sha256(Buffer.from('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));

// The address a browser requests for the stylesheet is the one in the page, version tag
// included, so that is the address worth checking. On 2026-10-05 the page went live a
// moment before its stylesheet and a visitor was served the new HTML with the old CSS.
test('a stylesheet link keeps its version tag', () => {
  assert.deepEqual(stylesheetHrefs('<link rel="stylesheet" href="/theme.css?v=20261005">'), ['/theme.css?v=20261005']);
});
test('an attribute order of href before rel is also found', () => {
  assert.deepEqual(stylesheetHrefs('<link href="/theme.css?v=1" rel="stylesheet">'), ['/theme.css?v=1']);
});
test('a plain stylesheet link is found', () => {
  assert.deepEqual(stylesheetHrefs('<link rel="stylesheet" href="/theme.css">'), ['/theme.css']);
});
test('other link tags (icons, canonical) are ignored', () => {
  const html = '<link rel="icon" href="/favicon.ico"><link rel="canonical" href="https://x/"><link rel="stylesheet" href="/a.css">';
  assert.deepEqual(stylesheetHrefs(html), ['/a.css']);
});
test('an external stylesheet is not something this site publishes, so it is ignored', () => {
  assert.deepEqual(stylesheetHrefs('<link rel="stylesheet" href="https://fonts.example/x.css">'), []);
});
test('a page with no stylesheet gives an empty list', () => assert.deepEqual(stylesheetHrefs('<p>hi</p>'), []));
