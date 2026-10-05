// The order files are uploaded in.
//
// A page references its stylesheet and images, so those go up first, then the pages, then
// the sitemap that lists them. Uploading in directory order put the services page live
// two seconds before the stylesheet it links (2026-10-05): in that gap the page was served
// with the old CSS under the new versioned stylesheet address, and a visitor who loaded it
// then saw an unstyled layout and kept it for the cache lifetime. Assets first means a page
// is never visible before what it depends on.
const path = require('path');

function group(file) {
  if (path.basename(file) === 'sitemap.xml') return 2;
  if (path.extname(file).toLowerCase() === '.html') return 1;
  return 0;
}

function publishOrder(files) {
  return [...files].sort((a, b) => group(a) - group(b) || (a < b ? -1 : a > b ? 1 : 0));
}

module.exports = { publishOrder };
