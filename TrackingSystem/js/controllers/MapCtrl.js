"use strict";

app.controller('MapCtrl', ['$scope', '$ionicLoading', '$stateParams', '$timeout', 'locationService', 'eventService', 'modalService', 'directionsService', 'mapService',
function ($scope, $ionicLoading, $stateParams, $timeout, locationService, eventService, modalService, directionsService, mapService) {
    function findDirections(position) {
        directionsService.findRoute($scope.map,
            {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            },
            {
                lat: parseFloat($stateParams.latitude),
                lng: parseFloat($stateParams.longitude)
            });
    }

    $scope.mapCreated = function (map) {
        $scope.map = map;
        mapService.addMarker($scope.map, $stateParams.latitude, $stateParams.longitude);
        $scope.date = $stateParams.date;
        $scope.$apply();
    };

    $scope.centerOnMe = function () {
        if (!$scope.map) {
            return;
        }

        $scope.loading = $ionicLoading.show(
        {
            content: 'Getting current location...',
            showBackdrop: false
        });

        navigator.geolocation.getCurrentPosition(function (pos) {
            mapService.addMarker($scope.map, pos.coords.latitude, pos.coords.longitude);
            findDirections(pos);
            $ionicLoading.hide();
        }, function (error) {
            notifier.alert('Unable to get location: ' + error.message);
        });
    }
}]);