
app.controller('MapCtrl', function ($scope, $ionicLoading, $stateParams)
{
    $scope.mapCreated = function(map) {
        $scope.map = map;
        addMarker($stateParams.latitude, $stateParams.longitude);
        $scope.date = $stateParams.date;
        $scope.$apply();
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
            $ionicLoading.hide();
        }, function (error)
        {
            alert('Unable to get location: ' + error.message);
        });
    }

    function addMarker(latitude, longitude)
    {
        var position = new google.maps.LatLng(latitude, longitude);
        var marker = new google.maps.Marker({
            position: position,
            draggable: true,
            animation: google.maps.Animation.DROP,
            title: "Your position"
        });

        marker.setMap($scope.map);
        marker.addListener('click', toggleBounce);
        $scope.map.setCenter(position);
    }

    function toggleBounce()
    {
        if (marker.getAnimation() !== null)
        {
            marker.setAnimation(null);
        } else
        {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }
});