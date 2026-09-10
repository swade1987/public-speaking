#!/usr/bin/env node
// Usage: node scripts/publish-r2.js <site-dir> <subdomain>
//
// Uploads every file under <site-dir> to the stevenwade-xyz-slides R2
// bucket under the key prefix "<subdomain>/", via Cloudflare's native R2
// object API (a plain bearer-token PUT per file). Same bucket, same
// key-shape convention, and same one-file-per-request mechanism as
// swade1987/slides' scripts/publish-r2.js (that repo owns the deck-build
// pipeline this one doesn't need — this site is one static page, no
// per-manifest build step). The slides-router Worker reads the same
// "<subdomain>/..." key shape to serve <subdomain>.stevenwade.xyz.
//
// Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
const fs = require('fs');
const path = require('path');

const BUCKET = 'stevenwade-xyz-slides';

const [siteDir, subdomain] = process.argv.slice(2);
if (!siteDir || !subdomain) {
  console.error('Usage: node scripts/publish-r2.js <site-dir> <subdomain>');
  process.exit(1);
}

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !accountId) {
  console.error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must both be set.');
  process.exit(1);
}

const absSiteDir = path.resolve(siteDir);
if (!fs.existsSync(absSiteDir)) {
  console.error(`Site dir not found: ${absSiteDir}`);
  process.exit(1);
}

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function contentTypeFor(filePath) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

async function uploadFile(filePath, baseDir) {
  const relPath = path.relative(baseDir, filePath).split(path.sep).join('/');
  const key = `${subdomain}/${relPath}`;
  const body = fs.readFileSync(filePath);
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentTypeFor(filePath),
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed for ${key}: ${res.status} ${text}`);
  }
  console.log(`Uploaded ${key} (${body.length} bytes)`);
}

(async () => {
  const files = walk(absSiteDir);
  if (files.length === 0) {
    console.error(`No files found under ${absSiteDir}`);
    process.exit(1);
  }
  for (const file of files) {
    await uploadFile(file, absSiteDir);
  }
  console.log(`Published ${files.length} file(s) to ${subdomain}.stevenwade.xyz`);
})().catch(err => {
  console.error(err.message);
  process.exit(1);
});
