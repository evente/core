Object.defineProperty(
    Object.prototype,
    'getField',
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
    'setField',
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


/**
 * Create new Evente application
 * @param {string} selector Selector for application root element
 * @param {*} [data={}] Initial data
 * @param {Object} [options] Aplication creation options
 * @param {boolean} [options.clean=false] Remove Comment and empty Text nodes from DOM
 * @param {boolean} [options.router=true] Use router
 * @param {boolean} [options.run=true] Run immediately after create
 * @returns {EventeApplication}
 */
const evente = function(selector, data, options) {
    return new EventeApplication(selector, data, options);
};

/**
 * Get registered pipes
 * @returns {EventePipes}
 */
Object.defineProperty(evente, 'pipes', {
    get: function() { return EventePipes; }
});

/**
 * Create EventeResource instance
 * @param {string} url Resource URL
 * @param {string} [type=json] Resource content type
 * @returns {EventeResource}
 */
evente.resource = function(url, type) {
    return new EventeResource(url, type);
}


/**
 * Evente Expression class
 */
class EventeExpression {

    /**
     * @param {string} string 
     */
    constructor(string) {
        this.expression = string;
        this.tree = this.parse(string.trim());
    }

    /**
     * Eveluate expression value or path
     * @param {EventeModel} model EventeModel object
     * @param {*} [item] Abstract Syntax Tree item
     * @param {boolean} [property] Flag to get path in model data
     * @returns {*}
     */
    eval(model, item, property) {
        if ( item === undefined )
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
                            value = value === undefined ? tmp : EventeExpression.operations[item.type].func(value, tmp);
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
                                value = [ EventeExpression.operations[item.type].func(value[0], value[1]) ];
                        }
                        value = value[0];
                        break;
                    case '!':
                        value = !this.eval(model, item.params[0]);
                        break;
                    case 'value':
                        value = this[property ? 'property' : 'eval'](model, item.params[0]);
                        break;
                    case '.':
                        if ( property ) {
                            value = this.property(model, item.params[0]);
                            value = value !== undefined ? value + '.' + item.params[1] : undefined;
                        } else {
                            value = this.eval(model, item.params[0]);
                            value = value !== undefined ? value.getField(item.params[1]) : undefined;
                        }
                        break;
                    case '[]':
                        value = item.params[0] + '.' + this.eval(model, item.params[1]);
                        if ( !property )
                            value = model.get(value);
                        break;
                    case '|':
                        let params = [];
                        for ( let i in item.params )
                            params.push( this.eval(model, item.params[i] ) );
                        value = EventePipes[item.name](params);
                        break;
                }
        }
        return value;
    }

    /**
     * Get path in model data
     * @param {EventeModel} model EventeModel object
     * @param {*} [item] Abstract Syntax Tree item
     * @returns {string}
     */
    property(model, item) {
        return this.eval(model, item, true);
    }

    /**
     * Get dependencies of Abstract Syntax Tree
     * @param {*} item Abstract Syntax Tree item
     * @returns {Array<string>}
     */
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
                    case '.':
                        links.push(...this.getLinks(item.params[0]));
                        break;
                    default:
                        for ( i in item.params )
                            links.push(...this.getLinks(item.params[i]));
                }
        }
        return links;
    }

    /**
     * Parse expression into Abstract Syntax Tree
     * @private
     * @param {string} data Expression string
     * @returns {Object}
     */
    parse(data) {
        data = this.parse_unclosed(data);
        data = this.parse_strings(data);
        data = this.parse_operations(data);
        this.expression = data;
        return this.parse_tree(this.parse_tokens(data));
    }

    /**
     * Parse expression parts not in double braces
     * @private
     * @param {string} string Expression string
     * @returns {string}
     */
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
                tmp_string += 'strings.' + EventeStrings.getIndex(tmp) + ' + ';
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
            tmp_string += 'strings.' + EventeStrings.getIndex(tmp);
        if ( tmp_string.endsWith(' + ') )
            tmp_string = tmp_string.substr(0, tmp_string.length - 3);
        if ( tmp_string.startsWith('(') && tmp_string.endsWith(')') && !tmp_string.match(/^\(.*(\(|\)).*\)$/) )
            tmp_string = tmp_string.substr(1, tmp_string.length - 2);
        return tmp_string;
    }

    /**
     * Parse strings of expression into model fields
     * @private
     * @param {string} string Expression string
     * @returns {string}
     */
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
                    str.index = EventeStrings.getIndex(str.string);
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

    /**
     * Parse double symbol operators
     * @private
     * @param {string} string Expression string
     * @returns {string}
     */
    parse_operations(string) {
        string = string.replace(/&&/g, '&');
        string = string.replace(/\|\|/g, '?');
        string = string.replace(/==/g, '=');
        string = string.replace(/!=/g, '#');
        return string;
    }

    /**
     * Parse expression into tokens
     * @private
     * @param {string} string Expression string
     * @returns {Array<string>}
     */
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

    /**
     * Parse expression tokens into Abstract Syntax Tree
     * @private
     * @param {Array<string>} tokens Expression tokens
     * @param {*} [item] Abstract Syntax Tree item
     * @returns {Object}
     */
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
                case '!':
                    if ( item.type === undefined ) {
                        item.type = token;
                        continue;
                    }
                    if ( item.type === token )
                        break;
                    if ( EventeExpression.operations[item.type].priority >= EventeExpression.operations[token].priority )
                        item = { type: token, params: [ item ] };
                    else
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
                    if ( item.type === undefined ) {
                        item.type = '[]';
                        item.params.push(this.parse_tree(tokens));
                    } else
                        item.params.push( { type: '[]', params: [ item.params.pop(), this.parse_tree(tokens) ] } );
                    break;
                case ']':
                    if ( item.type === undefined )
                        item.type = 'value';
                    return item;
                case '|':
                    if ( item.type !== undefined )
                        item = { params: [ item ] };
                    item.type = '|';
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
                            item.type = '.';
                            item.params.push(token);
                        } else {
                            if ( EventeExpression.operations[item.type].priority >= EventeExpression.operations['.'].priority )
                                item = {type: '.', params: [item, token]};
                            else
                                item.params.push({type: '.', params: [item.params.pop(), token]});
                        }
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

