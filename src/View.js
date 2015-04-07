import * as SecureStorage from './SecureStorage.js'

class ViewModel {
    constructor() {
        this.hidden = false
        this.entries = []

        for(let kv of SecureStorage.theSecureStorage.cache) {
            const entry = kv[1]
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
}

var vm = null

document.addEventListener('visibilitychange', () => {
    if(vm === null) { return }

    m.startComputation()
    vm.hidden = document.hidden
    m.endComputation()
})

export const view = function() {
    return m('div#view', [
        m('div#title', 'Carbon Fox'),
        m('section#passwordPane', [
            m('div#search-bar', [
                m('ul', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map((letter) => {
                    return m('li', letter)
                }))
            ]),

            m('ul#entry-list', vm.entries.map((entry) => {
                return m('li', {
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
        ])
    ])
}

export const controller = function() {
    vm = new ViewModel()
}
