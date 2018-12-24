if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.AttributeModel = class AttributeModel extends bjs.Attribute {

    constructor(node, name, model) {
        super(node, name, model);
    }

    apply() {
        let value = this.eval(this.model) || '';
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
        return this.eval(this.model) || '';
    }

    set(value) {
        this.model.set(this.property(this.model), value);
    }

};

bjs.attributes['b-model'] = bjs.AttributeModel;
