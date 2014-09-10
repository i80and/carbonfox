'use strict';

exports.toolbar = null

var Toolbar = function(element) {
    var _this = this

    this.element = element
    this.element.style.display = 'block'
    this.hide()

    window.addEventListener('click', function() {
        _this.hide()
    })
}

Toolbar.prototype.show = function() {
    this.element.style.bottom = '0px'
}

Toolbar.prototype.hide = function() {
    this.element.style.bottom = '-4rem'
}

var init = function() {
    exports.toolbar = new Toolbar(document.getElementById('toolbar'))
}

exports.Toolbar = Toolbar
exports.init = init