EventeExpression.operations = {
    '+': { priority: 0, func: function(a, b) { return a + b; } },
    '-': { priority: 0, func: function(a, b) { return a - b; } },
    '*': { priority: 1, func: function(a, b) { return a * b; } },
    '/': { priority: 1, func: function(a, b) { return a / b; } },
    '&': { priority: 2, func: function(a, b) { return Boolean(a && b); } },
    '?': { priority: 2, func: function(a, b) { return Boolean(a || b); } },
    '=': { priority: 3, func: function(a, b) { return Boolean(a == b); } },
    '#': { priority: 3, func: function(a, b) { return Boolean(a != b); } },
    '!': { priority: 4 },
    '.': { priority: 5 },
    '[]': { priority: 6 },
    '|': { priority: 7 },
};


/**
 * Attribute class
 * @extends EventeExpression
 */
class EventeAttribute extends EventeExpression {

    /**
     * @param {HTMLElement} node DOM element
     * @param {string} name Attribute name
     * @param {EventeModel} model EventeModel object
     */
    constructor(node, name, model) {
        let attribute = node.attributes[name];
        super(attribute.value);
        this.name = name;
        this.node = node;
        this.model = model;
    }

    /**
     * Apply attributes values
     */
    apply() {
        let value = this.eval(this.model);
        value = value !== undefined ? value.toString() : '';
        if ( this.node.getAttribute(this.name) !== value )
            this.node.setAttribute(this.name, value);
    }

    /**
     * Check attribute expression is in double braces
     * @param {Element} node DOM element
     * @param {string} name Attribute name
     * @returns {string}
     */
    static check(node, name) {
        let value = node.getAttribute(name).trim();
        return !value.startsWith('{{') ? '{{' + value + '}}' : value;
    };

    /**
     * Get registered attributes ordered by priority
     * @returns {Array<Object>}
     */
    static getAttributes() {
        if ( EventeAttribute.attributesByPriorty.length !== Object.keys(EventeAttribute.attributes).length ) {
            let tmp = [];
            for ( let i in EventeAttribute.attributes )
                tmp.push({ name: i, priority: EventeAttribute.attributes[i].priority});
            tmp.sort((a,b) => {
                if ( a.priority > b.priority )
                    return -1;
                if ( a.priority < b.priority )
                    return 1;
                return 0;
            })
            EventeAttribute.attributesByPriorty = tmp;
        }
        return EventeAttribute.attributesByPriorty;
    }

};

