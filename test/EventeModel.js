const evente = require('../src/Evente');

const html =
    '<h1 id="text">Items count is {{items.length}}!</h1>' +
    '<select id="for" e-for="item in items key id">' +
    '   <option value="{{item.id}}">' +
    '      {{item.id}}' +
    '   </option>' +
    '</select>' +
    '<div e-base="items[item_id] as item">' +
    '   <p id="base">item {{item.id}}</p>' +
    '</div>' +
    '<input id="model" e-model="form.text">';

describe('Model class', () => {

    test('Expressions in text nodes', () => {
        document.body.innerHTML = html;
        let app = evente('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('text').textContent).toBe('Items count is 2!');
    });

    test('Model object creation', () => {
        document.body.innerHTML = html;
        let app = evente('body', { form: { text: 'text' } });
        expect(document.getElementById('model').value).toBe('text');
    });

    test('Model change via variables', () => {
        document.body.innerHTML = html;
        let app = evente('body', { form: {} });
        app.model.set('form.text', 'text');
        expect(document.getElementById('model').value).toBe('text');
    });

    test('Model change via DOM', () => {
        document.body.innerHTML = html;
        let app = evente('body', { form: {} });
        let element = document.getElementById('model');
        element.value = 'text';
        let event = new Event('input');
        element.dispatchEvent(event);
        expect(app.model.get('form.text')).toBe('text');
    });

    test('Children creation in e-for', () => {
        document.body.innerHTML = html;
        let app = evente('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('for').children.length).toBe(2);
    });

    test('Children delete in e-for', () => {
        document.body.innerHTML = html;
        let app = evente('body', { items: { 1: { id: 1 }, 3: { id: 3 } } });
        expect(document.getElementById('for').children.length).toBe(2);
        delete app.data.items[3];
        expect(document.getElementById('for').children.length).toBe(1);
    });

    test('Data linking in e-base', () => {
        document.body.innerHTML = html;
        let app = evente('body', { items: { 1: { id: 1 }, 3: { id: 3 } }, item_id: 1 });
        expect(document.getElementById('base').textContent).toBe('item 1');
    });

    test('Linked data changing', () => {
        document.body.innerHTML = html;
        let app = evente('body', { items: { 1: { id: 1 }, 3: { id: 3 } }, item_id: 1 });
        app.data.item_id = 3;
        expect(document.getElementById('base').textContent).toBe('item 3');
    });

});
