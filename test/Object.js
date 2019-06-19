require('../src/Object');

describe('Object class extensions', () => {

    test('Get undefined field', () => {
        let obj = { data: {} };
        expect(obj.getField('data.id')).toBeUndefined();
    });

    test('Get defined field', () => {
        let obj = { data: [{id: undefined}, {id: 1}] };
        expect(obj.getField('data.1.id')).toBe(1);
    });

    test('Set object field', () => {
        let obj = { data: {} };
        obj.setField('data.id', 1);
        expect(obj.data.id).toBe(1);
    });

    test('Set array field', () => {
        let obj = {};
        obj.setField('data.1.id', 1);
        expect(obj.data[1].id).toBe(1);
    });

});
