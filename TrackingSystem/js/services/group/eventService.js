"use strict";

app.factory('eventService', ['identity', 'baseUrl', 'httpRequester', function (identity, baseUrl, httpRequester) {
    var url = baseUrl;

    return {
        addEvent: function (event) {
            return httpRequester.postAuthorized(url + '/api/events', event);
        },
    }
}]);