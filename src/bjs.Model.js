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
                    let property = model.map.get(target);
                    property = ( property !== undefined ? property + '.' : '' ) + prop;
                    model.map.set(target[prop], property);
                    target[prop] = new Proxy(target[prop], model.proxyHandler);
                }
                return target[prop];
            },
            set: function(target, prop, value, receiver) {
                let oldval = target[prop];
                target[prop] = value;
                if ( oldval !== value ) {
                    let property = model.map.get(target);
                    property = ( property !== undefined ? property + '.' : '' ) + prop;
                    model._apply(property);
                }
            }
        }
        this.data = new Proxy(data || {}, this.proxyHandler);
        this.map = new WeakMap();
        this.selector = new bjs.Selector(selector);
        this._init();
        this._apply();
    }

    get(property) {
        return this.data.getProperty(property);
    }

    set(property, value) {
        this.data.setProperty(property, value);
    }

    _init() {
        let element;
        for ( let i = 0; i < this.selector.length; i++ ) {
            element = this.selector.get(i);
            element.addEventListener('change', bjs.Model.eventHander, true);
            element.addEventListener('keyup', bjs.Model.eventHander, true);
        }
    }

    _apply(property, simple) {
        let selector, elements, value;
        // data-model-base + data-model-value|key
        if ( simple === undefined ) {
            selector = '[data-model-base], ' +
                       '[data-model-value' + ( property !== undefined ? '="' + property + '"' : '' ) + ']';
            elements = this.selector.find(selector);
            for ( let i = 0; i < elements.length; i++ ) {
                let tmp = elements[i].getAttribute('data-model-base');
                if ( tmp !== null ) value = tmp + '.';
                tmp = elements[i].getAttribute('data-model-value');
                if ( tmp !== null ) {
                    value += this.get(tmp) + '.';
                } else {
                    tmp = elements[i].getAttribute('data-model-key');
                    if ( tmp !== null ) value += tmp + '.';
                }
                let fields = elements.find('[data-field]');
                for ( let i = 0; i < fields.length; i++ )
                    fields[i].setAttribute('data-model', value + fields[i].getAttribute('data-field'));
                if ( property !== undefined )
                    this._apply(value, 1);
            }
        }
        // data-model
        selector = '[data-model' + ( property !== undefined ? '^="' + property + '"' : '' ) + ']';
        elements = this.selector.find(selector);
        for ( let i = 0; i < elements.length; i++ ) {
            value = this.data.getProperty(elements[i].getAttribute('data-model'));
            if ( value === undefined ) value = '';
            if (
                elements[i] instanceof HTMLInputElement ||
                elements[i] instanceof HTMLButtonElement ||
                elements[i] instanceof HTMLTextAreaElement ||
                elements[i] instanceof HTMLSelectElement ||
            ) {
                elements[i].value = value;
                elements[i].bjs_model = this;
            } else
                elements[i].textContent = value;
        }
    }

}

bjs.Model.eventHander = function(event) {
    if (
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLButtonElement ) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLSelectElement)
    )
        return;
    let model = event.target.bjs_model;
    let property = event.target.getAttribute('data-model');
    if ( model === undefined || property === null )
        return;
    let value_old = model.get(property);
    let value_new = event.target.value;
    if ( value_old === value_new )
        return;
    model.set(property, value_new);
}
