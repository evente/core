var rc = function(selector){
    return new rc.Selector(selector);
}

rc.attributes = {};
rc.models = [];
rc.routers = [];
rc.strings = [];
rc.pipes = {
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
        let tmp = rc.pipes.sort(params);
        return tmp ? tmp.reverse() : '';
    },
    min: function(params) {
        let tmp = rc.pipes.sort(params);
        return tmp ? tmp[0] : '';
    },
    max: function(params) {
        let tmp = rc.pipes.reverse(params);
        return tmp ? tmp[0] : '';
    }
}

rc._attributes = [];
rc.__proto__.getAttributes = () => {
    if ( rc._attributes.length !== Object.keys(rc.attributes).length ) {
        let tmp = [];
        for ( let i in rc.attributes )
            tmp.push({ name: i, priority: rc.attributes[i].priority});
        tmp.sort((a,b) => {
            if ( a.priority > b.priority )
                return -1;
            if ( a.priority < b.priority )
                return 1;
            return 0;
        })
        rc._attributes = tmp;
    }
    return rc._attributes;
}

rc.__proto__.getModel = function(node) {
    for ( var i in this.models ) {
        if ( this.models[i].selector.contains(node) )
            return this.models[i];
    }
}

rc.__proto__.getRouter = function(node) {
    for ( var i in this.routers ) {
        if ( this.routers[i].selector.contains(node) )
            return this.routers[i];
    }
}

rc.__proto__.getStringIndex = function(string) {
    var index = rc.strings.indexOf(string);
    if ( index === -1 ) {
        rc.strings.push(string);
        index = rc.strings.indexOf(string);
    }
    return index;
}

rc.__proto__.route = function() {
    for ( let i in rc.routers )
        rc.routers[i].handle(location.href);
}

if ( typeof b === 'undefined' )
    var b = rc;
if ( typeof $ === 'undefined' )
    var $ = rc;

if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' ) {
    module.exports = rc;
} else {
    window.addEventListener('popstate', rc.route);
}
