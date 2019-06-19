const EventeExpression = require('./EventeExpression');
const EventeModel = require('./EventeModel');

/**
 * Attribute class
 * @extends EventeExpression
 */
class EventeAttribute extends EventeExpression {

    /**
     * @param {HTMLElement} node DOM element
     * @param {string} name Attribute name
     * @param {EventeModel} model EventeModel object
     */
    constructor(node, name, model) {
        let attribute = node.attributes[name];
        super(attribute.value);
        this.name = name;
        this.node = node;
        this.model = model;
    }

    /**
     * Apply attributes values
     */
    apply() {
        let value = this.eval(this.model);
        value = value !== undefined ? value.toString() : '';
        if ( this.node.getAttribute(this.name) !== value )
            this.node.setAttribute(this.name, value);
    }

    /**
     * Check attribute expression is in double braces
     * @param {Element} node DOM element
     * @param {string} name Attribute name
     * @returns {string}
     */
    static check(node, name) {
        let value = node.getAttribute(name).trim();
        return !value.startsWith('{{') ? '{{' + value + '}}' : value;
    };

    /**
     * Get registered attributes ordered by priority
     * @returns {Array<Object>}
     */
    static getAttributes() {
        if ( EventeAttribute.attributesByPriorty.length !== Object.keys(EventeAttribute.attributes).length ) {
            let tmp = [];
            for ( let i in EventeAttribute.attributes )
                tmp.push({ name: i, priority: EventeAttribute.attributes[i].priority});
            tmp.sort((a,b) => {
                if ( a.priority > b.priority )
                    return -1;
                if ( a.priority < b.priority )
                    return 1;
                return 0;
            })
            EventeAttribute.attributesByPriorty = tmp;
        }
        return EventeAttribute.attributesByPriorty;
    }

};

/**
 * Registered attributes
 * @type {Object}
 */
EventeAttribute.attributes = {};
/**
 * Regstered attributes ordered by priority
 * @private
 * @type {Array<Object>}
 */
EventeAttribute.attributesByPriorty = [];
/**
 * Default attribute priority
 * @type {number}
 * @default 0
 */
EventeAttribute.priority = 0;

module.exports = EventeAttribute;
