"use strict";

app.controller('StudentGroupsCtrl', ['$scope', 'identity', 'errorHandler', 'notifier', 'studentsService', 'baseUrl',
function ($scope, identity, errorHandler, notifier, studentsService, baseUrl) {
    var interval;
    $scope.user = identity.getUserData();
    $scope.username = $scope.user.username;
    $scope.url = baseUrl;

    studentsService.getStudents()
    .then(function (data) {
        $scope.students = data;
        $scope.$apply();
    }, errorHandler.handle);

    $scope.addStudentToGroup = function (currentStudent) {
        studentsService.addStudentToGroup(currentStudent.UserName)
        .then(function (data) {
            // remove student from the scope so it 
            // can be rendered without it in the UI
            var index = $scope.students.indexOf(currentStudent);
            if (index > -1) {
                $scope.students.splice(index, 1);
                $scope.$apply();
            }

            notifier.alert('Added student to group');
        }, errorHandler.handle);
    }
}]);