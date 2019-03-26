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
let outputFile = 'dist/rc.js';
let outputFileMinified = 'dist/rc.min.js';
let inputFiles = [
    // Extensions
    'Object.js',
    // Order has matter
    'rc.js',
    'rc.Expression.js',
    'rc.Attribute.js',
    // Order has no matter - ordered by name
    'rc.App.js',
    'rc.AttributeBase.js',
    'rc.AttributeFor.js',
    'rc.AttributeHideShow.js',
    'rc.AttributeModel.js',
    'rc.Model.js',
    'rc.ModelProxyHandler.js',
    'rc.Resource.js',
    'rc.Router.js',
    'rc.Selector.js',
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
