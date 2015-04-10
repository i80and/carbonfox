function derive(counter) {
    const bytes = []
    for(let i = 0; i < 8; i += 1) {
        bytes.push(counter & 0xff)
        counter >>= 8
    }
    return triplesec.WordArray.from_ui8a(bytes.reverse())
}

function hotp(secretKey, counter, options={
        digits: 6,
        hash: 'sha1',
    }) {
    // See RFC-4226

    const digits = options.digits
    let hash = options.hash

    if(hash === 'sha1') {
        hash = triplesec.hash.SHA1
    } else if(hash === 'sha256') {
        hash = triplesec.hash.SHA256
    } else if(hash === 'sha512') {
        hash = triplesec.hash.SHA512
    } else {
        throw new Error('Unknown hash function')
    }

    // Convert our integer counter into a word array.
    const counterBitArray = derive(counter)

    // Compute the HMAC and convert it into a bytewise format easy for us to wrangle
    const rawhs = triplesec.hmac.sign({
        key: secretKey,
        input: counterBitArray,
        hash_class: hash})
    const hs = new Uint8Array(rawhs.words.length * 4)

    // Copy our big-endian words into a single-byte array
    for(let i = 0; i < rawhs.words.length; i += 1) {
        hs[i*4 + 3] = rawhs.words[i] & 0xff
        hs[i*4 + 2] = rawhs.words[i] >> 8 & 0xff
        hs[i*4 + 1] = rawhs.words[i] >> 16 & 0xff
        hs[i*4 + 0] = rawhs.words[i] >> 24 & 0xff
    }

    // Compute dynamic truncation of the HMAC's output
    const offset = hs[hs.length-1] & 0xf
    const snum = (hs[offset]  & 0x7f) << 24
           | (hs[offset+1] & 0xff) << 16
           | (hs[offset+2] & 0xff) <<  8
           | (hs[offset+3] & 0xff)

    const d = snum % (Math.pow(10, digits))
    return d
}

 export function totp(secretKey, startEpoch, now, timestepMs, options) {
    // See RFC-6238

    now = now.valueOf() / 1000
    const timestepSec = timestepMs / 1000
    const timeCounter = Math.floor((now - startEpoch) / timestepSec)
    return hotp(secretKey, timeCounter, options)
}

export function testHotp() {
    const correctResults = [
        755224,
        287082,
        359152,
        969429,
        338314,
        254676,
        287922,
        162583,
        399871,
        520489]

    const key = triplesec.WordArray.from_utf8('12345678901234567890')

    for(let i = 0; i < correctResults.length; i += 1) {
        const result = hotp(key, i)
        if(result !== correctResults[i]) {
            throw new Error(`${i}: ${result} != ${correctResults[i]}`)
        }
    }
}
