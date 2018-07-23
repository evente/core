let fs = require('fs');
let babelMinify = require('babel-minify');
let babelMinifyOptions = {
    dead_code: true,
    drop_console: true,
    global_defs: {
        process: {
            env: {
                NODE_ENV: "production"
            }
        }
    }
}

let inputDir = 'src/';
let outputFile = 'dist/bjs.js';
let outputFileMinified = 'dist/bjs.min.js';
let inputFiles = [
    // Extensions
    'Object.js',
    // Order has matter
    'bjs.js',
    'bjs.Model.js',
    // Order has no matter - ordered by name
    'bjs.App.js',
    'bjs.Expression.js',
    //'bjs.Fetch.js',
    'bjs.ModelProxyHandler.js',
    'bjs.Router.js',
    'bjs.Selector.js',
];

function minify() {
    let inputCode = '';
    inputFiles.forEach(function(file) {
        console.log(inputDir + file);
        inputCode += fs.readFileSync(inputDir + file, 'utf-8');
    });
    try {
        fs.writeFileSync(outputFile, inputCode);
        let outputCode = babelMinify(inputCode, babelMinifyOptions);
        fs.writeFileSync(outputFileMinified, outputCode);
        console.log('Rebuild done!');
    } catch (e) {
        console.log('Rebuild cannot be done! Source code has errors!');
    }
}

module.exports = minify;
