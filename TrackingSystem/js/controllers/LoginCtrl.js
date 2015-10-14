/**
 * Created by Виктор on 27.9.2014 г..
 */

app.controller('LoginCtrl', function ($scope, $rootScope, $ionicModal, $timeout, identity, auth, identity, $state, errorHandler, locationService, groupService, $ionicHistory)
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
        scope: $scope
    }).then(function (modal)
    {
        $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function ()
    {
        $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function ()
    {
        $scope.modal.show();
    };

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

                    $scope.closeLogin();
                    $state.go('app.home');
                    $scope.$apply();
                });               
            },
            function(err){
                errorHandler.handle(err);
            });
        };

    $scope.logout = function(){
        $location.path('/Login');
        var user = identity.getUser();
        identity.logoutUser();
        $scope.isLogged = identity.isLogged();
        $scope.isAdmin = identity.isAdmin();
        $scope.user.username = '';
        $scope.user.password = '';
        currentTeacher.deleteSessionTeacher();
        notifier.success('Successful logout');
    };                                     
});