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
        stack: (new Error()).stack,
        toString: function() {
            return `Error: ${this.name}: ${this.message}\n${this.stack}`
        }
    }
}
