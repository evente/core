const EventeAttributeBase = require('./EventeAttributeBase');
const EventeAttributeFor = require('./EventeAttributeFor');
const EventeAttributeHideShow = require('./EventeAttributeHideShow');
const EventeAttributeModel = require('./EventeAttributeModel');
const EventeModel = require('./EventeModel');
const EventeModelProxyHandler = require('./EventeModelProxyHandler');
const EventeParser = require('./EventeParser');
const EventeRouter = require('./EventeRouter');

/**
 * Evente Application class
 */
class EventeApplication {

    /**
     * @param {string} selector Selector for application root element
     * @param {*} data Initial data
     * @param {Object} [options={}] Aplication creation options
     * @param {boolean} [options.clean=false] Remove Comment and empty Text nodes from DOM
     * @param {boolean} [options.router=true] Use router
     * @param {boolean} [options.run=true] Run immediately after create
     */
    constructor(selector, data, options) {
        options = {
            clean: false,
            router: true,
            run: true,
            ...options
        };
        this.element = document.querySelector(selector);
        this.model = new EventeModel(this.element, data);
        this.model.proxy = new Proxy({$: ''}, new EventeModelProxyHandler(this.model));
        if ( options.clean )
            this.clean();
        if ( options.router )
            this.router = new EventeRouter(this.element);
        if ( options.run )
            this.run();
    }

    /**
     * Get model data
     * @returns {Object}
     */
    get data() {
        return this.model.data;
    }

    /**
     * Set model data
     * @param {Object} value
     */
    set data(value) {
        this.model.data = value;
        EventeParser.parseNode(this.element, this.model);
    }

    /**
     * Add or remove route
     * @param {string} route Route pattern
     * @param {Function} [callback] Calback function to set or undefined to remove route
     * @param {*} [params] Parameters that will be passed to callback function
     */
    route(route, callback, params) {
        if ( !this.router )
            return;
        if ( callback )
            this.router.add(route, callback, params);
        else
            this.router.remove(route);
    }

    /**
     * Run application
     */
    run() {
        EventeParser.parseNode(this.element, this.model);
        if ( this.router )
            this.router.trigger();
    }

    /**
     * Remove Comment and empty Text nodes from DOM
     * @private
     */
    clean() {
        let node, nodes = [], walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT, null, false);
        while( node = walker.nextNode() ) {
            switch ( node.nodeType ) {
                case Node.TEXT_NODE:
                    if ( !node.nodeValue.match(/[^\s\n]/m) )
                        nodes.push(node);
                    break;
                case Node.COMMENT_NODE:
                    nodes.push(node);
                    break;
            }
        }
        for ( node in nodes )
            nodes[node].remove();
    }

};

module.exports = EventeApplication;
