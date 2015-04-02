import * as SecureStorage from './SecureStorage.js'
window.theSecureStorage = SecureStorage.theSecureStorage

let defaultPath = '/welcome'
if(SecureStorage.theSecureStorage.isSetup()) {
    defaultPath = '/login'
}

const carbonfoxApp = angular.module('carbonfoxApp', ['ngRoute', 'carbonControllers'])
carbonfoxApp.config(function($routeProvider) {
    $routeProvider.
        when('/login', {
            templateUrl: 'partials/loginPane.html',
            controller: 'LoginController'
        }).
        when('/view', {
            templateUrl: 'partials/passwordPane.html',
            controller: 'PasswordController'
        }).
        when('/edit/:id', {
            templateUrl: 'partials/editPasswordPane.html',
            controller: 'EditPasswordController'
        }).
        when('/edit', {
            templateUrl: 'partials/editPasswordPane.html',
            controller: 'EditPasswordController'
        }).
        when('/welcome', {
            templateUrl: 'partials/welcomePane.html',
            controller: 'WelcomeController'
        }).
        otherwise({
            redirectTo: defaultPath
        })
})

carbonfoxApp.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        const fn = $parse(attrs.ngRightClick)
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault()
                fn(scope, {$event:event})
            })
        })
    }
})

window.reset = function() {
    SecureStorage.theSecureStorage.db.destroy()
    localStorage.clear()
}

var lockingTimeout = null

document.addEventListener('visibilitychange', function() {
    if(document.hidden) {
        if(lockingTimeout !== null) { return }

        // Lock the database if we're hidden for over 20 seconds
        lockingTimeout = window.setTimeout(() => {
            window.theSecureStorage.lock()
            lockingTimeout = null
        }, 10 * 1000)
    } else {
        if(lockingTimeout !== null) {
            window.clearTimeout(lockingTimeout)
        }
    }
})
