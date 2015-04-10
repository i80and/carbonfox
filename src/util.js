const rand_max = Math.pow(2,32) - 1

export function pick(list) {
    const crng_get = function() {
        // Return a cryptographically secure unsigned 32-bit integer
        const buf = new Uint32Array(1)
        crypto.getRandomValues(buf)
        return buf[0]
    }

    // Avoid modulo bias by looping until the RNG returns an acceptable value
    const n = list.length
    let x = crng_get()
    while(n < rand_max && x >= rand_max - (rand_max % n)) {
        x = crng_get()
    }

    return list[x % n]
}

export function randInt(lower, upper) {
    const range = upper - lower
    return lower + Math.floor(Math.random() * (range + 1))
}

// Lightweight custom error generator
export function error(name, message) {
    return {
        name: name,
        message: message,
        stack: (new Error()).stack
    }
}

// Map function for iterators
export function* map(it, f) {
    for(let x of it) {
        yield f(x)
    }
}

// XXX This function is a mess
export function base32Decode(input) {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

    let bits = 0
    let curByte = 0
    let curWord = 0
    let wordOffset = 0
    let result = []

    for(let i = 0; i < input.length; i += 1) {
        // Ignore tail padding
        if(input[i] === '=') {
            break
        }

        let x = ALPHABET.indexOf(input[i])
        if(x < 0) {
            throw new Error('Invalid base32')
        }

        x <<= 3
        curByte |= x >>> bits
        bits += 5
        if(bits >= 8) {
            curWord |= curByte << 8
            wordOffset += 1
            result.push(curByte)
            bits -= 8
            if(bits > 0) {
                curByte = x << (5 - bits) & 255
            } else {
                curByte = 0
            }
        }
    }

    // Convert into a hex string
    let output = ''
    for(let i = 0; i < result.length; i += 1) {
        output += result[i].toString(16)
    }

    return triplesec.WordArray.from_hex(output)
}

export function incrementer(start) {
    let i = start
    return () => {
        const result = i
        i += 1
        return result
    }
}
