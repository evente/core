var bjs = require('../bin/test.js');

describe('App class', () => {

    document.body.innerHTML =
        '<div data-model="text"></div>';

    test('App object creation', () => {
        let app = new bjs.App('body');
        expect(app.model.selector).toHaveLength(1);
    });

    test('Add route', () => {
        let app = new bjs.App('body');
        app.route('/test/', options => {});
        expect(Object.keys(app.router.routes)).toHaveLength(1);
    });

    test('Remove route', () => {
        let app = new bjs.App('body');
        app.route('/', options => {});
        app.route('/');
        expect(Object.keys(app.router.routes)).toHaveLength(0);
    });

});
