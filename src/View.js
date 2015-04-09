import * as SecureStorage from './SecureStorage.js'

let _ = document.webL10n.get

class ViewModel {
    constructor() {
        this.hidden = false
        this.entries = []
        this.menuVisible = m.prop(false)

        for(let kv of SecureStorage.theSecureStorage.iterate()) {
            const entry = kv[0]
            this.entries.push(entry)
        }

        this.entries.sort((a,b) => {
            if(a.domain > b.domain) { return 1 }
            if(a.domain < b.domain) { return -1 }
            return 0
        })
    }

    show(entry) {
        const f = entry.isLocked()? entry.unlock : entry.lock

        m.startComputation()
        f.call(entry, SecureStorage.theSecureStorage.key).then(() => {
            m.endComputation()
        }, (err) => {
            console.error(err)
            m.endComputation()
        })
    }

    add() {
        m.route('/edit')
    }

    edit(entry) {
        m.route(`/edit/${entry._id}`)
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
}

var vm = null

document.addEventListener('visibilitychange', () => {
    if(vm === null) { return }

    m.startComputation()
    vm.hidden = document.hidden
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

    return m('div#view', [
        m('div#title', [
            m('span', _('%view-title')),
            m('span#settings-icon.fa.fa-gear', {
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
                    style: vm.hidden? {visibility: 'hidden'} : {},
                    onclick: () => vm.show(entry),
                    oncontextmenu: (ev) => {
                        ev.preventDefault()
                        vm.edit(entry)
                    }}, [
                    m('div', [
                        m('div', [
                            m('div', entry.isLocked()? entry.domain : entry.password),
                            m('div', entry.isLocked()? entry.username : ''),
                        ]),
                        m('div.lock-icon.fa', {class: entry.isLocked()? 'fa-lock' : 'fa-unlock'}),
                    ])
                ])
            })),

            m('a#add-button.round-button.fa.fa-plus', {onclick: () => vm.add()})
        ]),
        m('ul#sidebar', {
            class: vm.menuVisible()? 'open' : ''
        }, [
            m('li', {onclick: () => vm.changePIN()}, [
                m('span.fa.fa-key'),
                _('%change-pin')]),
            m('li', [
                m('span.fa.fa-question'),
                m('a', {href: '?/about'}, _('%about'))])
        ])
    ])
}

export const controller = function() {
    vm = new ViewModel()
}
