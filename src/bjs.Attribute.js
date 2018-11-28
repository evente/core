if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Attribute = class Attribute {

    constructor(node, attribute) {
        this.expression = new bjs.Expression(attribute.value);
        this.name = attribute.name;
        this.node = node;
    }

    eval() {
        this.node.setAttribute(this.name, this.expression.eval(this.node.b_model) || '');
    }

    getLinks() {
        return this.expression.getLinks();
    }

};

bjs.Attribute.check = function(node, name) {
    let value = node.getAttribute(name).trim();
    return !value.startsWith('{{') ? '{{' + value + '}}' : value;
};
