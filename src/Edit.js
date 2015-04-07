import * as SecureStorage from './SecureStorage.js'
import * as Floater from './Floater.js'
import * as util from './util.js'

class ViewModel {
    constructor(id) {
        this.editingEntry = null

        this.domain = m.prop('')
        this.username = m.prop('')
        this.password = m.prop('')

        if(id !== undefined) {
            this.editingEntry = SecureStorage.theSecureStorage.cache.get(id)
            if(this.editingEntry !== undefined) {
                this.domain(this.editingEntry.domain)
                this.username(this.editingEntry.username)
            }
        }
    }

    generate() {
        let result = []
        for(let i = 0; i < 4; i += 1) {
            // XXX Dummy corpus
            result.push(util.pick(['battery', 'horse', 'staple', 'correct']))
        }

        this.password(result.join(' '))
    }

    cancel() {
        m.route('/view')
    }

    delete() {
        if(this.editingEntry === null) {
            return
        }

        if(window.confirm('Are you sure you want to delete this password?')) {
            SecureStorage.theSecureStorage.delete(this.editingEntry).then(() => {
                Floater.message('Deleted!')
                m.route('/view')
            }, (err) => {
                console.error(err)
                Floater.message('Error deleting')
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
            Floater.message('Saved!')
            m.route('/view')
        }).catch((err) => {
            console.error(err)
            if(err.name === 'conflict') {
                Floater.message('Already exists')
            } else if(err.name !== undefined) {
                Floater.message(`Error: ${err.name}`)
            }
        })
    }
}

let vm = null

export const view = function() {
    return m('div#view', [
        m('div#title', 'Password'),
        m('section#add-password-pane', [
            m('input[type="text"]', {
                placeholder: '(website)',
                onchange: m.withAttr('value', vm.domain), value: vm.domain()}),
            m('input[type="text"]', {
                placeholder: '(username)',
                onchange: m.withAttr('value', vm.username),
                value: vm.username()}),
            m('input[type="text"]', {
                placeholder: '(password)',
                onchange: m.withAttr('value', vm.password),
                value: vm.password()}),
            m('button', {onclick: () => vm.generate()}, 'Generate'),
            m('button', {onclick: () => vm.cancel()}, 'Cancel'),
            (vm.editingEntry === null)? null : m('button.danger', {onclick: () => vm.delete()}, 'Delete'),
            m('button.recommend', {onclick: () => vm.save()}, 'Save'),
        ])
    ])
}

export const controller = function() {
    vm = new ViewModel(m.route.param('id'))
}
