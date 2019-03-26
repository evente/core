if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var rc = require('./rc.js');

rc.AttributeBase = class AttributeBase extends rc.Attribute {

    constructor(node, name, model) {
        let attribute = node.attributes[name],
            match = attribute.value.match(/^{{(.*?)(\s+as\s+([a-z0-9_]+))}}$/im);
        attribute.value = '{{' + match[1] + '}}';
        super(node, name, model);
        this.alias = match[3];
        this.apply();
    }

    apply() {
        let i, item,
            items = this.node.childNodes,
            property = this.property(this.model);
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            this.dealias(item, this.alias, property);
        }
    }

    dealias(node, alias, base) {
        let value, regexp = new RegExp('(^|[^a-z])' + alias.replace(/\./g, '\\.') + '([^a-z]|$)', 'gim');
        if ( node instanceof Text ) {
            if ( node.rc_base ) {
                value = node.rc_base.replace(regexp, '$1' + base + '$2');
            } else {
                if ( node.nodeValue.match(regexp) ) {
                    node.rc_base = node.nodeValue;
                    value = node.nodeValue.replace(regexp, '$1' + base + '$2');
                } else
                    value = node.nodeValue;
            }
            if ( node.nodeValue !== value ) {
                node.nodeValue = value;
                this.model.parseAttributes(node);
                this.model.applyAttributes(node);
            }
            return;
        }
        node.rc_base = node.rc_base || {};
        let i, item, items = node.attributes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            value = rc.attributes[item.name] ? rc.attributes[item.name].check(node, item.name) : item.value;
            if ( node.rc_base[item.name] ) {
                value = node.rc_base[item.name].replace(regexp, '$1' + base + '$2');
            } else {
                if ( value.match(regexp) ) {
                    node.rc_base[item.name] = value;
                    value = value.replace(regexp, '$1' + base + '$2');
                }
            }
            if ( item.value !== value ) {
                item.value = value;
                this.model.parseAttribute(node, item.name);
                this.model.applyAttribute(node, item.name);
            }
        }
        if ( !Object.keys(node.rc_base).length )
            delete node.rc_base;
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

rc.attributes['rc-base'] = rc.AttributeBase;
