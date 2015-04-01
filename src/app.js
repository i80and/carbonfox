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
