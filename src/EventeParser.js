const EventeAttribute = require('./EventeAttribute');
const EventeExpression = require('./EventeExpression');
const EventeModel = require('./EventeModel');

/**
 * Evente HTML template parser
 */
class EventeParser {

    /**
     * Parse DOM node
     * @param {Node} node DOM node
     * @param {EventeModel} model EventeModel object
     */
    static parseNode(node, model) {
        EventeParser.parseAttributes(node, model);
        if ( node instanceof Text ) {
            model.applyAttributes(node);
            return;
        }
        let i, item, items = node.childNodes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            if (
                item instanceof Comment ||
                item instanceof HTMLBRElement ||
                item instanceof HTMLScriptElement
            )
                continue;
            EventeParser.parseNode(item, model);
        }
        model.applyAttributes(node);
    }

    /**
     * Parse attributes of DOM node
     * @param {Node} node DOM node
     * @param {EventeModel} model EventeModel object
     */
    static parseAttributes(node, model) {
        if ( node instanceof Text ) {
            if ( node.nodeValue.indexOf('{{') !== -1 ) {
                node.e_attributes = { '': new EventeExpression(node.nodeValue) };
                model.updateLinks(node);
            } else {
                if ( node.e_attributes === undefined )
                    delete node.e_attributes;
            }
            return;
        }
        let i, attribute, attributes = EventeAttribute.getAttributes();
        for ( i in attributes )
            EventeParser.parseAttribute(node, attributes[i].name, model);
        for ( i = 0; i < node.attributes.length; i++ ) {
            attribute = node.attributes[i];
            if ( EventeAttribute.attributes[attribute.name] === undefined )
                EventeParser.parseAttribute(node, attribute.name, model);
        }
        if ( node.e_attributes )
            model.updateLinks(node);
    }

    /**
     * Parse attribute DOM node
     * @param {Node} node DOM node
     * @param {string} name Attribute name
     * @param {EventeModel} model EventeModel object
     */
    static parseAttribute(node, name, model) {
        let value, tmp = node.attributes[name];
        if ( !tmp ) {
            if ( node.e_attributes )
                delete node.e_attributes[name];
            return;
        }
        if ( node.e_attributes && node.e_attributes[name] ) {
            let expression = '{{' + node.e_attributes[name].expression  + '}}';
            if ( expression === tmp.value )
                return;
        }
        if ( EventeAttribute.attributes[name] ) {
            value = EventeAttribute.attributes[name].check(node, name);
            if ( tmp.value !== value )
                tmp.value = value;
            tmp = new EventeAttribute.attributes[name](node, name, model);
        } else {
            if (tmp.value.indexOf('{{') === -1)
                return;
            tmp = new EventeAttribute(node, name, model);
        }
        if ( node.e_attributes === undefined )
            node.e_attributes = {};
        node.e_attributes[name] = tmp;
    }
}

module.exports = EventeParser;
