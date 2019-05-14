var evente = require('../scripts/test.js');

document.body.innerHTML =
    '<div id="first" class="test test1">' +
    '<input>' +
    '</div>' +
    '<div id="second" class="test test2"></div>';

describe('Selector class', () => {

    test('Create Selector object with no parameters', () => {
        let selector = new evente.Selector();
        expect(selector).toHaveLength(0);
    });

    test('Create Selector object with empty string', () => {
        let selector = new evente.Selector('');
        expect(selector).toHaveLength(0);
    });

    test('Create Selector object with selector string', () => {
        let selector = new evente.Selector('div');
        expect(selector).toHaveLength(2);
    });

    test('Create Selector object with HTMLElement', () => {
        let selector = new evente.Selector(document.body);
        expect(selector).toHaveLength(1);
    });

    test('Create Selector object with wrong parameters', () => {
        let selector = new evente.Selector({});
        expect(selector).toHaveLength(0);
    });

});

describe('DOM selectors', () => {

    test('Select elements by tag', () => {
        let selector = new evente.Selector('body');
        expect(selector).toHaveLength(1);
    });

    test('Get NodeElement from selection by index', () => {
        let selector = new evente.Selector('body');
        let expected = document.body;
        expect(selector.get(0)).toBe(expected);
    });

    test('Get parents of selected elements', () => {
        let selector = new evente.Selector('div');
        let expected = new evente.Selector([document.body, document.body], selector);
        expect(selector.parent()).toEqual(expected);
    });

    test('Get parents of empty selection', () => {
        let selector = new evente.Selector('span');
        expect(selector.parent()).toBeUndefined();
    });

    test('Find elements inside selection', () => {
        let selector = new evente.Selector('body');
        expect(selector.find('div')).toHaveLength(2);
    });

    test('All of selected elements matches selector', () => {
        let selector = new evente.Selector('div');
        expect(selector.is('.test')).toBe(true);
    });

    test('Not all of selected elements matches selector', () => {
        let selector = new evente.Selector('div');
        expect(selector.is('.test1', true)).toBe(false);
    });

    test('One of selected elements matches selector', () => {
        let selector = new evente.Selector('div');
        expect(selector.is('#first')).toBe(true);
        expect(selector.is('.test#second')).toBe(true);
    });

});

describe('Class manipulation', () => {

    test('All of selected elements has class', () => {
        let selector = new evente.Selector('div');
        expect(selector.hasClass('test', true)).toBe(true);
    });

    test('Not all of selected elements has class', () => {
        let selector = new evente.Selector('div');
        expect(selector.hasClass('test1', true)).toBe(false);
    });

    test('One of selected elements has class', () => {
        let selector = new evente.Selector('div');
        expect(selector.hasClass('test1')).toBe(true);
        expect(selector.hasClass('test2')).toBe(true);
    });

    test('None of selected elements has class', () => {
        let selector = new evente.Selector('div');
        expect(selector.hasClass('test3')).toBe(false);
    });

    test('Add class to elements', () => {
        let selector = new evente.Selector('body');
        expect(
            selector
                .find('div')
                    .addClass('testClass1 testClass2')
                    .end()
                .find('.testClass1')
        ).toHaveLength(2);
    });

    test('Remove class from elements', () => {
        let selector = new evente.Selector('body');
        expect(
            selector
                .find('div')
                    .removeClass(['testClass1', 'testClass2'])
                    .end()
                .find('.testClass1')
        ).toHaveLength(0);
    });

    test('Toggle class in selected elements', () => {
        let selector = new evente.Selector('body');
        expect(
            selector
                .find('div')
                    .toggleClass('test')
                    .end()
                .find('.test')
        ).toHaveLength(0);
    });

});

describe('Attributes manipulation', () => {

    test('Get elements text', () => {
        let selector = new evente.Selector('div');
        let expected = ['', ''];
        expect(selector.text()).toEqual(expected);
    });

    test('Set element text', () => {
        let selector = new evente.Selector('.test2');
        expect(
            selector
                .text('text')
                .text()
        ).toBe('text');
    });

    test('Get element html code', () => {
        let selector = new evente.Selector('.test1');
        expect(selector.html()).toBe('<input>');
    });

    test('Set element html code', () => {
        let selector = new evente.Selector('.test2');
        expect(
            selector
                .html('<span>text</span>')
                .html()
        ).toBe('<span>text</span>');
    });

    test('Get undefined attribute', () => {
        let selector = new evente.Selector('.test1');
        expect(selector.attr('data-model')).toBeUndefined();
    });

    test('Set attribute', () => {
        let selector = new evente.Selector('.test1');
        expect(
            selector
                .attr('data-model', 'text')
                .attr('data-model')
        ).toBe('text');
    });

    test('Get value of HTMLInputElement', () => {
        let selector = new evente.Selector('input');
        expect(selector.val()).toBe('');
    });

    test('Get value of non HTMLInputElement', () => {
        let selector = new evente.Selector('.test1');
        expect(selector.val()).toBeUndefined();
    });

    test('Set value of HTMLInputElement', () => {
        let selector = new evente.Selector('input');
        expect(selector.val('text').val()).toBe('text');
    });

    test('Set value of non HTMLInputElement', () => {
        let selector = new evente.Selector('.test1');
        expect(selector.val('text').val()).toBeUndefined();
    });

});

describe('Utilites', () => {

    test('Node containing', () => {
        let selector = new evente.Selector('input');
        let node = selector[0];
        selector = new evente.Selector('.test1');
        expect(selector.contains(node)).toBe(true);
        selector = new evente.Selector('.test2');
        expect(selector.contains(node)).toBe(false);
    });

});
