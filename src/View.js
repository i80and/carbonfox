import * as SecureStorage from './SecureStorage.js'
import * as util from './util.js'

const _ = document.webL10n.get

class EntryViewModel {
    constructor(entry) {
        this.entry = entry
    }

    isLocked() { return this.entry.isLocked() }
    unlock(key) { return this.entry.unlock(key) }
    lock(key) { return this.entry.lock(key) }
    haveTotp() { return this.entry.haveTotp() }
    get _id() { return this.entry._id }
    get _rev() { return this.entry._rev }
    get domain() { return this.entry.domain }
    get username() { return this.entry.username }
    get password() { return this.entry.password }
    get cipherPassword() { return this.entry.cipherPassword }
    get salt() { return this.entry.salt }
    get totp() { return this.entry.totp }
    get comment() { return this.entry.comment }

    progressStyle() {
        if(this.haveTotp()) {
            return {
                'animationDuration': ((this.totp.msUntilNextRefresh()) / 1000) + 's'
            }
        } else {
            return {}
        }
    }

    getView(key) {
        return m('div', [
            m('div', [
                m('div', this.isLocked()? this.entry.domain : this.entry.password),
                    m('div', this.isLocked()? this.entry.username : ''),
                    m('div.totp', {
                        style: this.progressStyle(),
                        key: key
                    },
                    this.isLocked()? '' : (this.entry.haveTotp()? this.entry.totp.get() : '')),
                ]),
                m('div.lock-icon.fa', {class: this.isLocked()? 'fa-lock' : 'fa-unlock'}),
            ])
    }
}

class ViewModel {
    constructor(mode) {
        this.hidden = m.prop(false)
        this.entries = []
        this.menuVisible = m.prop(false)
        this.totpMode = m.prop(mode === 'totp')

        // The number of TOTP-bearing entries currently open. If this is zero,
        // we don't need to redraw every refresh period.
        this.totpVisible = m.prop(0)

        // Coalesce TOTP timers
        this.refreshIntervals = new Map()

        for(let kv of SecureStorage.theSecureStorage.iterate()) {
            const entry = new EntryViewModel(kv[0])
            this.entries.push(entry)

            if(entry.haveTotp()) {
                const timestep = entry.totp.timestep
                if(!this.refreshIntervals.has(timestep)) {
                    this.refreshIntervals.set(timestep, [])
                }

                this.refreshIntervals.get(timestep).push(entry)
            }

            if(!entry.isLocked()) {
                this.totpVisible(this.totpVisible() + 1)
            }
        }

        // Sort entries by domain
        this.entries.sort((a,b) => {
            if(a.entry.domain > b.entry.domain) { return 1 }
            if(a.entry.domain < b.entry.domain) { return -1 }
            return 0
        })

        // Start our TOTP interval timers
        const redraw = () => {
            if(this.totpVisible() > 0) {
                m.redraw()
            }
        }
        this.redrawIntervalID = null

        for(let [t,v] of this.refreshIntervals) {
            v[0].totp.nextRefresh().then(() => {
                redraw()

                this.redrawIntervalID = self.setInterval(() => {
                    redraw()
                }, t)
            })
        }
    }

    show(entry) {
        const f = entry.isLocked()? entry.unlock : entry.lock

        if(entry.haveTotp()) {
            if(entry.isLocked()) { this.totpVisible(this.totpVisible() + 1) }
            else { this.totpVisible(this.totpVisible() - 1) }
        }

        m.startComputation()
        f.call(entry, SecureStorage.theSecureStorage.key).then(() => {
            m.endComputation()
        }, (err) => {
            console.error(err)
            m.endComputation()
        })
    }

    mode() {
        return this.totpMode()? 'totp' : 'password'
    }

    add() {
        m.route(`/edit/${this.mode()}`)
    }

    edit(entry) {
        m.route(`/edit/${this.mode()}/${entry._id}`)
    }

