'use strict';

var TokenManager = require('./TokenManager.js')
var Tokens = require('./Tokens.js')
var Toolbar = require('./Toolbar.js')
var SecureStorage = require('./SecureStorage.js')
var SlidePane = require('./SlidePane.js')
var ManualTotpPane = require('./ManualTotpPane.js')
var PasswordPane = require('./PasswordPane.js')
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

    var addPasswordPane = new PasswordPane.PasswordPane()
    var manualTotpPane = new ManualTotpPane.ManualTotpPane()

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
