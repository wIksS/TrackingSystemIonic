"use strict";

app.controller('SettingsCtrl', ['$scope', '$state', '$timeout', 'identity', 'errorHandler', 'groupService', 'config',
function ($scope, $state, $timeout, identity, errorHandler, groupService, config) {
    $scope.user = identity.getUserData();
    $scope.min = config.minDefaultDistance;
    $scope.max = config.maxDefaultDistance;
    $scope.currentDistance = $scope.user.group.MaxDistance;

    $scope.changeGroupDistance = function (newDistance) {
        groupService.changeGroupDistance(newDistance)
        .then(function (data) {
            $scope.currentDistance = data.MaxDistance;
            identity.setGroup(data);
        },
        function (err) {
            errorHandler.handle(err);
        })
    };
}]);