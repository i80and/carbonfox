'use strict';

var TokenManager = require('./TokenManager.js')
var Tokens = require('./Tokens.js')
var Base32 = require('./Base32.js')
var Toolbar = require('./Toolbar.js')
var SecureStorage = require('./SecureStorage.js')
var SlidePane = require('./SlidePane.js')
var LoginPane = require('./LoginPane.js')
var Sjcl = require('./deps/sjcl.js')

window.addEventListener('load', function() {
    // Make sure the browser offers random numbers, to avoid possible silent nonsense
    if(window.crypto.getRandomValues === undefined) {
        throw 'Need browser support for random values'
    }

    Toolbar.init()

    var secureStorage = new SecureStorage.SecureStorage('carbonfox')

    var loginPane = new LoginPane.LoginPane()
    if(!secureStorage.isInitialized()) {
        loginPane.setupMode = true
    }

    loginPane.onentry = function(pin) {
        secureStorage.unlock(pin).then(function() {
            console.log('OK!')
            loginPane.slidePane.close()
        }).catch(function(err) {
            console.error(err)
            loginPane.clear()
        })
    }

    loginPane.onsetup = function(pin) {
        // Make SURE we're not overwriting anything
        if(secureStorage.isInitialized()) {
            throw 'Setting up again!'
        }

        secureStorage.setup(pin).then(function() {
            secureStorage.setupMode = false
            loginPane.slidePane.close()
        }).catch(function(err) {
            console.error(err)
        })
    }

    loginPane.slidePane.open()
    loginPane.refresh()

    var manager = new TokenManager.TokenManager()
    var display = new TokenManager.TokenManagerDisplay(document.getElementById('token-list'), manager)
    manager.addTotp(new Tokens.TotpToken('i80and@gmail.com', Sjcl.codec.utf8String.toBits('foobar'), 30))
    for(var i = 0; i < 100; i += 1) {
        manager.addTotp(new Tokens.TotpToken(i.toString(), Sjcl.codec.utf8String.toBits('foobar' + i.toString()), 30))
    }

    var addWhatPane = {}
    addWhatPane.slidePane = new SlidePane.SlidePane(document.getElementById('pane-add-what'))

    var manualTotpPane = {}
    manualTotpPane.slidePane = new SlidePane.SlidePane(document.getElementById('pane-add-manual-totp'))
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

        options.digits = parseInt(manualTotpPane.digitsInput.value)
        if(isNaN(options.digits)) {
            throw 'Invalid digit number ' + manualTotpPane.digitsInput.value
        }

        return new Tokens.TotpToken(
            this.identityInput.value,
            Base32.toBits(this.secretKeyInput.value),
            parseInt(this.intervalInput.value),
            options)
    }

    var addPasswordPane = {}
    addPasswordPane.slidePane = new SlidePane.SlidePane(document.getElementById('pane-add-password'))
    addPasswordPane.websiteInput = document.getElementById('password-website-input')
    addPasswordPane.usernameInput = document.getElementById('password-username-input')
    addPasswordPane.passwordInput = document.getElementById('password-password-input')
    addPasswordPane.reset = function() {
        this.websiteInput.value = ''
        this.usernameInput.value = ''
        this.passwordInput.value = ''
    }

    addPasswordPane.makePassword = function() {
        var identity = this.websiteInput.value + ':' + this.usernameInput.value
        return new Tokens.PasswordToken(identity, this.passwordInput.value)
    }

    document.getElementById('add-identity').onclick = function() {
        addWhatPane.slidePane.open()
    }

    document.getElementById('add-manual-totp-input').onclick = function() {
        manualTotpPane.slidePane.open()
    }

    document.getElementById('save-identity-input').onclick = function() {
        manager.addTotp(manualTotpPane.makeTotp())
        addWhatPane.slidePane.close()
        manualTotpPane.slidePane.close()
        manualTotpPane.reset()
    }

    document.getElementById('close-add-what').onclick = function() {
        addWhatPane.slidePane.close()
    }

    document.getElementById('add-manual-password-input').onclick = function() {
        addPasswordPane.slidePane.open()
    }

    document.getElementById('save-password-input').onclick = function() {
        manager.addPassword(addPasswordPane.makePassword())
        addWhatPane.slidePane.close()
        addPasswordPane.slidePane.close()
        addPasswordPane.reset()
    }

    document.getElementById('close-manual-password-input').onclick = function() {
        addPasswordPane.slidePane.close()
    }

    document.getElementById('close-manual-totp-input').onclick = function() {
        manualTotpPane.slidePane.close()
        manualTotpPane.reset()
    }
})
