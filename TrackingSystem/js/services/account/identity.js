"use strict";

app.factory('identity', [function () {
    function getUser() {
        var user = {
            username: sessionStorage.getItem('username'),
            token: sessionStorage.getItem('token'),
            group: JSON.parse(sessionStorage.getItem('group'))
        };

        return user;
    };

    function setRoles(roles) {
        var rolesObj = {};
        for (var i = 0; i < roles.length; i++) {
            rolesObj[roles[i]] = true;
        }

        sessionStorage.setItem('roles', JSON.stringify(rolesObj));
    };

    return {
        loginUser: function (user) {
            sessionStorage.setItem('token', user.access_token);
            sessionStorage.setItem('username', user.userName);
        },
        setUserRoles: setRoles,
        getUser: getUser,
        logoutUser: function () {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('roles');
            sessionStorage.removeItem('group');
        },
        isLogged: function () {
            return !!sessionStorage.getItem('username');
        },
        isInRole: function (roleName) {
            var roles = JSON.parse(sessionStorage.getItem('roles')) || {};
            return roles[roleName];
        },
        isAdmin: function () {
            return this.isInRole('Admin');
        },
        setGroup: function (group) {
            sessionStorage.setItem('group', JSON.stringify(group));
        },
        getUserData: function () {
            var user = this.getUser();
            user.isLogged = this.isLogged();
            user.isAdmin = this.isAdmin();
            user.isTeacher = this.isInRole('Teacher');

            return user;
        }
    }
}]);