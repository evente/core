if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var bjs = require('./bjs.js');

bjs.AttributeHideShow = class AttributeHideShow extends bjs.Attribute {

    constructor(node, name, model) {
        super(node, name, model);
        this.type = name;
    }

    apply() {
        if (
            ( this.type == 'b-hide' && !this.eval(this.model) ) ||
            ( this.type == 'b-show' && this.eval(this.model) )
        )
            this.node.style.display = '';
        else
            this.node.style.display = 'none';
    }

};

bjs.attributes['b-hide'] = bjs.AttributeHideShow;
bjs.attributes['b-show'] = bjs.AttributeHideShow;
