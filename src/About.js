import * as DetailsComponent from './DetailsComponent.js'

let _ = document.webL10n.get

export const view = function() {
    return m('div#view', [
        m('div#title', [
            m('span.fa.fa-chevron-left.title-button.left', { onclick: () => history.back() }),
            m('span', _('%about')),
        ]),
        m('section#welcome-pane', [
            m('section.textblock', [
                m('h1', 'Carbon Fox'),
                m('h2', 'Details'),
                DetailsComponent.getDetailsComponent()
            ])
        ])
    ])
}

export const controller = function() {}
