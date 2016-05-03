"use strict";

app.factory('backgroundLocationService', ['errorHandler', 'locationService', function (errorHandler, locationService) {
    // This callback will be executed every time a
    // geolocation is recorded in the background.
    var addLocation = function (location) {
        locationService.addLocation(position)
        .then(function (data) {
            if (data.length > 0) {
                locationService.notifyDistantUsers(data);
            }
        }, errorHandler.handle);

        navigator.notification.beep(3);
    };

    return {
        configure: function (backgroundLocation) {
            backgroundLocation.configure(addLocation, errorHandler.handle, {
                desiredAccuracy: 10,
                stationaryRadius: 20,
                distanceFilter: 1,
                locationTimeout: 0,
                locationUpdateInterval: 1,
                notificationTitle: 'Background tracking', // <-- android only, customize the title of the notification
                notificationText: 'ENABLED', // <-- android only, customize the text of the notification
                activityType: 'AutomotiveNavigation',
                debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
                stopOnTerminate: false // <-- enable this to clear background location settings when the app terminates
            });
        },
    }
}]);