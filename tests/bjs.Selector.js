const bjs = require('../node/tests.js');

document.body.innerHTML =
    '<div class="test test1"></div>' +
    '<div class="test test2"></div>';

describe('Selector class', () => {

    test('Create Selector object with no parameters', () => {
        let selector = new bjs.Selector();
        expect(selector).toHaveLength(0);
    });

    test('Create Selector object with empty string', () => {
        let selector = new bjs.Selector();
        expect(selector).toHaveLength(0);
    });

    test('Create Selector object with selector string', () => {
        let selector = new bjs.Selector('div');
        expect(selector).toHaveLength(2);
    });

    test('Create Selector object with wrong parameters', () => {
        let selector = new bjs.Selector({});
        expect(selector).toHaveLength(0);
    });

});

describe('DOM selectors', () => {

    test('Select elements by tag', () => {
        expect(bjs('body')).toHaveLength(1);
    });

    test('Get NodeElement from selection by index', () => {
        let expected = document.body;
        expect(bjs('body').get(0)).toBe(expected);
    });

    test('Get parents of selected elements', () => {
        let expected = new bjs.Selector([document.body, document.body]);
        expect(bjs('div').parent()).toEqual(expected);
    });

    test('Get parents of empty selection', () => {
        expect(bjs('span').parent()).toBeUndefined();
    });

    test('Find elements inside selection', () => {
        expect(bjs('body').find('div')).toHaveLength(2);
    });

});

describe('Class manipulation', () => {

    test('All of selected elements has class', () => {
        expect(bjs('div').hasClass('test', true)).toBe(true);
    });

    test('Not all of selected elements has class', () => {
        expect(bjs('div').hasClass('test1', true)).toBe(false);
    });

    test('One of selected elements has class', () => {
        expect(bjs('div').hasClass('test1')).toBe(true);
        expect(bjs('div').hasClass('test2')).toBe(true);
    });

    test('None of selected elements has class', () => {
        expect(bjs('div').hasClass('test3')).toBe(false);
    });

    test('Add class to elements', () => {
        expect(
            bjs('body')
                .find('div')
                    .addClass('testClass1 testClass2')
                    .end()
                .find('.testClass1')
        ).toHaveLength(2);
    });

    test('Remove class from elements', () => {
        expect(
            bjs('body')
                .find('div')
                    .removeClass(['testClass1', 'testClass2'])
                    .end()
                .find('.testClass1')
        ).toHaveLength(0);
    });

    test('Toggle class in selected elements', () => {
        expect(
            bjs('body')
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
        expect(bjs('div').text()).toEqual(expected);
    });

    test('Set element text', () => {
        expect(
            bjs('.test1')
                .text('text')
                .text()
        ).toBe('text');
    });

    test('Get element html code', () => {
        expect(bjs('.test2').html()).toBe('');
    });

    test('Set element html code', () => {
        expect(
            bjs('.test2')
                .html('<span>text</span>')
                .html()
        ).toBe('<span>text</span>');
    });

    test('Get undefined attribute', () => {
        expect(bjs('.test1').attr('data-model')).toBeUndefined();
    });

    test('Set attribute', () => {
        expect(
            bjs('.test1')
                .attr('data-model', 'text')
                .attr('data-model')
        ).toBe('text');
    });

});
