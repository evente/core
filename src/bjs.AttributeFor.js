if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.AttributeFor = class AttributeFor extends bjs.Attribute {

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
            child = this.node.querySelector('[b-id="' + key + '"]');
            if ( child && child.b_index !== i ) {
                child.remove();
                child = null;
            }
            if ( !child ) {
                child = this.template.cloneNode(true);
                child.b_index = i;
                child.setAttribute('b-id', key);
                this.dealias(child, '\\$index', i);
                this.dealias(child, this.alias, property + '.' + i);
                this.node.appendChild(child);
                this.model.parseNode(child);
            }
        }
        for ( i = 0; i < this.node.childNodes.length; i++ ) {
            child = this.node.childNodes[i];
            if ( items === undefined || items[child.b_index] === undefined )
                remove.push(child);
        }
        for ( i in remove ) {
            this.model.unlink(remove[i]);
            remove[i].remove();
        }
    }

    dealias(node, alias, base) {
        let regexp = new RegExp('({{.*?)' + alias.replace('.', '\.') + '([ .}+\\-*/|=#&?])', 'gim');
        if ( node instanceof Text ) {
            if ( node.nodeValue.match(regexp) )
                node.nodeValue = node.nodeValue.replace(regexp, '$1' + base + '$2');
            return;
        }
        let i, item, items = node.attributes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            if ( item.value.match(regexp) )
                item.value = item.value.replace(regexp, '$1' + base + '$2');
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

bjs.AttributeFor.priority = 99;
bjs.attributes['b-for'] = bjs.AttributeFor;
