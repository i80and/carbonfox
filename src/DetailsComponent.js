import * as SecureStorage from './SecureStorage.js'

export function getDetailsComponent() {
    return m('div', [
        m('p.small', 'Carbon Fox has three main layers:'),

        m('ul', [
            m('li', m('p.small', 'PIN authentication')),
            m('li', m('p.small', 'Database encryption')),
            m('li', m('p.small', 'Password field encryption'))
        ]),

        m('p.small', 'Carbon Fox allows arbitrary PINs of any length and nature. While the keypad \
        makes entering numerical PINs easy, you can tap the PIN input box to enter \
        more a more complicated PIN involving letters. We recommend you do this for \
        optimal security.'),

        m('p.small', `When you finish entering your PIN, Carbon Fox applies the salted scrypt \
        key-derivation function with parameters r=16 and N=${SecureStorage.timeFactor}. \
        This makes your PIN substantially more difficult to attack.`),

        m('p.small', 'The derived key is then hashed together with a randomly-generated 16-byte \
        master key to protect your database if you sync it with the cloud, producing \
        the final derived key: K\'\'.'),

        m('p.small', 'The database stores each entry in a "boxed" format, comprised of a random \
        Initialization Vector, a HMAC-SHA512 signature, and an XSalsa20-encrypted JSON \
        payload. When the database decrypts this payload, the password field remains \
        encrypted with a different IV and a key K\'\'\' derived from a single round of \
        PBKDF2.'),

        m('p.small', 'Storing the password in an additional layer of encryption ensures that wiping \
        the stored encryption key K\'\' from memory will render unviewed passwords \
        unreadable, since it is not possible to scrub JavaScript strings.'),

        m('p.small', 'When you close Carbon Fox, or leave it for a period of time, the database will \
        scrub the stored encryption key K\'\' so that if an assailent steals your device, \
        they cannot easily obtain the key from a memory dump.'),

        m('p.small', 'If Carbon Fox loses visibility while viewing passwords, it will immediately hide \
        them to prevent accidental leaks through an app switcher.')
    ])
}
