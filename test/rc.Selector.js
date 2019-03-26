var rc = require('../bin/test.js');

document.body.innerHTML =
    '<div id="first" class="test test1">' +
    '<input>' +
    '</div>' +
    '<div id="second" class="test test2"></div>';

describe('Selector class', () => {

    test('Create Selector object with no parameters', () => {
        let selector = new rc.Selector();
        expect(selector).toHaveLength(0);
    });

    test('Create Selector object with empty string', () => {
        let selector = new rc.Selector('');
        expect(selector).toHaveLength(0);
    });

    test('Create Selector object with selector string', () => {
        let selector = new rc.Selector('div');
        expect(selector).toHaveLength(2);
    });

    test('Create Selector object with HTMLElement', () => {
        let selector = new rc.Selector(document.body);
        expect(selector).toHaveLength(1);
    });

    test('Create Selector object with wrong parameters', () => {
        let selector = new rc.Selector({});
        expect(selector).toHaveLength(0);
    });

});

describe('DOM selectors', () => {

    test('Select elements by tag', () => {
        expect(rc('body')).toHaveLength(1);
    });

    test('Get NodeElement from selection by index', () => {
        let expected = document.body;
        expect(rc('body').get(0)).toBe(expected);
    });

    test('Get parents of selected elements', () => {
        let divs = rc('div');
        let expected = new rc.Selector([document.body, document.body], divs);
        expect(divs.parent()).toEqual(expected);
    });

    test('Get parents of empty selection', () => {
        expect(rc('span').parent()).toBeUndefined();
    });

    test('Find elements inside selection', () => {
        expect(rc('body').find('div')).toHaveLength(2);
    });

    test('All of selected elements matches selector', () => {
        expect(rc('div').is('.test')).toBe(true);
    });

    test('Not all of selected elements matches selector', () => {
        expect(rc('div').is('.test1', true)).toBe(false);
    });

    test('One of selected elements matches selector', () => {
        expect(rc('div').is('#first')).toBe(true);
        expect(rc('div').is('.test#second')).toBe(true);
    });

});

describe('Class manipulation', () => {

    test('All of selected elements has class', () => {
        expect(rc('div').hasClass('test', true)).toBe(true);
    });

    test('Not all of selected elements has class', () => {
        expect(rc('div').hasClass('test1', true)).toBe(false);
    });

    test('One of selected elements has class', () => {
        expect(rc('div').hasClass('test1')).toBe(true);
        expect(rc('div').hasClass('test2')).toBe(true);
    });

    test('None of selected elements has class', () => {
        expect(rc('div').hasClass('test3')).toBe(false);
    });

    test('Add class to elements', () => {
        expect(
            rc('body')
                .find('div')
                    .addClass('testClass1 testClass2')
                    .end()
                .find('.testClass1')
        ).toHaveLength(2);
    });

    test('Remove class from elements', () => {
        expect(
            rc('body')
                .find('div')
                    .removeClass(['testClass1', 'testClass2'])
                    .end()
                .find('.testClass1')
        ).toHaveLength(0);
    });

    test('Toggle class in selected elements', () => {
        expect(
            rc('body')
                .find('div')
                    .toggleClass('test')
                    .end()
                .find('.test')
        ).toHaveLength(0);
    });

});

describe('Attributes manipulation', () => {

    test('Get elements text', () => {
        let expected = ['', ''];
        expect(rc('div').text()).toEqual(expected);
    });

    test('Set element text', () => {
        expect(
            rc('.test2')
                .text('text')
                .text()
        ).toBe('text');
    });

    test('Get element html code', () => {
        expect(rc('.test1').html()).toBe('<input>');
    });

    test('Set element html code', () => {
        expect(
            rc('.test2')
                .html('<span>text</span>')
                .html()
        ).toBe('<span>text</span>');
    });

    test('Get undefined attribute', () => {
        expect(rc('.test1').attr('data-model')).toBeUndefined();
    });

    test('Set attribute', () => {
        expect(
            rc('.test1')
                .attr('data-model', 'text')
                .attr('data-model')
        ).toBe('text');
    });

    test('Get value of HTMLInputElement', () => {
        expect(rc('input').val()).toBe('');
    });

    test('Get value of non HTMLInputElement', () => {
        expect(rc('.test1').val()).toBeUndefined();
    });

    test('Set value of HTMLInputElement', () => {
        expect(rc('input').val('text').val()).toBe('text');
    });

    test('Set value of non HTMLInputElement', () => {
        expect(rc('.test1').val('text').val()).toBeUndefined();
    });

});

describe('Utilites', () => {

    test('Node containing', () => {
        let node = rc('input')[0];
        expect(rc('.test1').contains(node)).toBe(true);
        expect(rc('.test2').contains(node)).toBe(false);
    });

});
