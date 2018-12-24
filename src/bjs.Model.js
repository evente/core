if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Model = class Model {

    constructor(selector, data, options) {
        options = { init: true, ...options };
        bjs.models.push(this);
        this.proxyHandler = new bjs.ModelProxyHandler(this);
        this.shadow = { ...data, strings: bjs.strings };
        this.proxy = new Proxy({$: ''}, this.proxyHandler);
        this.listeners = { get: {}, set: {}, delete: {} };
        this.links = {};
        this.selector = new bjs.Selector(selector);
        if ( options.init )
            this.init();
    }

    get data() {
        return this.proxy;
    }

    set data(value) {
        value.strings = bjs.strings;
        this.shadow = value;
        for ( let i in this.selector )
            this.parseNode(this.selector.get(i), '');
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
            element.addEventListener('input', bjs.Model.eventHander, true);
            this.parseNode(element);
        }
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
        if ( node.b_attributes === undefined )
            return;
        if ( node instanceof Text ) {
            let value = node.b_attributes[''].eval(this);
            value = value !== undefined ? value.toString() : '';
            if ( node.nodeValue !== value )
                node.nodeValue = value;
            return;
        }
        let name, attribute;
        for ( name in node.b_attributes )
            this.applyAttribute(node, name);
    }

    applyAttribute(node, name) {
        if ( node.b_attributes === undefined || node.b_attributes[name] === undefined )
            return;
        node.b_attributes[name].apply();
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
                node.b_attributes = { '': new bjs.Expression(node.nodeValue) };
                this.updateLinks(node);
            } else {
                if ( node.b_attributes === undefined )
                    delete node.b_attributes;
            }
            return;
        }
        let i, attribute, attributes = bjs.getAttributes();
        for ( i in attributes )
            this.parseAttribute(node, attributes[i].name);
        for ( i = 0; i < node.attributes.length; i++ ) {
            attribute = node.attributes[i];
            if ( bjs.attributes[attribute.name] === undefined )
                this.parseAttribute(node, attribute.name);
        }
        if ( node.b_attributes )
            this.updateLinks(node);
    }

    parseAttribute(node, name) {
        let value, tmp = node.attributes[name];
        if ( !tmp ) {
            if ( node.b_attributes )
                delete node.b_attributes[name];
            return;
        }
        if ( node.b_attributes && node.b_attributes[name] ) {
            let expression = '{{' + node.b_attributes[name].expression  + '}}';
            if ( expression === tmp.value )
                return;
        }
        if ( bjs.attributes[name] ) {
            value = bjs.attributes[name].check(node, name);
            if ( tmp.value !== value )
                tmp.value = value;
            tmp = new bjs.attributes[name](node, name, this);
        } else {
            if (tmp.value.indexOf('{{') === -1)
                return;
            if ( bjs.attributes[name] === undefined )
                tmp = new bjs.Attribute(node, name, this);
        }
        if ( node.b_attributes === undefined )
            node.b_attributes = {};
        node.b_attributes[name] = tmp;
    }

    updateLinks(node) {
        var i, j, tmp,
            set = new Set();
        for ( i in node.b_attributes ) {
            tmp = node.b_attributes[i].getLinks();
            for ( j in tmp )
                set.add(tmp[j]);
        }
        tmp = node.b_links || new Set();
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
        if ( node.b_links === undefined )
            node.b_links = new Set();
        node.b_links.add(property);
    }

    unlink(node, property) {
        if ( property === undefined ) {
            if ( node.b_links !== undefined ) {
                for ( let link of node.b_links )
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
            if ( node.b_links !== undefined ) {
                node.b_links.delete(property);
                if ( node.b_links.size === 0 )
                    delete node.b_links;
            }
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
    if ( event.target.b_attributes === undefined || event.target.b_attributes['b-model'] === undefined )
        return;
    let b_model = event.target.b_attributes['b-model'],
        value_old = b_model.get(),
        value_new = event.target.value;
    if ( value_old === value_new )
        return;
    b_model.set(value_new);
}
