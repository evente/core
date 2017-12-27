'use strict';

var bjs = function(selector){
    return new bjs.Selector(selector);
}

bjs.models = [];

bjs.__proto__.getModel = function(node) {
    for ( let i in this.models ) {
        if ( this.models[i].selector.contains(node) )
            return this.models[i];
    }
}

bjs.__proto__.observe = function(mutations) {
    let mutation, tmp, model, i, j;
    for ( i in mutations ) {
        mutation = mutations[i];
        for ( j = 0; j < mutation.removedNodes.length; j++ ) {
            tmp = mutation.removedNodes[j];
            model = tmp._b_model || bjs.getModel(tmp);
            if ( model )
                model._unlink(tmp);
        }
    }
}

if ( typeof b === 'undefined' )
    var b = bjs;
if ( typeof $ === 'undefined' )
    var $ = bjs;

if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' ) {
    module.exports = bjs;
} else {
    var observer = new MutationObserver(bjs.observe);
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
