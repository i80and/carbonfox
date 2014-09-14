'use strict';

var Sjcl = require('./deps/sjcl.js')

var Base32 = require('./Base32.js')
var SlidePane = require('./SlidePane.js')
var Tokens = require('./Tokens.js')

var ManualTotpPane = function() {
    this.slidePane = new SlidePane.SlidePane(document.getElementById('pane-add-manual-totp'))
    this.identityInput = document.getElementById('identity-input')
    this.secretKeyInput = document.getElementById('secret-input')
    this.hashFunctionInput = document.getElementById('hash-type-input')
    this.intervalInput = document.getElementById('interval-input')
    this.digitsInput = document.getElementById('digits-input')
}

ManualTotpPane.prototype.reset = function() {
    this.identityInput.value = ''
    this.secretKeyInput.value = ''
    this.hashFunctionInput.value = 'sha1'
    this.intervalInput.value = '30'
    this.digitsInput = '6'
}

ManualTotpPane.prototype.makeTotp = function() {
    var options = {}
    if(this.hashFunctionInput.value === 'sha1') {
        options.hash = Sjcl.hash.sha1
    } else if(this.hashFunctionInput.value === 'sha256') {
        options.hash = Sjcl.hash.sha256
    } else if(this.hashFunctionInput.value === 'sha512') {
        options.hash = Sjcl.hash.sha512
    } else {
        throw new Error('Invalid hash function ' + this.hashFunctionInput.value)
    }

    options.digits = parseInt(this.digitsInput.value)
    if(isNaN(options.digits)) {
        throw new Error('Invalid digit number ' + this.digitsInput.value)
    }

    return new Tokens.TotpToken(
        this.identityInput.value,
        Base32.toBits(this.secretKeyInput.value),
        parseInt(this.intervalInput.value),
        options)
}

exports.ManualTotpPane = ManualTotpPane
