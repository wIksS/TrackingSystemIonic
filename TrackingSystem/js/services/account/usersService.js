"use strict";

app.factory('usersService', function (identity, baseUrl, httpRequester) {
    var url = baseUrl;

    return {
        getUsers: function () {
            var user = identity.getUser();

            return httpRequester.getAuthorized(url + '/api/account/Users', user.token);
        },
        addRole: function (user, roleName, identity) {
            var data = { userName: user.UserName, roleName: roleName, identity: identity };

            return httpRequester.customAuthorizedUrlData('POST', url + '/api/account/AddRole', data);
        },
        deleteRole: function (user, roleName, identity) {
            var data = { userName: user.UserName, roleName: roleName, identity: identity };

            return httpRequester.customAuthorizedUrlData('DELETE', url + '/api/account/DeleteRole', data);
        },
        deleteUser: function (user, identity) {
            var data = { userName: user.UserName, identity: identity };

            return httpRequester.customAuthorizedUrlData('DELETE', url + '/api/account/DeleteUser', data);
        },
        getUserImage: function (user, identity) {
            return httpRequester.getAuthorized(url + '/api/File/' + user, identity);
        }
    }
});