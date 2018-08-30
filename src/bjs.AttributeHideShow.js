if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.AttributeHideShow = class AttributeHideShow extends bjs.Attribute {

    constructor(node, attribute) {
        super(node, attribute);
        this.type = attribute.name;
    }

    eval(node) {
        if ( this.display === undefined )
            this.display = node.style.display;
        if (
            ( this.type == 'b-hide' && !this.expression.eval(node.b_model) ) ||
            ( this.type == 'b-show' && this.expression.eval(node.b_model) )
        ) {
            node.style.display = this.display;
            delete this.display;
        } else
            node.style.display = 'none';
    }

};

bjs.attributes['b-hide'] = bjs.AttributeHideShow;
bjs.attributes['b-show'] = bjs.AttributeHideShow;
