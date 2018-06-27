if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.ModelProxyHandler = class ModelProxyHandler {

    constructor(model) {
        this.model = model;
    }

    deleteProperty(target, prop) {
        let data = this.model.shadow.getProperty(target.$);
        delete data[prop];
        let property = ( target.$ ? target.$ + '.' : '' ) + prop,
            elements = this.model.get_elements(property),
            model = this.model;
        elements.forEach(function(element) {
            if ( element.b_for !== undefined && element.b_for === property ) {
                element.remove();
                return;
            }
            model.parse_node(element, property);
        });
        return true;
    }

    enumerate(target) {
        let data = this.model.shadow.getProperty(target.$);
        return Object.keys(data)[Symbol.iterator]();
    }

    get(target, prop) {
        if ( prop === 'constructor' )
            return { name: 'Proxy' };
        let data = this.model.shadow.getProperty(target.$);
        switch ( prop ) {
            case 'keys':
                return Object.keys(data);
            break;
            case 'length':
                return Object.keys(data).length;
            break;
            case 'toJSON':
                return function() { return data; };
            break;
        }
        if ( data[prop] === undefined )
            return;
        if ( data[prop] !== null && typeof data[prop] === 'object' )
            return new Proxy(
                { $: ( target.$ ? target.$ + '.' : '' ) + prop },
                this.model.proxyHandler
            );
        return data[prop];
    }

    getPrototypeOf(target) {
        let data = this.model.shadow.getProperty(target.$);
        // Not Reflect.getPrototypeOf(data), for .. in not working
        return data;
    }

    has(target, prop) {
        let data = this.model.shadow.getProperty(target.$);
        return Reflect.has(data, prop);
    }

    isExtensible(target) {
        let data = this.model.shadow.getProperty(target.$);
        return Reflect.isExtensible(data);
    }

    ownKeys(target) {
        let data = this.model.shadow.getProperty(target.$);
        return Reflect.ownKeys(data);
    }

    set(target, prop, value) {
        let data = this.model.shadow.getProperty(target.$);
        if ( data[prop] !== value ) {
            data[prop] = value;
            let property = ( target.$ ? target.$ + '.' : '' ) + prop,
                elements = this.model.get_elements(property),
                model = this.model;
            elements.forEach(function(element) {
                model.parse_node(element, property);
            });
        }
        return true;
    }

}
