if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.ModelProxyHandler = class ModelProxyHandler {

    constructor(model) {
        this.model = model;
    }

    deleteProperty(target, prop) {
        let data = this.model.shadow.getProperty(target.$);
        let listeners = this.model.listeners.delete[target.$];
        if ( listeners ) {
            for ( let listener of listeners )
                listener(data, target.$, prop);
        }
        delete data[prop];
        let property = ( target.$ ? target.$ + '.' : '' ) + prop,
            node, nodes = this.model.getNodes(property);
        for ( node of nodes )
            this.model.applyAttributes(node, property);
        return true;
    }

    get(target, prop) {
        if ( prop === 'constructor' )
            return { name: 'Proxy' };
        let data = this.model.shadow.getProperty(target.$);
        switch ( prop ) {
            case 'keys':
                return Object.keys(data);
            case 'length':
                return Object.keys(data).length;
            case 'toJSON':
                return function() { return data; };
            case 'clone':
                return function() { return {...data}; };
        }
        let listeners = this.model.listeners.get[target.$];
        if ( listeners ) {
            for ( let listener of listeners )
                listener(data, target.$, prop);
        }
        if ( data[prop] === undefined || data[prop] === null )
            return;
        switch ( typeof data[prop] ) {
            case 'object':
                return new Proxy(
                    { $: ( target.$ ? target.$ + '.' : '' ) + prop },
                    this.model.proxyHandler
                );
            default:
                return data[prop];
        }
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
        let data = this.model.shadow.getProperty(target.$),
            listeners = this.model.listeners.set[target.$];
        if ( listeners ) {
            for ( let listener of listeners )
                listener(data, target.$, prop, value);
        }
        if ( data[prop] !== value ) {
            data[prop] = value;
            let property = ( target.$ ? target.$ + '.' : '' ) + prop,
                node, nodes = this.model.getNodes(property);
            for ( node of nodes )
                this.model.applyAttributes(node, property);
        }
        return true;
    }

}
