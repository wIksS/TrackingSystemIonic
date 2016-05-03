"use strict";

app.factory('groupService', ['baseUrl', 'httpRequester', function (baseUrl, httpRequester) {
    var url = baseUrl;

    return {
        getGroup: function () {
            return httpRequester.getAuthorized(url + '/api/Group/GetGroup');
        },
        changeGroupDistance: function (newDistance) {
            return httpRequester.postAuthorized(url + '/api/Group/?newDistance=' + newDistance);
        },
        getStudentsInGroup: function () {
            return httpRequester.getAuthorized(url + '/api/Group/GetStudentsInGroup');
        },
        removeFromGroup: function (id) {
            var data = {
                'id': id
            };

            return httpRequester.customAuthorizedUrlData('POST', url + '/api/Group/RemoveFromGroup', data);
        }
    }
}]);