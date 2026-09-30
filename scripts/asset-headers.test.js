const { test } = require('node:test');
const assert = require('node:assert/strict');
const { contentTypeFor, cacheControlFor } = require('./asset-headers.js');

const SHORT = 'public, max-age=300';
const LONG = 'public, max-age=86400';

test('files a page depends on for layout or content cache briefly', () => {
  for (const f of ['index.html', 'theme.css', 'app.js', 'data.json', 'sitemap.xml', 'robots.txt', 'a/b/theme.CSS']) {
    assert.equal(cacheControlFor(f), SHORT, f);
  }
});

test('images cache for a day', () => {
  for (const f of ['a.png', 'a.jpg', 'a.jpeg', 'a.gif', 'a.svg', 'favicon.ico', 'hero.webp', 'PHOTO.JPG']) {
    assert.equal(cacheControlFor(f), LONG, f);
  }
});

test('an unknown extension caches briefly, the safe default', () => {
  assert.equal(cacheControlFor('file.xyz'), SHORT);
});

test('content types are right for the file kinds the site publishes', () => {
  assert.equal(contentTypeFor('x.css'), 'text/css; charset=utf-8');
  assert.equal(contentTypeFor('x.webp'), 'image/webp');
  assert.equal(contentTypeFor('x.unknown'), 'application/octet-stream');
});
