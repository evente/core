const bjs = require('../node/tests.js');

describe('General', () => {

    test('Variable bjs has to be function', () => {
        expect(typeof bjs).toBe('function');
    });

});
