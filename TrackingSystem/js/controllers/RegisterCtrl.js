"use strict";

app.controller('RegisterCtrl', function ($scope, $state, auth, identity, errorHandler) {
    $scope.register = function (user) {
        auth.register(user)
        .then(function (data) {
            $state.go('app/home')
            auth.login(
            {
                username: user.email,
                password: user.password
            });
        }, function (err) {
            errorHandler.handle(err);
        });
    }
})