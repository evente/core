if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Expression = class Expression {

    constructor(string) {
        bjs.expressions.push(this);
        this._tree = this._parse(string.trim());
    }

    eval(model, item) {
        if ( item === undefined )
            item = this._tree;
        let value, tmp, number, type = typeof item;
        switch ( type ) {
            case 'string':
                value = model.get(item);
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
                            if ( (value === undefined || typeof value === 'number') && typeof tmp !== 'number' ) {
                                number = parseFloat(tmp);
                                if ( !isNaN(number) )
                                    tmp = number;
                            }
                            if ( value === undefined ) {
                                value = tmp;
                                continue;
                            }
                            value = bjs.Expression.operations[item.type].func(value, tmp);
                        }
                    break;
                    case 'value':
                        value = this.eval(model, item.params[0]);
                    break;
                    case 'property':
                        value = this.eval(model, item.params[0]);
                        value = value !== undefined ? value.getProperty(item.params[1]) : undefined;
                    break;
                    case 'index':
                        value = model.get(item.params[0] + '.' + this.eval(model, item.params[1]));
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

    getLinks(item) {
        if ( item === undefined )
            item = this._tree;
        let param, type, links = [];
        for ( let i in item.params ) {
            param = item.params[i];
            type = typeof param;
            switch ( type ) {
                case 'number':
                break;
                case 'string':
                    if ( param.endsWith('.length') ) {
                        links.push( param.substr(0, param.length - 7) );
                        continue;
                    }
                    if ( param.endsWith('.keys') ) {
                        links.push( param.substr(0, param.length - 5) );
                        continue;
                    }
                    links.push( param );
                break;
                default:
                    links.push.apply( links, this.getLinks(param) );
            }
        }
        return links;
    }

    _parse(data) {
        data = this._parse_unclosed(data);
        data = this._parse_strings(data);
        data = this._parse_tokens(data);
        return this._parse_tree(data);
    }

    _parse_unclosed(string) {
        let pos = 0,
            tmp_string = '',
            tmp,
            match,
            reg_exp = /{{.*?}}/gm,
            reg_token = /[-+*/[\]()|:]/gm;
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
        tmp = string.substr(pos).trim();
        if ( tmp.length )
            tmp_string += 'strings.' + bjs.getStringIndex(tmp);
        if ( tmp_string.endsWith(' + ') )
            tmp_string = tmp_string.substr(0, tmp_string.length - 3);
        if ( tmp_string.startsWith('(') && tmp_string.endsWith(')') )
            tmp_string = tmp_string.substr(1, tmp_string.length - 2);
        return tmp_string;
    }

    _parse_strings(string) {
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
            result += string.substr(pos).trim();
        return result;
    }

    _parse_tokens(string) {
        let pos = 0,
            tmp,
            match,
            reg_token = /[-+*/[\]()|:]/gm,
            tokens = [];
        pos = 0;
        reg_token.lastIndex = 0;
        match = reg_token.exec(string);
        while ( match ) {
            if ( match.index !== pos ) {
                tmp = string.substr(pos, match.index - pos).trim();
                if ( tmp.length ) {
                    tokens.push( string.substr(pos, match.index - pos).trim() );
                }
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

    _parse_tree(tokens, item) {
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
                    if ( item.type === undefined ) {
                        item.type = token;
                        continue;
                    }
                    if ( item.type === token ) {
                        if ( bjs.Expression.operations[item.type].priority > bjs.Expression.operations[token].priority )
                            item = { type: token, params: [ item ] };
                        if ( bjs.Expression.operations[item.type].priority < bjs.Expression.operations[token].priority )
                            item.params.push(this._parse_tree(
                                tokens,
                                { type: token, params: [ item.params.pop() ] }
                            ));
                    } else {
                        item.params.push(this._parse_tree(
                            tokens,
                            { type: token, params: [ item.params.pop() ] }
                        ));
                    }
                break;
                case '(':
                    item.params.push(this._parse_tree(tokens));
                break;
                case ')':
                    return item;
                break;
                case '[':
                    item.params.push( { type: 'index', params: [ item.params.pop(), this._parse_tree(tokens) ] } );
                break;
                case ']':
                    if ( item.type === undefined )
                        item.type = 'value';
                    return item;
                break;
                case '|':
                    if ( item.type !== undefined )
                        item = { params: [ item ] };
                    item.type = 'filter';
                    item.name = tokens.shift();
                    token = tokens.shift();
                    while ( token === ':' ) {
                        item.params.push( this._parse_tree(tokens) );
                        token = tokens.shift();
                    }
                    tokens.unshift(token);
                    return item;
                break;
                case ':':
                    tokens.unshift(token);
                    if ( !item.params.length )
                        return '';
                    if ( item.type === undefined )
                        item.type = 'value'
                    return item;
                break;
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
    '/': { priority: 1, func: function(a, b) { return a / b; } }
};