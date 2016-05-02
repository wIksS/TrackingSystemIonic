"use strict";

app.factory('locationService', ['baseUrl', 'httpRequester', 'notifier', '$state',
function (baseUrl, httpRequester, notifier, $state) {
    var url = baseUrl;

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
            navigator.notification.beep(3);
            for (var key in distances) {
                if (!isInPrompt) {
                    var dist = distances[key];
                    isInPrompt = true;

                    if (window.localNotification && localNotification) {
                        notifier.localNotification('You are ' + dist.Distance + 'meters away from ' + dist.User.UserName + '\n Click OK to show on map');
                    }

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

            return isInPrompt;
        }
    }
}]);