/**
 * Registered attributes
 * @type {Object}
 */
EventeAttribute.attributes = {};
/**
 * Regstered attributes ordered by priority
 * @private
 * @type {Array<Object>}
 */
EventeAttribute.attributesByPriorty = [];
/**
 * Default attribute priority
 * @type {number}
 * @default 0
 */
EventeAttribute.priority = 0;


/**
 * Evente Application class
 */
class EventeApplication {

    /**
     * @param {string} selector Selector for application root element
     * @param {*} data Initial data
     * @param {Object} [options={}] Aplication creation options
     * @param {boolean} [options.clean=false] Remove Comment and empty Text nodes from DOM
     * @param {boolean} [options.router=true] Use router
     * @param {boolean} [options.run=true] Run immediately after create
     */
    constructor(selector, data, options) {
        options = {
            clean: false,
            router: true,
            run: true,
            ...options
        };
        this.element = document.querySelector(selector);
        this.model = new EventeModel(this.element, data);
        this.model.proxy = new Proxy({$: ''}, new EventeModelProxyHandler(this.model));
        if ( options.clean )
            this.clean();
        if ( options.router )
            this.router = new EventeRouter(this.element);
        if ( options.run )
            this.run();
    }

    /**
     * Get model data
     * @returns {Object}
     */
    get data() {
        return this.model.data;
    }

    /**
     * Set model data
     * @param {Object} value
     */
    set data(value) {
        this.model.data = value;
        EventeParser.parseNode(this.element, this.model);
    }

    /**
     * Add or remove route
     * @param {string} route Route pattern
     * @param {Function} [callback] Calback function to set or undefined to remove route
     * @param {*} [params] Parameters that will be passed to callback function
     */
    route(route, callback, params) {
        if ( !this.router )
            return;
        if ( callback )
            this.router.add(route, callback, params);
        else
            this.router.remove(route);
    }

    /**
     * Run application
     */
    run() {
        EventeParser.parseNode(this.element, this.model);
        if ( this.router )
            this.router.trigger();
    }

    /**
     * Remove Comment and empty Text nodes from DOM
     * @private
     */
    clean() {
        let node, nodes = [], walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT, null, false);
        while( node = walker.nextNode() ) {
            switch ( node.nodeType ) {
                case Node.TEXT_NODE:
                    if ( !node.nodeValue.match(/[^\s\n]/m) )
                        nodes.push(node);
                    break;
                case Node.COMMENT_NODE:
                    nodes.push(node);
                    break;
            }
        }
        for ( node in nodes )
            nodes[node].remove();
    }

};


/**
 * Base attribute class
 * @extends EventeAttribute
 */
class EventeAttributeBase extends EventeAttribute {

    /**
     * @inheritdoc
     */
    constructor(node, name, model) {
        let attribute = node.attributes[name],
            match = attribute.value.match(/^{{(.*?)(\s+as\s+([a-z0-9_]+))}}$/im);
        attribute.value = '{{' + match[1] + '}}';
        super(node, name, model);
        this.alias = match[3];
        this.apply();
    }

