'use strict';

// An RFC-4648-compatible Base32 decoder, mirroring the SJCL Base64 API

var Sjcl = require('./deps/sjcl.js')

var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

// XXX This function is a mess
var toBits = function(input) {
    var bits = 0
    var curByte = 0
    var curWord = 0
    var wordOffset = 0
    var result = []

    for(var i = 0; i < input.length; i += 1) {
        // Ignore tail padding
        if(input[i] === '=') {
            break
        }

        var x = ALPHABET.indexOf(input[i])
        if(x < 0) {
            throw 'Invalid base32'
        }

        x <<= 3
        curByte |= x >>> bits
        bits += 5
        if(bits >= 8) {
            curWord |= curByte << 8
            wordOffset += 1
            result.push(curByte)
            bits -= 8
            if(bits > 0) {
                curByte = x << (5 - bits) & 255
            } else {
                curByte = 0
            }
        }

        // if(wordOffset > 4) {
        //     wordOffset = 0
        //     result.push(curWord)
        //     curWord = 0
        // }
    }

    // if(wordOffset > 0) {
    //     result.push(curWord)
    // }

    var output = ''
    for(i = 0; i < result.length; i += 1) {
        output += result[i].toString(16)
    }

    return Sjcl.codec.hex.toBits(output)
}

var selfTest = function() {
    var tests = {
        '': '',
        'f': 'MY======',
        'fo': 'MZXQ====',
        'foo': 'MZXW6===',
        'foob': 'MZXW6YQ=',
        'fooba': 'MZXW6YTB',
        'foobar': 'MZXW6YTBOI======' }

    for(var ascii in tests) {
        var decoded = Sjcl.codec.utf8String.fromBits(toBits(tests[ascii]))
        if(decoded !== ascii) {
            throw 'Base32 check failed: decoding ' + tests[ascii] + ' yielded ' + decoded
        }
    }
}

exports.toBits = toBits
exports.selfTest = selfTest
