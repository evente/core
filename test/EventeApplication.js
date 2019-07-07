const evente = require('../src/Evente');
const EventeApplication = require('../src/EventeApplication')

const html =
    '<!-- Comment -->' +
    ' ' +
    '<div id="div" e-model="text"></div>' +
    '{{ text }}';

describe('App class', () => {

    test('App object creation', () => {
        document.body.innerHTML = html;
        let app = new EventeApplication('body', {}, {run: false});
        expect(app.element).toBe(document.body);
    });

    test('Removing comments and empty text nodes', () => {
        document.body.innerHTML = html;
        let app = evente('body', {}, {clean: true});
        expect(document.body.childNodes).toHaveLength(2);
    });

    test('Get model data', () => {
        document.body.innerHTML = html;
        let app = evente('body', {text: 'text'});
        expect(app.data.text).toBe('text');
    });

    test('Set model data', () => {
        document.body.innerHTML = html;
        let app = evente('body', {});
        app.data = {text: 'text'};
        expect(document.getElementById('div').textContent).toBe('text');
    });

    test('Add route', () => {
        document.body.innerHTML = html;
        let app = evente('body');
        app.route('/test/', options => {});
        expect(Object.keys(app.router.routes)).toHaveLength(1);
    });

    test('Add route with disabled routing', () => {
        document.body.innerHTML = html;
        let app = evente('body', {}, {router: false});
        app.route('/test/', options => {});
        expect(app.router).toBeUndefined();
    });

    test('Remove route', () => {
        document.body.innerHTML = html;
        let app = evente('body');
        app.route('/', options => {});
        app.route('/');
        expect(Object.keys(app.router.routes)).toHaveLength(0);
    });

});
