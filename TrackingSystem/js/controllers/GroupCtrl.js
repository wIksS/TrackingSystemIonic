"use strict";

app.controller('GroupCtrl', ['$scope', 'identity', 'errorHandler', 'groupService', 'locationService', 'baseUrl', 'mapService',
function ($scope, identity, errorHandler, groupService, locationService, baseUrl, mapService) {
    $scope.user = identity.getUserData();
    $scope.url = baseUrl;

    groupService.getStudentsInGroup()
    .then(function (data) {
        $scope.students = data;
    }, errorHandler.handle);

    $scope.showOnMap = function (id) {
        locationService.getLocation(id)
        .then(function (data) {
            mapService.goToMapLocation(data);
        }, errorHandler.handle);
    };

    // remove specific user from the scope so 
    // it can be rendered without him in the UI
    $scope.removeFromGroup = function (selectedStudent) {
        groupService.removeFromGroup(selectedStudent.UserName)
        .then(function (data) {
            var index = $scope.students.indexOf(selectedStudent);
            if (index > -1) {
                $scope.students.splice(index, 1);
                $scope.$apply();
            }
        }, errorHandler.handle);
    };
}]);