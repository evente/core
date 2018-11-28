Object.defineProperty(
    Object.prototype,
    'getProperty',
    {
        value: function(field) {
            if ( field === '' )
                return this;
            let i,
                ref = this,
                path = field.toString().split('.'),
                len = path.length;
            for ( i = 0; i < len; i++ ) {
                if ( ref[ path[i] ] !== undefined )
                    ref = ref[ path[i] ];
                else
                    return undefined;
            }
            return ref;
        }
    }
);

Object.defineProperty(
    Object.prototype,
    'setProperty',
    {
        value: function(field, value) {
            let i,
                ref = this,
                path = field.toString().split('.'),
                len = path.length;
            for ( i = 0; i < len - 1; i++  ) {
                if ( ref[ path[i] ] === undefined  )
                    ref[ path[i] ] = {};
                ref = ref[ path[i] ];
            }
            ref[ path[len - 1] ] = value;
        }
    }
);
var bjs = function(selector){
    return new bjs.Selector(selector);
}

bjs.strings = [];
bjs.models = [];
bjs.routers = [];
bjs.filters = {
    empty: function(params) {
        return params[0] === undefined || params[0] === null ? ( params[1] ? params[1] : '' ) : ( params[2] ? params[2] : '' );
    },
    if: function(params) {
        var tmp = parseFloat(params[0]);
        if ( !isNaN(tmp) )
            params[0] = tmp;
        return params[0] ? ( params[1] ? params[1] : '' ) : ( params[2] ? params[2] : '' );
    },
    sort: function(params) {
        if ( params[0] === undefined || params[0] === null )
            return '';
        let values = params[0] instanceof Array ? params[0].slice() : params[0].keys;
        if ( values === undefined )
            return '';
        return values.sort();
    },
    reverse: function(params) {
        let tmp = bjs.filters.sort(params);
        return tmp ? tmp.reverse() : '';
    },
    min: function(params) {
        let tmp = bjs.filters.sort(params);
        return tmp ? tmp[0] : '';
    },
    max: function(params) {
        let tmp = bjs.filters.reverse(params);
        return tmp ? tmp[0] : '';
    }
}
bjs.attributes = {};

bjs.__proto__.getModel = function(node) {
    for ( var i in this.models ) {
        if ( this.models[i].selector.contains(node) )
            return this.models[i];
    }
}

bjs.__proto__.getRouter = function(node) {
    for ( var i in this.routers ) {
        if ( this.routers[i].selector.contains(node) )
            return this.routers[i];
    }
}

bjs.__proto__.getStringIndex = function(string) {
    var index = bjs.strings.indexOf(string);
    if ( index === -1 ) {
        bjs.strings.push(string);
        index = bjs.strings.indexOf(string);
    }
    return index;
}

bjs.__proto__.observe = function(mutations) {
    var mutation, tmp, model, i, j;
    for ( i in mutations ) {
        mutation = mutations[i];
        for ( j = 0; j < mutation.removedNodes.length; j++ ) {
            tmp = mutation.removedNodes[j];
            model = tmp.b_model || bjs.getModel(tmp);
            if ( model )
                model.unlink(tmp);
        }
        for ( j = 0; j < mutation.addedNodes.length; j++ ) {
            tmp = mutation.addedNodes[j];
            model = tmp.b_model || bjs.getModel(tmp);
            if ( model )
                model.parse_node(tmp);
        }
    }
}

bjs.__proto__.route = function() {
    for ( let i in bjs.routers )
        bjs.routers[i].handle(location.href);
}

if ( typeof b === 'undefined' )
    var b = bjs;
if ( typeof $ === 'undefined' )
    var $ = bjs;

if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' ) {
    module.exports = bjs;
} else {
    var observer = new MutationObserver(bjs.observe);
    observer.observe(
        document,
        {
            attributes: true,
            attributeOldValue: true,
            childList: true,
            characterData: true,
            characterDataOldValue: true,
            subtree: true
        }
    );
    window.addEventListener('popstate', bjs.route);
}
if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Attribute = class Attribute {

    constructor(node, attribute) {
        this.expression = new bjs.Expression(attribute.value);
        this.name = attribute.name;
        this.node = node;
    }

    eval() {
        this.node.setAttribute(this.name, this.expression.eval(this.node.b_model) || '');
    }

    getLinks() {
        return this.expression.getLinks();
    }

};

