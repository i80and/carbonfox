import * as SecureStorage from './SecureStorage.js'
import * as Floater from './Floater.js'
import * as GeneratorDict from './GeneratorDict.js'

let _ = document.webL10n.get

class ViewModel {
    constructor(id) {
        if(SecureStorage.theSecureStorage.key === null) {
            return m.route('/login')
        }

        this.editingEntry = null

        this.domain = m.prop('')
        this.username = m.prop('')
        this.password = m.prop('')

        if(id !== undefined) {
            this.editingEntry = SecureStorage.theSecureStorage.cache.get(id)
            if(this.editingEntry !== undefined) {
                this.domain(this.editingEntry.domain)
                this.username(this.editingEntry.username)

                m.startComputation()
                this.editingEntry.unlock(SecureStorage.theSecureStorage.key).then(() => {
                    this.password(this.editingEntry.password)
                    m.endComputation()
                })
            }
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

    cancel() {
        this.exit()
    }

    delete() {
        if(this.editingEntry === null) {
            return
        }

        if(window.confirm('Are you sure you want to delete this password?')) {
            SecureStorage.theSecureStorage.delete(this.editingEntry).then(() => {
                Floater.message(_('%deleted'))
                this.exit()
            }, (err) => {
                console.error(err)
                Floater.message(_('%error-deleting'))
            })
        }
    }

    save() {
        const makeEntry = () => {
            let _id
            let _rev

            if(this.editingEntry !== null) {
                _id = this.editingEntry._id
                _rev = this.editingEntry._rev
            }

            return new SecureStorage.SecureEntry({
                _id: _id,
                _rev: _rev,
                domain: this.domain(),
                username: this.username(),
                password: this.password()
            })
        }

        if(this.domain() === '' || this.username() === '' || this.password() === '') { return }

        const entry = makeEntry()

        SecureStorage.theSecureStorage.save(entry).then(() => {
            Floater.message(_('%saved'))
            this.exit()
        }).catch((err) => {
            console.error(err)
            if(err.name === 'conflict') {
                Floater.message(_('%already-exists'))
            } else if(err.name !== undefined) {
                Floater.message(`${_('%error')}: ${err.name}`)
            }
        })
    }

    exit() {
        const f = () => m.route('/view')
        if(this.editingEntry) {
            return SecureStorage.theSecureStorage.lockEntry(this.editingEntry).then(f).catch(f)
        }

        return f()
    }
}

let vm = null

export const view = function() {
    return m('div#view', [
        m('div#title', [
            m('span.fa.fa-chevron-left.title-button.left', {onclick: () => vm.cancel()}),
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
            m('textarea', {
                rows: 3,
                wrap: 'hard',
                placeholder: _('%placeholder-password'),
                onchange: m.withAttr('value', vm.password),
                value: vm.password()}),
            m('div.vspacer'),
            m('button', {onclick: () => vm.generate()}, _('%generate')),
            (vm.editingEntry === null)?
                null
                : m('button.danger', {
                    onclick: () => vm.delete()}, _('%delete'))
        ])
    ])
}

export const controller = function() {
    vm = new ViewModel(m.route.param('id'))
}
