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
        return this._class('add', classes);
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

    html(html) {
        if ( html !== undefined ) {
            for ( let i = 0; i < this.$.length; i++ ) {
                this.$[i].innerHTML = html;
            }
            return this;
        } else {
            if ( this.$.length > 1 ) {
                let htmls = [];
                for ( let i = 0; i < this.$.length; i++ ) {
                    htmls.push(this.$[i].innerHTML);
                }
                return htmls;
            } else if ( this.$.length == 1 ) {
                return this.$[0].innerHTML;
            }
        }
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
        return this._class('remove', classes);
    }

    text(text) {
        if ( text !== undefined ) {
            for ( let i = 0; i < this.$.length; i++ ) {
                this.$[i].textContent = text;
            }
            return this;
        } else {
            if ( this.$.length > 1 ) {
                let texts = [];
                for ( let i = 0; i < this.$.length; i++ ) {
                    texts.push(this.$[i].textContent);
                }
                return texts;
            } else if ( this.$.length == 1 ) {
                return this.$[0].textContent;
            }
        }
    }

    toggleClass(classes, active) {
        return this._class('toggle', classes);
    }

    _class(action, classes, active) {
        if ( typeof classes == 'string' )
            classes = classes.split(' ');
        for ( let i = 0; i < this.$.length; i++ ) {
            for ( let j = 0; j < classes.length; j++ ) {
                if ( action == 'toggle' ) {
                    this.$[i].classList.toggle(classes[j], active);
                } else {
                    this.$[i].classList[action](classes[j]);
                }
            }
        }
        return this;
    }

};
