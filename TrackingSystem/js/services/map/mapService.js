"use strict";

app.factory('mapService', ['$timeout', '$state', function ($timeout, $state) {
    function createMarker(position) {
        return new google.maps.Marker({
            position: position,
            draggable: true,
            animation: google.maps.Animation.DROP,
            title: "Your position"
        });
    }

    function addMarkerAnimation(marker) {
        $timeout(function () {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }, 1500);
    }

    return {
        addMarker: function (map, latitude, longitude, dontSetCenter) {
            var position = new google.maps.LatLng(latitude, longitude),
                marker = createMarker(position);

            marker.setMap(map);
            addMarkerAnimation(marker);

            if (!dontSetCenter) {
                map.setCenter(position);
            }
        },
        goToMapLocation: function (location) {
            return $state.go('app.map',
            {
                date: location.Date,
                latitude: location.Latitude,
                longitude: location.Longitude
            });
        }
    }
}]);
