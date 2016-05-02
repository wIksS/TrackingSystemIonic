"use strict";

app.controller('GroupCtrl', function ($scope, identity, errorHandler, $timeout, groupService, locationService, baseUrl, mapService) {
    identity.setScopeData($scope);
    $scope.url = baseUrl;

    groupService.getStudentsInGroup()
    .then(function (data) {
        $scope.students = data;
    }, function (err) {
        errorHandler.handle(err);
    });

    $scope.showOnMap = function (id) {
        locationService.getLocation(id)
        .then(function (data) {
            mapService.goToMapLocation(data);
        }, function (err) {
            errorHandler.handle(err);
        });
    };

    // remove specific user from the scope so 
    // it can be rendered without him in the UI
    $scope.removeFromGroup = function (currentStudent) {
        groupService.removeFromGroup(currentStudent.UserName)
        .then(function (data) {
            var index = $scope.students.indexOf(currentStudent);
            if (index > -1) {
                $scope.students.splice(index, 1);
                $scope.$apply();
            }
        }, function (err) {
            errorHandler.handle(err);
        });
    };
});