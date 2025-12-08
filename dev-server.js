const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT = path.resolve(__dirname);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

function send404(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(ROOT, urlPath);

    // If request is directory or root, serve index.html
    if (urlPath === '/' || urlPath.endsWith('/')) {
      filePath = path.join(ROOT, urlPath, 'index.html');
    }

    // Prevent directory traversal
    if (!filePath.startsWith(ROOT)) return send404(res);

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) return send404(res);

      const ext = path.extname(filePath).toLowerCase();
      const type = mime[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', type);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      stream.on('error', () => send404(res));
    });
  } catch (e) {
    send404(res);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Dev server running at http://127.0.0.1:${PORT} serving ${ROOT}`);
});

process.on('SIGINT', () => process.exit());
