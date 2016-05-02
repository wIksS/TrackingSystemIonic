"use strict";

app.factory('httpRequester', ['objectToQueryString', 'identity', function (objectToQueryString, identity) {
    return {
        get: function (url) {
            return $.ajax({
                method: "GET",
                url: url,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
        },
        getAuthorized: function (url) {
            return $.ajax({
                method: "GET",
                url: url,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Authorization": "Bearer " + identity.getUser().token }
            })
        },
        post: function (url, data) {
            return $.ajax({
                method: "POST",
                url: url,
                data: objectToQueryString.parse(data),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
        },
        postAuthorized: function (url) {
            return $.ajax({
                method: "POST",
                url: url,
                data: objectToQueryString.parse(data),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Authorization": "Bearer " + identity.getUser().token },
            })
        },
        custom: function (type, url, data) {
            return $.ajax({
                method: type,
                url: url,
                data: objectToQueryString.parse(data),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
        },
        customAuthorized: function (type, url, data) {
            return $.ajax({
                method: type,
                url: url,
                data: objectToQueryString.parse(data),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Authorization": "Bearer " + identity.getUser().token }
            })
        },
        customAuthorizedUrlData: function (type, url, data) {
            return $.ajax({
                method: type,
                url: url + '?' + objectToQueryString.parse(data),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Authorization": "Bearer " + identity.getUser().token }
            })
        },
        customAuthorizedUrlData: function (type, url, data) {
            return $.ajax({
                method: type,
                url: url + '?' + objectToQueryString.parse(data),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Authorization": "Bearer " + identity.getUser().token }
            })
        },
        customAuthorizedOnObject: function (object, url) {
            return object.ajax(url, {
                headers: { "Authorization": "Bearer " + identity.getUser().token }
            });
        },
    }
}]);