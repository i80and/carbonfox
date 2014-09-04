'use strict';

var Toolbar = require('./Toolbar.js')

var TotpDisplay = function(parent, totp) {
    var _this = this

    this.totp = totp
    this.rootElement = document.createElement('li')
    this.mainDisplay = document.createElement('p')
    this.secondaryDisplay = document.createElement('p')
    this.timerDisplay = document.createElement('aside')

    this.rootElement.appendChild(this.timerDisplay)
    this.rootElement.appendChild(this.mainDisplay)
    this.rootElement.appendChild(this.secondaryDisplay)

    this.timerDisplay.className = 'pack-end'
    this.secondaryDisplay.style.transition = 'opacity ' + totp.interval + 's linear'

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

TotpDisplay.prototype.refresh = function(key) {
    if(key === undefined) {
        key = this.totp.getKey()
    }

    if(this.shown) {
        this.mainDisplay.textContent = key
        this.secondaryDisplay.textContent = this.totp.identity
    } else {
        this.mainDisplay.textContent = this.totp.identity
        this.secondaryDisplay.textContent = key
    }

    this.value = key
}

TotpDisplay.prototype.hide = function() {
    if(!this.shown) {
        return
    }

    this.rootElement.appendChild(this.secondaryDisplay)
    this.shown = false
    this.refresh()
}

TotpDisplay.prototype.show = function() {
    if(this.shown) {
        return
    }

    this.rootElement.removeChild(this.secondaryDisplay)
    this.shown = true
    this.refresh()
}

TotpDisplay.prototype.toggle = function() {
    if(this.shown) {
        this.hide()
    }
    else {
        this.show()
    }

    this.refresh()
}

var TotpManager = function() {
    this.identities = {}
    this.timers = {}

    this.onupdate = function() {}
    this.onadd = function() {}
    this.onremove = function() {}
}

TotpManager.prototype.add = function(totp) {
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

TotpManager.prototype.remove = function(totp) {
    delete this.identities[totp.identity]
    delete this.timers[totp.interval][totp.identity]
    this.onremove(totp.identity)
}

var TotpManagerDisplay = function(element, manager) {
    var _this = this

    this.rootElement = element
    this.elements = {}
    this.manager = manager

    manager.onupdate = function(identities) {
        _this.refresh(identities)
    }

    manager.onadd = function(totp) {
        _this.elements[totp.identity] = new TotpDisplay(_this.rootElement, totp)
    }

    manager.onremove = function(identity) {
        delete _this.elements[identity]
    }
}

TotpManagerDisplay.prototype.refresh = function(dirtyIdentities) {
    if(dirtyIdentities === undefined) {
        dirtyIdentities = this.manager.identities
    }

    for(var identity in dirtyIdentities) {
        this.elements[identity].refresh()
    }
}

exports.TotpManager = TotpManager
exports.TotpManagerDisplay = TotpManagerDisplay
