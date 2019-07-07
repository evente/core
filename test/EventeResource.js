const EventeResource = require('../src/EventeResource');

describe('Resource class', () => {

    beforeEach(function() {
        global.Headers = jest.fn();
        global.fetch = jest.fn().mockResolvedValue({
            ok: true, 
            status: 200, 
            json: () => { return {id: 'test'}; },
            formData: () => {
                let data = new FormData();
                data.append('id', 'test');
                return data;
            },
            text: () => { return "{id: 'test'}"; },
        });
    });

    test('Create Resource object and get data', () => {
        let resource = new EventeResource('https://localhost/:id', 'text');
        resource.get({id: 'test', type: 'all'}).then(data => {
            expect(typeof data).toBe('string');
            expect(data).toBe("{id: 'test'}");
        });
    });

    test('Create Resource object and post data', () => {
        let resource = new EventeResource('https://localhost/:id');
        resource.post({id: 'test'}).then(data => {
            expect(resource.status).toBe(200);
        });
    });

    test('Create Resource object and put data', () => {
        let resource = new EventeResource('https://localhost/:id', 'form');
        resource.put({id: 'test'}).then(data => {
            expect(data instanceof FormData).toBe(true);
            expect(data.get('id')).toBe('test');
        });
    });

    test('Create Resource object and delete data', () => {
        let resource = new EventeResource('https://localhost/:id');
        resource.delete({id: 'test'}).then(data => {
            expect(resource.ok).toBe(true);
        });
    });

});
