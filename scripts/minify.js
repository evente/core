let fs = require('fs');
let uglify = require("uglify-es");
let uglifyOptions = {
    compress: {
        drop_console: true,
        global_defs: {
            process: {
                env: {
                    NODE_ENV: "build"
                }
            }
        },
    }
}

let inputDir = 'src/';
let outputFile = 'dist/evente.js';
let outputFileMinified = 'dist/evente.min.js';
let inputFiles = [
    // Extensions
    'Object.js',
    // Order has matter
    'evente.js',
    'Expression.js',
    'Attribute.js',
    // Order has no matter - ordered by name
    'App.js',
    'AttributeBase.js',
    'AttributeFor.js',
    'AttributeHideShow.js',
    'AttributeModel.js',
    'Model.js',
    'ModelProxyHandler.js',
    'Resource.js',
    'Router.js',
    'Selector.js',
];

function minify() {
    let inputCode = '';
    inputFiles.forEach(function(file) {
        console.log(inputDir + file);
        inputCode += fs.readFileSync(inputDir + file, 'utf-8');
    });
    inputCode = inputCode.replace(/var evente = require\('\.\/evente\.js'\);\n?/gm, '');
    try {
        fs.writeFileSync(outputFile, inputCode);
        let outputCode = uglify.minify(inputCode, uglifyOptions).code;
        fs.writeFileSync(outputFileMinified, outputCode);
        console.log('Done!');
    } catch (e) {
        console.warn('Source code has errors!');
    }
}

module.exports = minify;
