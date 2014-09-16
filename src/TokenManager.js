'use strict';

var Toolbar = require('./Toolbar.js')
var Tokens = require('./Tokens.js')

var ErrorDuplicate = function(message) {
    this.message = 'Duplicate identity: ' + message
}
ErrorDuplicate.prototype = new Error()
ErrorDuplicate.prototype.constructor = ErrorDuplicate

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

    this.eventHandlers = {add: [], update: [], remove: []}
}

TokenManager.prototype.serialize = function() {
    var output = {}
    output.tokens = []

    for(var identity in this.identities) {
        output.tokens.push(this.identities[identity])
    }

    return output
}

TokenManager.load = function(obj) {
    var result = new TokenManager()

    for(var i = 0; i < obj.tokens.length; i += 1) {
        var token = Tokens.load(obj.tokens[i])

        if(token.type === 'totp') {
            result.addTotp(token)
        } else if(token.type === 'password') {
            result.addPassword(token)
        }
    }

    return result
}

TokenManager.prototype.addTotp = function(totp) {
    var _this = this

    if(totp.identity in this.identities) {
        throw new ErrorDuplicate(totp.identity)
    }

    var tick = function() {
        _this.__handle('update', [_this.timers[totp.interval]])
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
    this.__handle('add', [totp])
}

TokenManager.prototype.addPassword = function(token) {
    if(token.identity in this.identities) {
        throw new ErrorDuplicate(token.identity)
    }

    this.identities[token.identity] = token
    this.__handle('add', [token])
}

TokenManager.prototype.remove = function(identity) {
    var token = this.identities[identity]

    if(token.type === 'totp') {
        delete this.timers[token.interval][identity]
    }

    delete this.identities[identity]
    this.__handle('remove', [identity])
}

TokenManager.prototype.get = function(identity) {
    var token = this.identities[identity]
    if(token === undefined) { return undefined }

    return token.getKey()
}

TokenManager.prototype.addEventHandler = function(event, f) {
    if(!(event in this.eventHandlers)) {
        throw new Error('Unknown event type ' + event)
    }

    this.eventHandlers[event].push(f)
}

TokenManager.prototype.forEach = function(f) {
    for(var token in this.identities) {
        f(this.identities[token])
    }
}

TokenManager.prototype.__handle = function(event, args) {
    if(!(event in this.eventHandlers)) {
        throw new Error('Unknown event type ' + event)
    }

    var handlers = this.eventHandlers[event]
    for(var i = 0; i < handlers.length; i += 1) {
        handlers[i].apply(this, args)
    }
}

var TokenManagerDisplay = function(element, manager) {
    var _this = this

    this.rootElement = element
    this.elements = {}
    this.manager = manager

    manager.addEventHandler('update', function(identities) {
        _this.refresh(identities)
    })

    manager.addEventHandler('add', function(totp) {
        _this.__add(totp)
    })

    manager.addEventHandler('remove', function(identity) {
        delete _this.elements[identity]
    })

    // Add the backlog of tokens
    this.manager.forEach(function(totp) {
        _this.__add(totp)
    })
}

TokenManagerDisplay.prototype.__add = function(totp) {
    this.elements[totp.identity] = new TokenDisplay(this.rootElement, totp)
    this.refresh([totp.identity])
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

exports.ErrorDuplicate = ErrorDuplicate
exports.TokenManager = TokenManager
exports.TokenManagerDisplay = TokenManagerDisplay