    /**
     * @inheritdoc
     */
    apply() {
        let i, item,
            items = this.node.childNodes,
            property = this.property(this.model);
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            this.dealias(item, this.alias, property);
        }
    }

    /**
     * Change alias in expressions on base path
     * @private
     * @param {Element | Text} node DOM node
     * @param {string} alias Alias name
     * @param {string} base Base path
     */
    dealias(node, alias, base) {
        let value, regexp = new RegExp('(^|[^a-z])' + alias.replace(/\./g, '\\.') + '([^a-z]|$)', 'gim');
        if ( node instanceof Text ) {
            if ( node.e_base ) {
                value = node.e_base.replace(regexp, '$1' + base + '$2');
            } else {
                if ( node.nodeValue.match(regexp) ) {
                    node.e_base = node.nodeValue;
                    value = node.nodeValue.replace(regexp, '$1' + base + '$2');
                } else
                    value = node.nodeValue;
            }
            if ( node.nodeValue !== value ) {
                node.nodeValue = value;
                EventeParser.parseAttributes(node, this.model);
                this.model.applyAttributes(node);
            }
            return;
        }
        node.e_base = node.e_base || {};
        let i, item, items = node.attributes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            value = EventeAttribute.attributes[item.name] ? EventeAttribute.attributes[item.name].check(node, item.name) : item.value;
            if ( node.e_base[item.name] ) {
                value = node.e_base[item.name].replace(regexp, '$1' + base + '$2');
            } else {
                if ( value.match(regexp) ) {
                    node.e_base[item.name] = value;
                    value = value.replace(regexp, '$1' + base + '$2');
                }
            }
            if ( item.value !== value ) {
                item.value = value;
                EventeParser.parseAttribute(node, item.name, this.model);
                this.model.applyAttribute(node, item.name);
            }
        }
        if ( !Object.keys(node.e_base).length )
            delete node.e_base;
        items = node.childNodes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            if (
                item instanceof Comment ||
                item instanceof HTMLBRElement ||
                item instanceof HTMLScriptElement
            )
                continue;
            this.dealias(item, alias, base);
        }
    }

};

EventeAttribute.attributes['e-base'] = EventeAttributeBase;


/**
 * b-for attribute class
 * @extends EventeAttribute
 */
class EventeAttributeFor extends EventeAttribute {

    /**
     * @inheritdoc
     */
    constructor(node, name, model) {
        let attribute = node.attributes[name],
            match = attribute.value.match(/^{{([a-z0-9_]+)\s+in\s+(.*?)(\s+key\s+([a-z0-9_]+))?}}$/im);
        attribute.value = '{{' + match[2] + '}}';
        super(node, name, model);
        this.alias = match[1];
        this.key = match[4];
        this.template = node.children[0];
        node.innerHTML = '';
    }

    /**
     * @inheritdoc
     */
    apply() {
        let i, key, child,
            remove = [],
            property = this.property(this.model),
            items = this.eval(this.model);
        for ( i in items ) {
            key = this.key !== undefined ? items[i][this.key] : i;
            child = this.node.querySelector('[e-key="' + key + '"]');
            if ( child && child.e_index !== i ) {
                child.remove();
                child = null;
            }
            if ( !child ) {
                child = this.template.cloneNode(true);
                child.e_index = i;
                child.setAttribute('e-key', key);
                this.dealias(child, '\\$index', i);
                this.dealias(child, '\\$key', key);
                this.dealias(child, this.alias, property + '.' + i);
                this.node.appendChild(child);
                EventeParser.parseNode(child, this.model);
            }
        }
        for ( i = 0; i < this.node.childNodes.length; i++ ) {
            child = this.node.childNodes[i];
            if ( items === undefined || items[child.e_index] === undefined )
                remove.push(child);
        }
        for ( i in remove ) {
            this.model.unlink(remove[i]);
            remove[i].remove();
        }
    }

    /**
     * Change alias in expressions on base path
     * @private
     * @param {Element|Text} node DOM node
     * @param {string} alias Alias name
     * @param {string} base Base path
     */
    dealias(node, alias, base) {
        let replace = new RegExp('(^|[^a-z])' + alias.replace(/\./g, '\\.') + '([^a-z]|$)', 'gim'),
            test = new RegExp('{{');
        if ( node instanceof Text ) {
            if ( node.nodeValue.match(replace) )
                node.nodeValue = node.nodeValue.replace(replace, '$1' + base + '$2');
            return;
        }
        let i, item, items = node.attributes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            if ( !EventeAttribute.attributes[item.name] && !item.value.match(test) )
                continue;
            if ( item.value.match(replace) )
                item.value = item.value.replace(replace, '$1' + base + '$2');
        }
        items = node.childNodes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            if (
                item instanceof Comment ||
                item instanceof HTMLBRElement ||
                item instanceof HTMLScriptElement
            )
                continue;
            this.dealias(item, alias, base);
        }
    }

};

EventeAttributeFor.priority = 99;
EventeAttribute.attributes['e-for'] = EventeAttributeFor;


