"use strict";

app.controller('LoginCtrl', function ($scope, $rootScope, $ionicModal, $timeout, identity, auth, $state, errorHandler, locationService, groupService, $ionicHistory, usersService, signalrService)
{
    var user = identity.getUser();
    $scope.isLogged = identity.isLogged();
    $scope.isAdmin = identity.isAdmin();
    $scope.isTeacher = identity.isInRole('Teacher');
    $scope.user = user || {};
    $scope.username = user.username;
    $scope.isHome = $ionicHistory.currentStateName().indexOf('home') > 0;

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        id:1,
        scope: $scope
    }).then(function (modal)
    {
        $scope.modal1 = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeModal = function (id)
    {
        if (id == 1) $scope.modal1.hide();
        else $scope.modal2.hide();
    };

    // Open the login modal
    $scope.openModal = function (id)
    {
        if (id == 1) $scope.modal1.show();
        else $scope.modal2.show();
    };

    $ionicModal.fromTemplateUrl('templates/profile.html', {
        id: 2,
        scope: $scope
    }).then(function (modal)
    {
        $scope.modal2 = modal;
    });

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        user = identity.getUser();
        $scope.isLogged = identity.isLogged();
        $scope.isAdmin = identity.isAdmin();
        $scope.isTeacher = identity.isInRole('Teacher');
        $scope.user = $scope.user || {};
        $scope.username = user.username;
        $scope.isHome = toState.name.indexOf('home') > 0;
    });

    $scope.doLogin = function(user){
        auth.login(user)
            .then(function(data){
                identity.loginUser(data)
                   .then(function (data) {
                    groupService.getGroup()
                    .then(function (data)
                    {
                        identity.setGroup(data);
                        signalrService.addToRoom(data.Id);
                    },
                    function (err)
                    {
                        errorHandler.handle(err);
                    });
                    $scope.isLogged = identity.isLogged();
                    var user = identity.getUser();
                    $scope.username = user.username;
                    $scope.isAdmin = identity.isAdmin();
                    $scope.isTeacher = identity.isInRole('Teacher');

                    $scope.closeModal(1);
                    $state.go('app.home');
                    $scope.$apply();
                });               
            },
            function(err){
                errorHandler.handle(err);
            });
        };

    $scope.logout = function ()
    {
        if (!$scope.isLogged)
        {
            navigator.app.exitApp();
            return;
        }

        var user = identity.getUser();
        identity.logoutUser();
        $scope.isLogged = identity.isLogged();
        $scope.isAdmin = identity.isAdmin();

        //notifier.success('Successful logout');
        $state.go('app.home');

    };                                     
});