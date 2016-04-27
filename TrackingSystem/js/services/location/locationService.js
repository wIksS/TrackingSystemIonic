"use strict";

app.factory('locationService', function (identity, baseUrl, httpRequester) {
    var url = baseUrl;

    return {
        addLocation:function(position){
            var user = identity.getUser();
            position.coords.identity = user.token;
            
            return httpRequester.postAuthorized(url + '/api/location', position.coords);
        },
        getLocation: function (id)
        {
            var user = identity.getUser();

            return httpRequester.getAuthorized(url + '/api/location/' + id, user.token);
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
    }
});