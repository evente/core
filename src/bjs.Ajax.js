if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Ajax = class Ajax {

    constructor(options) {
        this.options = Object({
            async: true,
            method: 'GET',
            open: true,
            timeout: 3000,
            url: ''
        }, options);
        this.xhr = new XMLHttpRequest();
        this.xhr.open(this.options.method, this.options.url, this.options.async);
    }

};
