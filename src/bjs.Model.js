bjs.Model = class Model {

    constructor(selector, model) {
        this.selector = new bjs.Selector(selector);
        this.model = model || {};
        let elements = this.selector.find('[data-model]');
        let element, prop, value;
        for ( let i = 0; i < elements.length; i++ ) {
            element = bjs(elements[i]);
            prop = element.attr('data-model');
            value = this.model.getProperty(prop);
            if ( value !== undefined ) {
                element.text(value);
            }
        }
    }

}
