const bjs = require('../node/tests.js');

describe('Object class extensions', () => {

    test('Get undefined property', () => {
        let obj = { data: {} };
        expect(obj.getProperty('data.id')).toBeUndefined();
    });

    test('Set object property', () => {
        let obj = { data: {} };
        obj.setProperty('data.id', 1);
        expect(obj.data.id).toBe(1);
    });

    test('Set array property', () => {
        let obj = {};
        obj.setProperty('data.1.id', 1);
        expect(obj.data[1].id).toBe(1);
    });

});
