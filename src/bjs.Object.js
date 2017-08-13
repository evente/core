if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Object = class extends Object {

    constructor() {
        super();
    }

};
