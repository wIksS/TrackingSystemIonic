"use strict";

app.factory('directionsService', function (notifier) {
    return {
        findRoute: function (map, fromPosition, toPosition) {
            var directions = locationService.getGoogleMapsService(map);
            directions.directionsService.route(
            {
                origin: { lat: fromPosition.lat, lng: fromPosition.lng },
                destination: { lat: toPosition.lat, lng: toPosition.lng },
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.WALKING
            }, function (response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    directions.directionsDisplay.setDirections(response);
                }
                else {
                    notifier.alert("No route found");
                }
            });
        },
    }
});