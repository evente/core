const EventeModel = require('./EventeModel');
const EventePipes = require('./EventePipes');
const EventeStrings = require('./EventeStrings');

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

module.exports = EventeExpression;
