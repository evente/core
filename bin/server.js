const fs = require('fs');
const path = require('path');
const http = require('http');
const watch = require('node-watch');
const minify = require('../bin/minify.js');

const hostname = '127.0.0.1';
const port = 3000;
const watchDir = 'src/';
const htmlDir = 'html/';
const srcDir = 'src/';
const buildDir = 'dist/';

console.log('Watching ' + watchDir + ' for changes...');
watch(watchDir, { recursive: true }, function(evt, name) {
    console.log('%s changed, rebuild started...', name);
    minify();
});

http.createServer((req, res) => {
    let dir = path.dirname(req.url);
    let file = path.basename(req.url) || 'dev.html';
    let source;
    switch ( dir ) {
        case '/src':  source = srcDir + file;   break;
        case '/dist': source = buildDir + file; break;
        default:      source = htmlDir + file;  break;
    }
    fs.readFile(source, function(err, contents) {
        if ( !err ) {
            res.end(contents);
        } else {
            console.dir(err);
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end('<h1>ERROR 404! File not found.</h1>');
        }
    });
}).listen(port, hostname, () => {
    console.log('Listening http on %s:%d', hostname, port);
});
