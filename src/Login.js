import * as SecureStorage from './SecureStorage.js'
import * as Floater from './Floater.js'

let _ = document.webL10n.get

// A few super-trivial checks for horrible PINs
function isStupidPassword(passwordList) {
    if(passwordList.length <= 3) {
        return true
    }

    // Check if all elements are the same
    const firstElement = passwordList[0]
    let isAllSame = true
    for(let i = 0; i < passwordList.length; i += 1) {
        if(passwordList[i] !== firstElement) {
            isAllSame = false
            break
        }
    }

    return isAllSame
}

export class ViewModel {
    constructor() {
        this.keypadMode = m.prop(true)
        this.isBusy = m.prop(false)
        this.pinDisplayList = []
        this.pinList = []
    }

    input(value) {
        if(!this.keypadMode()) {
            this.pinDisplayList = value.split('')
            this.pinList = value.split('')
            return
        }

        this.pinDisplayList.push('•')
        this.pinList.push(value)
    }

    backspace() {
        if(!this.keypadMode()) { return }

        this.pinDisplayList.pop()
        this.pinList.pop()
    }

    clear() {
        this.pinDisplayList = []
        this.pinList = []
    }

    // Entry point for checking a PIN; this method simply checks the PIN's
    // quality, and then calls the login() method, which should be overridden
    // by any consumers of this view model.
    go() {
        if(this.isBusy()) { return }

        if(this.pinList.length === 0) { return }
        if(isStupidPassword(this.pinList)) {
            Floater.message(_('%simple-pin'))
            this.clear()
            return
        }

        this.login()
    }

    login() {
        this.isBusy(true)
        m.startComputation()
        SecureStorage.theSecureStorage.unlock(this.pinList.join('')).then(() => {
            this.isBusy(false)
            m.route('/view')
            m.endComputation()
        }, (err) => {
            console.error(err)
            let message = err.message
            if(err.name === 'BadSignature') {
                message = _('%bad-pin')
            }

            Floater.message(message)
            this.isBusy(false)
            m.endComputation()
        })

        this.clear()
        m.redraw()
    }
}

let vm = null

export function viewFactory(vm, options = {
        goIcon: 'fa-unlock',
        oncancel: null
    }) {
    return function() {
        return m('div#view', [
            m('div#title', _('%login-title')),
            m('section#loginPane', {class: vm.keypadMode()? 'keypad' : ''}, [
            m('form', [
                m('button#cancel.fa.fa-chevron-left', {
                    style: {display: options.oncancel === null? 'none' : 'unset'},
                    onclick: options.oncancel
                }),
                m('input#lock-pane-input', {
                        type: 'password',
                        oninput: function() {
                            if(!vm.keypadMode()) {
                                vm.input(this.value)
                            }
                        },
                        placeholder: (vm.isBusy()? _('%checking-pin') : _('%enter-pin')),
                        class: (vm.pinDisplayList.length === 0)? 'empty' : '',
                        value: vm.pinDisplayList.join('') || '',
                        onfocus: () => {
                            vm.keypadMode(false)
                        }
                    }),
                m(`button#login-button.fa.${options.goIcon}.round-button`, {
                    type: 'submit',
                    class: vm.isBusy()? 'fa-spin' : '',
                    onclick: () => {
                        vm.go()
                        return false
                    }}),
            ]),
            m('div#keypad', [
                m('section', [
                    m('a', {onclick: vm.input.bind(vm, 1)}, [
                        m('div', 1), m('div', m.trust('&#160;'))
                    ]),
                    m('a', {onclick: vm.input.bind(vm, 2)}, [
                        m('div', 2), m('div', 'abc')
                    ]),
                    m('a', {onclick: vm.input.bind(vm, 3)}, [
                        m('div', 3), m('div', 'def')
                    ]),
                ]),
                m('section', [
                    m('a', {onclick: vm.input.bind(vm, 4)}, [
                        m('div', 4), m('div', 'ghi')
                    ]),
                    m('a', {onclick: vm.input.bind(vm, 5)}, [
                        m('div', 5), m('div', 'jkl')
                    ]),
                    m('a', {onclick: vm.input.bind(vm, 6)}, [
                        m('div', 6), m('div', 'mno')
                    ]),
                ]),
                m('section', [
                    m('a', {onclick: vm.input.bind(vm, 7)}, [
                        m('div', 7), m('div', 'pqr')
                    ]),
                    m('a', {onclick: vm.input.bind(vm, 8)}, [
                        m('div', 8), m('div', 'tuv')
                    ]),
                    m('a', {onclick: vm.input.bind(vm, 9)}, [
                        m('div', 9), m('div', 'wxyz')
                    ]),
                ]),
                m('section', [
                    m('a'),
                    m('a', {onclick: vm.input.bind(vm, 0)}, [
                        m('div', 0), m('div', m.trust('&#160;'))
                    ]),
                    m('a', {onclick: () => vm.backspace()}, [
                        m('div.backspace', _('%backspace')), m('div', m.trust('&#160;'))
                    ]),
                ]),
            ])])
        ])
    }
}

export let view = null

export const controller = function() {
    vm = new ViewModel()
    view = viewFactory(vm)
}
