if ( typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' )
    var rc = require('./rc.js');

rc.AttributeHideShow = class AttributeHideShow extends rc.Attribute {

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

rc.attributes['b-hide'] = rc.AttributeHideShow;
rc.attributes['b-show'] = rc.AttributeHideShow;
