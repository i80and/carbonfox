'use strict';

var isFunction = function(obj) {
    return obj && obj.constructor && obj.call && obj.apply
}

exports.isFunction = isFunction
