'use strict'

bjs.Selector = class Selector extends bjs.Array {

    constructor(options, selector) {
        super();
        switch (typeof options) {
            case 'string':
                this.$ = bjs.Selector.$(options);
                break;
            case 'object':
                this.$ = options;
                break;
        }
        this.selector = selector;
    }

    static $(selector) {
        return Array.prototype.slice.call(
            document.querySelectorAll(selector)
        );
    }

    addClass(classes) {
        if ( typeof classes == 'string' )
            classes = classes.split(' ');
        for ( let i = 0; i < this.$.length; i++ ) {
            for ( let j = 0; j < classes.length; j++ ) {
                this.$[i].classList.add(classes[j]);
            }
        }
        return this;
    }

    end() {
        return this.selector;
    }

    get(index) {
        return this.$[index];
    }

    hasClass(className, all) {
        let tmp;
        for ( let i = 0; i < this.$.length; i++ ) {
            tmp = this.$[i].classList.contains(className);
            if ( all !== true ) {
                if ( tmp ) return true;
            } else {
                if ( !tmp ) return false;
            }
        }
        return all === true ? true : false;
    }

    find(selector) {
        let nodes = [];
        let tmp;
        for ( let i = 0; i < this.$.length; i++ ) {
            tmp = this.$[i].querySelectorAll(selector);
            for ( let i = 0; i < tmp.length; i++ ) {
                nodes.push(tmp[i]);
            }
        }
        return new bjs.Selector(nodes, this);
    }

    parent() {
        if ( this.$.length > 1 ) {
            let parents = [];
            for ( let i = 0; i < this.$.length; i++ ) {
                parents.push(this.$[i].parentNode);
            }
            return new bjs.Selector(parents, this);
        } else if ( this.$.length == 1 ) {
            return new bjs.Selector(this.$[0].parentNode, this);
        }
    }

    removeClass(classes) {
        if ( typeof classes == 'string' )
            classes = classes.split(' ');
        for ( let i = 0; i < this.$.length; i++ ) {
            for ( let j = 0; j < classes.length; j++ ) {
                this.$[i].classList.remove(classes[j]);
            }
        }
        return this;
    }

    toggleClass(classes, active) {
        if ( typeof classes == 'string' )
            classes = classes.split(' ');
        for ( let i = 0; i < this.$.length; i++ ) {
            for ( let j = 0; j < classes.length; j++ ) {
                this.$[i].classList.toggle(classes[j], active);
            }
        }
        return this;
    }

};
