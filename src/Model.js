var evente = require('./evente.js');

evente.Model = class {

    constructor(selector, data, options) {
        options = { init: true, ...options };
        evente.models.push(this);
        this.proxyHandler = new evente.ModelProxyHandler(this);
        this.shadow = { ...data, strings: evente.strings };
        this.proxy = new Proxy({$: ''}, this.proxyHandler);
        this.listeners = { get: {}, set: {}, delete: {} };
        this.links = {};
        this.element = document.querySelector(selector);
        if ( options.init )
            this.init();
    }

    get data() {
        return this.proxy;
    }

    set data(value) {
        value.strings = evente.strings;
        this.shadow = value;
        this.parseNode(this.element);
    }

    get(property) {
        return this.data.getField(property);
    }

    set(property, value) {
        this.data.setField(property, value);
    }

    init() {
        this.element.addEventListener('input', evente.Model.eventHander, true);
        this.parseNode(this.element);
    }

    addListener(event, property, listener) {
        if ( !this.listeners[event] )
            return;
        if ( !this.listeners[event][property] )
            this.listeners[event][property] = new Set();
        this.listeners[event][property].add(listener);
    }

    removeListener(event, property, listener) {
        if ( this.listeners[event] && this.listeners[event][property] ) {
            this.listeners[event][property].delete(listener);
            if ( !this.listeners[event][property].size )
                delete this.listeners[event][property];
        }
    }

    applyAttributes(node) {
        if ( node.e_attributes === undefined )
            return;
        if ( node instanceof Text ) {
            let value = node.e_attributes[''].eval(this);
            value = value !== undefined ? value.toString() : '';
            if ( node.nodeValue !== value )
                node.nodeValue = value;
            return;
        }
        let name, attribute;
        for ( name in node.e_attributes )
            this.applyAttribute(node, name);
    }

    applyAttribute(node, name) {
        if ( node.e_attributes === undefined || node.e_attributes[name] === undefined )
            return;
        node.e_attributes[name].apply();
    }

    getNodes(link) {
        let i, node, nodes = new Set();
        for ( i in this.links ) {
            if ( !i.startsWith(link + '.') )
                continue;
            for ( node of this.links[i] )
                nodes.add(node);
        }
        while ( link != '' ) {
            if ( this.links[link] !== undefined ) {
                for ( node of this.links[link] )
                    nodes.add(node);
            }
            link = link.split('.').slice(0, -1).join('.');
        }
        return nodes;
    }

    parseNode(node) {
        this.parseAttributes(node);
        if ( node instanceof Text ) {
            this.applyAttributes(node);
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
            this.parseNode(item);
        }
        this.applyAttributes(node);
    }

    parseAttributes(node) {
        if ( node instanceof Text ) {
            if ( node.nodeValue.indexOf('{{') !== -1 ) {
                node.e_attributes = { '': new evente.Expression(node.nodeValue) };
                this.updateLinks(node);
            } else {
                if ( node.e_attributes === undefined )
                    delete node.e_attributes;
            }
            return;
        }
        let i, attribute, attributes = evente.getAttributes();
        for ( i in attributes )
            this.parseAttribute(node, attributes[i].name);
        for ( i = 0; i < node.attributes.length; i++ ) {
            attribute = node.attributes[i];
            if ( evente.attributes[attribute.name] === undefined )
                this.parseAttribute(node, attribute.name);
        }
        if ( node.e_attributes )
            this.updateLinks(node);
    }

    parseAttribute(node, name) {
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
        if ( evente.attributes[name] ) {
            value = evente.attributes[name].check(node, name);
            if ( tmp.value !== value )
                tmp.value = value;
            tmp = new evente.attributes[name](node, name, this);
        } else {
            if (tmp.value.indexOf('{{') === -1)
                return;
            if ( evente.attributes[name] === undefined )
                tmp = new evente.Attribute(node, name, this);
        }
        if ( node.e_attributes === undefined )
            node.e_attributes = {};
        node.e_attributes[name] = tmp;
    }

    updateLinks(node) {
        var i, j, tmp,
            set = new Set();
        for ( i in node.e_attributes ) {
            tmp = node.e_attributes[i].getLinks();
            for ( j in tmp )
                set.add(tmp[j]);
        }
        tmp = node.e_links || new Set();
        for ( i of tmp ) {
            if ( !set.has(i) )
                this.unlink(node, i)
        }
        for ( i of set ) {
            if ( !tmp.has(i) )
                this.link(node, i);
        }
    }

    link(node, property) {
        if ( this.links[property] === undefined )
            this.links[property] = new Set();
        this.links[property].add(node);
        if ( node.e_links === undefined )
            node.e_links = new Set();
        node.e_links.add(property);
    }

    unlink(node, property) {
        if ( property === undefined ) {
            if ( node.e_links !== undefined ) {
                for ( let link of node.e_links )
                    this.unlink(node, link);
            }
            let i, nodes = node.childNodes;
            for ( i = 0; i < nodes.length; i++ )
                this.unlink(nodes[i]);
        } else {
            if ( this.links[property] !== undefined ) {
                this.links[property].delete(node);
                if ( this.links[property].size === 0 )
                    delete this.links[property];
            }
            if ( node.e_links !== undefined ) {
                node.e_links.delete(property);
                if ( node.e_links.size === 0 )
                    delete node.e_links;
            }
        }
    }

}

evente.Model.eventHander = function(event) {
    if (
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLButtonElement ) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLSelectElement)
    )
        return;
    if ( event.target.e_attributes === undefined || event.target.e_attributes['e-model'] === undefined )
        return;
    let model = event.target.e_attributes['e-model'],
        value_old = model.get(),
        value_new = event.target.value;
    if ( value_old === value_new )
        return;
    model.set(value_new);
}
