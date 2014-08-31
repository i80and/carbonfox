'use strict';

var Sjcl = require('./sjcl.js')

// SJCL's convenience cryptographic methods are fine, but a little weaker than we would like; AES-128
// with 1000 rounds of PBKDF2.  We choose 5000 rounds for now (but perhaps should switch to scrypt)
// along with AES-192.  AES-256 is extra-vulnerable to related key attacks.
var KEY_SIZE = 192
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

    // IV has to be the same length as the key
    var iv = new Uint32Array(options.ks / 8 / 4)

    window.crypto.getRandomValues(salt)
    window.crypto.getRandomValues(iv)

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

var SecureStorage = function(prefix, pin) {
    this.prefix = prefix
    this.pin = pin

    // XXX Handle exceptions
    var ciphertext = window.localStorage[this.getStorageKey()]
    var decryptedData = Sjcl.decrypt(pin, ciphertext)
    this.data = JSON.parse(decryptedData)
}

SecureStorage.prototype.getStorageKey = function() {
    return this.prefix + '-keys'
}

SecureStorage.prototype.save = function() {
    var serialized = JSON.stringify(this.data)
    var ciphertext = encrypt(this.pin, serialized)
    window.localStorage[this.getStorageKey()] = ciphertext
}
