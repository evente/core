if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var rc = require('./rc.js');

rc.AttributeFor = class AttributeFor extends rc.Attribute {

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

    apply() {
        let i, key, child,
            remove = [],
            property = this.property(this.model),
            items = this.eval(this.model);
        for ( i in items ) {
            key = this.key !== undefined ? items[i][this.key] : i;
            child = this.node.querySelector('[b-key="' + key + '"]');
            if ( child && child.rc_index !== i ) {
                child.remove();
                child = null;
            }
            if ( !child ) {
                child = this.template.cloneNode(true);
                child.rc_index = i;
                child.setAttribute('b-key', key);
                this.dealias(child, '\\$index', i);
                this.dealias(child, '\\$key', key);
                this.dealias(child, this.alias, property + '.' + i);
                this.node.appendChild(child);
                this.model.parseNode(child);
            }
        }
        for ( i = 0; i < this.node.childNodes.length; i++ ) {
            child = this.node.childNodes[i];
            if ( items === undefined || items[child.rc_index] === undefined )
                remove.push(child);
        }
        for ( i in remove ) {
            this.model.unlink(remove[i]);
            remove[i].remove();
        }
    }

    dealias(node, alias, base) {
        let replace = new RegExp('(^|[^a-z])' + alias.replace(/\./g, '\\.') + '([^a-z]|$)', 'gim'),
            test = new RegExp('{{');
        if ( node instanceof Text ) {
            if ( node.nodeValue.match(replace) )
                node.nodeValue = node.nodeValue.replace(replace, '$1' + base + '$2');
            return;
        }
        let i, item, items = node.attributes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            if ( !rc.attributes[item.name] && !item.value.match(test) )
                continue;
            if ( item.value.match(replace) )
                item.value = item.value.replace(replace, '$1' + base + '$2');
        }
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

rc.AttributeFor.priority = 99;
rc.attributes['b-for'] = rc.AttributeFor;
