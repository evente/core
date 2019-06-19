const EventeAttribute = require('./EventeAttribute');
const EventeModel = require('./EventeModel');

/**
 * b-show and b-hide attribute class
 * @extends EventeAttribute
 */
class EventeAttributeHideShow extends EventeAttribute {

    /**
     * @inheritdoc
     */
    constructor(node, name, model) {
        super(node, name, model);
        this.type = name;
    }

    /**
     * @inheritdoc
     */
    apply() {
        if (
            ( this.type == 'e-hide' && !this.eval(this.model) ) ||
            ( this.type == 'e-show' && this.eval(this.model) )
        )
            this.node.style.display = '';
        else
            this.node.style.display = 'none';
    }

};

EventeAttribute.attributes['e-hide'] = EventeAttributeHideShow;
EventeAttribute.attributes['e-show'] = EventeAttributeHideShow;

module.exports = EventeAttributeHideShow;
