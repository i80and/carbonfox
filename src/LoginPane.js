'use strict';

var SlidePane = require('./SlidePane.js')
var Keypad = require('./Keypad.js')

var LoginPane = function() {
    var _this = this

    this.setupMode = false
    this.currentPasscode = []
    this.slidePane = new SlidePane.SlidePane(document.getElementById('lock-pane'))
    this.promptDisplay = document.getElementById('lock-pane-prompt')
    this.display = document.getElementById('lock-pane-display')
    this.keypad = new Keypad.Keypad(document.getElementById('lock-pane-input'))

    this.onentry = function() {}
    this.onsetup = function() {}

    this.keypad.oninput = function(value) {
        if(value === 'backspace') {
            _this.currentPasscode.pop()
            _this.refresh()
            return
        }

        if(_this.currentPasscode.length > 4) {
            return
        }

        _this.currentPasscode.push(value)
        _this.refresh()

        if(_this.currentPasscode.length === 4) {
            var pin = _this.currentPasscode.join('')

            if(_this.setupMode) {
                _this.onsetup(pin)
            } else {
                _this.onentry(pin)
            }
        }
    }
}

LoginPane.prototype.refresh = function() {
    if(this.setupMode) {
        this.promptDisplay.textContent = 'Please enter a 4-digit PIN'
    } else {
        this.promptDisplay.textContent = 'Please enter your PIN'
    }

    if(this.currentPasscode.length === 0) {
        this.display.innerHTML = '&nbsp;'
        return
    }

    var text = new Array(this.currentPasscode.length)
    text.fill('•')
    this.display.textContent = text.join(' ')
}

LoginPane.prototype.clear = function() {
    this.currentPasscode = []
    this.refresh()
}

exports.LoginPane = LoginPane
