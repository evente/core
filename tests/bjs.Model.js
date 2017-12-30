const bjs = require('../node/tests.js');

const html_model =
    '<!-- html -->' +
    '<h1 id="text">Items count is {{items.length}}!</h1>' +
    '<select id="for" b-for="items" b-as="item" b-key="id">' +
    '   <option b-field="name" value="{{item.id}}">' +
    '      <!-- item id -->' +
    '      {{item.id}}' +
    '   </option>' +
    '</select>' +
    '<div b-base="items" b-key="item_id">' +
    '   <p id="base" b-field="id"></p>' +
    '</div>' +
    '<input id="model" b-model="form.text">';


describe('Model class', () => {

    test('Expressions in text nodes', () => {
        document.body.innerHTML = html_model;
        let model = new bjs.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('text').textContent).toBe('Items count is 2!');
    });

    test('Model object creation', () => {
        document.body.innerHTML = html_model;
        let model = new bjs.Model('body', { form: { text: 'text' } });
        expect(document.getElementById('model').value).toBe('text');
    });

    test('Model change via variables', () => {
        document.body.innerHTML = html_model;
        let model = new bjs.Model('body', { form: {} });
        model.set('form.text', 'text');
        expect(document.getElementById('model').value).toBe('text');
    });

    test('Model change via DOM', () => {
        document.body.innerHTML = html_model;
        let model = new bjs.Model('body', { form: {} });
        let element = document.getElementById('model');
        element.value = 'text';
        let event = new Event('change');
        element.dispatchEvent(event);
        expect(model.get('form.text')).toBe('text');
    });

    test('Children creation in b-for', () => {
        document.body.innerHTML = html_model;
        let model = new bjs.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('for').children.length).toBe(2);
    });

    test('Children delete in b-for', () => {
        document.body.innerHTML = html_model;
        let model = new bjs.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('for').children.length).toBe(2);
        delete model.data.items[3];
        expect(document.getElementById('for').children.length).toBe(1);
    });

    test('Data linking in b-base and b-key', () => {
        document.body.innerHTML = html_model;
        let model = new bjs.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } }, item_id: 1 });
        expect(document.getElementById('base').textContent).toBe('1');
    });

    test('Linked data changing', () => {
        document.body.innerHTML = html_model;
        let model = new bjs.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } }, item_id: 1 });
        model.data.item_id = 3;
        expect(document.getElementById('base').textContent).toBe('3');
    });

});
