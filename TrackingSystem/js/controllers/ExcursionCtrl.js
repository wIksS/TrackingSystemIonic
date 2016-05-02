"use strict";

app.controller('ExcursionCtrl', ['$scope', 'errorHandler', 'locationService', 'notifier',
function ($scope, errorHandler, locationService, notifier) {
    var isInPrompt = false,
        interval = {};

    function successGetPosition(position) {
        locationService.addLocation(position)
        .then(function (data) {
            if (data.length > 0) {
                isInPrompt = locationService.notifyDistantUsers(data, interval, isInPrompt);
            }
        }, function (err) {
            errorHandler.handle(err);
        });
    };

    $scope.startExcursion = function () {
        if (cordova.plugins && cordova.plugins.backgroundMode) {
            cordova.plugins.backgroundMode.enable();
        }

        interval = setInterval(function () {
            navigator.geolocation.getCurrentPosition(successGetPosition, function (error) {
                notifier.alert("Can't get your location! Cannot connect to GPS satellite.");
            },
            {
                enableHighAccuracy: true
            });
        }, 3000);

    }

    $scope.stopExcursion = function () {
        clearInterval(interval);
        if (cordova.plugins && cordova.plugins.backgroundMode) {
            cordova.plugins.backgroundMode.disable();
        }
    }
}]);