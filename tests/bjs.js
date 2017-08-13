const bjs = require('../node/tests.js');

document.body.innerHTML =
    '<div></div>';

describe('General', () => {

    test('Variable bjs has to be function', () => {
        expect(typeof bjs).toBe('function');
    });

});
