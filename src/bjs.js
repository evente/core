'use strict';

let bjs = function(selector) {
    if ( selector !== undefined )
        return new bjs.Selector(selector);
}

let $ = bjs;

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
Object.prototype.setProperty = function(field, value, create) {
    let ref = this;
    let path = field.split('.');
    let len = path.length;
    create = create !== undefined ? create : true;
    for ( let i = 0; i < len - 1; i++  ) {
        if ( ref[ path[i] ] === undefined  ) {
            if ( !create ) return;
            ref[ path[i] ] = isNaN(parseInt(path[i+1])) ? {} : [];
        }
        ref = ref[ path[i] ];
    }
    if ( ref[ path[len - 1] ] === undefined && !create )
        return;
    ref[ path[len - 1] ] = value;
}
