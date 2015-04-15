import * as util from './util.js'
import * as CryptoTools from './CryptoTools.js'

export const timeFactor = 16

// A semi-random ID generator that creates extents of strictly increasing
// values. Designed to create well-balanced and efficient CouchDB B-Trees.
class SequentialID {
    constructor() {
        this.seq = 0
        this._reinit()
    }

    _reinit() {
        const prefix = new Uint8Array(13)
        crypto.getRandomValues(prefix)
        this.prefix = triplesec.WordArray.from_ui8a(prefix).to_hex()

        this.seq = 0
    }

    getNext() {
        if(this.seq >= 0xfff000) {
            this._reinit()
        }

        this.seq += util.randInt(1, 4095)
        return this.prefix + this.seq.toString(16)
    }
}

// A single password database entry. The password field is kept encrypted
// even after a SecureEntry is returned.
export class SecureEntry {
    constructor(options) {
        this.domain = options.domain
        this.username = options.username
        this.password = options.password || null
        this.cipherPassword = options.cipherPassword || null
        this.salt = options.salt || null
        this.comment = options.comment || ''

        this._id = options._id || undefined
        this._rev = options._rev || undefined

        if(this.domain === undefined ||
            this.username === undefined) {
            throw util.error('ValueError', 'Bad SecureEntry', this)
        }
    }

    static fromDocument(doc) {
        return new SecureEntry(doc)
    }

    isLocked() {
        return this.password === null
    }

    unlock(key) {
        if(!this.isLocked()) {
            return new Promise((resolve) => { resolve(this) })
        }

        if(this.salt === null) {
            throw util.error('ValueError', 'No salt stored')
        }

        const salt = triplesec.WordArray.from_hex(this.salt)

        return new Promise((resolve) => {
            return resolve(CryptoTools.pbkdf2(key, salt, 1))
        }).then((derivedKey) => {
            const input = triplesec.WordArray.from_hex(this.cipherPassword)
            const msg = CryptoTools.unbox(derivedKey, input)
            this.password = msg.to_utf8()
            msg.scrub()

            return this
        })
    }

    lock(key) {
        if(this.isLocked()) {
            return new Promise((resolve) => { resolve(this) })
        }

        const salt = CryptoTools.generateRandom(CryptoTools.saltSize * 4)
        this.salt = salt.to_hex()
        const iv = CryptoTools.generateRandom(CryptoTools.IVSize * 4)

        return new Promise((resolve) => {
            resolve(CryptoTools.pbkdf2(key, salt, 1))
        }).then((derivedKey) => {
            const input = triplesec.WordArray.from_utf8(this.password)
            const ciphertext = CryptoTools.box(derivedKey, iv, input)

            this.cipherPassword = ciphertext.to_hex()
            this.password = null
            input.scrub()

            return this
        })
    }

    getID() {
        return this.domain + ':' + this.username
    }
}

// A database of password entries
export class SecureStorage {
    constructor(name) {
        this.db = new PouchDB(name)
        this.idGenerator = new SequentialID()
        this.key = null

        this.cache = new Map()
        this.onlock = function() {}
    }

    isSetup() {
        return localStorage.getItem('salt') !== null
    }

    destroy() {
        this.db.destroy()
    }

    save(entry) {
        if(entry._id === undefined) {
            entry._id = this.idGenerator.getNext()
        }

        return entry.lock(this.key).then(() => {
            const nonce = CryptoTools.generateRandom(CryptoTools.IVSize * 4)
            const msgWordArray = triplesec.WordArray.from_utf8(JSON.stringify(entry))
            const ciphertext = CryptoTools.box(this.key, nonce, msgWordArray)
            msgWordArray.scrub()

            return this.db.put({
                _id: entry._id,
                _rev: entry._rev,
                entry: ciphertext.to_hex(),
            })
        }).then((result) => {
            entry._rev = result.rev
            this.cache.set(entry._id, entry)
        })
    }

    unlock(pin) {
        let storedSalt = window.localStorage.getItem('salt')
        let masterKey = null

        if(storedSalt === null) {
            const salt = CryptoTools.generateRandom(CryptoTools.saltSize * 4)
            storedSalt = salt.to_hex()
            window.localStorage.setItem('salt', storedSalt)

            // Generate a master key, since this is a new account
            masterKey = CryptoTools.generateRandom(32)
            window.localStorage.setItem('masterKey', masterKey.to_hex())
        } else {
            const storedMasterKey = window.localStorage.getItem('masterKey')
            masterKey = triplesec.WordArray.from_hex(storedMasterKey)
        }

        return CryptoTools.scrypt(pin, storedSalt, 16).then((key) => {
            // XXX I am led to believe that it is safe to use SHA256(k1 .. k2)
            // as a KDF, so long as k1 and k2 are of the same length. But
            // somebody should check this.
            this.key = key.clone()
            this.key.concat(masterKey)
            this.key = (new triplesec.hash.SHA256()).finalize(this.key)

            triplesec.util.scrub_vec(masterKey)

            // Read the database
            return this.refresh()
        })
    }

    lock() {
        if(this.key !== null) { this.key.scrub() }
        this.key = null
        this.cache.clear()
        this.onlock()
    }

    refresh() {
        return new Promise((resolve, reject) => {
            this.db.allDocs({include_docs: true}).then((result) => {
                this.cache.clear()
                for(let row of result.rows) {
                    try {
                        const ciphertext = triplesec.WordArray.from_hex(row.doc.entry)
                        const msg = CryptoTools.unbox(this.key, ciphertext).to_utf8()
                        const parsed = JSON.parse(msg)
                        parsed._id = row.doc._id
                        parsed._rev = row.doc._rev
                        const entry = SecureEntry.fromDocument(parsed)
                        this.cache.set(entry._id, entry)
                    } catch(e) {
                        return reject(e)
                    }
                }

                return resolve(this.cache)
            }, (err) => {
                return reject({name: 'DBError', message: 'Database Error: ' + err.message, err: err})
            })
        })
    }

    // Returns an iterator yielding (entry, f) pairs, where f returns a Promise
    // that will unlock entry. This should be a proper ES6 iterator, but that
    // requires Symbol.
    iterate() {
        return util.map(this.cache.values(), (entry) => {
            return [entry, () => entry.unlock(this.key)]
        })
    }

    delete(entry) {
        if(entry._rev === undefined) {
            return new Promise((resolve, reject) =>
                reject(util.error('ValueError', 'Cannot delete incomplete SecureEntry')))
        }

        return this.db.remove(entry._id, entry._rev).then(() => {
            this.cache.delete(entry._id)
        })
    }
}

export let theSecureStorage = null

export function init() {
    let dbName = self.localStorage.getItem('dbName')

    if(dbName === null) {
        dbName = 'carbonfox'
        self.localStorage.setItem('dbName', dbName)
    }

    theSecureStorage = new SecureStorage(dbName)
}
