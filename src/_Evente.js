const EventeApplication = require('./EventeApplication');
const EventePipes = require('./EventePipes');
const EventeResource = require('./EventeResource');

/**
 * Create new Evente application
 * @param {string} selector Selector for application root element
 * @param {*} [data={}] Initial data
 * @param {Object} [options] Aplication creation options
 * @param {boolean} [options.clean=false] Remove Comment and empty Text nodes from DOM
 * @param {boolean} [options.router=true] Use router
 * @param {boolean} [options.run=true] Run immediately after create
 * @returns {EventeApplication}
 */
const evente = function(selector, data, options) {
    return new EventeApplication(selector, data, options);
};

/**
 * Get registered pipes
 * @returns {EventePipes}
 */
Object.defineProperty(evente, 'pipes', {
    get: function() { return EventePipes; }
});

/**
 * Create EventeResource instance
 * @param {string} url Resource URL
 * @param {string} [type=json] Resource content type
 * @returns {EventeResource}
 */
evente.resource = function(url, type) {
    return new EventeResource(url, type);
}

module.exports = evente;
