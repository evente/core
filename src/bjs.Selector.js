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
        if ( value !== undefined ) {
            for ( let i = 0; i < this.length; i++ ) {
                this[i].setAttribute(name, value);
            }
            return this;
        } else {
            if ( this.length > 1 ) {
                let attributes = [];
                for ( let i = 0; i < this.length; i++ ) {
                    attributes.push(this[i].getAttribute(name));
                }
                return attributes;
            } else if ( this.length === 1 ) {
                return this[0].getAttribute(name);
            }
        }
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
		return this._forEach(html, function(obj, method, html){
			switch (method) {
				case 'get':
					return obj.innerHTML;
				break;
				case 'set':
					obj.innerHTML = html;
				break;
			}
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
		return this._forEach(undefined, function(obj, method){
			if ( method == 'get' ) {
				return obj.parentNode;
			}
		});
    }

    removeClass(classes) {
        return this._class('remove', classes);
    }

    text(text) {
		return this._forEach(text, function(obj, method, text){
			switch (method) {
				case 'get':
					return obj.textContent;
				break;
				case 'set':
					obj.textContent = text;
				break;
			}
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

	_forEach(data, callback) {
		if ( callback === undefined )
			return this;
        if ( data !== undefined ) {
            for ( let i = 0; i < this.length; i++ ) {
				callback(this[i], 'set', data);
            }
            return this;
        } else {
            if ( this.length > 1 ) {
                let tmp = [];
                for ( let i = 0; i < this.length; i++ ) {
                    tmp.push(callback(this[i], 'get'));
                }
                return tmp;
            } else if ( this.length === 1 ) {
                return callback(this[0], 'get');
            }
        }
	}

};
