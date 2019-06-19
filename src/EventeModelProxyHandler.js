const object = require('./Object');
const EventeModel = require('./EventeModel');

/**
 * Evente Model Proxy Handler class
 */
class EventeModelProxyHandler {

    /**
     * @param {EventeModel} data 
     */
    constructor(data) {
        this.data = data;
    }

    deleteProperty(target, prop) {
        let data = this.data.shadow.getField(target.$);
        let listeners = this.data.listeners.delete[target.$];
        if ( listeners ) {
            for ( let listener of listeners )
                listener(data, target.$, prop);
        }
        delete data[prop];
        let property = ( target.$ ? target.$ + '.' : '' ) + prop,
            node, nodes = this.data.getNodes(property);
        for ( node of nodes )
            this.data.applyAttributes(node);
        return true;
    }

    get(target, prop) {
        if ( prop === 'constructor' )
            return { name: 'Proxy' };
        let data = this.data.shadow.getField(target.$);
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
        let listeners = this.data.listeners.get[target.$];
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
                    this
                );
            default:
                return data[prop];
        }
    }

    getPrototypeOf(target) {
        let data = this.data.shadow.getField(target.$);
        // Not Reflect.getPrototypeOf(data), for .. in not working
        return data;
    }

    has(target, prop) {
        let data = this.data.shadow.getField(target.$);
        return Reflect.has(data, prop);
    }

    isExtensible(target) {
        let data = this.data.shadow.getField(target.$);
        return Reflect.isExtensible(data);
    }

    ownKeys(target) {
        let data = this.data.shadow.getField(target.$);
        return Object.keys(data);
    }

    set(target, prop, value) {
        let data = this.data.shadow.getField(target.$),
            listeners = this.data.listeners.set[target.$];
        if ( value.constructor.name === 'Proxy' )
            value = value.clone();
        if ( listeners ) {
            for ( let listener of listeners )
                listener(data, target.$, prop, value);
        }
        if ( data[prop] !== value ) {
            data[prop] = value;
            let property = ( target.$ ? target.$ + '.' : '' ) + prop,
                node, nodes = this.data.getNodes(property);
            for ( node of nodes )
                this.data.applyAttributes(node);
        }
        return true;
    }

}

module.exports = EventeModelProxyHandler;
