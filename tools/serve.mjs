import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.woff2': 'font/woff2'
};

createServer(async (request, response) => {
    try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        const segments = pathname.split('/');
        if (segments.some(segment => segment.startsWith('.') || segment === 'node_modules')) {
            response.writeHead(403).end('Forbidden');
            return;
        }
        const file = resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
        if (!file.startsWith(root.endsWith(sep) ? root : `${root}${sep}`)) {
            response.writeHead(403).end('Forbidden');
            return;
        }
        const info = await stat(file);
        if (!info.isFile()) throw new Error('Not a file');
        response.writeHead(200, {
            'Content-Type': types[extname(file)] || 'application/octet-stream',
            'Content-Length': info.size,
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        });
        if (request.method === 'HEAD') response.end();
        else createReadStream(file).on('error', () => response.destroy()).pipe(response);
    } catch {
        response.writeHead(404).end('Not found');
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`Portfolio preview: http://127.0.0.1:${port}`);
});
