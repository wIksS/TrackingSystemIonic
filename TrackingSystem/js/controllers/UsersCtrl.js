"use strict";

app.controller('UsersCtrl', ['$scope', '$location', 'auth', 'identity', 'baseUrl', 'errorHandler', 'usersService', 'config',
function ($scope, $location, auth, identity, baseUrl, errorHandler, usersService, config) {
    $scope.adminRole = config.adminRole;
    $scope.teacherRole = config.teacherRole;
    $scope.user = identity.getUserData();

    usersService.getUsers()
    .then(function (data) {
        $scope.users = data.map(function (user) {
            user[$scope.adminRole] = user.Roles.indexOf($scope.adminRole) >= 0;
            user[$scope.teacherRole] = user.Roles.indexOf($scope.teacherRole) >= 0;

            return user;
        });

        $scope.$apply();
    }, errorHandler.handle);

    $scope.addRole = function (selectedUser, roleName) {
        usersService.addRole(selectedUser, roleName)
        .then(function (data) {
            selectedUser[roleName] = true;
            $scope.$apply();
        }, errorHandler.handle);
    }

    $scope.deleteRole = function (selectedUser, roleName) {
        usersService.deleteRole(selectedUser, roleName)
        .then(function (data) {
            selectedUser[roleName] = false;
            $scope.$apply();
        }, errorHandler.handle);
    }

    $scope.deleteUser = function (selectedUser) {
        usersService.deleteUser(selectedUser)
        .then(function (data) {
            var index = $scope.users.indexOf(selectedUser);
            if (index > -1) {
                $scope.users.splice(index, 1);
            }
        }, errorHandler.handle);
    }
}]);