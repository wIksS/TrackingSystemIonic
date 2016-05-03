"use strict";

app.controller('LoginCtrl', ['$scope', '$rootScope', 'identity', 'modalService', 'auth', '$state', 'errorHandler', 'locationService', 'groupService', '$ionicHistory', 'usersService', 'signalrService',
function ($scope, $rootScope, identity, modalService, auth, $state, errorHandler, locationService, groupService, $ionicHistory, usersService, signalrService) {
    var profileModalUrl = 'templates/profile.html';
    var loginModalUrl = 'templates/login.html';

    $scope.loginModalId = modalService.getId();
    $scope.profileModalId = modalService.getId();
    $scope.isHome = $ionicHistory.currentStateName().indexOf('home') > 0;
    $scope.user = identity.getUserData();

    // Create the login and profile modals that we will use later 
    // ids must be unique
    modalService.create($scope, loginModalUrl, $scope.loginModalId);
    modalService.create($scope, profileModalUrl, $scope.profileModalId);

    // Triggered in the login modal to close it
    $scope.closeModal = function (id) {
        modalService.close(id);
    };

    // Open the login modal
    $scope.openModal = function (id) {
        modalService.open(id);
    };

    function setSignalRGroup() {
        groupService.getGroup()
        .then(function (data) {
            identity.setGroup(data);
            signalrService.addToRoom(data.Id);
        }, errorHandler.handle);
    }

    $scope.doLogin = function (user) {
        auth.login(user)
        .then(function (data) {
            identity.loginUser(data);
            auth.getUserRoles(identity.getUser())
            .then(function (data) {
                identity.setUserRoles(data);
                setSignalRGroup();
                $scope.user = identity.getUserData();
                $scope.closeModal($scope.loginModalId);
                $state.go('app.home');
                $scope.$apply();
            });
        }, errorHandler.handle);
    };

    $scope.logout = function () {
        if (!$scope.user.isLogged) {
            navigator.app.exitApp();
            return;
        }

        identity.logoutUser();
        $scope.user = identity.getUserData();

        $state.go('app.home', {}, {
            reload:true
        });
    };

    $rootScope.$on('$stateChangeStart', function (event, toState) {
        $scope.user = identity.getUserData();
        $scope.isHome = toState.name.indexOf('home') > 0;
    });
}]);