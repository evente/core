if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Fetch = class Fetch {

    constructor(params) {}

    static http(params) {
        let url = '/';
        let options = {};
        let type = 'text';
        if ( typeof params === 'string' )
            url = params;
        if ( typeof params === 'object' ) {
            if ( params.url !== undefined )
                url = params.url;
            if ( params.type !== undefined )
                type = params.type;
        }
        return fetch(url, options).then((response) => {
            switch ( type ) {
                case 'json':    return response.json();
                case 'form':    return response.formData();
                default:        return response.text();
            }
        });
    }

    static getJson(url, options) {
        return fetch(url, options).then((response) => {
            return response.json();
        });
    }

}
