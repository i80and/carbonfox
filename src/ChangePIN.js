import * as Login from './Login.js'
import * as SecureStorage from './SecureStorage.js'
import * as Floater from './Floater.js'

let _ = document.webL10n.get
let vm = null

class ViewModel extends Login.ViewModel {
    login() {
        // First create a new database
        // We shouldn't ever need the random element, but hey, a global namespace
        // is a global namespace is a collision.
        const now = (new Date()).valueOf()
        const randBuf = new Uint32Array(1)
        crypto.getRandomValues(randBuf)
        const newDBName = `carbonfox-${now}-${randBuf[0]}`

        // XXX We should make sure we're not overwriting an existing database,
        // as impossible as that is.

        this.isBusy(true)
        m.startComputation()
        const newDB = new SecureStorage.SecureStorage(newDBName)
        let waiting = []
        newDB.unlock(this.pinList.join('')).then(() => {
            for(let entry of SecureStorage.theSecureStorage.iterate()) {
                waiting.push(SecureStorage.theSecureStorage.unlockEntry(entry).then((unlocked) => {
                    return newDB.save(unlocked)
                }))
            }

            return Promise.all(waiting)
        }).then(() => {
            // Switch to our new database, and destroy the old one
            localStorage.setItem('dbName', newDBName)
            return SecureStorage.theSecureStorage.destroy()
        }).then(() => {
            SecureStorage.theSecureStorage = newDB
            Floater.message(_('%pin-changed'))
            this.isBusy(false)
            m.endComputation()
            m.route('/view')
        }).catch((err) => {
            console.error('Error', err)
            Floater.message(_('%error'))
            this.isBusy(false)
            m.endComputation()
        })

        this.clear()
        m.redraw()
    }
}

export let view = null

export const controller = function() {
    vm = new ViewModel()
    view = Login.viewFactory(vm, {goIcon: 'fa-check', oncancel: () => {
        m.route('/view')
    }})
}
