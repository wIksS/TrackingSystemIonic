"use strict";

app.controller('GroupCtrl', function ($scope, identity, errorHandler, $state, $timeout, groupService, locationService, baseUrl) {
    identity.setScopeData($scope);
    $scope.url = baseUrl;

    function goToMapLocation(location) {
        $state.go('app.map',
        {
            date: location.Date,
            latitude: location.Latitude,
            longitude: location.Longitude
        });
    };

    groupService.getStudentsInGroup()
    .then(function (data) {
        $scope.students = data;
    }, function (err) {
        errorHandler.handle(err);
    });

    $scope.showOnMap = function (id) {
        locationService.getLocation(id)
        .then(function (data) {
            goToMapLocation(data);
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