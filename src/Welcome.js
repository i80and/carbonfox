export const view = function() {
    return m('div#view', [
        m('div#title', 'Welcome'),
        m('section#welcomePane', [
        m('h1', 'Welcome to Carbon Fox!'),
        m('p', 'This is an early-stage prototype, but we encourage you to try it out!'),
        m('p', 'First you will set up a PIN to secure your passwords against casual thieves.'),
        m('a.bb-button.recommend', {href: '?/login'}, 'Get Started!')])
    ])
}

export const controller = function() {}
