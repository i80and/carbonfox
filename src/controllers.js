import * as util from './util.js'
import * as SecureStorage from './SecureStorage.js'

const carbonControllers = angular.module('carbonControllers', [])

carbonControllers.controller('FloatingMessageController', function($scope, $rootScope) {
    $scope.floater = document.getElementById('floating-message')
    $scope.floaterTimeout = 0

    $rootScope.$on('show-message', function(event, message) {
        $scope.floater.className = $scope.floater.className.replace('hidden', '')
        $scope.floater.innerHTML = message

        if($scope.floaterTimeout !== 0) {
            window.clearTimeout($scope.floaterTimeout)
            $scope.floaterTimeout = 0
        }

        $scope.floaterTimeout = window.setTimeout(function() {
            $scope.floater.className += ' hidden'
        }, 3000)
    })})

carbonControllers.controller('WelcomeController', function() {})

carbonControllers.controller('LoginController', function($scope, $rootScope, $location) {
    $scope.pinDisplayList = []
    $scope.pinList = []
    $scope.isBusy = false

    // A few super-trivial checks for horrible PINs
    const isStupidPassword = function(passwordList) {
        if(passwordList.length <= 3) {
            return true
        }

        // Check if all elements are the same
        const firstElement = passwordList[0]
        let isAllSame = true
        for(let i = 0; i < passwordList.length; i += 1) {
            if(passwordList[i] !== firstElement) {
                isAllSame = false
                break
            }
        }

        return isAllSame
    }

    $scope.input = function(value) {
        $scope.pinDisplayList.push('•')
        $scope.pinList.push(value)
    }

    $scope.backspace = function() {
        $scope.pinDisplayList.pop()
        $scope.pinList.pop()
    }

    $scope.clear = function() {
        $scope.pinDisplayList = []
        $scope.pinList = []
    }

    $scope.login = function() {
        if($scope.isBusy) { return }

        if($scope.pinList.length === 0) { return }
        if(isStupidPassword($scope.pinList)) {
            $rootScope.$broadcast('show-message', 'PIN too simple')
            $scope.clear()
            return
        }

        $scope.isBusy = true
        window.theSecureStorage.unlock($scope.pinList.join('')).then(() => {
            $scope.$apply(function() {
                $scope.isBusy = false
                $location.path('/view')})
        }, (err) => {
            console.error(err)
            let message = err.message
            if(err.name === 'BadSignature') {
                message = 'Incorrect PIN'
            }
            $rootScope.$broadcast('show-message', message)
            $scope.$apply(function() { $scope.isBusy = false })
        })

        $scope.clear()
    }})

carbonControllers.controller('PasswordController', function($scope, $location, $window, $document) {
    $scope.entries = []
    $scope.hidden = false

    let refreshEntries = () => {
        $scope.entries = []

        for(let kv of $window.theSecureStorage.cache) {
            const entry = kv[1]
            $scope.entries.push(entry)
        }

        $scope.entries.sort((a,b) => {
            if(a.domain > b.domain) { return 1 }
            if(a.domain < b.domain) { return -1 }
            return 0
        })
    }

    refreshEntries()

    $document[0].addEventListener('visibilitychange', function() {
        $scope.hidden = $document[0].hidden
        $scope.$apply()
    })

    $scope.add = function() {
        $location.path('/edit')
    }

    $scope.edit = function(entry) {
        $location.path(`/edit/${entry._id}`)
    }

    $scope.show = function(entry) {
        const f = entry.isLocked()? entry.unlock : entry.lock
        f.call(entry, $window.theSecureStorage.key).then(() => {
            $scope.$digest()
        }, (err) => {
            console.error(err)
        })
    }
})

carbonControllers.controller('EditPasswordController', function($scope, $rootScope, $routeParams, $location, $window) {
    $scope.domain = ''
    $scope.username = ''
    $scope.password = ''
    $scope.comment = ''
    $scope.editingEntry = null

    const makeEntry = function() {
        let _id
        let _rev

        if($scope.editingEntry !== null) {
            _id = $scope.editingEntry._id
            _rev = $scope.editingEntry._rev
        }

        return new SecureStorage.SecureEntry({
            _id: _id,
            _rev: _rev,
            domain: $scope.domain,
            username: $scope.username,
            password: $scope.password
        })
    }

    $scope.save = function() {
        if($scope.domain === '' || $scope.username === '' || $scope.password === '') { return }

        const entry = makeEntry()

        $window.theSecureStorage.save(entry).then(() => {
            $rootScope.$broadcast('show-message', 'Saved!')
            $location.path('/view')
            $scope.$apply()
        }).catch((err) => {
            console.error(err)
            if(err.name === 'conflict') {
                $rootScope.$broadcast('show-message', 'Already exists')
            } else if(err.name !== undefined) {
                $rootScope.$broadcast('show-message', `Error: ${err.name}`)
            }
        })
    }

    $scope.generate = function() {
        let result = []
        for(let i = 0; i < 4; i += 1) {
            // XXX Dummy corpus
            result.push(util.pick(['battery', 'horse', 'staple', 'correct']))
        }

        $scope.password = result.join(' ')
    }

    $scope.cancel = function() {
        $location.path('/view')
    }

    $scope.delete = function() {
        if($scope.editingEntry === null) {
            return
        }

        if(window.confirm('Are you sure you want to delete this password?')) {
            $window.theSecureStorage.delete($scope.editingEntry).then(() => {
                $rootScope.$broadcast('show-message', 'Deleted!')
                $location.path('/view')
                $scope.$apply()
            }, (err) => {
                console.error(err)
                $rootScope.$broadcast('show-message', 'Error deleting')
            })
        }
    }

    // If we're given an entry ID, try to load it from the cache. Otherwise,
    // do nothing and continue editing an empty entry.
    const tryLoad = function() {
        if($routeParams === null) {
            return
        }

        // We're editing an existing entry
        const entry = $window.theSecureStorage.cache[$routeParams.id]
        if(entry === undefined) {
            return
        }

        $scope.domain = entry.domain
        $scope.username = entry.username
        $scope.comment = entry.comment

        $scope.editingEntry = entry
    }

    tryLoad()
})
