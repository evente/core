var bjs = function(selector){
    return new bjs.Selector(selector);
}

bjs.strings = [];
bjs.models = [];
bjs.routers = [];
bjs.filters = {
    empty: function(params) {
        return params[0] === undefined || params[0] === null ? ( params[1] ? params[1] : '' ) : ( params[2] ? params[2] : '' );
    },
    if: function(params) {
        var tmp = parseFloat(params[0]);
        if ( !isNaN(tmp) )
            params[0] = tmp;
        return params[0] ? ( params[1] ? params[1] : '' ) : ( params[2] ? params[2] : '' );
    },
    sort: function(params) {
        if ( params[0] === undefined || params[0] === null )
            return '';
        let values = params[0] instanceof Array ? params[0].slice() : params[0].keys;
        if ( values === undefined )
            return '';
        return values.sort();
    },
    reverse: function(params) {
        let tmp = bjs.filters.sort(params);
        return tmp ? tmp.reverse() : '';
    },
    min: function(params) {
        let tmp = bjs.filters.sort(params);
        return tmp ? tmp[0] : '';
    },
    max: function(params) {
        let tmp = bjs.filters.reverse(params);
        return tmp ? tmp[0] : '';
    }
}
bjs.attributes = {};

bjs.__proto__.getModel = function(node) {
    for ( var i in this.models ) {
        if ( this.models[i].selector.contains(node) )
            return this.models[i];
    }
}

bjs.__proto__.getRouter = function(node) {
    for ( var i in this.routers ) {
        if ( this.routers[i].selector.contains(node) )
            return this.routers[i];
    }
}

bjs.__proto__.getStringIndex = function(string) {
    var index = bjs.strings.indexOf(string);
    if ( index === -1 ) {
        bjs.strings.push(string);
        index = bjs.strings.indexOf(string);
    }
    return index;
}

bjs.__proto__.observe = function(mutations) {
    var mutation, tmp, model, i, j;
    for ( i in mutations ) {
        mutation = mutations[i];
        for ( j = 0; j < mutation.removedNodes.length; j++ ) {
            tmp = mutation.removedNodes[j];
            model = bjs.getModel(tmp);
            if ( model )
                model.unlink(tmp);
        }
        for ( j = 0; j < mutation.addedNodes.length; j++ ) {
            tmp = mutation.addedNodes[j];
            model = bjs.getModel(tmp);
            if ( model )
                model.parse_node(tmp);
        }
    }
}

bjs.__proto__.route = function() {
    for ( let i in bjs.routers )
        bjs.routers[i].handle(location.href);
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
    window.addEventListener('popstate', bjs.route);
}
