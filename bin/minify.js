let fs = require('fs');
let uglify = require("uglify-es");
let uglifyOptions = {
    ecma: 8,
    compress: {
        drop_console: true,
        unsafe_arrows: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_undefined: true,
        global_defs: {
            process: {
                env: {
                    NODE_ENV: "production"
                }
            }
        },
    },
}

let inputDir = 'src/';
let outputFile = 'dist/bjs.js';
let outputFileMinified = 'dist/bjs.min.js';
let inputFiles = [
    // Extensions
    'Object.js',
    // Order has matter
    'bjs.js',
    'bjs.Expression.js',
    'bjs.Attribute.js',
    // Order has no matter - ordered by name
    'bjs.App.js',
    'bjs.AttributeBase.js',
    'bjs.AttributeFor.js',
    'bjs.AttributeHideShow.js',
    'bjs.AttributeModel.js',
    'bjs.Model.js',
    'bjs.ModelProxyHandler.js',
    'bjs.Resource.js',
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
        let outputCode = uglify.minify(inputCode, uglifyOptions).code;
        fs.writeFileSync(outputFileMinified, outputCode);
        console.log('Rebuild done!');
    } catch (e) {
        console.log('Rebuild cannot be done! Source code has errors!');
    }
}

module.exports = minify;
