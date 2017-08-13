let fs = require('fs');
let watch = require('node-watch');
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
let outputFile = 'build/bjs.min.js';
let inputFiles = [
    // Order has matter
    'bjs.js',
    'bjs.Model.js',
    // Order has no matter - ordered by name
    'bjs.App.js',
    'bjs.Array.js',
    'bjs.Object.js',
    'bjs.Resource.js',
    'bjs.Selector.js'
];

watch(inputDir, { recursive: true }, function(evt, name) {
    console.log('%s changed, rebuild started...', name);
    let inputCode = '';
    inputFiles.forEach(function(file) {
        console.log(inputDir + file);
        inputCode += fs.readFileSync(inputDir + file, 'utf-8');
    });
    try {
        let outputCode = babelMinify(inputCode, babelMinifyOptions);
        fs.writeFileSync(outputFile, outputCode);
        console.log('Rebuild done!');
    } catch (e) {
        console.log('Rebuild cannot be done! Source code has errors!');
    }
});
