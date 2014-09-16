'use strict';

var TokenManager = require('./TokenManager.js')
var SecureStorage = require('./SecureStorage.js')
var SlidePane = require('./SlidePane.js')
var ManualTotpPane = require('./ManualTotpPane.js')
var PasswordPane = require('./PasswordPane.js')
var LoginPane = require('./LoginPane.js')

var CarbonFox = function() {
    this.secureStorage = new SecureStorage.SecureStorage('carbonfox')
    this.manager = new TokenManager.TokenManager()
}

CarbonFox.prototype.onInit = function() {
    var _this = this

    var loginPane = new LoginPane.LoginPane()
    if(!_this.secureStorage.isInitialized()) {
        loginPane.setupMode = true
    }

    loginPane.onentry = function(pin) {
        _this.secureStorage.unlock(pin).then(function() {
            _this.manager = TokenManager.TokenManager.load(_this.secureStorage.data)
            loginPane.slidePane.close()
            _this.onLogin()
        }).catch(function(err) {
            console.error(err)
            loginPane.clear()
        })
    }

    loginPane.onsetup = function(pin) {
        // Make SURE we're not overwriting anything
        if(_this.secureStorage.isInitialized()) {
            throw 'Setting up again!'
        }

        _this.secureStorage.setup(pin).then(function() {
            _this.secureStorage.setupMode = false
            loginPane.slidePane.close()
            _this.onLogin()
        }).catch(function(err) {
            console.error(err)
        })
    }

    loginPane.slidePane.open()
    loginPane.refresh()
}

CarbonFox.prototype.onLogin = function() {
    var _this = this
    var display = new TokenManager.TokenManagerDisplay(document.getElementById('token-list'),
                                                       _this.manager)

    var save = function() {
        _this.secureStorage.data = _this.manager.serialize()
        _this.secureStorage.save()
    }

    _this.manager.addEventHandler('add', save)
    _this.manager.addEventHandler('remove', save)

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
        _this.manager.addTotp(manualTotpPane.makeTotp())
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
        _this.manager.addPassword(addPasswordPane.makePassword())
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
}

window.addEventListener('load', function() {
    // Make sure the browser offers random numbers, to avoid possible silent nonsense
    if(window.crypto.getRandomValues === undefined) {
        throw 'Need browser support for random values'
    }

    var app = new CarbonFox()
    app.onInit()
})