/**
 * b-show and b-hide attribute class
 * @extends EventeAttribute
 */
class EventeAttributeHideShow extends EventeAttribute {

    /**
     * @inheritdoc
     */
    constructor(node, name, model) {
        super(node, name, model);
        this.type = name;
    }

    /**
     * @inheritdoc
     */
    apply() {
        if (
            ( this.type == 'e-hide' && !this.eval(this.model) ) ||
            ( this.type == 'e-show' && this.eval(this.model) )
        )
            this.node.style.display = '';
        else
            this.node.style.display = 'none';
    }

};

EventeAttribute.attributes['e-hide'] = EventeAttributeHideShow;
EventeAttribute.attributes['e-show'] = EventeAttributeHideShow;


/**
 * b-model attribute class
 * @extends EventeAttribute
 */
class EventeAttributeModel extends EventeAttribute {

    /**
     * @inheritdoc
     */
    constructor(node, name, model) {
        super(node, name, model);
    }

    /**
     * @inheritdoc
     */
    apply() {
        let value = this.eval(this.model);
        if ( value !== undefined )
            value = typeof value !== 'object' ? value.toString() : JSON.stringify(value);
        else
            value = '';
        if (
            this.node instanceof HTMLInputElement ||
            this.node instanceof HTMLButtonElement ||
            this.node instanceof HTMLTextAreaElement ||
            this.node instanceof HTMLSelectElement
        ) {
            if ( this.node.value != value )
                this.node.value = value;
        } else {
            if ( this.node.textContent != value )
                this.node.textContent = value;
        }
    }

    /**
     * Get assotiated model field value
     * @returns {*}
     */
    get() {
        let value = this.eval(this.model);
        return value !== undefined ? value : '';
    }

    /**
     * Set assotiated model field value
     * @param {*} value
     */
    set(value) {
        this.model.set(this.property(this.model), value);
    }

};

EventeAttribute.attributes['e-model'] = EventeAttributeModel;



/**
 * Evente Model class
 */
class EventeModel {
    /**
     * @param {Node} node DOM Node
     * @param {Object} data Initial model data
     */
    constructor(node, data) {
        /**
         * @private
         * @type {Object}
         */
        this.shadow = { ...data, strings: EventeStrings.strings };
        /**
         * @private
         * @type {Object.<string, Object.<string, Set<Function>>>}
         */
        this.listeners = { get: {}, set: {}, delete: {} };
        /**
         * @private
         * @type {Object.<string, Set<Node>>}
         * */
        this.links = {};
        /**
         * @type {Proxy}
         */
        this.proxy = null;
        node.addEventListener('input', EventeModel.eventHander, true);
    }

    /**
     * Get model data
     * @returns {Object}
     */
    get data() {
        return this.proxy;
    }

    /**
     * Set model data
     * @param {Object} value
     */
    set data(value) {
        value.strings = EventeStrings.strings;
        this.shadow = value;
    }

    /**
     * Get model field by path
     * @param {string} property Model path
     */
    get(property) {
        return this.proxy.getField(property);
    }

    /**
     * Set model field by path
     * @param {string} property Model path
     * @param {*} value New value
     */
    set(property, value) {
        this.proxy.setField(property, value);
    }

    /**
     * Add listener of model change events
     * @param {string} event Listening evente - get, set or delete
     * @param {string} property Path in model data
     * @param {Function} listener Listener function
     */
    addListener(event, property, listener) {
        if ( !this.listeners[event] )
            return;
        if ( !this.listeners[event][property] )
            this.listeners[event][property] = new Set();
        this.listeners[event][property].add(listener);
    }

    /**
     * Add listener of model change events
     * @param {string} event Listening evente - get, set or delete
     * @param {string} property Path in model data
     * @param {Function} listener Listener function
     */
    removeListener(event, property, listener) {
        if ( this.listeners[event] && this.listeners[event][property] ) {
            this.listeners[event][property].delete(listener);
            if ( !this.listeners[event][property].size )
                delete this.listeners[event][property];
        }
    }

