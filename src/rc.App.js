if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var rc = require('./rc.js');

rc.App = class App {

    constructor(selector, data, options) {
        options = {
            clean: true,
            router: true,
            run: false,
            ...options
        };
        this.model = new rc.Model(selector, data, {init: false});
        if ( options.clean )
            this.clean();
        if ( options.router )
            this.router = new rc.Router(this.model.selector);
        if ( options.run )
            this.run();
    }

    get data() {
        return this.model.data;
    }

    set data(value) {
        this.model.data = value;
    }

    route(route, callback, params) {
        if ( !this.router )
            return;
        if ( callback )
            this.router.add(route, callback, params);
        else
            this.router.remove(route);
    }

    run() {
        this.model.init();
        if ( this.router )
            this.router.trigger();
    }

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
