if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Model = class Model {

    constructor(selector, data) {
        let model = this;
        this.proxyHandler = {
            get: function(target, prop) {
                if ( prop === 'constructor' )
                    return { name: 'Proxy' };
                if ( target[prop] === undefined )
                    return;
                if ( target[prop].constructor.name !== 'Proxy' && typeof target[prop] === 'object' ) {
                    let path = model.path.get(target);
                    path = ( path !== undefined ? path + '.' : '' ) + prop;
                    model.path.set(target[prop], path);
                    target[prop] = new Proxy(target[prop], model.proxyHandler);
                }
                return target[prop];
            },
            set: function(target, prop, value, receiver) {
                let oldval = target[prop];
                target[prop] = value;
                if ( oldval !== value ) {
                    let path = model.path.get(target);
                    path = ( path !== undefined ? path + '.' : '' ) + prop;
                    model._apply(path);
                }
            }
        }
        this.data = new Proxy(data || {}, this.proxyHandler);
        this.path = new WeakMap();
        this.selector = new bjs.Selector(selector);
        this._init();
        this._apply();
    }

    get(property) {
        return this.data.getProperty(property);
    }

    set(property, value) {
        return this.data.setProperty(property, value);
    }

    _init() {
        let element;
        for ( let i = 0; i < this.selector.length; i++ ) {
            element = this.selector.get(i);
            element.addEventListener('change', bjs.Model.eventHander, true);
            element.addEventListener('keyup', bjs.Model.eventHander, true);
        }
    }

    _apply(path) {
        let selector = '[data-model' + ( path !== undefined ? '^="' + path + '"' : '' ) + ']';
        let elements = this.selector.find(selector);
        let value;
        for ( let i = 0; i < elements.length; i++ ) {
            value = this.data.getProperty(elements[i].getAttribute('data-model'));
            if ( elements[i] instanceof HTMLInputElement ) {
                elements[i].value = value;
                elements[i].bjs_model = this;
            } else
                elements[i].textContent = value;
        }
    }

}

bjs.Model.eventHander = function(event) {
    if ( !(event.target instanceof HTMLInputElement) )
        return;
    let model = event.target.bjs_model;
    let path = event.target.getAttribute('data-model');
    if ( model === undefined || path === null )
        return;
    let value_old = model.data.getProperty(path);
    let value_new = event.target.value;
    if ( value_old == value_new )
        return;
    model.data.setProperty(path, value_new);
    model._apply(path);
}
