var bjs = function(selector){
    return new bjs.Selector(selector);
}

bjs.attributes = {};
bjs.models = [];
bjs.routers = [];
bjs.strings = [];
bjs.pipes = {
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
        let tmp = bjs.pipes.sort(params);
        return tmp ? tmp.reverse() : '';
    },
    min: function(params) {
        let tmp = bjs.pipes.sort(params);
        return tmp ? tmp[0] : '';
    },
    max: function(params) {
        let tmp = bjs.pipes.reverse(params);
        return tmp ? tmp[0] : '';
    }
}

bjs._attributes = [];
bjs.__proto__.getAttributes = () => {
    if ( bjs._attributes.length !== Object.keys(bjs.attributes).length ) {
        let tmp = [];
        for ( let i in bjs.attributes )
            tmp.push({ name: i, priority: bjs.attributes[i].priority});
        tmp.sort((a,b) => {
            if ( a.priority > b.priority )
                return -1;
            if ( a.priority < b.priority )
                return 1;
            return 0;
        })
        bjs._attributes = tmp;
    }
    return bjs._attributes;
}

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
    window.addEventListener('popstate', bjs.route);
}
