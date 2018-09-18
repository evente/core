if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.App = class App extends bjs.Model {

    constructor(selector, model, options) {
        super(selector, model);
        this.options = Object.assign({
            router: true,
        }, options);
        if ( this.options.router )
            this.router = new bjs.Router(this.selector);
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
        if ( this.router )
            this.router.trigger();
    }

};
