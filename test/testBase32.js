'use strict';

var assert = require('assert')
var Base32 = require('../src/Base32.js')
var Sjcl = require('../src/deps/sjcl.js')

describe('Base32', function() {
    describe('#toBits', function() {
        it('should match the test vector', function() {
            var tests = {
                '': '',
                'f': 'MY======',
                'fo': 'MZXQ====',
                'foo': 'MZXW6===',
                'foob': 'MZXW6YQ=',
                'fooba': 'MZXW6YTB',
                'foobar': 'MZXW6YTBOI======' }

            for(var ascii in tests) {
                var decoded = Sjcl.codec.utf8String.fromBits(Base32.toBits(tests[ascii]))
                assert.equal(decoded, ascii)
            }
        })
    })
})
