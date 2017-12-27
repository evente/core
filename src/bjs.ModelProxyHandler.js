if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.ModelProxyHandler = class ModelProxyHandler {

    constructor(model) {
        this.model = model;
    }

    get(target, prop) {
        if ( prop === 'constructor' )
            return { name: 'Proxy' };
        if ( target[prop] === undefined ) {
            if ( prop === 'length'  )
                return Object.keys(target).length;
            return;
        }
        if ( target[prop] !== null && target[prop].constructor.name !== 'Proxy' && typeof target[prop] === 'object' ) {
            let property = this.model.paths.get(target);
            property = ( property !== undefined ? property + '.' : '' ) + prop;
            this.model.paths.set(target[prop], property);
            target[prop] = new Proxy(target[prop], this.model.proxyHandler);
        }
        return target[prop];
    }

    set(target, prop, value, receiver) {
        let oldval = target[prop];
        target[prop] = value;
        if ( oldval !== value ) {
            let property = this.model.paths.get(target);
            property = ( property !== undefined ? property + '.' : '' ) + prop;
            let elements = this.model._get_elements(property),
                model = this.model;
            elements.forEach(function(element) {
                model._parse_node(element, property);
            });
        }
        return true;
    }

    deleteProperty(target, prop) {
        delete target[prop];
        let property = this.model.paths.get(target);
        property = ( property !== undefined ? property + '.' : '' ) + prop;
        let elements = this.model._get_elements(property);
        let model = this.model;
        elements.forEach(function(element) {
            if ( element._b_for !== undefined && element._b_for === property ) {
                model._unlink(element, property);
                element.remove();
                return;
            }
            model._parse_node(element, property);
        });
        return true;
    }

}
