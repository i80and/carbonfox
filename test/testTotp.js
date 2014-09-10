'use strict';

var assert = require('assert')
var Totp = require('../src/Totp.js')
var Sjcl = require('../src/deps/sjcl.js')

describe('Totp', function() {
    describe('#hotp', function() {
        it('should match the test vector from RFC-4226', function() {
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
                var result = Totp.hotp(Sjcl.codec.utf8String.toBits('12345678901234567890'), i)
                assert.equal(result, correctResults[i])
            }
        })
    })
})
