if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Model = class Model {

    constructor(selector, data) {
        let model = this;
        bjs.models.push(this);
        this.proxyHandler = new bjs.ModelProxyHandler(this);
        this.data = new Proxy(data || {}, this.proxyHandler);
        this.paths = new WeakMap();
        this.links = {};
        this.selector = new bjs.Selector(selector);
        this.regexp = /{{.*?}}/gm;
        this._init();
    }

    get(property) {
        return this.data.getProperty(property);
    }

    set(property, value) {
        this.data.setProperty(property, value);
    }

    _init() {
        let i, element;
        for ( i in this.selector ) {
            element = this.selector.get(i);
            element.addEventListener('change', bjs.Model.eventHander, true);
            element.addEventListener('keyup', bjs.Model.eventHander, true);
            this._parse_node(element);
        }
    }

    _apply_attributes(node) {
        if ( node._b_attributes === undefined )
            return;
        let i, j, parts, part, value;
        for ( i in node._b_attributes ) {
            value = '';
            parts = node._b_attributes[i];
            for ( j in parts ) {
                part = parts[j];
                switch (part.type) {
                    case 'string': value += part.value;           break;
                    case 'value':  value += this.get(part.value); break;
                }
            }
            node.setAttribute(i, value);
        }
    }

    _get_elements(link) {
        let elements = new Set();
        while ( link != '' ) {
            if ( this.links[link] !== undefined )
                this.links[link].forEach(function(element) {
                    elements.add(element);
                });
            link = link.split('.').slice(0, -1).join('.');
        }
        return elements;
    }

    _parse_attributes(node) {
        let attribute, attributes = node.attributes, parts, pos, property, regexp;
        for ( let i = 0; i < attributes.length; i++ ) {
            attribute = attributes[i];
            parts = [];
            pos = 0;
            regexp = this.regexp.exec(attribute.value);
            while ( regexp ) {
                if ( regexp.index !== pos ) {
                    parts.push({ 'type': 'string', 'value': attribute.value.substr(pos, regexp.index - pos) });
                    pos = regexp.index;
                }
                property = regexp[0].substr(2, regexp[0].length - 4).trim();
                this._link(node, property);
                parts.push({ 'type': 'value', 'value': property });
                pos += regexp[0].length;
                regexp = this.regexp.exec(attribute.value);
            }
            if ( pos && pos < attribute.value.length )
                parts.push({ 'type': 'string', 'value': attribute.value.substr(pos) });
            if ( parts.length ) {
                if ( node._b_attributes === undefined )
                    node._b_attributes = {};
                node._b_attributes[attribute.name] = parts;
                this._apply_attributes(node);
            }
        }
    }

    _parse_node(node, property) {
        if ( property )
            this._apply_attributes(node, property);
        else
            this._parse_attributes(node);
        if ( node.hasAttribute('b-for') )
            this._parse_for(node, property);
        if ( node.hasAttribute('b-base') )
            this._parse_base(node, property);
        let i, tmp, nodes = node.childNodes;
        for ( i = 0; i < nodes.length; i++ ) {
            tmp = nodes[i];
            if (
                tmp instanceof Text ||
                tmp instanceof Comment ||
                tmp instanceof HTMLBRElement ||
                tmp instanceof HTMLScriptElement
            )
                continue;
            this._parse_node(tmp);
        }
        if ( node.hasAttribute('b-model') )
            this._parse_model(node, property);
    }

    _parse_for(element, changed) {
        let property, key, as, items, value, child;
        if ( element._b_template === undefined ) {
            element._b_template = element.children[0];
            element._b_template.remove();
        }
        property = element.getAttribute('b-for');
        this._link(element, property);
        as = element.getAttribute('b-as') || '_';
        key = element.getAttribute('b-key');
        items = this.data.getProperty(property);
        for ( let i in items ) {
            value = items[i][key];
            if ( changed && changed != property && !changed.startsWith(property + '.' + value) )
                continue;
            child = element.querySelector('[b-base="' + property + '.' + value + '"]');
            if ( !child ) {
                child = element._b_template.cloneNode(true);
                child._b_for = property + '.' + value;
                child._b_key = value;
                child.setAttribute('b-base', child._b_for);
                this._replace_local(child, as, child._b_for);
                element.appendChild(child);
            }
            if ( changed )
                this._parse_base(child, changed);
        }
        if ( changed && changed === property ) {
            for ( let i = 0; i < element.children.length; i++ ) {
                child = element.children[i];
                key = child._b_key || '';
                if ( items[key] === undefined && child._b_for !== undefined && child._b_for === property + '.' + key )
                    child.remove();
            }
        }
    }

    _parse_base(element, changed) {
        let base, key, value, property, clear = false, tmp, items, item;
        base = property = element.getAttribute('b-base');
        this._link(element, property);
        value = element.getAttribute('b-key');
        if ( value !== null ) {
            this._link(element, value);
            tmp = this.get(value);
            if ( tmp !== undefined && this.get(property + '.' + tmp) !== undefined )
                property += '.' + tmp;
            else
                property = '';
        }
        property += '.';
        items = Array.prototype.slice.call(element.querySelectorAll('[b-field]'));
        if ( element.hasAttribute('b-field') )
            items.push(element);
        for ( let i in items ) {
            item = items[i];
            if ( property !== '.' ) {
                tmp = property + item.getAttribute('b-field');
                if ( changed && !tmp.startsWith(changed) && changed !== value )
                    continue;
                if ( item.getAttribute('b-model') !== tmp )
                    item.setAttribute('b-model', tmp);
                if ( changed )
                    this._parse_model(item, changed);
            } else {
                item.removeAttribute('b-model');
                this._parse_model(item, changed);
            }
        }
    }

    _parse_model(element) {
        let value = '', property = element.getAttribute('b-model');
        if ( property !== null ) {
            value = this.data.getProperty(property);
            if ( value === undefined )
                value = '';
            this._link(element, property);
        } else
            this._unlink(element);
        if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLButtonElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
        ) {
            if ( typeof value !== 'object' && element.value != value )
                element.value = value;
        } else {
            value = typeof value !== 'object' ? value.toString() : JSON.stringify(value);
            if ( element.textContent != value )
                element.textContent = value;
        }
    }

    _link(element, property) {
        if ( this.links[property] === undefined )
            this.links[property] = new Set();
        this.links[property].add(element);
        if ( element._b_links === undefined )
            element._b_links = new Set();
        element._b_links.add(property);
        if ( element._b_model !== this )
            element._b_model = this;
    }

    _unlink(element, property) {
        if ( element._b_model !== undefined && property === undefined ) {
            if ( element._b_links !== undefined )
                element._b_links.forEach(function(link){
                    element._b_model._unlink(element, link);
                });
        } else {
            if ( this.links[property] !== undefined ) {
                this.links[property].delete(element);
                if ( this.links[property].size === 0 )
                    delete this.links[property];
            }
            if ( element._b_links !== undefined ) {
                element._b_links.delete(property);
                if ( element._b_links.size === 0 ) {
                    delete element._b_model;
                }
            }
        }
    }

    _replace_local(node, local, base) {
        let i, nodes, tmp, attribute,
            attributes = node.attributes,
            regexp = new RegExp('(.*{{.*)' + local.replace('.', '\.') + '\.(.*}}.*)', 'gim');
        for ( i = 0; i < attributes.length; i++ ) {
            attribute = attributes[i];
            if ( attribute.value.match(regexp) )
                node.setAttribute(attribute.name, attribute.value.replace(regexp, '$1' + base + '.$2'));
        }
        nodes = node.childNodes;
        for ( i = 0; i < nodes.length; i++ ) {
            tmp = nodes[i];
            if (
                tmp instanceof Text ||
                tmp instanceof Comment ||
                tmp instanceof HTMLBRElement ||
                tmp instanceof HTMLScriptElement
            )
                continue;
            this._replace_local(tmp, local, base);
        }
    }

}

bjs.Model.eventHander = function(event) {
    if (
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLButtonElement ) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLSelectElement)
    )
        return;
    let model = event.target._b_model;
    let property = event.target.getAttribute('b-model');
    if ( model === undefined || property === null )
        return;
    let value_old = model.get(property);
    let value_new = event.target.value;
    if ( value_old === value_new )
        return;
    model.set(property, value_new);
}
