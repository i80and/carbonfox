let _ = document.webL10n.get

export const view = function() {
    return m('div#view', [
        m('div#title', _('%welcome-title')),
        m('section#welcomePane', [
            m('h1', _('%welcome-welcome')),
            m('p', _('%welcome-para-early')),
            m('p', _('%welcome-para-setup-pin')),
            m('a.bb-button.recommend', {href: '?/login'}, _('%get-started'))
        ])
    ])
}

export const controller = function() {}
