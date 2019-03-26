var rc = require('../bin/test.js');

const html_attribute =
    '<div id="hide" rc-hide="hide"></div>' +
    '<div id="show" rc-show="show"></div>';


describe('Attribute class', () => {

    test('Attribute rc-hide', () => {
        document.body.innerHTML = html_attribute;
        let model = new rc.Model('body', {hide: true});
        expect(document.getElementById('hide').style.display).toBe('none');
    });

    test('Attribute rc-show', () => {
        document.body.innerHTML = html_attribute;
        let model = new rc.Model('body', {show: false});
        expect(document.getElementById('show').style.display).toBe('none');
    });

});
