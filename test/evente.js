const evente = require('../src/Evente');
const EventeResource = require('../src/EventeResource');

document.body.innerHTML =
    '<div></div>';

describe('General', () => {

    test('Variable evente has to be function', () => {
        expect(typeof evente).toBe('function');
    });

    test('Get regised pipes', () => {
        expect(typeof evente.pipes).toBe('object');
    });

    test('Create Resource using evente.resource', () => {
        let resource = evente.resource('http://localhost');
        expect(resource instanceof EventeResource).toBe(true);
    });

});
