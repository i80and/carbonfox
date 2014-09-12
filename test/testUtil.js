'use strict';

var assert = require('assert')
var Util = require('../src/Util.js')

describe('Util', function() {
    describe('isFunction', function() {
        it('must correctly identify Date', function() {
            assert(Util.isFunction(Date))
        })

        it('must correctly identify itself', function() {
            assert(Util.isFunction(Util.isFunction))
        })

        it('must correctly reject other types', function() {
            assert(!Util.isFunction(5))
            assert(!Util.isFunction('foobar'))
            assert(!Util.isFunction(Util))
            assert(!Util.isFunction([1, 2]))
            assert(!Util.isFunction({}))
        })
    })
})
