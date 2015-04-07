export class Floater {
    constructor(el) {
        this.floater = el
        this.floaterTimeout = 0
    }

    message(msg) {
        this.floater.className = this.floater.className.replace('hidden', '')
        this.floater.innerHTML = msg

        if(this.floaterTimeout !== 0) {
            window.clearTimeout(this.floaterTimeout)
            this.floaterTimeout = 0
        }

        this.floaterTimeout = window.setTimeout(() => {
            this.floater.className += ' hidden'
        }, 3000)
    }
}

let theFloater = null

export function init() {
    theFloater = new Floater(document.getElementById('floating-message'))
}

export const message = (msg) => theFloater.message(msg)
