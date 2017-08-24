const bjs = require('../node/tests.js');

describe('Model class', () => {

    document.body.innerHTML =
        '<input id="text" data-model="form.text">';

    test('Model object creation', () => {
        let model = new bjs.Model('body', { form: { text: 'text' } });
        expect(document.getElementById('text').value).toBe('text');
    });

    test('Model change via variables', () => {
        let model = new bjs.Model('body', { form: {} });
        model.set('form.text', 'text');
        expect(document.getElementById('text').value).toBe('text');
    });

    test('Model change via DOM', () => {
        let model = new bjs.Model('body', { form: {} });
        let element = document.getElementById('text');
        element.value = 'text';
        let event = new Event('change');
        element.dispatchEvent(event);
        expect(model.get('form.text')).toBe('text');
    });

});
