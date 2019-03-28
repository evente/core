var evente = require('./evente.js');

evente.AttributeHideShow = class extends evente.Attribute {

    constructor(node, name, model) {
        super(node, name, model);
        this.type = name;
    }

    apply() {
        if (
            ( this.type == 'e-hide' && !this.eval(this.model) ) ||
            ( this.type == 'e-show' && this.eval(this.model) )
        )
            this.node.style.display = '';
        else
            this.node.style.display = 'none';
    }

};

evente.attributes['e-hide'] = evente.AttributeHideShow;
evente.attributes['e-show'] = evente.AttributeHideShow;
