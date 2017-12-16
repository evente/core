const bjs = require('../node/tests.js');

describe('Model class', () => {

    document.body.innerHTML =
        '<div id="for" b-for="items" b-key="id">' +
        '    <p b-field="name"></p>' +
        '</div>' +
        '<input id="model" b-model="form.text">';

    test('Model object creation', () => {
        let model = new bjs.Model('body', { form: { text: 'text' } });
        expect(document.getElementById('model').value).toBe('text');
    });

    test('Model change via variables', () => {
        let model = new bjs.Model('body', { form: {} });
        model.set('form.text', 'text');
        expect(document.getElementById('model').value).toBe('text');
    });

    test('Model change via DOM', () => {
        let model = new bjs.Model('body', { form: {} });
        let element = document.getElementById('model');
        element.value = 'text';
        let event = new Event('change');
        element.dispatchEvent(event);
        expect(model.get('form.text')).toBe('text');
    });

    test('Children creation in b-for', () => {
        let model = new bjs.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('for').children.length).toBe(2);
    });

    test('Children delete in b-for', () => {
        let model = new bjs.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('for').children.length).toBe(2);
        delete model.data.items[3];
        expect(document.getElementById('for').children.length).toBe(1);
    });

});
