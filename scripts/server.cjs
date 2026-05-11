const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = __dirname;

const server = http.createServer((req, res) => {
    let filePath;
    
    // Serve data files from data directory
    if (req.url.startsWith('/data/')) {
        filePath = path.join(ROOT_DIR, req.url);
    } else {
        // Serve static files from root
        filePath = path.join(ROOT_DIR, req.url === '/' ? 'index.html' : req.url);
    }
    
    const ext = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };
    
    // Add CORS headers for data files
    const headers = { 
        'Content-Type': contentTypes[ext] || 'text/plain',
        'Access-Control-Allow-Origin': '*'
    };
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found: ' + req.url);
        } else {
            res.writeHead(200, headers);
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop');
});
