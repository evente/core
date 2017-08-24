let watch = require('node-watch');
let minify = require('../node/minify.js');

let inputDir = 'src';

console.log('Watching ' + inputDir + ' for changes...');
watch(inputDir, { recursive: true }, function(evt, name) {
    console.log('%s changed, rebuild started...', name);
    minify();
});
