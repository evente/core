const evente = require('../src/Evente');

const html =
    '<a href="/items">' +
    '    <span id="items"></span>' +
    '</a>' +
    '<a href="//localhost/items/add">' +
    '    <span id="items"></span>' +
    '</a>' +
    '<a href="http://localhost/items/1">' +
    '    <span id="id1"></span>' +
    '</a>' +
    '';

describe('Model class', () => {

    test('Register routes', () => {
        document.body.innerHTML = html;
        let app = evente('body');
        app.route('/items/:id', () => {});
        expect(Object.keys(app.router.routes).length).toBe(1);
    });

    test('Handle route change via DOM events', () => {
        document.body.innerHTML = html;
        let app = evente('body');
        app.route('/items/:id', () => {});
        document.getElementById('id1').click();
        expect(location.href).toBe('http://localhost/items/1');
    });

});
