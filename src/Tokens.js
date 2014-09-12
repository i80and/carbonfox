'use strict';

var Totp = require('./Totp.js')

var TotpToken = function(identity, secretKey, interval, options) {
    this.type = 'totp'
    this.identity = identity
    this.secretKey = secretKey
    this.interval = interval

    if(options === undefined) {
        options = {}
    }

    this.epoch = options.epoch
    if(this.epoch === undefined) {
        this.epoch = new Date(0)
    }

    this.hash = options.hash
    if(this.hash === undefined) {
        this.hash = 'sha1'
    }

    this.digits = options.digits
    if(this.digits === undefined) {
        this.digits = 6
    }
}

TotpToken.prototype.getKey = function(now) {
    if(now === undefined) {
        now = new Date()
    }

    var options = {}
    options.epoch = this.epoch
    options.hash = this.hash
    options.digits = this.digits

    return Totp.totp(this.secretKey, this.epoch, now, this.interval, options)
}

TotpToken.prototype.timeUntilNextTick = function() {
    var now = (new Date()).valueOf() / 1000
    now -= this.epoch.valueOf() / 1000
    var remaining = this.interval - (now - (Math.floor(now / this.interval) * this.interval))

    if(remaining < 0) { return 0 }
    return remaining
}

TotpToken.load = function(obj) {
    var options = {}
    options.epoch = new Date(obj.epoch)
    options.hash = obj.hash
    options.digits = obj.digits

    return new TotpToken(obj.identity, obj.secretKey, obj.interval, options)
}

var PasswordToken = function(identity, secretKey) {
    this.type = 'password'
    this.identity = identity
    this.secretKey = secretKey
}

PasswordToken.prototype.getKey = function() {
    return this.secretKey
}

PasswordToken.load = function(obj) {
    return new PasswordToken(obj.identity, obj.secretKey)
}

var load = function(obj) {
    if(obj.type === 'totp') {
        return TotpToken.load(obj)
    } else if(obj.type === 'password') {
        return PasswordToken.load(obj)
    } else {
        throw 'Unknown token type ' + obj.type
    }
}

exports.TotpToken = TotpToken
exports.PasswordToken = PasswordToken
exports.load = load
