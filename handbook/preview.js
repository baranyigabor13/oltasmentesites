const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../public');
function createServer() {
  return http.createServer((req, res) => {
    let target;
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
      target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    }
    catch { res.writeHead(400).end(); return; }
    if (target === root) target = path.join(root, 'index.html');
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    // Redirect only existing pages; unknown routes must remain real 404s.
    if (url.pathname.endsWith('.html') && fs.existsSync(target)) {
      const cleanPath = url.pathname === '/index.html' ? '/' : url.pathname.slice(0, -5);
      res.writeHead(308, { Location: cleanPath + url.search }).end();
      return;
    }
    if (!path.extname(target)) {
      if (fs.existsSync(target + '.html') && url.pathname.endsWith('/')) {
        res.writeHead(308, { Location: url.pathname.slice(0, -1) + url.search }).end();
        return;
      }
      target += '.html';
    }
    fs.readFile(target, (error, data) => {
      if (error) { res.writeHead(404).end('Not found'); return; }
      const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
      res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
}
if (require.main === module) createServer().listen(4500, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4500/manipulacio-anatomiaja'));
module.exports = { createServer };
