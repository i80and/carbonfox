import * as util from './util.js'

// Box format, in 4-byte words
// 6    N         16
// [IV] [Message] [Signature]

export const IVSize = 6
export const SignatureSize = 16
export const saltSize = 4

export function generateRandom(nBytes) {
    const buf = new Uint8Array(nBytes)
    crypto.getRandomValues(buf)
    const result = triplesec.WordArray.from_ui8a(buf)
    triplesec.util.scrub_vec(buf)

    return result
}

export function scrypt(password, salt, m) {
    if(m === undefined) { m = 16 }

    let worker = new Worker('js/crypto_worker.js')
    worker.postMessage({method: 'scrypt', args: [password, salt, m]})

    return new Promise((resolve, reject) => {
        worker.onmessage = (msg) => {
            if(msg.data.error !== undefined) {
                reject(new Error(msg.data.error))
            }

            const result = triplesec.WordArray.from_ui8a(msg.data.result)
            triplesec.util.scrub_vec(msg.data.result)
            resolve(result)
        }
    })
}

export function pbkdf2(input, salt, iters) {
    if(iters === undefined) { iters = 50000 }

    // Triplesec is a twit here and scrubs whatever input we provide
    const ourInput = input.clone()

    return new Promise((resolve) => {
        triplesec.pbkdf2({key: ourInput, dkLen: 32, salt: salt, c: iters}, (result) => {
            ourInput.scrub()
            return resolve(result)
        })
    })
}

function salsa20(key, iv, input) {
    triplesec.ciphers.salsa20.encrypt({input: input, key: key, iv: iv})
}

// Returns a WordArray, combining the IV and ciphertext with a signature.
// Arguments remain constant.
export function box(key, iv, msg) {
    if(key.is_scrubbed()) {
        throw util.error('ValueError', 'Key is scrubbed')
    }

    if(iv.sigBytes !== (IVSize*4)) {
        throw util.error('ValueError', 'Bad IV length')
    }

    iv = iv.clone()
    msg = msg.clone()
    salsa20(key, iv, msg)

    const input = iv.concat(msg)
    const signature = triplesec.hmac.sign({key: key, input: input})

    msg.scrub()
    return signature.concat(input)
}

// Returns a WordArray containing the original plain text of the box.
// Throws an exception if signature verification fails. Arguments remain
// constant.
export function unbox(key, boxed) {
    if(boxed.sigBytes < (IVSize + SignatureSize)*4) {
        console.error(boxed.sigBytes, (IVSize + SignatureSize)*4)
        throw util.error('ValueError', 'Message too short')
    }

    boxed = boxed.clone()

    // Verify signature
    const signature = boxed.unshift(SignatureSize)
    const testSignature = triplesec.hmac.sign({key: key, input: boxed})
    if(!testSignature.equal(signature)) {
        throw util.error('BadSignature', 'Bad signature')
    }

    const iv = boxed.unshift(IVSize)
    salsa20(key, iv, boxed)
    return boxed
}
