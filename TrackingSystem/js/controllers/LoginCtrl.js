"use strict";

app.controller('LoginCtrl', function ($scope, $rootScope, $ionicModal, $timeout, identity, modalService, auth, $state, errorHandler, locationService, groupService, $ionicHistory, usersService, signalrService) {
    var profileModalUrl = 'templates/profile.html',
        loginModalUrl = 'templates/login.html';

    $scope.loginModalId = modalService.getId();
    $scope.profileModalId = modalService.getId();
    $scope.isHome = $ionicHistory.currentStateName().indexOf('home') > 0;
    identity.setScopeData($scope);

    function createModals() {
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
    }

    function setSignalRGroup() {
        groupService.getGroup()
        .then(function (data) {
            signalrService.addToRoom(data.Id);
        },
        function (err) {
            errorHandler.handle(err);
        });
    }

    createModals();

    $scope.doLogin = function (user) {
        auth.login(user)
        .then(function (data) {
            identity.loginUser(data)
            .then(function (data) {
                setSignalRGroup();
                identity.setScopeData($scope);
                $scope.closeModal($scope.loginModalId);
                $state.go('app.home');
                $scope.$apply();
            });
        },
        function (err) {
            errorHandler.handle(err);
        });
    };

    $scope.logout = function () {
        if (!$scope.isLogged) {
            navigator.app.exitApp();
            return;
        }

        var user = identity.getUser();
        identity.logoutUser();
        $scope.isLogged = identity.isLogged();
        $scope.isAdmin = identity.isAdmin();

        $state.go('app.home');
    };

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        identity.setScopeData($scope);
        $scope.username = $scope.user.username;
        $scope.isHome = toState.name.indexOf('home') > 0;
    });
});