if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Expression = class Expression {

    constructor(string) {
		this._parse(string);
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