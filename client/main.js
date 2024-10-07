var http = require('http');
var fileSystem = require('fs');
var path = require('path');

var server = http.createServer(function (req, resp) {
    // Resolve file path based on the request URL or default to index.html
    var filePath = '.' + (req.url === '/' ? '/index.html' : req.url);

    // Get the extension of the requested file
    var extname = String(path.extname(filePath)).toLowerCase();

    // Set the MIME type for different types of files
    var mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
    };

    // Default to plain text if no match
    var contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read and serve the requested file
    fileSystem.readFile(filePath, function (error, fileContent) {
        if (error) {
            if (error.code == 'ENOENT') {
                // If file not found, serve a 404 page
                fileSystem.readFile('./404.html', function (err, content) {
                    resp.writeHead(404, { 'Content-Type': 'text/html' });
                    resp.end(content, 'utf-8');
                });
            } else {
                // For other errors, return a server error
                resp.writeHead(500, { 'Content-Type': 'text/plain' });
                resp.end('Server error: ' + error.code);
            }
        } else {
            // Serve the file with the correct content type
            resp.writeHead(200, { 'Content-Type': contentType });
            resp.end(fileContent, 'utf-8');
        }
    });
});

server.listen(8080);

console.log('Server running at http://localhost:8080');