    /**
     * Get DOM nodes which dependent of link
     * @param {string} path Path in model data hierarchy
     * @returns {Set<Node>}
     */
    getNodes(path) {
        let i, node, nodes = new Set();
        for ( i in this.links ) {
            if ( !i.startsWith(path + '.') )
                continue;
            for ( node of this.links[i] )
                nodes.add(node);
        }
        while ( path != '' ) {
            if ( this.links[path] !== undefined ) {
                for ( node of this.links[path] )
                    nodes.add(node);
            }
            path = path.split('.').slice(0, -1).join('.');
        }
        return nodes;
    }

    /**
     * Apply node attributes values
     * @param {Node} node DOM node
     */
    applyAttributes(node) {
        if ( node.e_attributes === undefined )
            return;
        if ( node instanceof Text ) {
            // TODO
            let value = node.e_attributes[''].eval(this);
            value = value !== undefined ? value.toString() : '';
            if ( node.nodeValue !== value )
                node.nodeValue = value;
            return;
        }
        let name, attribute;
        for ( name in node.e_attributes )
            this.applyAttribute(node, name);
    }

    /**
     * Apply node attribute value
     * @param {Node} node DOM node
     * @param {string} name Atribute name
     */
    applyAttribute(node, name) {
        if ( node.e_attributes === undefined || node.e_attributes[name] === undefined )
            return;
        node.e_attributes[name].apply();
    }

    /**
     * Update dependencies of DOMnode
     * @param {Node} node DOM node
     */
    updateLinks(node) {
        var i, j, tmp,
            set = new Set();
        for ( i in node.e_attributes ) {
            tmp = node.e_attributes[i].getLinks();
            for ( j in tmp )
                set.add(tmp[j]);
        }
        tmp = node.e_links || new Set();
        for ( i of tmp ) {
            if ( !set.has(i) )
                this.unlink(node, i)
        }
        for ( i of set ) {
            if ( !tmp.has(i) )
                this.link(node, i);
        }
    }

    /**
     * Add dependency of DOM node
     * @param {Node} node DOM node
     * @param {string} property Path in model data
     */
    link(node, property) {
        if ( this.links[property] === undefined )
            this.links[property] = new Set();
        this.links[property].add(node);
        if ( node.e_links === undefined )
            node.e_links = new Set();
        node.e_links.add(property);
    }

    /**
     * Remove dependency of DOM node
     * @param {Node} node DOM node
     * @param {string} [property] Path in model data
     */
    unlink(node, property) {
        if ( property === undefined ) {
            if ( node.e_links !== undefined ) {
                for ( let link of node.e_links )
                    this.unlink(node, link);
            }
            let i, nodes = node.childNodes;
            for ( i = 0; i < nodes.length; i++ )
                this.unlink(nodes[i]);
        } else {
            if ( this.links[property] !== undefined ) {
                this.links[property].delete(node);
                if ( this.links[property].size === 0 )
                    delete this.links[property];
            }
            if ( node.e_links !== undefined ) {
                node.e_links.delete(property);
                if ( node.e_links.size === 0 )
                    delete node.e_links;
            }
        }
    }

    /**
     * Handle model data changes via DOM elements
     * @param {Event} event Event object
     */
    static eventHander(event) {
        if (
            !(event.target instanceof HTMLInputElement) &&
            !(event.target instanceof HTMLButtonElement ) &&
            !(event.target instanceof HTMLTextAreaElement) &&
            !(event.target instanceof HTMLSelectElement)
        )
            return;
        if ( event.target.e_attributes === undefined || event.target.e_attributes['e-model'] === undefined )
            return;
        let model = event.target.e_attributes['e-model'],
            value_old = model.get(),
            value_new = event.target.value;
        if ( value_old === value_new )
            return;
        model.set(value_new);
    }

}



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





/**
 * Evente HTML template parser
 */
class EventeParser {

