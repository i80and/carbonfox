'use strict';

var SlidePane = function(element) {
    this.element = element
    this.close()
}

SlidePane.prototype.open = function() {
    if(this.state === 'open') {
        return
    }

    this.element.style.top = '0%'
    this.state = 'open'
}

SlidePane.prototype.close = function() {
    if(this.state === 'closed') {
        return
    }

    this.element.style.top = '100%'
    this.state = 'closed'
}

exports.SlidePane = SlidePane
