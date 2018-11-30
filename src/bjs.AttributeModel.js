if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.AttributeModel = class AttributeModel extends bjs.Attribute {

    constructor(node, attribute, model) {
        super(node, attribute, model);
    }

    eval() {
        let value = this.expression.eval(this.model) || '';
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
        return this.expression.eval(this.model) || '';
    }

    set(value) {
        this.model.set(this.expression.property(this.model), value);
    }

};

bjs.attributes['b-model'] = bjs.AttributeModel;
