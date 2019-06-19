/**
 * Evente Router class
 */
class EventeRouter {

    /**
     * 
     * @param {Node} node 
     */
    constructor(node) {
        EventeRouter.routers.push(this);
        this.routes = {};
        this.node = node;
        this.node.addEventListener('click', EventeRouter.clickHander, true);
    }

    /**
     * Add route
     * @param {string} route Route pattern
     * @param {Function} callback Callback function
     * @param {*} params Parameters passed to callback function
     */
    add(route, callback, params) {
        route = this.normalize(route);
        this.routes[route] = {
            parts: route.split('/'),
            callback: callback,
            params: params || {},
        };
    }

    /**
     * Remove route
     * @param {string} route Route pattern
     */
    remove(route) {
        route = this.normalize(route);
        delete this.routes[route];
    }

    /**
     * Trigger route handling
     * @param {string} route Route
     * @param {boolean} push Flag to push route in history
     */
    trigger(route, push) {
        if ( route === undefined )
            route = location.pathname;
        this.handle(route, push);
    }

    /**
     * Handle route change
     * @param {string} route Route
     * @param {boolean} push Flag to push route in history
     * @returns {boolean}
     */
    handle(route, push) {
        route = this.normalize(route);
        if ( this.routes[route] !== undefined ) {
            if ( push )
                window.history.pushState({}, '', '/' + route);
            this.routes[route].callback(this.routes[route].params);
            return true;
        }
        let i, j, tmp,
            routes = Object.assign({}, this.routes),
            params = {},
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
                    params[ tmp.substr(1) ] = part;
                else
                    delete routes[j];
            }
        }
        if ( Object.keys(routes).length ) {
            if ( push )
                window.history.pushState({}, '', '/' + route);
            for ( j in routes )
                routes[j].callback(Object.assign(routes[j].params, params));
        }
        return Object.keys(routes).length > 0;
    }

    /**
     * Normalize route form
     * @param {string} route Route
     * @returns {string}
     */
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

    /**
     * Get router by DOM node
     * @param {Node} node DOM node
     * @returns {EventeRouter}
     */
    static getRouter(node) {
        for ( let i in EventeRouter.routers ) {
            let router = EventeRouter.routers[i];
            if ( router.node === node || router.node.contains(node) )
                return router;
        }
    }

    /**
     * Handle clck event
     * @param {Event} event Event object
     */
    static clickHander(event) {
        let target = event.target;
        while ( !(target instanceof HTMLAnchorElement) ) {
            target = target.parentNode;
            if ( target instanceof HTMLDocument )
                return;
        }
        let router = EventeRouter.getRouter(target);
        if ( !router )
            return;
        let route = target.getAttribute('href');
        if ( route && router.handle(route, true) )
            event.preventDefault();
    }

    /**
     * Handle URL change
     */
    static popstateHandler() {
        for ( let i in EventeRouter.routers )
        EventeRouter.routers[i].handle(location.href);
    }

}

EventeRouter.routers = [];
window.addEventListener('popstate', EventeRouter.popstateHandler);

module.exports = EventeRouter;
