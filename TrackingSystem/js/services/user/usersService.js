"use strict";

app.factory('usersService', function (baseUrl, httpRequester) {
    var url = baseUrl;

    return {
        getUsers: function () {
            return httpRequester.getAuthorized(url + '/api/account/Users');
        },
        addRole: function (user, roleName) {
            var data = { userName: user.UserName, roleName: roleName };

            return httpRequester.customAuthorizedUrlData('POST', url + '/api/account/AddRole', data);
        },
        deleteRole: function (user, roleName) {
            var data = { userName: user.UserName, roleName: roleName };

            return httpRequester.customAuthorizedUrlData('DELETE', url + '/api/account/DeleteRole', data);
        },
        deleteUser: function (user) {
            var data = { userName: user.UserName };

            return httpRequester.customAuthorizedUrlData('DELETE', url + '/api/account/DeleteUser', data);
        },
        getUserImage: function (user) {
            return httpRequester.getAuthorized(url + '/api/File/' + user);
        }
    }
});