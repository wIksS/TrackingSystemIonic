"use strict";

app.factory('imageUploadService', function (identity, baseUrl, httpRequester) {
    var url = baseUrl;

    return {
        upload: function (imageBlob,onComplete, onError) {
            var user = identity.getUser();
            return imageBlob.ajax(url + '/api/file/UploadFile', {
                complete:onComplete,
                error: onError,
                headers: { "Authorization": "Bearer " + user.token },
            });
        }
    }
});