"use strict";

app.factory('eventService', function (identity, baseUrl, httpRequester) {
    var url = baseUrl;

    return {
        addEvent: function (event) {
            var user = identity.getUser();
            event.identity = user.token;

            return httpRequester.postAuthorized(url + '/api/events', event);
        },
    }
});