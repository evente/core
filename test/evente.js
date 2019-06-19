const evente = require('../src/Evente');

document.body.innerHTML =
    '<div></div>';

describe('General', () => {

    test('Variable evente has to be function', () => {
        expect(typeof evente).toBe('function');
    });

});
