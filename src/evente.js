var evente = function(selector) {
    return new evente.Selector(selector);
}

evente.attributes = {};
evente.models = [];
evente.routers = [];
evente.strings = [];
evente.pipes = {
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
        let tmp = evente.pipes.sort(params);
        return tmp ? tmp.reverse() : '';
    },
    min: function(params) {
        let tmp = evente.pipes.sort(params);
        return tmp ? tmp[0] : '';
    },
    max: function(params) {
        let tmp = evente.pipes.reverse(params);
        return tmp ? tmp[0] : '';
    }
}

evente._attributes = [];
evente.__proto__.getAttributes = () => {
    if ( evente._attributes.length !== Object.keys(evente.attributes).length ) {
        let tmp = [];
        for ( let i in evente.attributes )
            tmp.push({ name: i, priority: evente.attributes[i].priority});
        tmp.sort((a,b) => {
            if ( a.priority > b.priority )
                return -1;
            if ( a.priority < b.priority )
                return 1;
            return 0;
        })
        evente._attributes = tmp;
    }
    return evente._attributes;
}

evente.__proto__.getModel = function(node) {
    for ( var i in this.models ) {
        if ( this.models[i].selector.contains(node) )
            return this.models[i];
    }
}

evente.__proto__.getRouter = function(node) {
    for ( var i in this.routers ) {
        if ( this.routers[i].selector.contains(node) )
            return this.routers[i];
    }
}

evente.__proto__.getStringIndex = function(string) {
    var index = evente.strings.indexOf(string);
    if ( index === -1 ) {
        evente.strings.push(string);
        index = evente.strings.indexOf(string);
    }
    return index;
}

evente.__proto__.route = function() {
    for ( let i in evente.routers )
        evente.routers[i].handle(location.href);
}

if ( typeof module !== 'undefined' ) {
    module.exports = evente;
} else {
    if ( typeof e === 'undefined' )
        var e = evente;
    if ( typeof $ === 'undefined' )
        var $ = evente;
    window.addEventListener('popstate', evente.route);
}
