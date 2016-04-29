"use strict";

app.controller('RegisterCtrl', function ($scope, auth, identity, errorHandler, $state) {
    $scope.register = function(user){
        auth.register(user)
            .then(function(data){
                $state.go('app/home')
                auth.login({
                    username:user.email,
                    password:user.password
                });
            },function(err){
                errorHandler.handle(err);
            });
    }
})