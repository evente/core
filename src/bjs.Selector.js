if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Selector = class Selector extends Array {

    constructor(options, selector) {
        super();
        if ( options !== undefined ) {
            switch (options.constructor.name) {
                case 'String':
                    if ( options.length > 0 )
                        bjs.Selector.prototype.push.apply(this, document.querySelectorAll(options));
                break;
                case 'Array':
                    bjs.Selector.prototype.push.apply(this, options);
                break;
                default:
                    if ( options instanceof HTMLElement )
                        this.push(options);
                    else
                        console.warn('Selector: Unknown constructor name - ' + options.constructor.name + '!');
            }
        }
        Object.defineProperty(this, 'selector', { enumerable: false, writable: true });
        this.selector = selector;
    }

    addClass(classes) {
        return this.classes('add', classes);
    }

    attr(name, value) {
        return this.forEach({
            'action': 'attr',
            'name': name,
            'value': value
        });
    }

    contains(node) {
        return this.forEach({
            'action': 'contains',
            'node': node
        });
    }

    end() {
        return this.selector;
    }

    find(selector) {
        return this.forEach({
            'action': 'find',
            'selector': selector
        });
    }

    get(index) {
        return this[index];
    }

    hasClass(className, all) {
        return this.forEach({
            'action': 'hasClass',
            'class': className,
            'all': all
        });
    }

    html(html) {
        return this.forEach({
            'action': 'html',
            'value': html
        });
    }

    is(selector, all) {
        return this.forEach({
            'action': 'is',
            'selector': selector,
            'all': all
        });
    }

    parent() {
        return this.forEach({
            'action': 'parent'
        });
    }

    removeClass(classes) {
        return this.classes('remove', classes);
    }

    text(text) {
        return this.forEach({
            'action': 'text',
            'value': text
        });
    }

    toggleClass(classes, active) {
        return this.classes('toggle', classes);
    }

    val(value) {
        return this.forEach({
            'action': 'val',
            'value': value
        });
    }

    classes(action, classes, active) {
        if ( typeof classes === 'string' )
            classes = classes.split(' ');
        for ( let i in this ) {
            for ( let j in classes ) {
                if ( action === 'toggle' ) {
                    this[i].classList.toggle(classes[j], active);
                } else {
                    this[i].classList[action](classes[j]);
                }
            }
        }
        return this;
    }

    forEach(options) {
        if ( options.value !== undefined ) {
            for ( let i in this ) {
                switch ( options.action ) {
                    case 'attr':    this[i].setAttribute(options.name, options.value);  break;
                    case 'html':    this[i].innerHTML = options.value;                  break;
                    case 'text':    this[i].textContent = options.value;                break;
                    case 'val':
                        if ( this[i] instanceof HTMLInputElement )
                            this[i].value = options.value;
                    break;
                }
            }
            return this;
        }
        if ( this.length === 0 )
            return undefined;
        let i, tmp, result = [];
        for ( i in this ) {
            switch ( options.action ) {
                case 'attr':
                    tmp = this[i].getAttribute(options.name);
                    result.push(tmp !== null ? tmp : undefined );
                break;
                case 'contains':
                    if ( this[i] === options.node || this[i].contains(options.node) )
                        return true;
                break;
                case 'find':
                    Array.prototype.push.apply(result, this[i].querySelectorAll(options.selector));
                break;
                case 'html':    result.push(this[i].innerHTML);     break;
                case 'hasClass':
                    tmp = this[i].classList.contains(options.class);
                    if ( options.all !== true ) {
                        if ( tmp ) return true;
                    } else {
                        if ( !tmp ) return false;
                    }
                break;
                case 'is':
                    tmp = this[i].matches(options.selector);
                    if ( options.all !== true ) {
                        if ( tmp ) return true;
                    } else {
                        if ( !tmp ) return false;
                    }
                break;
                case 'parent':  result.push(this[i].parentNode);    break;
                case 'text':    result.push(this[i].textContent);   break;
                case 'val':
                    result.push(this[i] instanceof HTMLInputElement ? this[i].value : undefined);
                break;
            }
        }
        switch ( options.action ) {
            case 'contains':
                return false;
            case 'find':
            case 'parent':
                return new bjs.Selector(result, this);
            case 'hasClass':
            case 'is':
                return options.all === true ? true : false;
            default:
                return result.length > 1 ? result : result[0];
        }
    }

};
