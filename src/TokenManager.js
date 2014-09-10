'use strict';

var Toolbar = require('./Toolbar.js')
var Tokens = require('./Tokens.js')

var TokenDisplay = function(parent, token) {
    var _this = this

    this.token = token
    this.key = ''

    this.rootElement = document.createElement('li')
    this.mainDisplay = document.createElement('p')
    this.secondaryDisplay = document.createElement('p')
    this.timerDisplay = document.createElement('aside')

    this.rootElement.appendChild(this.timerDisplay)
    this.rootElement.appendChild(this.mainDisplay)
    this.rootElement.appendChild(this.secondaryDisplay)

    this.timerDisplay.className = 'pack-end'

    this.toolbar = document.getElementById('toolbar')

    this.shown = false
    this.hide()

    this.rootElement.onclick = function() {
        _this.toggle()
    }

    this.rootElement.oncontextmenu = function(ev) {
        ev.preventDefault()

        Toolbar.toolbar.show()
        console.log('Context')
    }

    this.onremove = function() {}

    parent.appendChild(this.rootElement)
}

TokenDisplay.prototype.refresh = function(key) {
    if(key !== undefined) {
        this.key = key
    }

    if(this.shown) {
        this.mainDisplay.textContent = this.key
        this.secondaryDisplay.textContent = this.token.identity
    } else {
        this.mainDisplay.textContent = this.token.identity
        this.secondaryDisplay.textContent = this.key
    }
}

TokenDisplay.prototype.hide = function() {
    if(!this.shown) {
        return
    }

    this.rootElement.appendChild(this.secondaryDisplay)
    this.shown = false
    this.refresh()
}

TokenDisplay.prototype.show = function() {
    if(this.shown) {
        return
    }

    this.rootElement.removeChild(this.secondaryDisplay)
    this.shown = true
    this.refresh()
}

TokenDisplay.prototype.toggle = function() {
    if(this.shown) {
        this.hide()
    }
    else {
        this.show()
    }

    this.refresh()
}

var TokenManager = function() {
    this.identities = {}
    this.timers = {}

    this.onupdate = function() {}
    this.onadd = function() {}
    this.onremove = function() {}
}

TokenManager.prototype.serialize = function() {
    var output = {}
    output.tokens = []

    for(var identity in this.identities) {
        output.push(this.identities[identity])
    }

    return output
}

TokenManager.prototype.load = function(obj) {
    for(var i = 0; i < obj.tokens.length; i += 1) {
        var token = Tokens.load(obj.tokens[i])

        if(token.type === 'totp') {
            this.addTotp(token)
        } else if(token.type === 'password') {
            this.addPassword(token)
        }
    }
}

TokenManager.prototype.addTotp = function(totp) {
    var _this = this

    if(totp.identity in this.identities) {
        throw 'Duplicate identity ' + totp.identity
    }

    var tick = function() {
        _this.onupdate(_this.timers[totp.interval])
    }

    this.identities[totp.identity] = totp
    if(!(totp.interval in this.timers)) {
        this.timers[totp.interval] = {}

        // Don't start ticking until we're on the time interval boundary
        window.setTimeout(function() {
            // Every interval, update our keys
            window.setInterval(function() {
                tick()
            }, totp.interval * 1000)

            tick()
        }, totp.timeUntilNextTick() * 1000)
    }

    this.timers[totp.interval][totp.identity] = null
    this.onadd(totp)
}

TokenManager.prototype.addPassword = function(token) {
    if(token.identity in this.identities) {
        throw 'Duplicate identity ' + token.identity
    }

    this.identities[token.identity] = token
    this.onadd(token)
}

TokenManager.prototype.remove = function(totp) {
    delete this.identities[totp.identity]
    delete this.timers[totp.interval][totp.identity]
    this.onremove(totp.identity)
}

TokenManager.prototype.get = function(identity) {
    return this.identities[identity].getKey()
}

var TokenManagerDisplay = function(element, manager) {
    var _this = this

    this.rootElement = element
    this.elements = {}
    this.manager = manager

    manager.onupdate = function(identities) {
        _this.refresh(identities)
    }

    manager.onadd = function(totp) {
        _this.elements[totp.identity] = new TokenDisplay(_this.rootElement, totp)
        _this.refresh([totp.identity])
    }

    manager.onremove = function(identity) {
        delete _this.elements[identity]
    }
}

TokenManagerDisplay.prototype.refresh = function(dirtyIdentities) {
    var identity

    if(dirtyIdentities === undefined) {
        dirtyIdentities = []
        for(identity in this.manager.identities) {
            dirtyIdentities.push(identity)
        }
    }

    for(var i = 0; i < dirtyIdentities.length; i += 1) {
        identity = dirtyIdentities[i]
        this.elements[identity].refresh(this.manager.get(identity))
    }
}

exports.TokenManager = TokenManager
exports.TokenManagerDisplay = TokenManagerDisplay
