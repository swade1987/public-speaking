// Content-Type and Cache-Control for each published file, kept apart from the
// publish script so they can be tested.
//
// Anything that can change between publishes and that a page depends on
// (HTML, CSS, JS, JSON, XML, TXT) gets a short cache. A long cache on a file
// that has no versioned filename leaves returning visitors on the old copy
// while the new HTML is already live, which broke the services page on its
// first deploy: new HTML, old stylesheet. Only images, which are replaced
// rarely and never hold layout rules, cache for a day.
const path = require('path');

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
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const LONG_CACHE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp']);

function contentTypeFor(filePath) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function cacheControlFor(filePath) {
  return LONG_CACHE_EXTENSIONS.has(path.extname(filePath).toLowerCase())
    ? 'public, max-age=86400'
    : 'public, max-age=300';
}

module.exports = { contentTypeFor, cacheControlFor };
