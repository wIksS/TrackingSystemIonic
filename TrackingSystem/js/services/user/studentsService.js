"use strict";

app.factory('studentsService', ['baseUrl', 'httpRequester', function (baseUrl, httpRequester) {
    var url = baseUrl;

    return {
        getStudents: function () {
            return httpRequester.getAuthorized(url + '/api/students');
        },
        addStudentToGroup: function (userName) {
            return httpRequester.postAuthorized(url + '/api/students/' + userName);
        }
    }
}]);