    /**
     * Parse DOM node
     * @param {Node} node DOM node
     * @param {EventeModel} model EventeModel object
     */
    static parseNode(node, model) {
        EventeParser.parseAttributes(node, model);
        if ( node instanceof Text ) {
            model.applyAttributes(node);
            return;
        }
        let i, item, items = node.childNodes;
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            if (
                item instanceof Comment ||
                item instanceof HTMLBRElement ||
                item instanceof HTMLScriptElement
            )
                continue;
            EventeParser.parseNode(item, model);
        }
        model.applyAttributes(node);
    }

    /**
     * Parse attributes of DOM node
     * @param {Node} node DOM node
     * @param {EventeModel} model EventeModel object
     */
    static parseAttributes(node, model) {
        if ( node instanceof Text ) {
            if ( node.nodeValue.indexOf('{{') !== -1 ) {
                node.e_attributes = { '': new EventeExpression(node.nodeValue) };
                model.updateLinks(node);
            } else {
                if ( node.e_attributes === undefined )
                    delete node.e_attributes;
            }
            return;
        }
        let i, attribute, attributes = EventeAttribute.getAttributes();
        for ( i in attributes )
            EventeParser.parseAttribute(node, attributes[i].name, model);
        for ( i = 0; i < node.attributes.length; i++ ) {
            attribute = node.attributes[i];
            if ( EventeAttribute.attributes[attribute.name] === undefined )
                EventeParser.parseAttribute(node, attribute.name, model);
        }
        if ( node.e_attributes )
            model.updateLinks(node);
    }

    /**
     * Parse attribute DOM node
     * @param {Node} node DOM node
     * @param {string} name Attribute name
     * @param {EventeModel} model EventeModel object
     */
    static parseAttribute(node, name, model) {
        let value, tmp = node.attributes[name];
        if ( !tmp ) {
            if ( node.e_attributes )
                delete node.e_attributes[name];
            return;
        }
        if ( node.e_attributes && node.e_attributes[name] ) {
            let expression = '{{' + node.e_attributes[name].expression  + '}}';
            if ( expression === tmp.value )
                return;
        }
        if ( EventeAttribute.attributes[name] ) {
            value = EventeAttribute.attributes[name].check(node, name);
            if ( tmp.value !== value )
                tmp.value = value;
            tmp = new EventeAttribute.attributes[name](node, name, model);
        } else {
            if (tmp.value.indexOf('{{') === -1)
                return;
            tmp = new EventeAttribute(node, name, model);
        }
        if ( node.e_attributes === undefined )
            node.e_attributes = {};
        node.e_attributes[name] = tmp;
    }
}


const EventePipes = {

    empty: function(params) {
        return params[0] === undefined || params[0] === null ? ( params[1] ? params[1] : '' ) : ( params[2] ? params[2] : '' );
    },

    if: function(params) {
        var tmp = parseFloat(params[0]);
        if ( !isNaN(tmp) )
            params[0] = tmp;
        return params[0] ? ( params[1] ? params[1] : '' ) : ( params[2] ? params[2] : '' );
    },

    max: function(params) {
        let tmp = EventePipes.reverse(params);
        return tmp ? tmp[0] : '';
    },

    min: function(params) {
        let tmp = EventePipes.sort(params);
        return tmp ? tmp[0] : '';
    },

    reverse: function(params) {
        let tmp = EventePipes.sort(params);
        return tmp ? tmp.reverse() : '';
    },

    sort: function(params) {
        if ( params[0] === undefined || params[0] === null )
            return '';
        let values = params[0] instanceof Array ? params[0].slice() : params[0].keys;
        if ( values === undefined )
            return '';
        return values.sort();
    },

}


/**
 * Evente Resource class
 */
class EventeResource {

    /**
     * @param {string} url Resource URL
     * @param {string} [type=json] Resource content type 
     */
    constructor(url, type) {
        this.url = url;
        this.type = type || 'json';
    }

    /**
     * Send GET request
     * @param {Object} params Request parameters
     * @returns {Promise}
     */
    get(params) {
        return this.method('get', params);
    }

    /**
     * Send POST request
     * @param {Object} params Request parameters
     * @returns {Promise}
     */
    post(params) {
        return this.method('post', params);
    }

    /**
     * Send PUT request
     * @param {Object} params Request parameters
     * @returns {Promise}
     */
    put(params) {
        return this.method('put', params);
    }

    /**
     * Send DELETE request
     * @param {Object} params Request parameters
     * @returns {Promise}
     */
    delete(params) {
        return this.method('delete', params);
    }

