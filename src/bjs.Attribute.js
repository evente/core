if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Attribute = class Attribute {

    constructor(node, attribute) {
        this.expression = new bjs.Expression(attribute.value);
    }

    eval(node) {}

    getLinks() {
        return this.expression.getLinks();
    }

};

bjs.Attribute.check = function(node, name) {
    let value = node.getAttribute(name).trim();
    if ( !value.startsWith('{{') )
        node.setAttribute(name, '{{' + value + '}}');
};
