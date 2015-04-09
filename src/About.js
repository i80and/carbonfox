let _ = document.webL10n.get

export const view = function() {
    return m('div#view', [
        m('div#title', _('%about')),
        m('section#welcome-pane', [
            m('section.textblock', [
                m('h1', 'Carbon Fox'),
            ]),
            m('div.vspacer'),
            m('a.bb-button.recommend', {
                onclick: () => {
                    console.log('back')
                    history.back()
                }
            }, _('%back'))
        ])
    ])
}

export const controller = function() {}
