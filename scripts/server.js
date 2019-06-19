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
    content = fs.readFileSync(source, 'utf-8');
    if ( source.endsWith('.js') ) {
        content = content.replace(/const [a-zA-Z]+ = require\('.+'\);\n?/gm, '');
        content = content.replace(/module.exports = [a-zA-Z]+;\n?/gm, '');
    }
    res.end(content);
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
