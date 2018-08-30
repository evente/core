if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Model = class Model {

    constructor(selector, data) {
        if ( data )
            data.strings = bjs.strings;
        bjs.models.push(this);
        this.proxyHandler = new bjs.ModelProxyHandler(this);
        this.shadow = data || { strings: bjs.strings };
        this.proxy = new Proxy({$: ''}, this.proxyHandler);
        this.links = {};
        this.selector = new bjs.Selector(selector);
        this.init();
    }

    get data() {
        return this.proxy;
    }

    set data(value) {
        value.strings = bjs.strings;
        this.shadow = value;
        for ( let i in this.selector )
            this.parse_node(this.selector.get(i), '');
    }

    get(property) {
        return this.data.getProperty(property);
    }

    set(property, value) {
        this.data.setProperty(property, value);
    }

    init() {
        let i, element;
        for ( i in this.selector ) {
            element = this.selector.get(i);
            element.addEventListener('change', bjs.Model.eventHander, true);
            element.addEventListener('keyup', bjs.Model.eventHander, true);
            this.parse_node(element);
        }
    }

    apply_attributes(node) {
        if ( node.b_attributes === undefined )
            return;
        if ( node instanceof Text ) {
            node.nodeValue = node.b_attributes.eval(this);
            return;
        }
        let i, tmp;
        for ( i in node.b_attributes ) {
            if ( bjs.attributes[i] !== undefined )
                node.b_attributes[i].eval(node);
            else
                node.setAttribute(i, node.b_attributes[i].eval(this));
        }
    }

    get_elements(link) {
        let i, elements = new Set();
        for ( i in this.links ) {
            if ( !i.startsWith(link + '.') )
                continue;
            this.links[i].forEach(function(element) {
                elements.add(element);
            });
        }
        while ( link != '' ) {
            if ( this.links[link] !== undefined )
                this.links[link].forEach(function(element) {
                    elements.add(element);
                });
            link = link.split('.').slice(0, -1).join('.');
        }
        return elements;
    }

    parse_attributes(node) {
        if ( node instanceof Text ) {
            if ( node.nodeValue.indexOf('{{') !== -1 ) {
                node.b_attributes = new bjs.Expression(node.nodeValue);
                let i, links = node.b_attributes.getLinks();
                for ( i in links )
                    this.link(node, links[i]);
                this.apply_attributes(node);
            }
            return;
        }
        let i, j, links, attribute, attributes = node.attributes;
        for ( i = 0; i < attributes.length; i++ ) {
            attribute = attributes[i];
            if ( bjs.attributes[attribute.name] !== undefined )
                bjs.attributes[attribute.name].check(node, attribute.name);
            if (attribute.value.indexOf('{{') === -1)
                continue;
            if ( node.b_attributes === undefined )
                node.b_attributes = {};
            if ( bjs.attributes[attribute.name] !== undefined )
                node.b_attributes[attribute.name] = new bjs.attributes[attribute.name](node, attribute);
            else
                node.b_attributes[attribute.name] = new bjs.Expression(attribute.value);
            links = node.b_attributes[attribute.name].getLinks();
            for ( j in links )
                this.link(node, links[j]);
        }
        this.apply_attributes(node);
    }

    parse_node(node, changed) {
        if ( changed !== undefined )
            this.apply_attributes(node, changed);
        else
            this.parse_attributes(node);
        if ( node instanceof Text )
            return;
        if ( node.hasAttribute('b-for') )
            this.parse_for(node, changed);
        if ( node.hasAttribute('b-base') )
            this.parse_base(node, changed);
        let i, tmp, nodes = node.childNodes;
        for ( i = 0; i < nodes.length; i++ ) {
            tmp = nodes[i];
            if (
                tmp instanceof Comment ||
                tmp instanceof HTMLBRElement ||
                tmp instanceof HTMLScriptElement
            )
                continue;
            this.parse_node(tmp, changed);
        }
        if ( node.hasAttribute('b-model') )
            this.parse_model(node);
    }

    parse_for(element, changed) {
        let property, key, as, items, value, child;
        if ( element.b_template === undefined ) {
            element.b_template = element.children[0];
            element.b_template.remove();
        }
        property = element.getAttribute('b-for');
        this.link(element, property);
        as = element.getAttribute('b-as') || '_';
        key = element.getAttribute('b-key');
        items = this.get(property);
        for ( let i in items ) {
            value = items[i][key];
            if ( changed !== undefined && !(property + '.' + value).startsWith(changed) )
                continue;
            child = element.querySelector('[b-base="' + property + '.' + value + '"]');
            if ( !child ) {
                child = element.b_template.cloneNode(true);
                child.b_for = property + '.' + value;
                child.b_key = value;
                child.setAttribute('b-base', child.b_for);
                this.replace_local(child, as, child.b_for);
                element.appendChild(child);
            }
            if ( changed !== undefined )
                this.parse_base(child, changed);
        }
        if ( changed !== undefined && property.startsWith(changed) ) {
            let i, remove = [];
            for ( i = 0; i < element.childNodes.length; i++ ) {
                child = element.childNodes[i];
                key = child.b_key !== undefined ? child.b_key : '';
                if (
                    items === undefined ||
                    ( items[key] === undefined && child.b_for !== undefined && child.b_for === property + '.' + key )
                )
                    remove.push(child);
            }
            for ( i in remove )
                remove[i].remove();
        }
    }

    parse_base(element, changed) {
        let base, key, value, property, clear = false, tmp, items, item;
        base = property = element.getAttribute('b-base');
        this.link(element, property);
        value = element.getAttribute('b-key');
        if ( value !== null ) {
            this.link(element, value);
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
                let old;
                if ( item.getAttribute('b-model') !== tmp ) {
                    old = item.getAttribute('b-model');
                    item.setAttribute('b-model', tmp);
                }
                if ( changed )
                    this.parse_model(item, old);
            } else {
                item.removeAttribute('b-model');
                this.parse_model(item);
            }
        }
    }

    parse_model(element, old) {
        let value = '', property = element.getAttribute('b-model');
        if ( property !== null ) {
            if ( old !== undefined )
                this.unlink(element, old);
            value = this.get(property);
            if ( value === undefined )
                value = '';
            this.link(element, property);
        } else
            this.unlink(element);
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

    link(element, property) {
        if ( this.links[property] === undefined )
            this.links[property] = new Set();
        this.links[property].add(element);
        if ( element.b_links === undefined )
            element.b_links = new Set();
        element.b_links.add(property);
        if ( element.b_model !== this )
            element.b_model = this;
    }

    unlink(node, property) {
        if ( property === undefined ) {
            if ( node.b_model !== undefined && node.b_links !== undefined )
                node.b_links.forEach(function(link) {
                    node.b_model.unlink(node, link);
                });
            let i, nodes = node.childNodes;
            for ( i = 0; i < nodes.length; i++ )
                this.unlink(nodes[i]);
        } else {
            if ( this.links[property] !== undefined ) {
                this.links[property].delete(node);
                if ( this.links[property].size === 0 )
                    delete this.links[property];
            }
            if ( node.b_links !== undefined ) {
                node.b_links.delete(property);
                if ( node.b_links.size === 0 ) {
                    delete node.b_model;
                }
            }
        }
    }

    replace_local(node, local, base) {
        let regexp = new RegExp('({{.*?)' + local.replace('.', '\.') + '([ .}+\\-*/|=#&?])', 'gim');
        if ( node instanceof Text ) {
            if ( node.nodeValue.match(regexp) )
                node.nodeValue = node.nodeValue.replace(regexp, '$1' + base + '$2');
            return;
        }
        let i, nodes, tmp, attribute,
            attributes = node.attributes;
        for ( i = 0; i < attributes.length; i++ ) {
            attribute = attributes[i];
            if ( bjs.attributes[attribute.name] !== undefined )
                bjs.attributes[attribute.name].check(node, attribute.name);
            if ( attribute.value.match(regexp) )
                node.setAttribute(attribute.name, attribute.value.replace(regexp, '$1' + base + '$2'));
        }
        nodes = node.childNodes;
        for ( i = 0; i < nodes.length; i++ ) {
            tmp = nodes[i];
            if (
                tmp instanceof Comment ||
                tmp instanceof HTMLBRElement ||
                tmp instanceof HTMLScriptElement
            )
                continue;
            this.replace_local(tmp, local, base);
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
    let model = event.target.b_model,
        property = event.target.getAttribute('b-model');
    if ( model === undefined || property === null )
        return;
    let value_old = model.get(property),
        value_new = event.target.value;
    if ( value_old === value_new )
        return;
    model.set(property, value_new);
}
