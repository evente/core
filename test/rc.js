var rc = require('../bin/test.js');

document.body.innerHTML =
    '<div></div>';

describe('General', () => {

    test('Variable rc has to be function', () => {
        expect(typeof rc).toBe('function');
    });

});
