if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.App = class App {

    constructor(selector, data, options) {
        options = {router: true, ...options};
        this.model = new bjs.Model(selector, data, {init: false});
        if ( options.router )
            this.router = new bjs.Router(this.model.selector);
    }

    get data() {
        return this.model.data;
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

};
