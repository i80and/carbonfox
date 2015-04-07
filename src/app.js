import * as SecureStorage from './SecureStorage.js'
import * as Floater from './Floater.js'

// App modules
import * as Welcome from './Welcome.js'
import * as Login from './Login.js'
import * as View from './View.js'
import * as Edit from './Edit.js'

document.addEventListener('DOMContentLoaded', () => {
    window.reset = () => {
        window.localStorage.clear()
        SecureStorage.theSecureStorage.db.destroy()
    }

    Floater.init()

    const body = document.querySelector('#root-container')

    let defaultPath = '/welcome'
    if(SecureStorage.theSecureStorage.isSetup()) {
        defaultPath = '/login'
    }

    m.route(body, defaultPath, {
        '/welcome': Welcome,
        '/login': Login,
        '/view': View,
        '/edit': Edit,
        '/edit/:id': Edit
    })
})
