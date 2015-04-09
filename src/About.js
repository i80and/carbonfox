let _ = document.webL10n.get

export const view = function() {
    return m('div#view', [
        m('div#title', _('%welcome-title'))
    ])
}

export const controller = function() {}
