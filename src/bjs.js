'use strict';

let bjs = function(selector) {
    if ( selector !== undefined )
        return new bjs.Selector(selector);
}
