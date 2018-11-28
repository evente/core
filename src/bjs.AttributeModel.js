if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.AttributeModel = class AttributeModel extends bjs.Attribute {

    constructor(node, attribute) {
        super(node, attribute);
    }

    eval() {
        let value = this.expression.eval(this.node.b_model) || '';
        if (
            this.node instanceof HTMLInputElement ||
            this.node instanceof HTMLButtonElement ||
            this.node instanceof HTMLTextAreaElement ||
            this.node instanceof HTMLSelectElement
        ) {
            if ( typeof value !== 'object' && this.node.value != value )
            this.node.value = value;
        } else {
            value = typeof value !== 'object' ? value.toString() : JSON.stringify(value);
            if ( this.node.textContent != value )
            this.node.textContent = value;
        }
    }

    get() {
        return this.expression.eval(this.node.b_model) || '';
    }

    set(value) {
        this.node.b_model.set(this.expression.property(this.node.b_model), value);
    }

};

bjs.attributes['b-model'] = bjs.AttributeModel;
