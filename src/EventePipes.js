const EventePipes = {

    empty: function(params) {
        return params[0] === undefined || params[0] === null ? ( params[1] ? params[1] : '' ) : ( params[2] ? params[2] : '' );
    },

    if: function(params) {
        var tmp = parseFloat(params[0]);
        if ( !isNaN(tmp) )
            params[0] = tmp;
        return params[0] ? ( params[1] ? params[1] : '' ) : ( params[2] ? params[2] : '' );
    },

    max: function(params) {
        let tmp = EventePipes.reverse(params);
        return tmp ? tmp[0] : '';
    },

    min: function(params) {
        let tmp = EventePipes.sort(params);
        return tmp ? tmp[0] : '';
    },

    reverse: function(params) {
        let tmp = EventePipes.sort(params);
        return tmp ? tmp.reverse() : '';
    },

    sort: function(params) {
        if ( params[0] === undefined || params[0] === null )
            return '';
        let values = params[0] instanceof Array ? params[0].slice() : params[0].keys;
        if ( values === undefined )
            return '';
        return values.sort();
    },

}

module.exports = EventePipes;