    /**
     * Execute request method
     * @private
     * @param {string} method Method type
     * @param {Object} [params={}] Request parameters
     * @param {Object} [headers=EventeResource.headers] Request headers
     * @returns {Promise}
     */
    method(method, params, headers) {
        params = params || {};
        if ( params.constructor.name === 'Proxy' )
            params = params.clone();
        let url = this.url.replace(/\/:([-_0-9a-z]+)(\/|$)/ig, (match, param, end) => {
            let tmp = params[param] || '';
            delete params[param];
            return '/' + tmp + end;
        });
        /** @type {RequestInit} */
        let options = { mode: 'cors', method: method, headers: new Headers(headers || EventeResource.headers) };
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
                case 'json': return response.json();
                case 'form': return response.formData();
                case 'text': return response.text();
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

/**
 * Default headers
 * @type {Object}
 * @default {}
 */
EventeResource.headers = {};

/**
 * Evente Router class
 */
class EventeRouter {

    /**
     * 
     * @param {Node} node 
     */
    constructor(node) {
        EventeRouter.routers.push(this);
        this.routes = {};
        this.node = node;
        this.node.addEventListener('click', EventeRouter.clickHander, true);
    }

    /**
     * Add route
     * @param {string} route Route pattern
     * @param {Function} callback Callback function
     * @param {*} params Parameters passed to callback function
     */
    add(route, callback, params) {
        route = this.normalize(route);
        this.routes[route] = {
            parts: route.split('/'),
            callback: callback,
            params: params || {},
        };
    }

    /**
     * Remove route
     * @param {string} route Route pattern
     */
    remove(route) {
        route = this.normalize(route);
        delete this.routes[route];
    }

    /**
     * Trigger route handling
     * @param {string} route Route
     * @param {boolean} push Flag to push route in history
     */
    trigger(route, push) {
        if ( route === undefined )
            route = location.pathname;
        this.handle(route, push);
    }

    /**
     * Handle route change
     * @param {string} route Route
     * @param {boolean} push Flag to push route in history
     * @returns {boolean}
     */
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

    /**
     * Normalize route form
     * @param {string} route Route
     * @returns {string}
     */
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

    /**
     * Get router by DOM node
     * @param {Node} node DOM node
     * @returns {EventeRouter}
     */
    static getRouter(node) {
        for ( let i in EventeRouter.routers ) {
            let router = EventeRouter.routers[i];
            if ( router.node === node || router.node.contains(node) )
                return router;
        }
    }

    /**
     * Handle clck event
     * @param {Event} event Event object
     */
    static clickHander(event) {
        let target = event.target;
        while ( !(target instanceof HTMLAnchorElement) ) {
            target = target.parentNode;
            if ( target instanceof HTMLDocument )
                return;
        }
        let router = EventeRouter.getRouter(target);
        if ( !router )
            return;
        let route = target.getAttribute('href');
        if ( route && router.handle(route, true) )
            event.preventDefault();
    }

    /**
     * Handle URL change
     */
    static popstateHandler() {
        for ( let i in EventeRouter.routers )
        EventeRouter.routers[i].handle(location.href);
    }

}

EventeRouter.routers = [];
window.addEventListener('popstate', EventeRouter.popstateHandler);

/**
 * Class for operations with DOM JQuery-like way
 * @extends Array
 */
class EventeSelector extends Array {

    constructor(options, selector) {
        super();
        if ( options !== undefined ) {
            switch (options.constructor.name) {
                case 'String':
                    if ( options.length > 0 )
                        this.push(...document.querySelectorAll(options));
                break;
                case 'Array':
                    this.push(...options);
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
                    result.push(...this[i].querySelectorAll(options.selector));
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
                return new EventeSelector(result, this);
            case 'hasClass':
            case 'is':
                return options.all === true ? true : false;
            default:
                return result.length > 1 ? result : result[0];
        }
    }

};

if ( typeof $ === 'undefined' )
    var $ = function(selector) { return new EventeSelector(selector); }

/**
 * Evente Strings class
 */
class EventeStrings {

    /**
     * Get index of string
     * @param {string} string String to get index
     * @returns {number}
     */
    static getIndex(string) {
        var index = EventeStrings.strings.indexOf(string);
        if ( index === -1 ) {
            EventeStrings.strings.push(string);
            index = EventeStrings.strings.indexOf(string);
        }
        return index;
    }

}

EventeStrings.strings = [];


