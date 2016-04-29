"use strict";

app.controller('ExcursionCtrl', function ($scope, $ionicPopup, $state, locationService, notifier) {
    var isInPrompt = false,
        interval = {},
        id = 102;

    function successGetPosition(position) {
        locationService.addLocation(position)
        .then(function (data) {
            if (data.length > 0) {
                navigator.notification.beep(3);
                notifyDistantUsers(data);
            }
        }, function (err) {
            console.log(err);
        });
    };

    function notifyDistantUsers(distances) {
        for (var key in distances) {
            if (!isInPrompt) {
                var dist = distances[key];
                isInPrompt = true;

                notifier.confirm('distance', 'You are ' + parseFloat(dist.Distance).toFixed(2) + 'meters away from ' + dist.User.UserName + '\n Click OK to show on map')
                .then(function (data) {
                    if (data) {
                        clearInterval(interval);
                        $state.go('app.map', { date: dist.Coordinate.Date, latitude: dist.Coordinate.Latitude, longitude: dist.Coordinate.Longitude });
                    }
                    else {
                        isInPrompt = false;
                    }
                });
            }
        }
    }

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
});