const bjs = require('../node/tests.js');

describe('App class', () => {

    document.body.innerHTML =
        '<div data-model="text"></div>';

    test('App object creation', () => {
        let app = new bjs.App('body', {text: 'text'});
        expect(app.selector).toHaveLength(1);
    });

});
