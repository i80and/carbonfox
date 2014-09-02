'use strict';

var Sjcl = require('./deps/sjcl.js')

// SJCL's convenience cryptographic methods are fine, but a little weaker than we would like; AES-128
// with 1000 rounds of PBKDF2.  We choose 5000 rounds for now (but perhaps should switch to scrypt)
// along with AES-256; our usage of AES should not be vulnerable to a related-key attack.  Still,
// I'd prefer to use salsa20 or something instead.
var KEY_SIZE = 256
var ITERS = 5000

// Return a promise for a possibly-asynchronously-computed encrypted value.  In practice, right now
// it resolves immediately, but this will very likely change down the road.
var encrypt = function(secretKey, text, options) {
    if(options === undefined) {
        options = {}
    }

    if(options.ks === undefined) {
        options.ks = KEY_SIZE
    }

    if(options.iters === undefined) {
        options.iters = ITERS
    }

    // 16 bytes of salt ought to be enough for anybody
    var salt = new Uint32Array(4)

    // 16 byte IV
    var iv = new Uint32Array(4)

    // Now generate our random salt and initialization vector
    window.crypto.getRandomValues(salt)
    window.crypto.getRandomValues(iv)

    // SJCL requires lists, not typed arrays
    salt = [salt[0], salt[1], salt[2], salt[3]]
    iv = [iv[0], iv[1], iv[2], iv[3]]

    var ts = 64
    var adata = ''
    var key = Sjcl.misc.pbkdf2(secretKey, salt, options.iters, options.ks)
    var cipher = new Sjcl.cipher.aes(key)
    var cipherText = Sjcl.mode.ccm.encrypt(cipher, text, iv, ts, adata)

    // Our encryption format is intended to be the same as SJCL's encryption format
    var result = {}
    result.iv = Sjcl.codec.base64.fromBits(iv)
    result.v = 1
    result.iter = options.iters
    result.ks = options.ks
    result.ts = ts
    result.mode = 'ccm'
    result.adata = adata
    result.cipher = 'aes'
    result.salt = Sjcl.codec.base64.fromBits(salt)
    result.ct = Sjcl.codec.base64.fromBits(cipherText)

    return new Promise(function(resolve) {
        resolve(JSON.stringify(result))
    })
}

var SecureStorage = function(prefix) {
    this.prefix = prefix
    this.pin = null
    this.data = null
}

SecureStorage.prototype.getStorageKey = function() {
    return this.prefix + '-keys'
}

SecureStorage.prototype.unlock = function(pin) {
    var _this = this

    var ciphertext = window.localStorage[this.getStorageKey()]
    if(ciphertext === undefined) {
        return new Promise(function(resolve, reject) {
            reject('No database')
        })
    }

    var decryptedData
    try {
        decryptedData = Sjcl.decrypt(pin, ciphertext)
    } catch(err) {
        return new Promise(function(resolve, reject) {
            reject(err)
        })
    }

    try {
        this.data = JSON.parse(decryptedData)
    } catch(err) {
        return new Promise(function(resolve, reject) {
            reject('Corrupt JSON')
        })
    }

    return new Promise(function(resolve) {
        _this.pin = pin
        resolve()
    })
}

SecureStorage.prototype.lock = function() {
    this.data = null
}

SecureStorage.prototype.save = function() {
    var _this = this
    var serialized = JSON.stringify(this.data)
    var textPin = Sjcl.codec.utf8String.toBits(_this.pin)

    return new Promise(function(resolve, reject) {
        encrypt(textPin, Sjcl.codec.utf8String.toBits(serialized)).then(function(ciphertext) {
            window.localStorage[_this.getStorageKey()] = ciphertext
            resolve()
        }).catch(function() {
            console.error('Error')
            reject('Encryption error')
        })
    })
}

SecureStorage.prototype.isInitialized = function() {
    return window.localStorage[this.getStorageKey()] !== undefined
}

SecureStorage.prototype.setup = function(pin) {
    this.pin = pin
    this.data = {}
    return this.save()
}

exports.SecureStorage = SecureStorage
