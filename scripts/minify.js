const fs = require('fs');
const uglify = require("uglify-es");
const uglifyOptions = {
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

const inputDir = 'src/';
const outputFile = 'dist/evente.js';
const outputFileMinified = 'dist/evente.min.js';
const inputFiles = [
    // Extensions
    'Object.js',
    // Order has matter
    'Evente.js',
    'EventeExpression.js',
    'EventeAttribute.js',
    // Order has no matter - ordered by name
    'EventeApplication.js',
    'EventeAttributeBase.js',
    'EventeAttributeFor.js',
    'EventeAttributeHideShow.js',
    'EventeAttributeModel.js',
    'EventeModel.js',
    'EventeModelProxyHandler.js',
    'EventeParser.js',
    'EventePipes.js',
    'EventeResource.js',
    'EventeRouter.js',
    'EventeSelector.js',
    'EventeStrings.js',
];

function minify() {
    let inputCode = '';
    inputFiles.forEach(function(file) {
        console.log(inputDir + file);
        inputCode += fs.readFileSync(inputDir + file, 'utf-8');
    });
    inputCode = inputCode.replace(/const [a-zA-Z]+ = require\('.+'\);\n?/gm, '');
    inputCode = inputCode.replace(/module.exports = [a-zA-Z]+;\n?/gm, '');
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
