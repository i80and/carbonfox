'use strict';

var TotpManager = require('./TotpManager.js')
var Totp = require('./Totp.js')
var Base32 = require('./Base32.js')
var Toolbar = require('./Toolbar.js')
var Sjcl = require('./deps/sjcl.js')

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

window.addEventListener('load', function() {
    // If something about the environment is exposing a bug in our implementation,
    // let's find it out now.
    Base32.selfTest()
    Totp.selfTest()

    // Make sure the browser offers random numbers, to avoid possible silent nonsense
    if(window.crypto.getRandomValues === undefined) {
        throw 'Need browser support for random values'
    }

    Toolbar.init()

    var manager = new TotpManager.TotpManager(document.getElementById('token-list'))
    manager.add(new Totp.Totp('i80and@gmail.com', Sjcl.codec.utf8String.toBits('foobar'), 30))
    for(var i = 0; i < 100; i += 1) {
        manager.add(new Totp.Totp(i.toString(), Sjcl.codec.utf8String.toBits('foobar' + i.toString()), 30))
    }

    var addWhatPane = {}
    addWhatPane.slidePane = new SlidePane(document.getElementById('pane-add-what'))

    var manualTotpPane = {}
    manualTotpPane.slidePane = new SlidePane(document.getElementById('pane-add-manual-totp'))
    manualTotpPane.identityInput = document.getElementById('identity-input')
    manualTotpPane.secretKeyInput = document.getElementById('secret-input')
    manualTotpPane.hashFunctionInput = document.getElementById('hash-type-input')
    manualTotpPane.intervalInput = document.getElementById('interval-input')
    manualTotpPane.digitsInput = document.getElementById('digits-input')
    manualTotpPane.reset = function() {
        this.identityInput.value = ''
        this.secretKeyInput.value = ''
        this.hashFunctionInput.value = 'sha1'
        this.intervalInput.value = '30'
        this.digitsInput = '6'
    }

    manualTotpPane.makeTotp = function() {
        var options = {}
        if(manualTotpPane.hashFunctionInput.value === 'sha1') {
            options.hash = Sjcl.hash.sha1
        } else if(manualTotpPane.hashFunctionInput.value === 'sha256') {
            options.hash = Sjcl.hash.sha256
        } else if(manualTotpPane.hashFunctionInput.value === 'sha512') {
            options.hash = Sjcl.hash.sha512
        } else {
            throw 'Invalid hash function ' + manualTotpPane.hashFunctionInput.value
        }

        options.digits = parseInt(manualTotpPane.digitsInput)

        return new Totp.Totp(
            this.identityInput.value,
            Base32.toBits(this.secretKeyInput.value),
            parseInt(this.intervalInput.value),
            options)
    }

    var addPasswordPane = {}
    addPasswordPane.slidePane = new SlidePane(document.getElementById('pane-add-password'))

    document.getElementById('add-identity').onclick = function() {
        addWhatPane.slidePane.open()
    }

    document.getElementById('add-manual-totp-input').onclick = function() {
        manualTotpPane.slidePane.open()
    }

    document.getElementById('save-identity-input').onclick = function() {
        manager.add(manualTotpPane.makeTotp())
        manualTotpPane.slidePane.close()
        manualTotpPane.reset()
    }

    document.getElementById('close-add-what').onclick = function() {
        addWhatPane.slidePane.close()
    }

    document.getElementById('add-manual-password-input').onclick = function() {
        addPasswordPane.slidePane.open()
    }

    document.getElementById('close-manual-password-input').onclick = function() {
        addPasswordPane.slidePane.close()
    }

    document.getElementById('close-manual-totp-input').onclick = function() {
        manualTotpPane.slidePane.close()
        manualTotpPane.reset()
    }
})
