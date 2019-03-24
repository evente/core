var bjs = require('../bin/test.js');

document.body.innerHTML =
    '<div></div>';

describe('General', () => {

    test('Variable bjs has to be function', () => {
        expect(typeof bjs).toBe('function');
    });

});
