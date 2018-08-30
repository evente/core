const bjs = require('../bin/test.js');

html_expression =
    '<div id="simple">{{ 2 * a + b - c }} = 1</div>' +
    '<div id="brackets">{{ 2 * (a + b) - c / 2 }}</div>' +
    '<div id="booleans">{{ ( a || b ) && c }}</div>' +
    '<div id="index">{{ items[id + 1].name }}</div>' +
    '<div id="filter_if">{{ a == b | if:a + " is equal " + b }}</div>' +
    '<div id="filter_min_max">{{ numbers | min }}...{{ numbers | max }}</div>' +
    '';


describe('Expression class', () => {

    test('Simple', () => {
        document.body.innerHTML = html_expression;
        let model = new bjs.Model('body', {a: 1, b: 2, c: 3});
        expect(document.getElementById('simple').innerHTML).toBe('1 = 1');
    });

    test('Brackets', () => {
        document.body.innerHTML = html_expression;
        let model = new bjs.Model('body', {a: 1, b: 2, c: 3});
        expect(document.getElementById('brackets').innerHTML).toBe('4.5');
    });

    test('Booleans', () => {
        document.body.innerHTML = html_expression;
        let model = new bjs.Model('body', {a: false, b: 2, c: 0});
        expect(document.getElementById('booleans').innerHTML).toBe("false");
    });

    test('Index and property', () => {
        document.body.innerHTML = html_expression;
        let model = new bjs.Model('body', {id: 0, items: {1: {name: "one"}}});
        expect(document.getElementById('index').innerHTML).toBe("one");
    });

    test('Filter if', () => {
        document.body.innerHTML = html_expression;
        let model = new bjs.Model('body', {a: 1, b: 1});
        expect(document.getElementById('filter_if').innerHTML).toBe("1 is equal 1");
    });

    test('Filters min/max', () => {
        document.body.innerHTML = html_expression;
        let model = new bjs.Model('body', {numbers: [1, 2, 3, 4, 5]});
        expect(document.getElementById('filter_min_max').innerHTML).toBe("1...5");
    });

});
