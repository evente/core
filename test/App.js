var evente = require('../scripts/test.js');

describe('App class', () => {

    html =
        '<!-- Comment -->' +
        ' ' +
        '<div id="div" e-model="text"></div>' +
        '{{ text }}';
    document.body.innerHTML = html;

    test('App object creation', () => {
        let app = new evente.App('body');
        expect(app.model.element).toBe(document.body);
    });

    test('Removing comments and empty text nodes', () => {
        let app = new evente.App('body', {}, {clean: true, run: true});
        expect(document.body.childNodes).toHaveLength(2);
    });

    test('Get model data', () => {
        let app = new evente.App('body', {text: 'text'}, {run: true});
        expect(app.data.text).toBe('text');
    });

    test('Set model data', () => {
        document.body.innerHTML = html;
        let app = new evente.App('body', {}, {run: true});
        app.data = {text: 'text'};
        expect(document.getElementById('div').textContent).toBe('text');
    });

    test('Add route', () => {
        let app = new evente.App('body');
        app.route('/test/', options => {});
        expect(Object.keys(app.router.routes)).toHaveLength(1);
    });

    test('Add route with disabled routing', () => {
        let app = new evente.App('body', {}, {router: false});
        app.route('/test/', options => {});
        expect(app.router).toBeUndefined();
    });

    test('Remove route', () => {
        let app = new evente.App('body');
        app.route('/', options => {});
        app.route('/');
        expect(Object.keys(app.router.routes)).toHaveLength(0);
    });

});
