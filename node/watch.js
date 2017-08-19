let watch = require('node-watch');
let minify = require('../node/minify.js');

let inputDir = 'src/';

watch(inputDir, { recursive: true }, function(evt, name) {
    console.log('%s changed, rebuild started...', name);
    minify();
});
