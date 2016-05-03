"use strict";

app.controller('EventCtrl', ['$scope', '$timeout', 'eventService', 'modalService', 'mapService',
function ($scope, $timeout, eventService, modalService, mapService) {
    var mapModalId = modalService.getId();
    var mapModalUrl = 'templates/event-create.html';

    $scope.event = {
        hours: 1,
        minutes:1
    };

    $scope.eventMapCreated = function (map) {
        modalService.create($scope, mapModalUrl, mapModalId);

        $scope.map = map;
        google.maps.event.addListener($scope.map, 'click', function (event) {
            $scope.selectedCoord = event;
            mapService.addMarker($scope.map, event.latLng.lat(), event.latLng.lng(), true);
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

        var eventModel =
        {
            date: new Date().toLocaleString(),
            latitude: $scope.selectedCoord.latLng.lat(),
            longitude: $scope.selectedCoord.latLng.lng(),
            message: event.message
        };

        eventService.addEvent(eventModel)
        .then(function (data) {
            $scope.closeModal();
        }, errorHandler.handle);
    };
}]);