bjs.Attribute.check = function(node, name) {
    let value = node.getAttribute(name).trim();
    return !value.startsWith('{{') ? '{{' + value + '}}' : value;
};
if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Model = class Model {

    constructor(selector, data) {
        if ( data )
            data.strings = bjs.strings;
        bjs.models.push(this);
        this.proxyHandler = new bjs.ModelProxyHandler(this);
        this.shadow = data || { strings: bjs.strings };
        this.proxy = new Proxy({$: ''}, this.proxyHandler);
        this.links = {};
        this.selector = new bjs.Selector(selector);
        this.init();
    }

    get data() {
        return this.proxy;
    }

    set data(value) {
        value.strings = bjs.strings;
        this.shadow = value;
        for ( let i in this.selector )
            this.parse_node(this.selector.get(i), '');
    }

    get(property) {
        return this.data.getProperty(property);
    }

    set(property, value) {
        this.data.setProperty(property, value);
    }

    init() {
        let i, element;
        for ( i in this.selector ) {
            element = this.selector.get(i);
            element.addEventListener('change', bjs.Model.eventHander, true);
            element.addEventListener('keyup', bjs.Model.eventHander, true);
            this.parse_node(element);
        }
    }

    apply_attributes(node) {
        if ( node instanceof Text && node.b_expression !== undefined )
            node.nodeValue = node.b_expression.eval(this);
        if ( node.b_attributes === undefined )
            return;
        for ( let i in node.b_attributes ) {
            if ( bjs.attributes[i] !== undefined )
                node.b_attributes[i].eval();
            else
                node.setAttribute(i, node.b_attributes[i].eval(this));
        }
    }

    get_elements(link) {
        let i, elements = new Set();
        for ( i in this.links ) {
            if ( !i.startsWith(link + '.') )
                continue;
            this.links[i].forEach(function(element) {
                elements.add(element);
            });
        }
        while ( link != '' ) {
            if ( this.links[link] !== undefined )
                this.links[link].forEach(function(element) {
                    elements.add(element);
                });
            link = link.split('.').slice(0, -1).join('.');
        }
        return elements;
    }

    parse_attributes(node) {
        if ( node instanceof Text ) {
            if ( node.nodeValue.indexOf('{{') !== -1 ) {
                node.b_expression = new bjs.Expression(node.nodeValue);
                let i, links = node.b_expression.getLinks();
                for ( i in links )
                    this.link(node, links[i]);
                this.apply_attributes(node);
            }
            return;
        }
        let i, j, links, attribute, attributes = node.attributes;
        for ( i = 0; i < attributes.length; i++ ) {
            attribute = {
                name: attributes[i].name,
                value: attributes[i].value
            };
            if ( bjs.attributes[attribute.name] !== undefined )
                attribute.value = bjs.attributes[attribute.name].check(node, attribute.name);
            if (attribute.value.indexOf('{{') === -1)
                continue;
            if ( node.b_attributes === undefined )
                node.b_attributes = {};
            if ( bjs.attributes[attribute.name] !== undefined )
                node.b_attributes[attribute.name] = new bjs.attributes[attribute.name](node, attribute);
            else
                node.b_attributes[attribute.name] = new bjs.Expression(attribute.value);
            links = node.b_attributes[attribute.name].getLinks();
            for ( j in links )
                this.link(node, links[j]);
        }
        this.apply_attributes(node);
    }

    parse_node(node, changed) {
        if ( !(node instanceof Text) ) {
            if ( node.hasAttribute('b-for') )
                this.parse_for(node, changed);
            if ( node.hasAttribute('b-base') )
                this.parse_base(node, changed);
            let i, tmp, nodes = node.childNodes;
            for ( i = 0; i < nodes.length; i++ ) {
                tmp = nodes[i];
                if (
                    tmp instanceof Comment ||
                    tmp instanceof HTMLBRElement ||
                    tmp instanceof HTMLScriptElement
                )
                    continue;
                this.parse_node(tmp, changed);
            }
        }
        if ( changed !== undefined )
            this.apply_attributes(node);
        else
            this.parse_attributes(node);
    }

    parse_for(element, changed) {
        let property, key, as, items, value, child;
        if ( element.b_template === undefined ) {
            element.b_template = element.children[0];
            element.b_template.remove();
        }
        property = element.getAttribute('b-for');
        this.link(element, property);
        as = element.getAttribute('b-as') || '_';
        key = element.getAttribute('b-key');
        items = this.get(property);
        for ( let i in items ) {
            value = items[i][key];
            if ( changed !== undefined && !(property + '.' + value).startsWith(changed) )
                continue;
            child = element.querySelector('[b-base="' + property + '.' + value + '"]');
            if ( !child ) {
                child = element.b_template.cloneNode(true);
                child.b_for = property + '.' + value;
                child.b_key = value;
                child.setAttribute('b-base', child.b_for);
                this.replace_local(child, as, child.b_for);
                element.appendChild(child);
            }
            if ( changed !== undefined )
                this.parse_base(child, changed);
        }
        if ( changed !== undefined && property.startsWith(changed) ) {
            let i, remove = [];
            for ( i = 0; i < element.childNodes.length; i++ ) {
                child = element.childNodes[i];
                key = child.b_key !== undefined ? child.b_key : '';
                if (
                    items === undefined ||
                    ( items[key] === undefined && child.b_for !== undefined && child.b_for === property + '.' + key )
                )
                    remove.push(child);
            }
            for ( i in remove )
                remove[i].remove();
        }
    }

    parse_base(element, changed) {
        let base, key, value, property, clear = false, tmp, items, item;
        base = property = element.getAttribute('b-base');
        this.link(element, property);
        value = element.getAttribute('b-key');
        if ( value !== null ) {
            this.link(element, value);
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
                if ( item.getAttribute('b-model') !== tmp ) {
                    old = item.getAttribute('b-model');
                    item.setAttribute('b-model', tmp);
                    this.parse_attributes(item);
                }
            } else {
                item.removeAttribute('b-model');
                this.parse_attributes(item);
            }
        }
    }

    link(element, property) {
        if ( this.links[property] === undefined )
            this.links[property] = new Set();
        this.links[property].add(element);
        if ( element.b_links === undefined )
            element.b_links = new Set();
        element.b_links.add(property);
        if ( element.b_model !== this )
            element.b_model = this;
    }

    unlink(node, property) {
        if ( property === undefined ) {
            if ( node.b_model !== undefined && node.b_links !== undefined )
                node.b_links.forEach(function(link) {
                    node.b_model.unlink(node, link);
                });
            let i, nodes = node.childNodes;
            for ( i = 0; i < nodes.length; i++ )
                this.unlink(nodes[i]);
        } else {
            if ( this.links[property] !== undefined ) {
                this.links[property].delete(node);
                if ( this.links[property].size === 0 )
                    delete this.links[property];
            }
            if ( node.b_links !== undefined ) {
                node.b_links.delete(property);
                if ( node.b_links.size === 0 ) {
                    delete node.b_model;
                }
            }
        }
    }

    replace_local(node, local, base) {
        let regexp = new RegExp('({{.*?)' + local.replace('.', '\.') + '([ .}+\\-*/|=#&?])', 'gim');
        if ( node instanceof Text ) {
            if ( node.nodeValue.match(regexp) )
                node.nodeValue = node.nodeValue.replace(regexp, '$1' + base + '$2');
            return;
        }
        let i, nodes, tmp, attribute,
            attributes = node.attributes;
        for ( i = 0; i < attributes.length; i++ ) {
            attribute = attributes[i];
            if ( bjs.attributes[attribute.name] !== undefined )
                bjs.attributes[attribute.name].check(node, attribute.name);
            if ( attribute.value.match(regexp) )
                node.setAttribute(attribute.name, attribute.value.replace(regexp, '$1' + base + '$2'));
        }
        nodes = node.childNodes;
        for ( i = 0; i < nodes.length; i++ ) {
            tmp = nodes[i];
            if (
                tmp instanceof Comment ||
                tmp instanceof HTMLBRElement ||
                tmp instanceof HTMLScriptElement
            )
                continue;
            this.replace_local(tmp, local, base);
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
    if ( event.target.b_attributes === undefined || event.target.b_attributes['b-model'] === undefined )
        return;
    let b_model = event.target.b_attributes['b-model'],
        value_old = b_model.get(),
        value_new = event.target.value;
    if ( value_old === value_new )
        return;
    b_model.set(value_new);
}
if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.App = class App extends bjs.Model {

    constructor(selector, model, options) {
        super(selector, model);
        this.options = Object.assign({
            router: true,
        }, options);
        if ( this.options.router )
            this.router = new bjs.Router(this.selector);
    }

    route(route, callback, params) {
        if ( !this.router )
            return;
        if ( callback )
            this.router.add(route, callback, params);
        else
            this.router.remove(route);
    }

    run() {
        if ( this.router )
            this.router.trigger();
    }

};
if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.AttributeHideShow = class AttributeHideShow extends bjs.Attribute {

    constructor(node, attribute) {
        super(node, attribute);
        this.type = attribute.name;
    }

    eval() {
        //if ( this.display === undefined )
        //    this.display = this.node.style.display;
        if (
            ( this.type == 'b-hide' && !this.expression.eval(this.node.b_model) ) ||
            ( this.type == 'b-show' && this.expression.eval(this.node.b_model) )
        ) {
            //node.style.display = this.display;
            //delete this.display;
            this.node.style.display = '';
        } else
            this.node.style.display = 'none';
    }

};

bjs.attributes['b-hide'] = bjs.AttributeHideShow;
bjs.attributes['b-show'] = bjs.AttributeHideShow;
if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.AttributeModel = class AttributeModel extends bjs.Attribute {

    constructor(node, attribute) {
        super(node, attribute);
    }

    eval() {
        let value = this.expression.eval(this.node.b_model) || '';
        if (
            this.node instanceof HTMLInputElement ||
            this.node instanceof HTMLButtonElement ||
            this.node instanceof HTMLTextAreaElement ||
            this.node instanceof HTMLSelectElement
        ) {
            if ( typeof value !== 'object' && this.node.value != value )
            this.node.value = value;
        } else {
            value = typeof value !== 'object' ? value.toString() : JSON.stringify(value);
            if ( this.node.textContent != value )
            this.node.textContent = value;
        }
    }

    get() {
        return this.expression.eval(this.node.b_model) || '';
    }

    set(value) {
        this.node.b_model.set(this.expression.property(this.node.b_model), value);
    }

};

bjs.attributes['b-model'] = bjs.AttributeModel;
if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Expression = class Expression {

    constructor(string) {
        this.expression = string;
        this.tree = this.parse(string.trim());
    }

    eval(model, item, property) {
        if ( !item )
            item = this.tree;
        let value, tmp, number, type = typeof item;
        switch ( type ) {
            case 'string':
                value = property ? item : model.get(item);
                break;
            case 'number':
                value = item;
                break;
            default:
                switch ( item.type ) {
                    case '+':
                    case '-':
                    case '*':
                    case '/':
                        for ( let i in item.params ) {
                            tmp = this.eval(model, item.params[i]);
                            if ( tmp === undefined || tmp === null )
                                continue;
                            if ( (value === undefined || typeof value === 'number') && typeof tmp !== 'number' ) {
                                number = parseFloat(tmp);
                                if ( !isNaN(number) )
                                    tmp = number;
                            }
                            value = value === undefined ? tmp : bjs.Expression.operations[item.type].func(value, tmp);
                        }
                        break;
                    case '&':
                    case '?':
                    case '=':
                    case '#':
                        value = [];
                        for ( let i in item.params ) {
                            tmp = this.eval(model, item.params[i]);
                            number = parseFloat(tmp);
                            if ( !isNaN(number) )
                                tmp = number;
                            value.push(tmp);
                            if ( value.length > 1 )
                                value = [ bjs.Expression.operations[item.type].func(value[0], value[1]) ];
                        }
                        value = value[0];
                        break;
                    case 'value':
                        value = this[property ? 'property' : 'eval'](model, item.params[0]);
                        break;
                    case 'property':
                        if ( property ) {
                            value = this.property(model, item.params[0]);
                            value = value !== undefined ? value + '.' + item.params[1] : undefined;
                        } else {
                            value = this.eval(model, item.params[0]);
                            value = value !== undefined ? value.getProperty(item.params[1]) : undefined;
                        }
                        break;
                    case 'index':
                        value = item.params[0] + '.' + this.eval(model, item.params[1]);
                        if ( !property )
                            value = model.get(value);
                        break;
                    case 'filter':
                        let params = [];
                        for ( let i in item.params )
                            params.push( this.eval(model, item.params[i] ) );
                        value = bjs.filters[item.name](params);
                        break;
                }
        }
        return value;
    }

    property(model, item) {
        return this.eval(model, item, true);
    }

    getLinks(item) {
        if ( item === undefined )
            item = this.tree;
        let i, links = [], type = typeof item;
        switch ( type ) {
            case 'number':
                break;
            case 'string':
                if ( item.endsWith('.length') )
                    item = item.substr(0, item.length - 7);
                if ( item.endsWith('.keys') )
                    item = item.substr(0, item.length - 5);
                links.push(item);
                break;
            default:
                switch ( item.type ) {
                    case 'property':
                        links.push.apply(links, this.getLinks(item.params[0]));
                        break;
                    default:
                        for ( i in item.params )
                            links.push.apply(links, this.getLinks(item.params[i]));
                }
        }
        return links;
    }

    parse(data) {
        data = this.parse_unclosed(data);
        data = this.parse_strings(data);
        data = this.parse_operations(data);
        this.expression = data;
        data = this.parse_tokens(data);
        return this.parse_tree(data);
    }

    parse_unclosed(string) {
        let pos = 0,
            tmp_string = '',
            tmp,
            match,
            reg_exp = /{{.*?}}/gm,
            reg_token = new RegExp([
                '=', '!=',
                '!', '&&', '\\|\\|',
                '-', '\\+', '\\*', '\\/',
                '\\[', ']', '\\(', '\\)',
                '\\|', ':',
            ].join('|'));
        match = reg_exp.exec(string);
        while ( match ) {
            if ( match.index !== pos ) {
                tmp = string.substr(pos, match.index - pos);
                tmp_string += 'strings.' + bjs.getStringIndex(tmp) + ' + ';
                pos = match.index;
            }
            tmp = match[0].substr(2, match[0].length - 4).trim();
            if ( reg_token.test(tmp) )
                tmp = '(' + tmp + ')';
            tmp_string += tmp + ' + ';
            pos += match[0].length;
            match = reg_exp.exec(string);
        }
        tmp = string.substr(pos);
        if ( tmp.length )
            tmp_string += 'strings.' + bjs.getStringIndex(tmp);
        if ( tmp_string.endsWith(' + ') )
            tmp_string = tmp_string.substr(0, tmp_string.length - 3);
        if ( tmp_string.startsWith('(') && tmp_string.endsWith(')') && !tmp_string.match(/^\(.*(\(|\)).*\)$/) )
            tmp_string = tmp_string.substr(1, tmp_string.length - 2);
        return tmp_string;
    }

    parse_strings(string) {
        let result = '',
            pos = 0,
            str = { start: 0 },
            regexp = /['"]/gm,
            match = regexp.exec(string);
        while ( match ) {
            if ( !str.start ) {
                str.start = match.index + 1;
                str.delim = match[0];
                result += string.substr(pos, match.index - pos);
            } else {
                if ( str.delim === match[0] ) {
                    str.string = string.substr(str.start, match.index - str.start);
                    str.index = bjs.getStringIndex(str.string);
                    result += 'strings.' + str.index;
                    str.start = 0;
                }
            }
            pos = match.index + 1;
            match = regexp.exec(string);
        }
        if ( pos < string.length )
            result += string.substr(pos);
        return result;
    }

    parse_operations(string) {
        string = string.replace(/&&/, '&');
        string = string.replace(/\|\|/, '?');
        string = string.replace(/==/, '=');
        string = string.replace(/!=/, '#');
        return string;
    }

    parse_tokens(string) {
        let pos = 0,
            tmp,
            match,
            reg_token = /[!&?=#\-+*/[\]()|:]/gm,
            tokens = [];
        pos = 0;
        reg_token.lastIndex = 0;
        match = reg_token.exec(string);
        while ( match ) {
            if ( match.index !== pos ) {
                tmp = string.substr(pos, match.index - pos).trim();
                if ( tmp.length )
                    tokens.push( string.substr(pos, match.index - pos).trim() );
                pos = match.index;
            }
            tokens.push( match[0].trim() );
            pos += match[0].length;
            match = reg_token.exec(string);
        }
        tmp = string.substr(pos).trim();
        if ( tmp.length )
            tokens.push(tmp);
        return tokens;
    }

    parse_tree(tokens, item) {
        if ( item === undefined )
            item = {};
        if ( item.params === undefined )
            item.params = [];
        let token, tmp;
        while ( tokens.length ) {
            token = tokens.shift();
            switch ( token ) {
                case '-':
                case '+':
                case '*':
                case '/':
                case '&':
                case '?':
                case '=':
                case '#':
                    if ( item.type === undefined ) {
                        item.type = token;
                        continue;
                    }
                    if ( item.type === token )
                        break;
                    if ( bjs.Expression.operations[item.type].priority == bjs.Expression.operations[token].priority )
                        item.params.push({ type: token, params: [item.params.pop(), this.parse_tree(tokens)] });
                    if ( bjs.Expression.operations[item.type].priority > bjs.Expression.operations[token].priority )
                        item = { type: token, params: [ item ] };
                    if ( bjs.Expression.operations[item.type].priority < bjs.Expression.operations[token].priority )
                        item.params.push(this.parse_tree(
                            tokens,
                            { type: token, params: [ item.params.pop() ] }
                        ));
                    break;
                case '(':
                    item.params.push(this.parse_tree(tokens));
                    break;
                case ')':
                    if ( item.type === undefined )
                        item.type = 'value';
                    return item;
                case '[':
                    item.params.push( { type: 'index', params: [ item.params.pop(), this.parse_tree(tokens) ] } );
                    break;
                case ']':
                    if ( item.type === undefined )
                        item.type = 'value';
                    return item;
                case '|':
                    if ( item.type !== undefined )
                        item = { params: [ item ] };
                    item.type = 'filter';
                    item.name = tokens.shift();
                    token = tokens.shift();
                    while ( token === ':' ) {
                        item.params.push( this.parse_tree(tokens) );
                        token = tokens.shift();
                    }
                    if ( token !== undefined )
                        tokens.unshift(token);
                    break;
                case ':':
                    tokens.unshift(token);
                    if ( !item.params.length )
                        return '';
                    if ( item.type === undefined )
                        item.type = 'value'
                    return item;
                default:
                    if ( token[0] == '.' ) {
                        token = token.substr(1);
                        if ( item.type === undefined ) {
                            item.type = 'property';
                            item.params.push(token);
                        } else
                            item.params.push( { type: 'property', params: [ item.params.pop(), token ] } );
                    } else {
                        tmp = parseFloat(token);
                        if ( !isNaN(tmp) )
                            token = tmp;
                        item.params.push(token);
                    }
            }
        }
        if ( item.type === undefined )
            item.type = 'value';
        return item;
    }

};

bjs.Expression.operations = {
    '+': { priority: 0, func: function(a, b) { return a + b; } },
    '-': { priority: 0, func: function(a, b) { return a - b; } },
    '*': { priority: 1, func: function(a, b) { return a * b; } },
    '/': { priority: 1, func: function(a, b) { return a / b; } },
    '&': { priority: 2, func: function(a, b) { return Boolean(a && b); } },
    '?': { priority: 2, func: function(a, b) { return Boolean(a || b); } },
    '=': { priority: 3, func: function(a, b) { return Boolean(a == b); } },
    '#': { priority: 3, func: function(a, b) { return Boolean(a != b); } },
    'filter': { priority: 4 },
};
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
        if ( data[prop] !== null ) {
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
if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Resource = class Resource {

    constructor(url, type) {
        this.url = url;
        this.type = type || 'json';
    }

    get(params) {
        return this.method('get', params);
    }

    post(params) {
        return this.method('post', params);
    }

    put(params) {
        return this.method('put', params);
    }

    delete(params) {
        return this.method('delete', params);
    }

    method(method, params, headers) {
        params = params || {};
        let url = this.url.replace(/\/:([-_0-9a-z]+)(\/|$)/ig, (match, param, end) => {
                let tmp = params[param] || '';
                delete params[param];
                return '/' + tmp + end;
            }),
            options = { mode: 'cors', method: method, headers: new Headers(headers || bjs.Resource.headers) };
        switch ( method ) {
            case 'get':
            case 'delete':
                let key, tmp = [];
                for ( key in params )
                    tmp.push(key + '=' + encodeURIComponent(params[key]));
                url += '?' + tmp.join('&');
                break;
            case 'post':
            case 'put':
                options.body = JSON.stringify(params);
                break;
        }
        if ( ['post', 'put'].indexOf(method) !== -1 )
            options.body = JSON.stringify(params);
        return fetch(url, options).then(response => {
            this.ok = response.ok;
            this.status = response.status;
            switch ( this.type ) {
                case 'json': return response.json();     break;
                case 'form': return response.formData(); break;
                default:     return response.text();
            }
        }).then(response => {
            if ( !this.ok ) {
                let error = new Error();
                error.status = this.status;
                error.data = response;
                throw error;
            }
            return response;
        });
    }

}

bjs.Resource.headers = {};
if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Router = class Router {

    constructor(selector) {
        bjs.routers.push(this);
        this.routes = {};
        this.selector = selector;
        this.init();
    }

    init() {
        let i, node;
        for ( i in this.selector ) {
            node = this.selector.get(i);
            node.addEventListener('click', bjs.Router.eventHander, true);
        }
    }

    add(route, callback, params) {
        route = this.normalize(route);
        this.routes[route] = {
            parts: route.split('/'),
            callback: callback,
            params: params || {},
        };
    }

    remove(route) {
        route = this.normalize(route);
        delete this.routes[route];
    }

    trigger(route, push) {
        if ( route === undefined )
            route = location.pathname;
        this.handle(route, push);
    }

    handle(route, push) {
        route = this.normalize(route);
        if ( this.routes[route] !== undefined ) {
            if ( push )
                window.history.pushState({}, '', '/' + route);
            this.routes[route].callback(this.routes[route].params);
            return true;
        }
        let i, j, tmp,
            routes = Object.assign({}, this.routes),
            params = {},
            part, parts = route.split('/');
        for ( i in parts ) {
            part = parts[i];
            for ( j in routes ) {
                if ( routes[j].parts.length !== parts.length ) {
                    delete routes[j];
                    continue;
                }
                tmp = routes[j].parts[i];
                if ( tmp === part )
                    continue;
                if ( tmp !== undefined && tmp[0] === ':' )
                    params[ tmp.substr(1) ] = part;
                else
                    delete routes[j];
            }
        }
        if ( Object.keys(routes).length ) {
            if ( push )
                window.history.pushState({}, '', '/' + route);
            for ( j in routes )
                routes[j].callback(Object.assign(routes[j].params, params));
        }
        return Object.keys(routes).length > 0;
    }

    normalize(route) {
        if ( route.startsWith(location.origin) )
            route = route.substr(location.origin.length);
        if ( route.startsWith('//' + location.host) )
            route = route.substr(('//' + location.host).length);
        if ( route.startsWith('/') )
            route = route.substr(1);
        if ( route.endsWith('/') )
            route = route.substr(0, route.length - 1);
        return route;
    }

}

bjs.Router.eventHander = function(event) {
    let target = event.target;
    while ( !(target instanceof HTMLAnchorElement) ) {
        target = target.parentNode;
        if ( target instanceof HTMLDocument )
            return;
    }
    let router = bjs.getRouter(target);
    if ( !router )
        return;
    let route = target.getAttribute('href');
    if ( route && router.handle(route, true) )
        event.preventDefault();
}
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

    closest(selector) {
        return this.forEach({
            'action': 'closest',
            'selector': selector
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
                case 'closest':
                    tmp = this[i].parentNode;
                    while ( !tmp.matches(options.selector) ) {
                        tmp = tmp.parentNode;
                        if ( tmp instanceof HTMLDocument ) {
                            tmp = null;
                            break;
                        }
                    }
                    result.push(tmp);
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
            case 'closest':
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