    // Scroll the view such that domains starting with a given letter are visible
    scrollTo(letter) {
        // Incredibly ugly hack that only works for ASCII characters and would be
        // slow if there weren't only 27 possible characters.
        const getPrevLetter = (letter) => {
            if(letter === '#') { return 'Z' }
            const codePoint = letter.codePointAt(0)
            if(codePoint > 'Z'.codePointAt(0) || codePoint < 'A'.codePointAt(0)) {
                return 'A'
            }

            return String.fromCodePoint(codePoint - 1)
        }

        const el = document.getElementById(`letter-${letter}`)
        if(el === null) {
            // Try the previous letter
            if(letter !== 'A') {
                return this.scrollTo(getPrevLetter(letter))
            }

            // No entries that we know how to index
            return
        }

        el.scrollIntoView(false)
    }

    toggleMenu() {
        this.menuVisible(!this.menuVisible())
    }

    changePIN() {
        if(window.confirm(_('%change-pin-confirm'))) {
            m.route('/changepin')
        }
    }

    toggleTotp() {
        this.totpMode(!this.totpMode())
        window.localStorage.setItem('viewMode', this.mode())
        this.menuVisible(false)
    }
}

var vm = null

document.addEventListener('visibilitychange', () => {
    if(vm === null) { return }

    m.startComputation()
    vm.hidden(document.hidden)
    m.endComputation()
})

export const view = function() {
    // Create a list of entries with one per starting letter
    let letterIndex = {}
    let entryIndex = {}
    for(let entry of vm.entries) {
        if(entry.length === 0) { continue }

        let letter = entry.domain[0].toUpperCase()
        if(/[0-9]/.test(letter)) { letter = '#' }

        if(letterIndex[letter] === undefined) {
            letterIndex[letter] = entry
            entryIndex[entry._id] = letter
        }
    }

    const getIdForElement = (entry) => {
        const letter = entryIndex[entry._id]
        return (letter === undefined)?
            `entry-${entry._id}` :
            `letter-${entryIndex[entry._id]}`
    }

    // To ensure that TOTP timeout animations restart properly, we give each
    // virtual element a unique key.
    const incrementer = util.incrementer(Math.random())

    return m('div#view', [
        m('div#title', [
            m('span', _('%view-title')),
            m('span#settings-icon.title-button.right.fa.fa-gear', {
                onclick: () => vm.toggleMenu(),
                class: vm.menuVisible()? 'open' : ''
            })
        ]),
        m('section#passwordPane', [
            m('div#search-bar', [
                m('ul', '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
                    return m('li', {
                        onclick: () => vm.scrollTo(letter)
                    }, letter)
                }))
            ]),

            m('ul#entry-list', vm.entries.map((entry) => {
                return m('li', {
                    id: getIdForElement(entry),
                    style: vm.hidden()? {visibility: 'hidden'} : {},
                    onclick: () => {
                        vm.show(entry)
                    },
                    oncontextmenu: (ev) => {
                        ev.preventDefault()
                        vm.edit(entry)
                    }}, [
                    entry.getView(incrementer())
                ])
            })),

            m('a#add-button.round-button.fa.fa-plus', {onclick: () => vm.add()})
        ]),
        m('ul#sidebar', {
            class: vm.menuVisible()? 'open' : ''
        }, [
            m('li', {onclick: () => vm.toggleTotp()}, [
                m('span.fa', {class: vm.totpMode()? 'fa-toggle-on' : 'fa-toggle-off'}),
                m('span', 'Time-based Authenticator')]),
            m('li.spacer'),
            m('li', {onclick: () => vm.changePIN()}, [
                m('span.fa.fa-key'),
                _('%change-pin')]),
            m('li', {onclick: () => m.route('/about')}, [
                m('span.fa.fa-question'),
                _('%about')])
        ])
    ])
}

export const controller = function() {
    let mode = window.localStorage.getItem('viewMode')
    if(mode === null) { mode = 'password' }
    vm = new ViewModel(mode)

    this.onunload = function() {
        self.clearInterval(vm.redrawIntervalID)
    }
}
