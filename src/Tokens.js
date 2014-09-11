'use strict';

var Totp = require('./Totp.js')

var TotpToken = function(identity, secretKey, interval, options) {
    this.type = 'totp'
    this.identity = identity
    this.secretKey = secretKey
    this.interval = interval
    this.options = options
}

TotpToken.prototype.getKey = function() {
    return Totp.totp(this.secretKey, 0, this.interval, this.options)
}

TotpToken.prototype.timeUntilNextTick = function() {
    var now = (new Date()).valueOf() / 1000
    var remaining = this.interval - (now - (Math.floor(now / this.interval) * this.interval))
    return Math.abs(remaining)
}

TotpToken.load = function(obj) {
    return new TotpToken(obj.identity, obj.secretKey, obj.interval, obj.options)
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
