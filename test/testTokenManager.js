'use strict';

var assert = require('assert')
var TokenManager = require('../src/TokenManager.js')
var Tokens = require('../src/Tokens.js')

describe('TokenManager', function() {
    describe('#addPassword', function() {
        it('should add a password and call the onadd() callback', function() {
            var wasCalled = false

            var manager = new TokenManager.TokenManager()
            manager.onadd = function() { wasCalled = true }

            manager.addPassword(new Tokens.PasswordToken('example.com:me', 'password'))
            manager.addPassword(new Tokens.PasswordToken('example.com:me2', 'password'))
            assert(wasCalled)
            assert.equal(manager.get('example.com:me'), 'password')
            assert.equal(manager.get('example.com:me2'), 'password')

            assert.throws(
                function() { manager.addPassword(new Tokens.PasswordToken('example.com:me', 'duplicate')) },
                TokenManager.ErrorDuplicate
            )
        })
    }),

    describe('#remove', function() {
        it('should remove a token from the manager and call the onremove() callback', function() {
            var wasCalled = false

            var manager = new TokenManager.TokenManager()
            manager.onremove = function() { wasCalled = true }

            manager.addPassword(new Tokens.PasswordToken('example.com:me', 'password'))
            manager.addPassword(new Tokens.PasswordToken('example.com:me2', 'password'))

            manager.remove('example.com:me')

            assert.equal(manager.get('example.com:me'), undefined)
            assert.equal(manager.get('example.com:me2'), 'password')
            assert(wasCalled)
        })
    }),

    describe('#serialize', function() {
        it('should return a valid JavaScript object', function() {
            var manager = new TokenManager.TokenManager()
            manager.addPassword(new Tokens.PasswordToken('example.com:me', 'password'))

            var result = manager.serialize()
            assert.deepEqual(result, {
                tokens: [
                    {
                        'type': 'password',
                        'identity': 'example.com:me',
                        'secretKey': 'password'
                    }
                ]
            })
        }),
        it('should return an empty representation', function() {
            var manager = new TokenManager.TokenManager()
            var result = manager.serialize()
            assert.deepEqual(result, { tokens: [] })
        })
    }),

    describe('#load', function() {
        it('should load a TokenManager from a JavaScript object', function() {
            var manager = TokenManager.TokenManager.load({
                tokens: [
                    {
                        'type': 'password',
                        'identity': 'example.com:me',
                        'secretKey': 'password'
                    }
                ]
            })

            assert.equal(manager.get('example.com:me'), 'password')
        })
    })
})
