const EventeAttribute = require('./EventeAttribute');
const EventeModel = require('./EventeModel');

/**
 * b-model attribute class
 * @extends EventeAttribute
 */
class EventeAttributeModel extends EventeAttribute {

    /**
     * @inheritdoc
     */
    constructor(node, name, model) {
        super(node, name, model);
    }

    /**
     * @inheritdoc
     */
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

    /**
     * Get assotiated model field value
     * @returns {*}
     */
    get() {
        let value = this.eval(this.model);
        return value !== undefined ? value : '';
    }

    /**
     * Set assotiated model field value
     * @param {*} value
     */
    set(value) {
        this.model.set(this.property(this.model), value);
    }

};

EventeAttribute.attributes['e-model'] = EventeAttributeModel;

module.exports = EventeAttribute;
