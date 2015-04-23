/* jshint worker: true */

// API
// { method: scrypt, args: [pin: UTF8, salt: hex, N: int] }

importScripts('triplesec.js')

var scrypt = function(pin, salt, time_factor, memory_factor) {
    var pinWordArray = triplesec.WordArray.from_utf8(pin)
    var saltWordArray = triplesec.WordArray.from_hex(salt)
    triplesec.scrypt({key: pinWordArray, salt: saltWordArray, dkLen: 32, r: memory_factor, N: time_factor}, (key) => {
        pinWordArray.scrub()
        self.postMessage({'result': key.to_ui8a()})
        key.scrub()
    })
}

self.onmessage = function(e) {
    if(e.data.method === 'scrypt') { scrypt.apply(null, e.data.args) }
}
