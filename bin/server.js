const fs = require('fs');
const path = require('path');
const http = require('http');
const minify = require('../bin/minify.js');

const hostname = '127.0.0.1';
const port = 3000;
const watchDir = 'src/';
const htmlDir = 'html/';
const srcDir = 'src/';
const buildDir = 'dist/';

console.log('Watching ' + watchDir + ' for changes...');
watch(watchDir);

http.createServer((req, res) => {
    let dir = path.dirname(req.url);
    let file = path.basename(req.url) || 'dev.html';
    let source;
    switch ( dir ) {
        case '/src':  source = srcDir + file;   break;
        case '/dist': source = buildDir + file; break;
        default:      source = htmlDir + file;  break;
    }
    if ( !fs.existsSync(source) )
        source = htmlDir + 'dev.html';
    fs.readFile(source, function(err, contents) {
        if ( !err ) {
            res.end(contents);
        } else {
            console.dir(err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('ERROR 500! Internal Server Error');
        }
    });
}).listen(port, hostname, () => {
    console.log('Listening on http://%s:%d', hostname, port);
});

function watch(path) {
    fs.watch(path, { recursive: true }, function(event) {
        console.log('Watch event:', event, path, ', rebuild started...');
        setTimeout(minify, 200);
    });
    if ( process.platform === 'freebsd' && fs.statSync(path).isDirectory() ) {
        fs.readdirSync(path).forEach(file => {
            watch(path + '/' + file);
        });
    }
}
