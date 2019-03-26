if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var rc = require('./rc.js');

rc.AttributeModel = class AttributeModel extends rc.Attribute {

    constructor(node, name, model) {
        super(node, name, model);
    }

    apply() {
        let value = this.eval(this.model);
        if ( value !== undefined )
            value = typeof value !== 'object' ? value.toString() : JSON.stringify(value);
        else
            value = '';
        if (
            this.node instanceof HTMLInputElement ||
            this.node instanceof HTMLButtonElement ||
            this.node instanceof HTMLTextAreaElement ||
            this.node instanceof HTMLSelectElement
        ) {
            if ( this.node.value != value )
                this.node.value = value;
        } else {
            if ( this.node.textContent != value )
                this.node.textContent = value;
        }
    }

    get() {
        let value = this.eval(this.model);
        return value !== undefined ? value : '';
    }

    set(value) {
        this.model.set(this.property(this.model), value);
    }

};

rc.attributes['rc-model'] = rc.AttributeModel;
