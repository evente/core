if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Attribute = class Attribute extends bjs.Expression {

    constructor(node, name, model) {
        let attribute = node.attributes[name];
        super(attribute.value);
        this.name = name;
        this.node = node;
        this.model = model;
    }

    apply() {
        let value = this.eval(this.model);
        value = value !== undefined ? value.toString() : '';
        if ( this.node.getAttribute(this.name) !== value )
            this.node.setAttribute(this.name, value);
    }

};

bjs.Attribute.priority = 0;
bjs.Attribute.check = function(node, name) {
    let value = node.getAttribute(name).trim();
    return !value.startsWith('{{') ? '{{' + value + '}}' : value;
};
