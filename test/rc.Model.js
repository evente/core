var rc = require('../bin/test.js');

const html_model =
    '<!-- html -->' +
    '<h1 id="text">Items count is {{items.length}}!</h1>' +
    '<select id="for" rc-for="item in items key id">' +
    '   <option value="{{item.id}}">' +
    '      <!-- item id -->' +
    '      {{item.id}}' +
    '   </option>' +
    '</select>' +
    '<div rc-base="items[item_id] as item">' +
    '   <p id="base">{{item.id}}</p>' +
    '</div>' +
    '<input id="model" rc-model="form.text">';


describe('Model class', () => {

    test('Expressions in text nodes', () => {
        document.body.innerHTML = html_model;
        let model = new rc.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('text').textContent).toBe('Items count is 2!');
    });

    test('Model object creation', () => {
        document.body.innerHTML = html_model;
        let model = new rc.Model('body', { form: { text: 'text' } });
        expect(document.getElementById('model').value).toBe('text');
    });

    test('Model change via variables', () => {
        document.body.innerHTML = html_model;
        let model = new rc.Model('body', { form: {} });
        model.set('form.text', 'text');
        expect(document.getElementById('model').value).toBe('text');
    });

    test('Model change via DOM', () => {
        document.body.innerHTML = html_model;
        let model = new rc.Model('body', { form: {} });
        let element = document.getElementById('model');
        element.value = 'text';
        let event = new Event('input');
        element.dispatchEvent(event);
        expect(model.get('form.text')).toBe('text');
    });

    test('Children creation in rc-for', () => {
        document.body.innerHTML = html_model;
        let model = new rc.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('for').children.length).toBe(2);
    });

    test('Children delete in rc-for', () => {
        document.body.innerHTML = html_model;
        let model = new rc.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('for').children.length).toBe(2);
        delete model.data.items[3];
        expect(document.getElementById('for').children.length).toBe(1);
    });

    test('Data linking in rc-base', () => {
        document.body.innerHTML = html_model;
        let model = new rc.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } }, item_id: 1 });
        expect(document.getElementById('base').textContent).toBe('1');
    });

    test('Linked data changing', () => {
        document.body.innerHTML = html_model;
        let model = new rc.Model('body', { items: { 1: { id: 1 }, 3: { id: 3 } }, item_id: 1 });
        model.data.item_id = 3;
        expect(document.getElementById('base').textContent).toBe('3');
    });

});
