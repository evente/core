bjs.Array = class Array extends bjs.Object {

    constructor() {
        super();
        return new Proxy(this, bjs.Array.handler);
    }

    static get(obj, field) {
        if ( !isNaN(parseInt(field)) )
            return obj.$[field];
        return obj[field];
    }

};

bjs.Array.handler = {
    get: bjs.Array.get
}
