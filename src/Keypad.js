'use strict';

var Keypad = function(element) {
    var _this = this

    this.rootElement = element
    var templateNode = document.getElementById('template-keypad')
    var cloned = document.importNode(templateNode.content, true)
    this.rootElement.appendChild(cloned)

    var callback = function() {
        var value = this.getAttribute('data-value')
        if(value === 'backspace') {
            _this.oninput(value)
        } else {
            _this.oninput(parseInt(value))
        }
    }

    var buttons = this.rootElement.querySelectorAll('a')
    for(var i = 0; i < buttons.length; i += 1) {
        buttons[i].onclick = callback
    }

    this.oninput = function() {}
}

exports.Keypad = Keypad
