'use strict';

var bjs = function(selector) {
    if ( selector !== undefined )
        return new bjs.Selector(selector);
}

var $ = bjs;

if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    module.exports = bjs;

// Object extensions
Object.prototype.getProperty = function(field) {
    let ref = this;
    let path = field.split('.');
    let len = path.length;
    for ( let i = 0; i < len; i++ ) {
        if ( ref[ path[i] ] !== undefined )
            ref = ref[ path[i] ];
        else
            return undefined;
    }
    return ref;
}
Object.prototype.setProperty = function(field, value) {
    let ref = this;
    let path = field.split('.');
    let len = path.length;
    for ( let i = 0; i < len - 1; i++  ) {
        if ( ref[ path[i] ] === undefined  ) {
            ref[ path[i] ] = isNaN(parseInt(path[i+1], 10)) ? {} : [];
        }
        ref = ref[ path[i] ];
    }
    ref[ path[len - 1] ] = value;
}
