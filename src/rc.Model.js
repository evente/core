if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var rc = require('./rc.js');

rc.Model = class Model {

    constructor(selector, data, options) {
        options = { init: true, ...options };
        rc.models.push(this);
        this.proxyHandler = new rc.ModelProxyHandler(this);
        this.shadow = { ...data, strings: rc.strings };
        this.proxy = new Proxy({$: ''}, this.proxyHandler);
        this.listeners = { get: {}, set: {}, delete: {} };
        this.links = {};
        this.selector = new rc.Selector(selector);
        if ( options.init )
            this.init();
    }

    get data() {
        return this.proxy;
    }

    set data(value) {
        value.strings = rc.strings;
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
            element.addEventListener('input', rc.Model.eventHander, true);
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
        if ( node.rc_attributes === undefined )
            return;
        if ( node instanceof Text ) {
            let value = node.rc_attributes[''].eval(this);
            value = value !== undefined ? value.toString() : '';
            if ( node.nodeValue !== value )
                node.nodeValue = value;
            return;
        }
        let name, attribute;
        for ( name in node.rc_attributes )
            this.applyAttribute(node, name);
    }

    applyAttribute(node, name) {
        if ( node.rc_attributes === undefined || node.rc_attributes[name] === undefined )
            return;
        node.rc_attributes[name].apply();
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
                node.rc_attributes = { '': new rc.Expression(node.nodeValue) };
                this.updateLinks(node);
            } else {
                if ( node.rc_attributes === undefined )
                    delete node.rc_attributes;
            }
            return;
        }
        let i, attribute, attributes = rc.getAttributes();
        for ( i in attributes )
            this.parseAttribute(node, attributes[i].name);
        for ( i = 0; i < node.attributes.length; i++ ) {
            attribute = node.attributes[i];
            if ( rc.attributes[attribute.name] === undefined )
                this.parseAttribute(node, attribute.name);
        }
        if ( node.rc_attributes )
            this.updateLinks(node);
    }

    parseAttribute(node, name) {
        let value, tmp = node.attributes[name];
        if ( !tmp ) {
            if ( node.rc_attributes )
                delete node.rc_attributes[name];
            return;
        }
        if ( node.rc_attributes && node.rc_attributes[name] ) {
            let expression = '{{' + node.rc_attributes[name].expression  + '}}';
            if ( expression === tmp.value )
                return;
        }
        if ( rc.attributes[name] ) {
            value = rc.attributes[name].check(node, name);
            if ( tmp.value !== value )
                tmp.value = value;
            tmp = new rc.attributes[name](node, name, this);
        } else {
            if (tmp.value.indexOf('{{') === -1)
                return;
            if ( rc.attributes[name] === undefined )
                tmp = new rc.Attribute(node, name, this);
        }
        if ( node.rc_attributes === undefined )
            node.rc_attributes = {};
        node.rc_attributes[name] = tmp;
    }

    updateLinks(node) {
        var i, j, tmp,
            set = new Set();
        for ( i in node.rc_attributes ) {
            tmp = node.rc_attributes[i].getLinks();
            for ( j in tmp )
                set.add(tmp[j]);
        }
        tmp = node.rc_links || new Set();
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
        if ( node.rc_links === undefined )
            node.rc_links = new Set();
        node.rc_links.add(property);
    }

    unlink(node, property) {
        if ( property === undefined ) {
            if ( node.rc_links !== undefined ) {
                for ( let link of node.rc_links )
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
            if ( node.rc_links !== undefined ) {
                node.rc_links.delete(property);
                if ( node.rc_links.size === 0 )
                    delete node.rc_links;
            }
        }
    }

}

rc.Model.eventHander = function(event) {
    if (
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLButtonElement ) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLSelectElement)
    )
        return;
    if ( event.target.rc_attributes === undefined || event.target.rc_attributes['b-model'] === undefined )
        return;
    let rc_model = event.target.rc_attributes['b-model'],
        value_old = rc_model.get(),
        value_new = event.target.value;
    if ( value_old === value_new )
        return;
    rc_model.set(value_new);
}
