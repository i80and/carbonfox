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

    // If the user switches away, we should lock the password database
    let lockingTimeout = null

    // Lock the database if we're hidden for over 20 seconds
    document.addEventListener('visibilitychange', () => {
        if(document.hidden) {
            if(lockingTimeout !== null) { return }

            lockingTimeout = window.setTimeout(() => {
                SecureStorage.theSecureStorage.lock()
                lockingTimeout = null
            }, 10 * 1000)
        } else {
            if(lockingTimeout !== null) {
                window.clearTimeout(lockingTimeout)
            }
        }
    })

    SecureStorage.theSecureStorage.onlock = () => {
        m.route('/login')
    }
})
