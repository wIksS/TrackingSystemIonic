"use strict";

app.controller('RegisterCtrl', ['$scope', '$state', 'auth', 'errorHandler',
function ($scope, $state, auth, errorHandler) {
    $scope.register = function (user) {
        auth.register(user)
        .then(function (data) {
            $state.go('app/home');
            auth.login(
            {
                username: user.email,
                password: user.password
            });
        }, errorHandler.handle);
    }
}]);