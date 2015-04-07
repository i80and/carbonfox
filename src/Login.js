import * as SecureStorage from './SecureStorage.js'
import * as Floater from './Floater.js'

let pinDisplayList = []
let pinList = []
let isBusy = false

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

class ViewModel {
    input(value) {
        pinDisplayList.push('•')
        pinList.push(value)
    }

    backspace() {
        pinDisplayList.pop()
        pinList.pop()
    }

    clear() {
        pinDisplayList = []
        pinList = []
    }

    login() {
        if(isBusy) { return }

        if(pinList.length === 0) { return }
        if(isStupidPassword(pinList)) {
            Floater.message('PIN too simple')
            this.clear()
            return
        }

        isBusy = true
        SecureStorage.theSecureStorage.unlock(pinList.join('')).then(() => {
            isBusy = false
            m.route('/view')
        }, (err) => {
            console.error(err)
            let message = err.message
            if(err.name === 'BadSignature') {
                message = 'Incorrect PIN'
            }

            Floater.message(message)
            isBusy = false
        })

        this.clear()
    }
}

let vm = null

export const view = function() {
    return m('div#view', [
        m('div#title', 'Carbon Fox'),
        m('section#loginPane', [
        m('div#lock-pane-input', {class: (pinDisplayList.length === 0)? 'empty' : ''},
            pinDisplayList.join(' ') || (isBusy ? 'Checking your PIN...' : 'Enter PIN')),
        m('a#login-button.fa.fa-unlock.round-button', {
            class: isBusy? 'fa-spin' : '',
            onclick: () => vm.login()}),
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
                    m('div.backspace', 'Bkspace'), m('div', m.trust('&#160;'))
                ]),
            ]),
        ])])
    ])
}

export const controller = function() {
    vm = new ViewModel()
}
