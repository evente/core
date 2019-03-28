var evente = require('../scripts/test.js');

const html_attribute =
    '<div id="hide" e-hide="hide"></div>' +
    '<div id="show" e-show="show"></div>';


describe('Attribute class', () => {

    test('Attribute e-hide', () => {
        document.body.innerHTML = html_attribute;
        let model = new evente.Model('body', {hide: true});
        expect(document.getElementById('hide').style.display).toBe('none');
    });

    test('Attribute e-show', () => {
        document.body.innerHTML = html_attribute;
        let model = new evente.Model('body', {show: false});
        expect(document.getElementById('show').style.display).toBe('none');
    });

});
