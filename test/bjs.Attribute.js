const bjs = require('../bin/test.js');

const html_attribute =
    '<div id="hide" b-hide="hide"></div>' +
    '<div id="show" b-show="show"></div>';


describe('Attribute class', () => {

    test('Attribute b-hide', () => {
        document.body.innerHTML = html_attribute;
        let model = new bjs.Model('body', {hide: true});
        expect(document.getElementById('hide').style.display).toBe('none');
    });

    test('Attribute b-show', () => {
        document.body.innerHTML = html_attribute;
        let model = new bjs.Model('body', {show: false});
        expect(document.getElementById('show').style.display).toBe('none');
    });

});
