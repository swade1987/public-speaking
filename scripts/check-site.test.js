const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkSite, pagePathFor } = require('./check-site.js');

const ORIGIN = 'https://speaking.stevenwade.xyz';

function page(canonicalPath, body = '') {
  return `<!DOCTYPE html><html><head><title>T</title><meta name="description" content="D">
<link rel="canonical" href="${ORIGIN}${canonicalPath}"><link rel="stylesheet" href="/theme.css?v=1"></head><body>${body}</body></html>`;
}
const sitemap = paths => `<urlset>${paths.map(p => `<url><loc>${ORIGIN}${p}</loc></url>`).join('')}</urlset>`;

function makeSite(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-'));
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
  return dir;
}

const good = () => ({
  'index.html': page('/', '<a href="/talk/">talk</a> <a href="https://example.com/x">ext</a> <a href="mailto:a@b.c">m</a> <a href="#top">t</a> <img src="pic.jpg">'),
  'talk/index.html': page('/talk/', '<a href="/">home</a>'),
  'theme.css': 'body{}',
  'pic.jpg': 'x',
  'sitemap.xml': sitemap(['/', '/talk/']),
});

test('pagePathFor maps files to served paths', () => {
  assert.equal(pagePathFor('index.html'), '/');
  assert.equal(pagePathFor('talk/index.html'), '/talk/');
});

test('a well-formed site has no problems', () => {
  assert.deepEqual(checkSite(makeSite(good())), []);
});

test('flags a missing title', () => {
  const f = good(); f['talk/index.html'] = f['talk/index.html'].replace('<title>T</title>', '');
  assert.match(checkSite(makeSite(f)).join('\n'), /talk\/index\.html: missing or empty <title>/);
});

test('flags a missing meta description', () => {
  const f = good(); f['index.html'] = f['index.html'].replace(/<meta name="description"[^>]*>/, '');
  assert.match(checkSite(makeSite(f)).join('\n'), /index\.html: missing or empty meta description/);
});

test('flags a missing canonical', () => {
  const f = good(); f['index.html'] = f['index.html'].replace(/<link rel="canonical"[^>]*>/, '');
  assert.match(checkSite(makeSite(f)).join('\n'), /index\.html: missing canonical/);
});

test('flags a canonical that points at the wrong page', () => {
  const f = good(); f['talk/index.html'] = page('/other/');
  assert.match(checkSite(makeSite(f)).join('\n'), /canonical is .*\/other\/, expected .*\/talk\//);
});

test('flags a link to a subpage without a trailing slash', () => {
  const f = good(); f['index.html'] = page('/', '<a href="/talk">talk</a>');
  assert.match(checkSite(makeSite(f)).join('\n'), /subpage without a trailing slash/);
});

test('flags a link to a page that does not exist', () => {
  const f = good(); f['index.html'] = page('/', '<a href="/gone/">x</a>');
  assert.match(checkSite(makeSite(f)).join('\n'), /link \/gone\/ has no index\.html/);
});

test('flags a missing asset', () => {
  const f = good(); f['index.html'] = page('/', '<img src="/nope.png">');
  assert.match(checkSite(makeSite(f)).join('\n'), /link \/nope\.png does not resolve/);
});

test('flags a page missing from the sitemap', () => {
  const f = good(); f['sitemap.xml'] = sitemap(['/']);
  assert.match(checkSite(makeSite(f)).join('\n'), /sitemap\.xml does not list .*\/talk\//);
});

test('flags a sitemap entry with no page', () => {
  const f = good(); f['sitemap.xml'] = sitemap(['/', '/talk/', '/ghost/']);
  assert.match(checkSite(makeSite(f)).join('\n'), /sitemap\.xml lists .*\/ghost\/, which is not a page/);
});

test('flags a missing sitemap', () => {
  const f = good(); delete f['sitemap.xml'];
  assert.match(checkSite(makeSite(f)).join('\n'), /sitemap\.xml is missing/);
});

test('flags an em dash in a published page, with its line number', () => {
  const f = good(); f['index.html'] = page('/', '<p>one\n— two</p>').replace('<body>', '<body>\n');
  assert.match(checkSite(makeSite(f)).join('\n'), /index\.html:\d+ contains an em dash/);
});

test('flags an em dash in a repo doc passed as extra prose', () => {
  const dir = makeSite(good());
  const doc = path.join(os.tmpdir(), `doc-${Date.now()}.md`);
  fs.writeFileSync(doc, 'fine\nbad — here');
  assert.match(checkSite(dir, [doc]).join('\n'), /doc-\d+\.md:2 contains an em dash/);
});

test('ignores binary files when looking for em dashes', () => {
  const f = good(); f['pic.jpg'] = Buffer.from([0xe2, 0x80, 0x94]);
  assert.deepEqual(checkSite(makeSite(f)), []);
});
