const EventeAttribute = require('./EventeAttribute');
const EventeModel = require('./EventeModel');
const EventeParser = require('./EventeParser');

/**
 * Base attribute class
 * @extends EventeAttribute
 */
class EventeAttributeBase extends EventeAttribute {

    /**
     * @inheritdoc
     */
    constructor(node, name, model) {
        let attribute = node.attributes[name],
            match = attribute.value.match(/^{{(.*?)(\s+as\s+([a-z0-9_]+))}}$/im);
        attribute.value = '{{' + match[1] + '}}';
        super(node, name, model);
        this.alias = match[3];
        this.apply();
    }

    /**
     * @inheritdoc
     */
    apply() {
        let i, item,
            items = this.node.childNodes,
            property = this.property(this.model);
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            this.dealias(item, this.alias, property);
        }
    }

    /**
     * Change alias in expressions on base path
     * @private
     * @param {Element | Text} node DOM node
     * @param {string} alias Alias name
     * @param {string} base Base path
     */
    dealias(node, alias, base) {
        let value, regexp = new RegExp('(^|[^a-z])' + alias.replace(/\./g, '\\.') + '([^a-z]|$)', 'gim');
        if ( node instanceof Text ) {
            if ( node.e_base ) {
                value = node.e_base.replace(regexp, '$1' + base + '$2');
            } else {
                if ( node.nodeValue.match(regexp) ) {
                    node.e_base = node.nodeValue;
                    value = node.nodeValue.replace(regexp, '$1' + base + '$2');
                } else
                    value = node.nodeValue;
            }
            if ( node.nodeValue !== value ) {
                node.nodeValue = value;
                EventeParser.parseAttributes(node, this.model);
                this.model.applyAttributes(node);
            }
            return;
        }
        node.e_base = node.e_base || {};
        let i, item, items = node.attributes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            value = EventeAttribute.attributes[item.name] ? EventeAttribute.attributes[item.name].check(node, item.name) : item.value;
            if ( node.e_base[item.name] ) {
                value = node.e_base[item.name].replace(regexp, '$1' + base + '$2');
            } else {
                if ( value.match(regexp) ) {
                    node.e_base[item.name] = value;
                    value = value.replace(regexp, '$1' + base + '$2');
                }
            }
            if ( item.value !== value ) {
                item.value = value;
                EventeParser.parseAttribute(node, item.name, this.model);
                this.model.applyAttribute(node, item.name);
            }
        }
        if ( !Object.keys(node.e_base).length )
            delete node.e_base;
        items = node.childNodes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            if (
                item instanceof Comment ||
                item instanceof HTMLBRElement ||
                item instanceof HTMLScriptElement
            )
                continue;
            this.dealias(item, alias, base);
        }
    }

};

EventeAttribute.attributes['e-base'] = EventeAttributeBase;

module.exports = EventeAttributeBase;
