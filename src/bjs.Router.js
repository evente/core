if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Router = class Router {

    constructor(selector) {
        bjs.routers.push(this);
        this.routes = {};
        this.selector = selector;
        this.init();
    }

    init() {
        let i, node;
        for ( i in this.selector ) {
            node = this.selector.get(i);
            node.addEventListener('click', bjs.Router.eventHander, true);
        }
    }

    add(route, callback, options) {
        route = this.normalize(route);
        this.routes[route] = {
            parts: route.split('/'),
            callback: callback,
            options: options || {},
        };
    }

    remove(route) {
        route = this.normalize(route);
        delete this.routes[route];
    }

    handle(route, push) {
        route = this.normalize(route);
        if ( this.routes[route] !== undefined ) {
            this.routes[route].callback(this.routes[route].options);
            return;
        }
        let i, j, tmp,
            routes = Object.assign({}, this.routes),
            options = {},
            part, parts = route.split('/');
        for ( i in parts ) {
            part = parts[i];
            for ( j in routes ) {
                if ( routes[j].parts.length !== parts.length ) {
                    delete routes[j];
                    continue;
                }
                tmp = routes[j].parts[i];
                if ( tmp === part )
                    continue;
                if ( tmp !== undefined && tmp[0] === ':' )
                    options[ tmp.substr(1) ] = part;
                else
                    delete routes[j];
            }
        }
        if ( Object.keys(routes).length ) {
            if ( push )
                window.history.pushState({}, '', '/' + route);
            for ( j in routes )
                routes[j].callback(Object.assign(routes[j].options, options));
        }
        return Object.keys(routes).length > 0;
    }

    normalize(route) {
        if ( route.startsWith(location.origin) )
            route = route.substr(location.origin.length);
        if ( route.startsWith('//' + location.host) )
            route = route.substr(('//' + location.host).length);
        if ( route.startsWith('/') )
            route = route.substr(1);
        if ( route.endsWith('/') )
            route = route.substr(0, route.length - 1);
        return route;
    }

}

bjs.Router.eventHander = function(event) {
    let target = event.target;
    while ( !(target instanceof HTMLAnchorElement) ) {
        target = target.parentNode;
        if ( target instanceof HTMLDocument )
            return;
    }
    let router = bjs.getRouter(target);
    if ( !router )
        return;
    let route = target.getAttribute('href');
    if ( route && router.handle(route, true) )
        event.preventDefault();
}
