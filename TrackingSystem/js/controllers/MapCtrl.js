"use strict";

app.controller('MapCtrl', function ($scope, $ionicLoading, $stateParams,locationService, $ionicModal, $timeout,eventService)
{
    $scope.event = {};
    $scope.event.hours = 1;
    $scope.event.minutes = 1;

    function toggleBounce() {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }

    function addMarker(latitude, longitude, dontSetCenter) {
        var position = new google.maps.LatLng(latitude, longitude);
        var marker = new google.maps.Marker({
            position: position,
            draggable: true,
            animation: google.maps.Animation.DROP,
            title: "Your position"
        });

        marker.setMap($scope.map);
        marker.addListener('click', toggleBounce);

        if (!dontSetCenter) {
            $scope.map.setCenter(position);
        }
    }

    $scope.mapCreated = function (map)
    {
        $scope.map = map;
        addMarker($stateParams.latitude, $stateParams.longitude);
        $scope.date = $stateParams.date;
        $scope.$apply();
    };

    $scope.eventMapCreated = function(map)
    {
        $ionicModal.fromTemplateUrl('templates/event-create.html', {
            id: 1,
            scope: $scope
        }).then(function (modal)
        {
            $scope.modal = modal;
        });

        $scope.map = map;
        google.maps.event.addListener($scope.map, 'click', function (event)
        {
            $scope.selectedCoord = event;
            addMarker(event.latLng.lat(), event.latLng.lng(), true);
            $timeout(function ()
            {
                $scope.modal.show()
            }, 1000);
        });
    }

    $scope.closeModal = function ()
    {
        $scope.modal.hide();
    };

    $scope.uploadEvent = function(event)
    {
        $scope.closeModal();

        var eventViewModel = {
            date: new Date().toLocaleString(),
            latitude: $scope.selectedCoord.latLng.lat(),
            longitude: $scope.selectedCoord.latLng.lng(),
            message:event.message
        };

        eventService.addEvent(eventViewModel)
            .then(function (data)
            {
                $scope.closeModal();

            }, function (err)
            {
                console.log(err);
            });
    };

    $scope.centerOnMe = function ()
    {
        if (!$scope.map)
        {
            return;
        }

        $scope.loading = $ionicLoading.show({
            content: 'Getting current location...',
            showBackdrop: false
        });

        navigator.geolocation.getCurrentPosition(function (pos)
        {
            addMarker(pos.coords.latitude, pos.coords.longitude);
            var directions = locationService.getGoogleMapsService($scope.map);
            debugger;
            directions.directionsService.route({
                origin: { lat: pos.coords.latitude, lng: pos.coords.longitude},
                destination: { lat: parseFloat($stateParams.latitude), lng: parseFloat($stateParams.longitude) },
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.WALKING
            }, function (response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    directions.directionsDisplay.setDirections(response);
                } else {
                    alert("No route found");
                }
            });

            $ionicLoading.hide();
        }, function (error)
        {
            alert('Unable to get location: ' + error.message);
        });
    }
});