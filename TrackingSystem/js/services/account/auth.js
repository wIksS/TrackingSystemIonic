"use strict";

app.factory('auth', function ($http, $q, baseUrl, httpRequester, objectToQueryString) {
    var url = baseUrl;
    
    return {
        login: function (user) {
            user = user || {};
            user['grant_type'] = 'password';

            return httpRequester.post(url + '/token',user);
        },
        register: function (user) {
            user = user || {};

            return httpRequester.post(url + '/api/account/register', user);
        },
        getUserRoles: function (user) {
            user = user || {};
            user['grant_type'] = 'password';
			user.identity = user.token;
            
            return httpRequester.getAuthorized(url + '/api/account/GetRoles',user.token);
        }
    }
})