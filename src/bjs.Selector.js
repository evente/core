if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Selector = class Selector extends Array {

    constructor(options, selector) {
        super();
        switch (options.constructor.name) {
            case 'String':
                bjs.Selector.prototype.push.apply(this, document.querySelectorAll(options));
                break;
            case 'Array':
                bjs.Selector.prototype.push.apply(this, options);
                break;
            default:
                if ( options instanceof Node )
                    this.push(options);
                else
                    console.warn('Selector: Unknown constructor name - ' + options.constructor.name + '!');
        }
        this.selector = selector;
    }

    addClass(classes) {
        return this._class('add', classes);
    }

    attr(name, value) {
        return this._forEach({
            'prop': 'attr',
            'name': name,
            'value': value
        });
    }

    end() {
        return this.selector;
    }

    get(index) {
        return this[index];
    }

    hasClass(className, all) {
        let tmp;
        for ( let i = 0; i < this.length; i++ ) {
            tmp = this[i].classList.contains(className);
            if ( all !== true ) {
                if ( tmp ) return true;
            } else {
                if ( !tmp ) return false;
            }
        }
        return all === true ? true : false;
    }

    html(html) {
        return this._forEach({
            'prop': 'html',
            'value': html
        });
    }

    find(selector) {
        let nodes = [];
        let tmp;
        for ( let i = 0; i < this.length; i++ ) {
            tmp = this[i].querySelectorAll(selector);
            for ( let i = 0; i < tmp.length; i++ ) {
                nodes.push(tmp[i]);
            }
        }
        return new bjs.Selector(nodes, this);
    }

    parent() {
        return this._forEach({
            'prop': 'parent'
        });
    }

    removeClass(classes) {
        return this._class('remove', classes);
    }

    text(text) {
        return this._forEach({
            'prop': 'text',
            'value': text
        });
    }

    toggleClass(classes, active) {
        return this._class('toggle', classes);
    }

    _class(action, classes, active) {
        if ( typeof classes === 'string' )
            classes = classes.split(' ');
        for ( let i = 0; i < this.length; i++ ) {
            for ( let j = 0; j < classes.length; j++ ) {
                if ( action === 'toggle' ) {
                    this[i].classList.toggle(classes[j], active);
                } else {
                    this[i].classList[action](classes[j]);
                }
            }
        }
        return this;
    }

    _forEach(options) {
        if ( options.value !== undefined ) {
            for ( let i = 0; i < this.length; i++ ) {
                switch ( options.prop ) {
                    case 'attr':    this[i].setAttribute(options.name, options.value);  break;
                    case 'html':    this[i].innerHTML = options.value;                  break;
                    case 'text':    this[i].textContent = options.value;                break;
                }
            }
            return this;
        }
        let tmp = [];
        let result;
        for ( let i = 0; i < this.length; i++ ) {
            switch ( options.prop ) {
                case 'attr':    result = this[i].getAttribute(options.name);    break;
                case 'html':    result = this[i].innerHTML;                     break;
                case 'parent':  result = this[i].parentNode;                    break;
                case 'text':    result = this[i].textContent;                   break;
            }
            tmp.push(result);
        }
        if ( options.prop === 'parent' )
            return new bjs.Selector(tmp);
        if ( tmp.length === 0 )
            return undefined;
        return tmp.length > 1 ? tmp : tmp[0];
    }

};
