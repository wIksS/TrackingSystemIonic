"use strict";

app.controller('SettingsCtrl', function ($scope, identity, errorHandler, $state, $timeout, groupService) {
    identity.setScopeData($scope);
    $scope.min = 50;
    $scope.max = 5000;

    $scope.currentDistance = user.group.MaxDistance;

    if (!$scope.isTeacher) {
        $timeout(function () {
            $state.go('app.home', {}, { reload: true });
        });
    }

    $scope.changeGroupDistance = function (newDistance) {
        groupService.changeGroupDistance(newDistance)
            .then(function (data) {
                $scope.currentDistance = data.MaxDistance;
                identity.setGroup(data);
            },
            function (err) {
                errorHandler.handle(err);
            })
    }

});