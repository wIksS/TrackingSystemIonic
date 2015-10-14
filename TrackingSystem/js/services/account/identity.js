app.factory('identity', function (auth) {
    function getUser(){
        var user = {
            username:sessionStorage.getItem('username'),
            token: sessionStorage.getItem('token'),
            group: JSON.parse(sessionStorage.getItem('group'))
        };

        return user;
    };

    function setRoles() {
        return auth.getUserRoles(getUser())
            .then(function (data) {
                var roles = {};
                for (var i = 0; i < data.length; i++) {
                    roles[data[i]] = true;
                }

                sessionStorage.setItem('roles', JSON.stringify(roles));
            }, function (err) {
                console.log(err);
            });
    };

    return{
        loginUser: function (user) {
            sessionStorage.setItem('token',user.access_token);
            sessionStorage.setItem('username', user.userName);
            return setRoles();
        },
        getUser:getUser,
        logoutUser:function(){
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('roles');
            sessionStorage.removeItem('group');
        },
        isLogged:function(){
            return !!sessionStorage.getItem('username');
        },
        isInRole: function (roleName) {
            var roles = JSON.parse(sessionStorage.getItem('roles')) || {};
            return roles[roleName];
        },
        isAdmin: function () {
            return this.isInRole('Admin');
        },
        setGroup :function(group)
        {
            sessionStorage.setItem('group', JSON.stringify(group));            
        }
    }
});