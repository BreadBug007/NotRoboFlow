var http = require('http');
var fileSystem = require('fs');
var path = require('path');

var server = http.createServer(function (req, resp) {
    // Always serve the index.html file, regardless of the request URL
    var filePath = './index.html';

    // Determine the content type (always HTML in this case)
    var contentType = 'text/html';

    // Read and serve the index.html file
    fileSystem.readFile(filePath, function (error, fileContent) {
        if (error) {
            if (error.code == 'ENOENT') {
                // If file not found, serve a 404
                resp.writeHead(404, { 'Content-Type': 'text/plain' });
                resp.end('404 Not Found');
            } else {
                // For other errors, return a server error
                resp.writeHead(500, { 'Content-Type': 'text/plain' });
                resp.end('Error');
            }
        } else {
            // Serve the index.html file with the correct content type
            resp.writeHead(200, { 'Content-Type': contentType });
            resp.end(fileContent, 'utf-8');
        }
    });
});

server.listen(8080);

console.log('Listening at: localhost:8080');
