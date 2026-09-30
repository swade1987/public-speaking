#!/usr/bin/env node
// Usage: node scripts/check-site.js [site-dir]
//
// Enforces this repo's own rules on the published site, so they do not rest
// on someone remembering to grep. Prints every problem and exits non-zero if
// there are any. No dependencies.
//
//  - every page has a <title>, a meta description, and a canonical URL that
//    matches where the page is actually served
//  - every internal link and asset reference resolves to a real file, and a
//    link to a subpage ends in "/" (slides-router only appends index.html to
//    a path ending in "/", so a link without one is a dead link in practice)
//  - sitemap.xml lists every page and only pages that exist
//  - no em dashes in published prose or the repo docs (Steve's rule)
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://speaking.stevenwade.xyz';
const EM_DASH = '—';
const TEXT_EXTENSIONS = new Set(['.html', '.css', '.xml', '.txt', '.md', '.json']);

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else results.push(full);
  }
  return results;
}

// index.html -> "/", x/index.html -> "/x/"
function pagePathFor(rel) {
  if (rel === 'index.html') return '/';
  return '/' + rel.slice(0, -'index.html'.length);
}

function checkPage(siteDir, file, problems) {
  const rel = path.relative(siteDir, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  const where = `${rel}:`;

  const title = /<title>([^<]*)<\/title>/i.exec(html);
  if (!title || !title[1].trim()) problems.push(`${where} missing or empty <title>`);

  const desc = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html);
  if (!desc || !desc[1].trim()) problems.push(`${where} missing or empty meta description`);

  const canonical = /<link\s+rel="canonical"\s+href="([^"]*)"/i.exec(html);
  const expected = ORIGIN + pagePathFor(rel);
  if (!canonical) problems.push(`${where} missing canonical link (expected ${expected})`);
  else if (canonical[1] !== expected) problems.push(`${where} canonical is ${canonical[1]}, expected ${expected}`);

  const refs = html.matchAll(/\b(?:href|src)="([^"]+)"/g);
  for (const [, raw] of refs) {
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(raw)) continue; // http:, mailto:, data:, #frag, protocol-relative
    const bare = raw.split('#')[0].split('?')[0];
    if (!bare) continue;
    const target = bare.startsWith('/')
      ? path.join(siteDir, bare)
      : path.join(path.dirname(file), bare);
    if (bare.endsWith('/')) {
      if (!fs.existsSync(path.join(target, 'index.html'))) problems.push(`${where} link ${raw} has no index.html to serve`);
    } else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      problems.push(`${where} link ${raw} is a subpage without a trailing slash (it 404s unless the router redirects it)`);
    } else if (!fs.existsSync(target)) {
      problems.push(`${where} link ${raw} does not resolve to a file`);
    }
  }
}

function checkSitemap(siteDir, pages, problems) {
  const sitemap = path.join(siteDir, 'sitemap.xml');
  if (!fs.existsSync(sitemap)) {
    problems.push('sitemap.xml is missing');
    return;
  }
  const listed = [...fs.readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  const served = new Set(pages.map(rel => ORIGIN + pagePathFor(rel)));
  for (const url of served) {
    if (!listed.includes(url)) problems.push(`sitemap.xml does not list ${url}`);
  }
  for (const url of listed) {
    if (!served.has(url)) problems.push(`sitemap.xml lists ${url}, which is not a page in the site`);
  }
}

function checkEmDashes(files, siteDir, problems) {
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (line.includes(EM_DASH)) problems.push(`${path.relative(siteDir, file)}:${i + 1} contains an em dash`);
    });
  }
}

function checkSite(siteDir, extraProseFiles = []) {
  const problems = [];
  const files = walk(siteDir);
  const pages = files
    .map(f => path.relative(siteDir, f).split(path.sep).join('/'))
    .filter(rel => rel === 'index.html' || rel.endsWith('/index.html'));
  for (const rel of pages) checkPage(siteDir, path.join(siteDir, rel), problems);
  checkSitemap(siteDir, pages, problems);
  checkEmDashes([...files, ...extraProseFiles.filter(f => fs.existsSync(f))], siteDir, problems);
  return problems;
}

module.exports = { checkSite, pagePathFor };

if (require.main === module) {
  const siteDir = path.resolve(process.argv[2] || 'site');
  const docs = ['README.md', 'CLAUDE.md', 'CONTRIBUTING.md', 'SECURITY.md'].map(f => path.resolve(f));
  const problems = checkSite(siteDir, docs);
  if (problems.length) {
    console.error(`${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log('site-check: clean');
}
