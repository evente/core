if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.App = class App extends bjs.Model {

    constructor(selector, model) {
        super(selector, model);
    }

};
