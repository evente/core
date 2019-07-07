/**
 * Evente Resource class
 */
class EventeResource {

    /**
     * @param {string} url Resource URL
     * @param {string} [type=json] Resource content type 
     */
    constructor(url, type) {
        this.url = url;
        this.type = type || 'json';
    }

    /**
     * Send GET request
     * @param {Object} params Request parameters
     * @returns {Promise}
     */
    get(params) {
        return this.method('get', params);
    }

    /**
     * Send POST request
     * @param {Object} params Request parameters
     * @returns {Promise}
     */
    post(params) {
        return this.method('post', params);
    }

    /**
     * Send PUT request
     * @param {Object} params Request parameters
     * @returns {Promise}
     */
    put(params) {
        return this.method('put', params);
    }

    /**
     * Send DELETE request
     * @param {Object} params Request parameters
     * @returns {Promise}
     */
    delete(params) {
        return this.method('delete', params);
    }

    /**
     * Execute request method
     * @private
     * @param {string} method Method type
     * @param {Object} [params={}] Request parameters
     * @param {Object} [headers=EventeResource.headers] Request headers
     * @returns {Promise}
     */
    method(method, params, headers) {
        params = params || {};
        if ( params.constructor.name === 'Proxy' )
            params = params.clone();
        let url = this.url.replace(/\/:([-_0-9a-z]+)(\/|$)/ig, (match, param, end) => {
            let tmp = params[param] || '';
            delete params[param];
            return '/' + tmp + end;
        });
        /** @type {RequestInit} */
        let options = { mode: 'cors', method: method, headers: new Headers(headers || EventeResource.headers) };
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
                case 'json': return response.json();
                case 'form': return response.formData();
                case 'text': return response.text();
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

/**
 * Default headers
 * @type {Object}
 * @default {}
 */
EventeResource.headers = {};

module.exports = EventeResource;
