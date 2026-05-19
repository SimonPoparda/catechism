import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  // Security headers for all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.tailwindcss.com fonts.googleapis.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com",
  };

  try {
    // Normalize and validate path to prevent traversal attacks
    const requestPath = req.url === '/' ? '/index.html' : req.url;
    const normalizedPath = path.normalize(requestPath);

    // Ensure path doesn't try to escape project directory
    if (normalizedPath.startsWith('..') || normalizedPath.includes('/../')) {
      res.writeHead(403, securityHeaders);
      res.end('Forbidden');
      return;
    }

    let filePath = path.join(__dirname, normalizedPath);
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(__dirname);

    // Verify resolved path is within project directory
    if (!resolvedPath.startsWith(resolvedDir)) {
      res.writeHead(403, securityHeaders);
      res.end('Forbidden');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      try {
        if (err) {
          if (err.code === 'ENOENT') {
            console.warn(`[404] File not found: ${filePath}`);
            res.writeHead(404, securityHeaders);
            res.end('Not found');
          } else if (err.code === 'EACCES') {
            console.error(`[403] Access denied: ${filePath}`);
            res.writeHead(403, securityHeaders);
            res.end('Forbidden');
          } else if (err.code === 'EISDIR') {
            console.warn(`[400] Expected file, got directory: ${filePath}`);
            res.writeHead(400, securityHeaders);
            res.end('Bad request');
          } else {
            console.error(`[500] File read error: ${err.code || err.message}`);
            res.writeHead(500, securityHeaders);
            res.end('Internal server error');
          }
          return;
        }

        const responseHeaders = {
          ...securityHeaders,
          'Content-Type': mime + (mime.startsWith('text/') ? '; charset=utf-8' : ''),
        };
        res.writeHead(200, responseHeaders);
        res.end(data);
      } catch (innerErr) {
        console.error(`[500] Callback error: ${innerErr.message}`);
        res.writeHead(500, securityHeaders);
        res.end('Internal server error');
      }
    });
  } catch (err) {
    res.writeHead(500, securityHeaders);
    res.end('Internal server error');
  }
}).listen(PORT, () => console.log(`Serving at http://localhost:${PORT}`));
