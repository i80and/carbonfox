import * as SecureStorage from './SecureStorage.js'
import * as Floater from './Floater.js'
import * as GeneratorDict from './GeneratorDict.js'

let _ = document.webL10n.get

class ViewModel {
    constructor(mode, id) {
        this.mode = m.prop(mode)
        this.domain = m.prop('')
        this.username = m.prop('')
        this.password = m.prop('')

        this.secret = m.prop('')
        this.digits = m.prop(6)
        this.intervalSeconds = m.prop(30)
        this.hash = m.prop('sha1')

        if(id !== undefined) {
            this.editingEntry = SecureStorage.theSecureStorage.cache.get(id).clone()
        } else {
            this.editingEntry = new SecureStorage.SecureEntry({})
        }

        this.domain(this.editingEntry.domain)
        this.username(this.editingEntry.username)

        if(this.editingEntry.haveTotp()) {
            this.secret(this.editingEntry.totp.secret)
        }
    }

    generate() {
        m.startComputation()
        GeneratorDict.init().then(() => {
            let result = []
            for(let i = 0; i < 4; i += 1) {
                result.push(GeneratorDict.getWord())
            }

            this.password(result.join(' '))
            m.endComputation()
        }, (err) => {
            console.error(err)
            m.endComputation()
        })
    }

    delete() {
        if(this.editingEntry === null) {
            return
        }

        if(window.confirm('Are you sure you want to delete this password?')) {
            SecureStorage.theSecureStorage.delete(this.editingEntry).then(() => {
                Floater.message(_('%deleted'))
                history.back()
            }, (err) => {
                console.error(err)
                Floater.message(_('%error-deleting'))
            })
        }
    }

    save() {
        if(this.domain() === '' || this.username() === '') { return }

        this.editingEntry.domain = this.domain()
        this.editingEntry.username = this.username()
        this.editingEntry.password = this.password()

        if(this.mode() === 'totp' && this.secret()) {
            if(!this.editingEntry.haveTotp()) {
                this.editingEntry.totp = new SecureStorage.TotpEntry({
                    secret: this.secret(),
                    digits: this.digits(),
                    timestep: this.intervalSeconds() * 1000,
                    hash: this.hash()
                })
            } else {
                this.editingEntry.totp.secret = this.secret()
                this.editingEntry.totp.digits = this.digits()
                this.editingEntry.totp.timestep = this.intervalSeconds() * 1000
                this.editingEntry.totp.hash = this.hash()
            }
        }

        SecureStorage.theSecureStorage.save(this.editingEntry).then(() => {
            Floater.message(_('%saved'))
            history.back()
        }).catch((err) => {
            console.error(err)
            if(err.name === 'conflict') {
                Floater.message(_('%already-exists'))
            } else if(err.name !== undefined) {
                Floater.message(`${_('%error')}: ${err.name}`)
            }
        })
    }
}

let vm = null

export const view = function() {
    return m('div#view', [
        m('div#title', [
            m('span.fa.fa-chevron-left.title-button.left', {onclick: () => history.back()}),
            m('span', _('%edit-title')),
            m('span.fa.fa-check.title-button.right', {onclick: () => vm.save()}),
        ]),
        m('section#add-password-pane', [
            m('input[type="text"]', {
                placeholder: _('%placeholder-website'),
                onchange: m.withAttr('value', vm.domain), value: vm.domain()}),
            m('input[type="text"]', {
                placeholder: _('%placeholder-username'),
                onchange: m.withAttr('value', vm.username),
                value: vm.username()}),
            m('div.vspacer'),

            m('h2', 'Password'),
            m('textarea', {
                rows: 3,
                wrap: 'hard',
                placeholder: _('%placeholder-password'),
                onchange: m.withAttr('value', vm.password),
                value: vm.password()}),
            m('button', {onclick: () => vm.generate()}, _('%generate')),
            m('div.vspacer'),

            m('div', {
                style: {display: (vm.mode() === 'totp')? 'block' : 'none'}
            }, [
                m('h2', 'Time-Based Authentication'),
                m('input', {
                    type: 'input',
                    placeholder: 'secret',
                    onchange: m.withAttr('value', vm.secret),
                }),
                m('button', 'QR Code')
            ]),
            m('div.vspacer'),
            (vm.editingEntry === null)?
                null
                : m('button.danger', {
                    onclick: () => vm.delete()}, _('%delete'))
        ])
    ])
}

export const controller = function() {
    vm = new ViewModel(m.route.param('mode'), m.route.param('id'))
}
