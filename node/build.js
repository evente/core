let fs = require('fs');
let watch = require('node-watch');
let babelMinify = require('babel-minify');

let inputDir = '../src/';
let outputFile = '../build/bjs.min.js';
let inputFiles = [
    'bjs.js',
    'bjs.Object.js',
    'bjs.Array.js',
    'bjs.Selector.js'
];

watch(inputDir, { recursive: true }, function(evt, name) {
    console.log('%s changed, rebuild started...', name);
    let inputCode = '';
    inputFiles.forEach(function(file) {
        console.log(inputDir + file);
        inputCode += fs.readFileSync(inputDir + file, 'utf-8');
    });
    let outputCode = babelMinify(inputCode);
    fs.writeFileSync(outputFile, outputCode);
    console.log('Rebuild done!');
});
