"use strict";

app.factory('locationService', ['baseUrl', 'httpRequester', 'notifier', '$state',
function (baseUrl, httpRequester, notifier, $state) {
    var url = baseUrl;

    function alertForDistantUser(distanceModel, onConfirmMessage) {
        navigator.notification.beep(3);
        var message = 'You are ' + parseFloat(distanceModel.Distance).toFixed(2) + 'meters away from ' + distanceModel.User.UserName + '\n Click OK to show on map';
        notifier.localNotification(message);

        notifier.confirm('distance', message)
        .then(onConfirmMessage);
    }

    return {
        addLocation: function (position) {
            return httpRequester.postAuthorized(url + '/api/location', position.coords);
        },
        getLocation: function (id) {
            return httpRequester.getAuthorized(url + '/api/location/' + id);
        },
        getGoogleMapsService: function (map) {
            var directionsService = new google.maps.DirectionsService;
            var directionsDisplay = new google.maps.DirectionsRenderer;

            directionsDisplay.setMap(map);

            return {
                directionsService: directionsService,
                directionsDisplay: directionsDisplay
            };
        },
        notifyDistantUsers: function (distances, interval, isInPrompt) {
            for (var key in distances) {
                if (!isInPrompt) {
                    var distanceModel = distances[key];
                    isInPrompt = true;
                    alertForDistantUser(distanceModel, function (data) {
                        if (data) {
                            clearInterval(interval);
                            $state.go('app.map', {
                                date: distanceModel.Coordinate.Date,
                                latitude: distanceModel.Coordinate.Latitude,
                                longitude: distanceModel.Coordinate.Longitude
                            });
                        }
                        else {
                            isInPrompt = false;
                        }
                    });
                }
            }

            return isInPrompt;
        }
    }
}]);