if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Expression = class Expression {

    constructor(string) {
        this._parse(string);
    }

    eval(model) {
        let i, part, value = '';
        for ( i in this.parts ) {
            part = this.parts[i];
            switch (part.type) {
                case 'string': value += part.value;            break;
                case 'value':  value += model.get(part.value); break;
            }
        }
        return value;
    }

    getLinks() {
        let i, part, links = [];
        for ( i in this.parts ) {
            part = this.parts[i];
            if ( part.type === 'value' )
                links.push(part.value);
        }
        return links;
    }

    _parse(string) {
        this.parts = [];
        let property,
            pos = 0,
            regexp = bjs.Expression.regexp.exec(string);
        while ( regexp ) {
            if ( regexp.index !== pos ) {
                this.parts.push({ 'type': 'string', 'value': string.substr(pos, regexp.index - pos) });
                pos = regexp.index;
            }
            property = regexp[0].substr(2, regexp[0].length - 4).trim();
            this.parts.push({ 'type': 'value', 'value': property });
            pos += regexp[0].length;
            regexp = bjs.Expression.regexp.exec(string);
        }
        if ( pos && pos < string.length )
            this.parts.push({ 'type': 'string', 'value': string.substr(pos) });
    }

};

bjs.Expression.regexp = /{{.*?}}/gm;
