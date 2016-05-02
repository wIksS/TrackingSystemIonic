"use strict";

app.controller('SettingsCtrl', ['$scope', '$state', '$timeout', 'identity', 'errorHandler', 'groupService',
function ($scope, $state, $timeout, identity, errorHandler, groupService) {
    identity.setScopeData($scope);
    $scope.min = 50;
    $scope.max = 5000;
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

    if (!$scope.isTeacher) {
        $timeout(function () {
            $state.go('app.home', {}, { reload: true });
        });
    }
}]);