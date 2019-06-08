const fs = require('fs');
const path = require('path');
const http = require('http');
const minify = require('./minify.js');

const hostname = '127.0.0.1';
const port = 3000;
const htmlDir = 'html/';
const srcDir = 'src/';
const distDir = 'dist/';

console.log('Watching ' + srcDir + ' for changes...');
watch(srcDir);

http.createServer((req, res) => {
    let dir = path.dirname(req.url);
    let file = path.basename(req.url) || 'index.html';
    let source;
    switch ( dir ) {
        case '/src':  source = srcDir + file;   break;
        case '/dist': source = distDir + file; break;
        default:      source = htmlDir + file;  break;
    }
    if ( !fs.existsSync(source) )
        source = htmlDir + 'index.html';
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

let timeout = 0;
function watch(path) {
    fs.watch(path, { recursive: true }, function(event) {
        console.log('Watch event:', event, path, ', rebuild started...');
        if ( !timeout )
            timeout = setTimeout(() => { minify(); timeout = 0; }, 200);
    });
    if ( process.platform === 'freebsd' && fs.statSync(path).isDirectory() ) {
        fs.readdirSync(path).forEach(file => {
            watch(path + '/' + file);
        });
    }
}
