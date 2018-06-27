Object.defineProperty(
    Object.prototype,
    'getProperty',
    {
        value: function(field) {
            if ( field === '' )
                return this;
            let i,
                ref = this,
                path = field.toString().split('.'),
                len = path.length;
            for ( i = 0; i < len; i++ ) {
                if ( ref[ path[i] ] !== undefined )
                    ref = ref[ path[i] ];
                else
                    return undefined;
            }
            return ref;
        }
    }
);

Object.defineProperty(
    Object.prototype,
    'setProperty',
    {
        value: function(field, value) {
            let i,
                ref = this,
                path = field.toString().split('.'),
                len = path.length;
            for ( i = 0; i < len - 1; i++  ) {
                if ( ref[ path[i] ] === undefined  )
                    ref[ path[i] ] = {};
                ref = ref[ path[i] ];
            }
            ref[ path[len - 1] ] = value;
        }
    }
);
