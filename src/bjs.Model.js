if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Model = class Model {

    constructor(selector, data) {
        let model = this;
        this.proxyHandler = {
            get: function(target, prop) {
                if ( prop === 'constructor' )
                    return { name: 'Proxy' };
                if ( target[prop] === undefined ) {
					if ( prop === 'length'  )
						return Object.keys(target).length;
                    return;
				}
                if ( target[prop] !== null && target[prop].constructor.name !== 'Proxy' && typeof target[prop] === 'object' ) {
                    let property = model.paths.get(target);
                    property = ( property !== undefined ? property + '.' : '' ) + prop;
                    model.paths.set(target[prop], property);
                    target[prop] = new Proxy(target[prop], model.proxyHandler);
                }
                return target[prop];
            },
            set: function(target, prop, value, receiver) {
                let oldval = target[prop];
                target[prop] = value;
                if ( oldval !== value ) {
                    let property = model.paths.get(target);
                    property = ( property !== undefined ? property + '.' : '' ) + prop;
					let elements = model._get_elements(property);
					elements.forEach(function(element) {
						model._parse(element, property);
					});
                }
				return true;
            },
			deleteProperty: function(target, prop) {
				delete target[prop];
				let property = model.paths.get(target);
				property = ( property !== undefined ? property + '.' : '' ) + prop;
				let elements = model._get_elements(property);
				elements.forEach(function(element) {
					if ( element._b_for !== undefined && element._b_for === property ) {
						model._unlink(element, property);
						element.remove();
						return;
					}
					model._parse(element, property);
				});
				return true;
			}
        }
        this.data = new Proxy(data || {}, this.proxyHandler);
		this.paths = new WeakMap();
		this.links = {};
        this.selector = new bjs.Selector(selector);
        this._init();
		this._parse();
    }

    get(property) {
        return this.data.getProperty(property);
    }

    set(property, value) {
        this.data.setProperty(property, value);
    }

    _init() {
        let element;
        for ( let i in this.selector ) {
            element = this.selector.get(i);
            element.addEventListener('change', bjs.Model.eventHander, true);
            element.addEventListener('keyup', bjs.Model.eventHander, true);
        }
    }

	_get_elements(link) {
		let elements = new Set();
		while ( link != '' ) {
			if ( this.links[link] !== undefined )
				this.links[link].forEach(function(element) {
					elements.add(element);
				});
			link = link.split('.').slice(0, -1).join('.');
		}
		return elements;
	}

	_parse(element, changed) {
		if ( element !== undefined ) {
			if ( element.hasAttribute('b-for') )
				this._parse_for(element, changed);
			if ( element.hasAttribute('b-base') )
				this._parse_base(element, changed);
			if ( element.hasAttribute('b-model') )
				this._parse_model(element);
		} else {
			let selector, elements;
			// for + key
			selector = '[b-for][b-key]';
			elements = this.selector.find(selector);
			for ( let i in elements )
				this._parse_for(elements[i]);
			// base, base + key, base + value
			selector = '[b-base], [b-base][b-key], [b-base][b-value]';
			elements = this.selector.find(selector);
			for ( let i in elements )
				this._parse_base(elements[i]);
			// model
			selector = '[b-model]';
			elements = this.selector.find(selector);
			for ( let i in elements )
				this._parse_model(elements[i]);
		}
	}

	_parse_for(element, changed) {
		let property, key, items, value, child;
		if ( element._b_template === undefined ) {
			element._b_template = element.children[0];
			element._b_template.remove();
		}
		property = element.getAttribute('b-for');
		this._link(element, property);
		key = element.getAttribute('b-key');
		items = this.data.getProperty(property);
		for ( let i in items ) {
			value = items[i][key];
			if ( changed && changed != property && !changed.startsWith(property + '.' + value) )
				continue;
			child = element.querySelector('[b-key="' + value + '"]');
			if ( !child ) {
				child = element._b_template.cloneNode(true);
				child.setAttribute('b-base', property);
				child.setAttribute('b-key', value);
				child._b_for = property + '.' + value;
				element.appendChild(child);
			}
			if ( changed )
				this._parse_base(child, changed);
		}
		if ( changed && changed === property ) {
			for ( let i = 0; i < element.children.length; i++ ) {
				child = element.children[i];
				key = child.getAttribute('b-key');
				if ( items[key] === undefined && child._b_for !== undefined && child._b_for === property + '.' + key )
					child.remove();
			}
		}
	}

	_parse_base(element, changed) {
		let base, key, value, property, clear = false, tmp, items, item;
		base = property = element.getAttribute('b-base');
		this._link(element, property);
		key = element.getAttribute('b-key');
		if ( key !== null ) {
			property += '.' + key;
			this._link(element, property);
			if ( this.get(property) === undefined )
				property = '';
		}
		value = element.getAttribute('b-value');
		if ( value !== null ) {
			this._link(element, value);
			tmp = this.get(value);
			if ( tmp !== undefined && this.get(property + '.' + tmp) !== undefined )
				property += '.' + tmp;
			else
				property = '';
		}
		property += '.';
		items = Array.prototype.slice.call(element.querySelectorAll('[b-field]'));
		if ( element.hasAttribute('b-field') )
			items.push(element);
		for ( let i in items ) {
			item = items[i];
			if ( property !== '.' ) {
				tmp = property + item.getAttribute('b-field');
				if ( changed && !tmp.startsWith(changed) && changed !== value )
					continue;
				if ( item.getAttribute('b-model') !== tmp )
					item.setAttribute('b-model', tmp);
				if ( changed )
					this._parse_model(item, changed);
			} else {
				item.removeAttribute('b-model');
				this._parse_model(item, changed);
			}
		}
	}

	_parse_model(element) {
		let value = '', property = element.getAttribute('b-model');
		if ( property !== null ) {
			value = this.data.getProperty(property);
			if ( value === undefined )
				value = '';
			this._link(element, property);
		} else
			this._unlink(element);
		if (
			element instanceof HTMLInputElement ||
			element instanceof HTMLButtonElement ||
			element instanceof HTMLTextAreaElement ||
			element instanceof HTMLSelectElement
		) {
			if ( typeof value !== 'object' && element.value != value )
				element.value = value;
		} else {
			value = typeof value !== 'object' ? value.toString() : JSON.stringify(value);
			if ( element.textContent != value )
				element.textContent = value;
		}
	}

	_link(element, property) {
		if ( this.links[property] === undefined )
			this.links[property] = new Set();
		this.links[property].add(element);
		if ( element._b_links === undefined )
			element._b_links = new Set();
		element._b_links.add(property);
		if ( !element.hasAttribute('b-linked') )
			element.setAttribute('b-linked', '');
		if ( element._b_model != this )
			element._b_model = this;
	}

	_unlink(element, property) {
		if ( element._b_model !== undefined && property === undefined ) {
			if ( element._b_links !== undefined )
				element._b_links.forEach(function(link){
					element._b_model._unlink(element, link);
				});
		} else {
			if ( this.links[property] !== undefined ) {
				this.links[property].delete(element);
				if ( this.links[property].size === 0 )
					delete this.links[property];
			}
			if ( element._b_links !== undefined ) {
				element._b_links.delete(property);
				if ( element._b_links.size === 0 ) {
					element.removeAttribute('b-linked');
					delete element._b_model;
				}
			}
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
    let model = event.target._b_model;
    let property = event.target.getAttribute('b-model');
    if ( model === undefined || property === null )
        return;
    let value_old = model.get(property);
    let value_new = event.target.value;
    if ( value_old === value_new )
        return;
    model.set(property, value_new);
}
