/**
 * Evente Strings class
 */
class EventeStrings {

    /**
     * Get index of string
     * @param {string} string String to get index
     * @returns {number}
     */
    static getIndex(string) {
        var index = EventeStrings.strings.indexOf(string);
        if ( index === -1 ) {
            EventeStrings.strings.push(string);
            index = EventeStrings.strings.indexOf(string);
        }
        return index;
    }

}

EventeStrings.strings = [];

module.exports = EventeStrings;
