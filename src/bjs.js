'use strict';

//bjs.prototype.ajax = function() {}
//bjs.prototype.get = function() {}
//bjs.prototype.post = function() {}

var bjs = function(selector){
    return new bjs.Selector(selector);
}
bjs.__proto__.get = function() { return 'get'; }

if ( typeof b === 'undefined' )
    var b = bjs;
if ( typeof $ === 'undefined' )
    var $ = bjs;

if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' ) {
    module.exports = bjs;
} else {
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            let tmp;
            for ( let i = 0; i < mutation.removedNodes.length; i++ ) {
                tmp = mutation.removedNodes[i];
                if ( tmp.constructor.name === 'Text' )
                    continue;
                if ( tmp._b_model !== undefined )
                    tmp._b_model._unlink(tmp);
                tmp = tmp.querySelectorAll('[b-linked]');
                for ( let j = 0; j < tmp.length; j++ ) {
                    if ( tmp[j]._b_model !== undefined )
                        tmp[j]._b_model._unlink(tmp[j]);
                }
            }
        });
    });
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
}
