var evente = require('./evente.js');

evente.Attribute = class extends evente.Expression {

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

evente.Attribute.priority = 0;
evente.Attribute.check = function(node, name) {
    let value = node.getAttribute(name).trim();
    return !value.startsWith('{{') ? '{{' + value + '}}' : value;
};
