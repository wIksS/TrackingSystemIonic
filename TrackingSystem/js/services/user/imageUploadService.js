"use strict";

app.factory('imageUploadService', function (baseUrl, httpRequester) {
    var url = baseUrl;

    return {
        upload: function (imageBlob, onComplete, onError) {
            return httpRequester.customAuthorizedOnObject(imageBlob, url + '/api/file/UploadFile');
        }
    }
});