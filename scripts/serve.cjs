const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const rel = url === '/' ? 'index.html' : url.slice(1);
    const file = path.join(root, rel);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        // single-page build: extensionless paths fall back to the entry
        const isPage = !path.extname(rel);
        if (!isPage) {
          res.writeHead(404);
          return res.end('not found');
        }
        fs.readFile(path.join(root, 'index.html'), (err2, page) => {
          if (err2) {
            res.writeHead(404);
            return res.end('not found');
          }
          res.writeHead(200, { 'content-type': types['.html'], 'cache-control': 'no-store' });
          res.end(page);
        });
        return;
      }
      res.writeHead(200, {
        'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(buf);
    });
  })
  .listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
