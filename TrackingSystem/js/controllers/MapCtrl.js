"use strict";

app.controller('MapCtrl', function ($scope, $ionicLoading, $stateParams, $ionicModal, $timeout, locationService, eventService, modalService, directionsService) {
    var mapModalId = modalService.getId(),
        mapModalUrl = 'templates/event-create.html';

    $scope.event = {};
    $scope.event.hours = 1;
    $scope.event.minutes = 1;

    function toggleBounce() {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        }
        else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }

    function findDirections(position) {
        debugger;
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

    function createMarker(position) {
        return new google.maps.Marker({
            position: position,
            draggable: true,
            animation: google.maps.Animation.DROP,
            title: "Your position"
        });
    }

    function addMarker(latitude, longitude, dontSetCenter) {
        var position = new google.maps.LatLng(latitude, longitude),
            marker = createMarker(position);

        marker.setMap($scope.map);
        marker.addListener('click', toggleBounce);

        if (!dontSetCenter) {
            $scope.map.setCenter(position);
        }
    }

    $scope.mapCreated = function (map) {
        $scope.map = map;
        addMarker($stateParams.latitude, $stateParams.longitude);
        $scope.date = $stateParams.date;
        $scope.$apply();
    };

    $scope.eventMapCreated = function (map) {
        modalService.create($scope, mapModalUrl, mapModalId);

        $scope.map = map;
        google.maps.event.addListener($scope.map, 'click', function (event) {
            $scope.selectedCoord = event;
            addMarker(event.latLng.lat(), event.latLng.lng(), true);
            $timeout(function () {
                modalService.open(mapModalId);
            }, 1000);
        });
    }

    $scope.closeModal = function () {
        modalService.close(mapModalId);
    };

    $scope.uploadEvent = function (event) {
        modalService.close(mapModalId);

        var eventViewModel = {
            date: new Date().toLocaleString(),
            latitude: $scope.selectedCoord.latLng.lat(),
            longitude: $scope.selectedCoord.latLng.lng(),
            message: event.message
        };

        eventService.addEvent(eventViewModel)
        .then(function (data) {
            $scope.closeModal();
        }, function (err) {
            console.log(err);
        });
    };

    $scope.centerOnMe = function () {
        if (!$scope.map) {
            return;
        }

        $scope.loading = $ionicLoading.show({
            content: 'Getting current location...',
            showBackdrop: false
        });

        navigator.geolocation.getCurrentPosition(function (pos) {
            addMarker(pos.coords.latitude, pos.coords.longitude);
            findDirections(pos);
            $ionicLoading.hide();
        }, function (error) {
            alert('Unable to get location: ' + error.message);
        });
    }
});