const EventeStrings = require('./EventeStrings');

/**
 * Evente Model class
 */
class EventeModel {
    /**
     * @param {Node} node DOM Node
     * @param {Object} data Initial model data
     */
    constructor(node, data) {
        /**
         * @private
         * @type {Object}
         */
        this.shadow = { ...data, strings: EventeStrings.strings };
        /**
         * @private
         * @type {Object.<string, Object.<string, Set<Function>>>}
         */
        this.listeners = { get: {}, set: {}, delete: {} };
        /**
         * @private
         * @type {Object.<string, Set<Node>>}
         * */
        this.links = {};
        /**
         * @type {Proxy}
         */
        this.proxy = null;
        node.addEventListener('input', EventeModel.eventHander, true);
    }

    /**
     * Get model data
     * @returns {Object}
     */
    get data() {
        return this.proxy;
    }

    /**
     * Set model data
     * @param {Object} value
     */
    set data(value) {
        value.strings = EventeStrings.strings;
        this.shadow = value;
    }

    /**
     * Get model field by path
     * @param {string} property Model path
     */
    get(property) {
        return this.proxy.getField(property);
    }

    /**
     * Set model field by path
     * @param {string} property Model path
     * @param {*} value New value
     */
    set(property, value) {
        this.proxy.setField(property, value);
    }

    /**
     * Add listener of model change events
     * @param {string} event Listening evente - get, set or delete
     * @param {string} property Path in model data
     * @param {Function} listener Listener function
     */
    addListener(event, property, listener) {
        if ( !this.listeners[event] )
            return;
        if ( !this.listeners[event][property] )
            this.listeners[event][property] = new Set();
        this.listeners[event][property].add(listener);
    }

    /**
     * Add listener of model change events
     * @param {string} event Listening evente - get, set or delete
     * @param {string} property Path in model data
     * @param {Function} listener Listener function
     */
    removeListener(event, property, listener) {
        if ( this.listeners[event] && this.listeners[event][property] ) {
            this.listeners[event][property].delete(listener);
            if ( !this.listeners[event][property].size )
                delete this.listeners[event][property];
        }
    }

    /**
     * Get DOM nodes which dependent of link
     * @param {string} path Path in model data hierarchy
     * @returns {Set<Node>}
     */
    getNodes(path) {
        let i, node, nodes = new Set();
        for ( i in this.links ) {
            if ( !i.startsWith(path + '.') )
                continue;
            for ( node of this.links[i] )
                nodes.add(node);
        }
        while ( path != '' ) {
            if ( this.links[path] !== undefined ) {
                for ( node of this.links[path] )
                    nodes.add(node);
            }
            path = path.split('.').slice(0, -1).join('.');
        }
        return nodes;
    }

    /**
     * Apply node attributes values
     * @param {Node} node DOM node
     */
    applyAttributes(node) {
        if ( node.e_attributes === undefined )
            return;
        if ( node instanceof Text ) {
            // TODO
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

    /**
     * Apply node attribute value
     * @param {Node} node DOM node
     * @param {string} name Atribute name
     */
    applyAttribute(node, name) {
        if ( node.e_attributes === undefined || node.e_attributes[name] === undefined )
            return;
        node.e_attributes[name].apply();
    }

    /**
     * Update dependencies of DOMnode
     * @param {Node} node DOM node
     */
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

    /**
     * Add dependency of DOM node
     * @param {Node} node DOM node
     * @param {string} property Path in model data
     */
    link(node, property) {
        if ( this.links[property] === undefined )
            this.links[property] = new Set();
        this.links[property].add(node);
        if ( node.e_links === undefined )
            node.e_links = new Set();
        node.e_links.add(property);
    }

    /**
     * Remove dependency of DOM node
     * @param {Node} node DOM node
     * @param {string} [property] Path in model data
     */
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

    /**
     * Handle model data changes via DOM elements
     * @param {Event} event Event object
     */
    static eventHander(event) {
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

}

module.exports = EventeModel;
