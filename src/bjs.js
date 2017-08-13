'use strict';

var bjs = function(selector) {
    return new bjs.Selector(selector);
}

var $ = bjs;

if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    module.exports = bjs;
