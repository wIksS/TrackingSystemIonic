"use strict";

app.controller('UsersCtrl', ['$scope', '$location', 'auth', 'identity', 'baseUrl', 'errorHandler', 'usersService',
function ($scope, $location, auth, identity, baseUrl, errorHandler, usersService) {
    $scope.adminRole = 'Admin';
    $scope.teacherRole = 'Teacher';
    identity.setScopeData($scope);

    usersService.getUsers()
    .then(function (data) {
        $scope.users = data;
        for (var i = 0; i < data.length; i++) {
            data[i][$scope.adminRole] = data[i].Roles.indexOf($scope.adminRole) >= 0;
            data[i][$scope.teacherRole] = data[i].Roles.indexOf($scope.teacherRole) >= 0;
        }

        $scope.$apply();
    }, function (err) {
        errorHandler.handle(err);
    });

    $scope.addRole = function (currentUser, roleName) {
        usersService.addRole(currentUser, roleName)
        .then(function (data) {
            currentUser[roleName] = true;
            $scope.$apply();
        }, function (err) {
            errorHandler.handle(err);
        });
    }

    $scope.deleteRole = function (currentUser, roleName) {
        usersService.deleteRole(currentUser, roleName)
            .then(function (data) {
                currentUser[roleName] = false;
                $scope.$apply();
            }, function (err) {
                errorHandler.handle(err);
            }
        );
    }

    $scope.deleteUser = function (currentUser) {
        usersService.deleteUser(currentUser)
            .then(function (data) {
                var index = $scope.users.indexOf(currentUser);
                if (index > -1) {
                    $scope.users.splice(index, 1);
                }
            }, function (err) {
                errorHandler.handle(err);
            }
        );
    }
}]);