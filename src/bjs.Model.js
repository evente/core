if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Model = class Model {

    constructor(selector, data) {
        this.selector = new bjs.Selector(selector);
        this.$ = data || {};
        this._apply();
    }

    get(property) {
        return this.$.getProperty(property);
    }

    set(property, value) {
        return this.$.setProperty(property, value);
    }

    _apply() {
        let elements = this.selector.find('[data-model]');
        let element, property, value;
        for ( let i = 0; i < elements.length; i++ ) {
            element = bjs(elements[i]);
            property = element.attr('data-model');
            value = this.$.getProperty(property);
            if ( value !== undefined ) {
                element.text(value);
            }
        }
    }

}
