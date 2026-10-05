const { test } = require('node:test');
const assert = require('node:assert/strict');
const { publishOrder } = require('./publish-order.js');

const FILES = [
  'index.html',
  'sitemap.xml',
  'services/index.html',
  'theme.css',
  'services/hero.webp',
  'headshot.jpg',
  'the-human-api/index.html',
];

test('assets are published before any page', () => {
  const order = publishOrder(FILES);
  const lastAsset = Math.max(...order.map((f, i) => (!f.endsWith('.html') && f !== 'sitemap.xml' ? i : -1)));
  const firstPage = Math.min(...order.map((f, i) => (f.endsWith('.html') ? i : Infinity)));
  assert.ok(lastAsset < firstPage, order.join(', '));
});

test('the stylesheet is live before the first page that links it', () => {
  const order = publishOrder(FILES);
  assert.ok(order.indexOf('theme.css') < order.indexOf('services/index.html'));
  assert.ok(order.indexOf('theme.css') < order.indexOf('index.html'));
});

test('the sitemap goes last, after every page it lists', () => {
  const order = publishOrder(FILES);
  assert.equal(order[order.length - 1], 'sitemap.xml');
});

test('the order is deterministic whatever order the files arrive in', () => {
  assert.deepEqual(publishOrder([...FILES].reverse()), publishOrder(FILES));
});

test('every file is kept exactly once', () => {
  assert.deepEqual([...publishOrder(FILES)].sort(), [...FILES].sort());
});

test('absolute paths are ordered the same way as relative ones', () => {
  const abs = FILES.map(f => `/site/${f}`);
  assert.deepEqual(publishOrder(abs).map(f => f.replace('/site/', '')), publishOrder(FILES));
});

test('the input array is not mutated', () => {
  const copy = [...FILES];
  publishOrder(copy);
  assert.deepEqual(copy, FILES);
});
