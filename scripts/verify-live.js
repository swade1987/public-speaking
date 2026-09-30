#!/usr/bin/env node
// Usage: node scripts/verify-live.js <site-dir> <subdomain>
//
// Run after publishing. Finishing an upload proves nothing about what the
// site serves, so this fetches every file under <site-dir> from
// https://<subdomain>.stevenwade.xyz and requires a 200 whose bytes hash the
// same as the local file. Each request carries a throwaway "?cb=" query
// string: the router ignores it, but the CDN treats it as a separate cache
// entry, so a stale cached copy cannot make the check pass (or fail)
// wrongly. It also requires every subpage to redirect when requested without
// its trailing slash, because without that redirect the page 404s.
//
// Uploads can take a moment to be readable, so each check retries briefly.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ATTEMPTS = 6;
const DELAY_MS = 5000;

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else results.push(full);
  }
  return results;
}

// index.html -> "/", x/index.html -> "/x/", anything else -> "/<path>"
function urlPathFor(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function retry(describe, attempt) {
  let last = 'no attempt made';
  for (let i = 1; i <= ATTEMPTS; i++) {
    last = await attempt().catch(err => `request failed: ${err.message}`);
    if (last === null) return null;
    if (i < ATTEMPTS) await sleep(DELAY_MS);
  }
  return `${describe}: ${last}`;
}

async function main() {
  const [siteDir, subdomain] = process.argv.slice(2);
  if (!siteDir || !subdomain) {
    console.error('Usage: node scripts/verify-live.js <site-dir> <subdomain>');
    process.exit(1);
  }
  const root = path.resolve(siteDir);
  const origin = `https://${subdomain}.stevenwade.xyz`;
  const failures = [];

  for (const file of walk(root)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const expected = sha256(fs.readFileSync(file));
    const urlPath = urlPathFor(rel);
    const url = `${origin}${urlPath}?cb=${expected.slice(0, 12)}`;

    const failure = await retry(`${urlPath}`, async () => {
      const res = await fetch(url);
      if (res.status !== 200) return `status ${res.status}, expected 200`;
      const got = sha256(Buffer.from(await res.arrayBuffer()));
      return got === expected ? null : `live bytes differ from the repo (live ${got.slice(0, 12)}, repo ${expected.slice(0, 12)})`;
    });
    if (failure) { failures.push(failure); console.error(`FAIL ${failure}`); } else console.log(`ok   ${urlPath}`);

    if (rel.endsWith('/index.html')) {
      const noSlash = urlPath.slice(0, -1);
      const redirectFailure = await retry(`${noSlash} (no trailing slash)`, async () => {
        const res = await fetch(`${origin}${noSlash}`, { redirect: 'manual' });
        const location = res.headers.get('location') || '';
        if (res.status === 301 && location.replace(/\?.*$/, '').endsWith(urlPath)) return null;
        return `status ${res.status} location "${location}", expected a 301 to ${urlPath}`;
      });
      if (redirectFailure) { failures.push(redirectFailure); console.error(`FAIL ${redirectFailure}`); } else console.log(`ok   ${noSlash} redirects to ${urlPath}`);
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} check(s) failed; the site is not serving what was published.`);
    process.exit(1);
  }
  console.log(`\nverified: ${origin} serves every published file, byte for byte.`);
}

module.exports = { urlPathFor, sha256 };

if (require.main === module) main();
