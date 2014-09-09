'use strict';

var Sjcl = require('./deps/sjcl.js')

var hotp = function(secretKey, counter, options) {
    // See RFC-4226

    if(options === undefined) {
        options = {}
    }

    if(options.digits === undefined) {
        options.digits = 6
    }

    if(options.hash === undefined) {
        options.hash = Sjcl.hash.sha1
    }

    // SJCL takes a special format called bit arrays composed of 32-bit integers.
    // Convert our integer counter into a bit array.
    var counterBitArray = [0 & 0xffffffff, counter >> 32 & 0xffffffff]

    // Compute the HMAC and convert it into a bytewise format easy for us to wrangle
    var hmac = new Sjcl.misc.hmac(secretKey, options.hash)
    var rawhs = hmac.encrypt(counterBitArray)
    var hs = new Uint8Array(rawhs.length * 4)

    // Copy our big-endian words into a single-byte array
    for(var i = 0; i < rawhs.length; i += 1) {
        hs[i*4 + 3] = rawhs[i] & 0xff
        hs[i*4 + 2] = rawhs[i] >> 8 & 0xff
        hs[i*4 + 1] = rawhs[i] >> 16 & 0xff
        hs[i*4 + 0] = rawhs[i] >> 24 & 0xff
    }

    // Compute dynamic truncation of the HMAC's output
    var offset = hs[hs.length-1] & 0xf
    var snum = (hs[offset]  & 0x7f) << 24
           | (hs[offset+1] & 0xff) << 16
           | (hs[offset+2] & 0xff) <<  8
           | (hs[offset+3] & 0xff)

    var d = snum % (Math.pow(10, options.digits))
    return d
}

var totp = function(secretKey, startEpoch, timestep, options) {
    // See RFC-6238

    var now = (new Date()).valueOf() / 1000
    var timeCounter = Math.floor((now - startEpoch) / timestep)
    return hotp(secretKey, timeCounter, options)
}

var selfTest = function() {
    // HOTP Test vector taken from the RFC-4226 examples
    var correctResults = [755224,
        287082,
        359152,
        969429,
        338314,
        254676,
        287922,
        162583,
        399871,
        520489]

    for(var i = 0; i < correctResults.length; i += 1) {
        var result = hotp(Sjcl.codec.utf8String.toBits('12345678901234567890'), i)
        if(result !== correctResults[i]) {
            throw 'Self-test failed: got ' + result + ' expected ' + correctResults[i]
        }
    }
}

exports.hotp = hotp
exports.totp = totp
exports.selfTest = selfTest
