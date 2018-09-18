if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.Resource = class Resource {

    constructor(url, type) {
        this.url = url;
        this.type = type || 'json';
    }

    get(params) {
        return this.method('get', params);
    }

    post(params) {
        return this.method('post', params);
    }

    put(params) {
        return this.method('put', params);
    }

    delete(params) {
        return this.method('delete', params);
    }

    method(method, params) {
        params = params || {};
        let url = this.url.replace(/\/:([-_0-9a-z]+)(\/|$)/ig, (match, param, end) => {
                let tmp = params[param] || '';
                delete params[param];
                return '/' + tmp + end;
            }),
            options = { mode: 'cors', method: method };
        switch ( method ) {
            case 'get':
            case 'delete':
                let key, tmp = [];
                for ( key in params )
                    tmp.push(key + '=' + encodeURIComponent(params[key]));
                url += '?' + tmp.join('&');
                break;
            case 'post':
            case 'put':
                options.body = JSON.stringify(params);
                break;
        }
        if ( ['post', 'put'].indexOf(method) !== -1 )
            options.body = JSON.stringify(params);
        return fetch(url, options).then(response => {
            this.ok = response.ok;
            this.status = response.status;
            switch ( this.type ) {
                case 'json': return response.json();     break;
                case 'form': return response.formData(); break;
                default:     return response.text();
            }
        }).then(response => {
            if ( !this.ok ) {
                let error = new Error();
                error.status = this.status;
                error.data = response;
                throw error;
            }
            return response;
        });
    }

}
