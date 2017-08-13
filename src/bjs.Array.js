if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Array = class extends Array {

    constructor() {
        super();
    }

};
