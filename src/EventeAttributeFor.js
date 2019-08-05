const EventeAttribute = require('./EventeAttribute');
const EventeModel = require('./EventeModel');
const EventeParser = require('./EventeParser');

/**
 * b-for attribute class
 * @extends EventeAttribute
 */
class EventeAttributeFor extends EventeAttribute {

    /**
     * @inheritdoc
     */
    constructor(node, name, model) {
        let attribute = node.attributes[name],
            match = attribute.value.match(/^{{([a-z0-9_]+)\s+in\s+(.*?)(\s+key\s+([a-z0-9_]+))?}}$/im);
        attribute.value = '{{' + match[2] + '}}';
        super(node, name, model);
        this.alias = match[1];
        this.key = match[4];
        this.template = node.children[0];
        node.innerHTML = '';
    }

    /**
     * @inheritdoc
     */
    apply() {
        let i, key, child,
            remove = [],
            property = this.property(this.model),
            items = this.eval(this.model);
        for ( i in items ) {
            key = this.key !== undefined ? items[i][this.key] : i;
            child = this.node.querySelector('[e-key="' + key + '"]');
            if ( child && child.e_index !== i ) {
                child.remove();
                child = null;
            }
            if ( !child ) {
                child = this.template.cloneNode(true);
                child.e_index = i;
                child.setAttribute('e-key', key);
                this.dealias(child, '\\$index', i);
                this.dealias(child, '\\$key', key);
                this.dealias(child, this.alias, property + '.' + i);
                this.node.appendChild(child);
                EventeParser.parseNode(child, this.model);
            }
        }
        for ( i = 0; i < this.node.childNodes.length; i++ ) {
            child = this.node.childNodes[i];
            if ( items === undefined || items[child.e_index] === undefined )
                remove.push(child);
        }
        for ( i in remove ) {
            this.model.unlink(remove[i]);
            remove[i].remove();
        }
    }

    /**
     * Change alias in expressions on base path
     * @private
     * @param {ChildNode | Element | Text} node DOM node
     * @param {string} alias Alias name
     * @param {string} base Base path
     */
    dealias(node, alias, base) {
        let value,
            replace = new RegExp('(^|[^a-z])' + alias.replace(/\./g, '\\.') + '([^a-z]|$)', 'gim'),
            test = new RegExp('{{');
        if ( node instanceof Text ) {
            value = node.nodeValue;
            if ( !value.match(test) )
                return;
            value = this.preparse(value);
            if ( value.match(replace) )
                node.nodeValue = value.replace(replace, '$1' + base + '$2');
            return;
        }
        let i, attr, attrs = node.attributes;
        for ( i = 0; i < attrs.length; i++ ) {
            attr = attrs[i];
            value = attr.value;
            if ( !EventeAttribute.attributes[attr.name] && !value.match(test) )
                continue;
            value = this.preparse(value);
            if ( value.match(replace) )
                attr.value = value.replace(replace, '$1' + base + '$2');
        }
        let item, items = node.childNodes;
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

EventeAttributeFor.priority = 99;
EventeAttribute.attributes['e-for'] = EventeAttributeFor;

module.exports = EventeAttribute;
