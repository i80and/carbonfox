'use strict';

var assert = require('assert')
var Tokens = require('../src/Tokens.js')
var Sjcl = require('../src/deps/sjcl.js')

describe('Tokens', function() {
    describe('TotpToken', function() {
        var tokenEpoch = new Date(new Date() - (29990))
        var secretKey = Sjcl.codec.utf8String.toBits('foobar')
        var token = new Tokens.TotpToken('example.com:me',
            secretKey,
            30,
            { epoch: tokenEpoch })

        describe('#timeUntilNextTick', function() {
            var timeRemaining = token.timeUntilNextTick()
            assert(timeRemaining >= 0 && timeRemaining < 0.1)

            var pastDate = new Date(new Date() - 25000)
            var token2 = new Tokens.TotpToken('example.com:me', secretKey, 30, { epoch: pastDate })
            timeRemaining = token2.timeUntilNextTick()
            assert(timeRemaining < 6 && timeRemaining > 4)
        })

        describe('#load', function() {
            var serialized = JSON.parse(JSON.stringify(token))

            it('must serialize correctly', function() {
                assert.deepEqual(serialized, {
                    'type': 'totp',
                    'identity': 'example.com:me',
                    'secretKey': secretKey,
                    'interval': 30,
                    'epoch': tokenEpoch.toJSON(),
                    'hash': 'sha1',
                    'digits': 6
                })
            })

            it('must load correctly', function() {
                var loaded = Tokens.load(serialized)
                assert.equal(loaded.identity, token.identity)
                assert.deepEqual(loaded.secretKey, token.secretKey)
                assert.equal(loaded.interval, token.interval)
                assert.deepEqual(loaded.epoch, token.epoch)
                assert.equal(loaded.hash, token.hash)
                assert.equal(loaded.digits, token.digits)
            })
        })

        describe('#getKey', function() {
            it('must yield the right output', function() {
                var token = new Tokens.TotpToken('example.com:me',
                    secretKey,
                    30)

                assert.equal(token.getKey(new Date(123456 * 1000)), '940026')
            })
        })

        describe('bad hash function', function() {
            it('must fail', function() {
                assert.throws(function() {
                    var token = new Tokens.TotpToken('example.com:me',
                        secretKey,
                        30,
                        { 'hash': 'md5' })
                    token.getKey()
                }, Error)
            })
        })
    }),

    describe('PasswordToken', function() {
        var token = new Tokens.PasswordToken('example.com:me', 'foobar')

        describe('#load', function() {
            var serialized = JSON.parse(JSON.stringify(token))

            it('must serialize correctly', function() {
                assert.deepEqual(serialized, {
                    'type': 'password',
                    'identity': 'example.com:me',
                    'secretKey': 'foobar'
                })
            })

            it('must load correctly', function() {
                var loaded = Tokens.load(serialized)
                assert.equal(loaded.identity, token.identity)
                assert.deepEqual(loaded.secretKey, token.secretKey)
            })
        })

        describe('#getKey', function() {
            it('must yield its key', function() {
                assert.equal(token.getKey(), 'foobar')
            })
        })
    })
})
