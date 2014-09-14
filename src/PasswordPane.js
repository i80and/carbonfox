'use strict';

var SlidePane = require('./SlidePane.js')
var Tokens = require('./Tokens.js')

var PasswordPane = function() {
    this.slidePane = new SlidePane.SlidePane(document.getElementById('pane-add-password'))
    this.websiteInput = document.getElementById('password-website-input')
    this.usernameInput = document.getElementById('password-username-input')
    this.passwordInput = document.getElementById('password-password-input')
}

PasswordPane.reset = function() {
    this.websiteInput.value = ''
    this.usernameInput.value = ''
    this.passwordInput.value = ''
}

PasswordPane.makePassword = function() {
    var identity = this.websiteInput.value + ':' + this.usernameInput.value
    return new Tokens.PasswordToken(identity, this.passwordInput.value)
}

exports.PasswordPane = PasswordPane
