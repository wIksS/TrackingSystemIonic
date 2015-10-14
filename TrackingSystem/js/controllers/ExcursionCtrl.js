
app.controller('ExcursionCtrl', function ($scope, $ionicPopup,locationService,$state)
{
    var isInPrompt = false;
    var interval = {};

    $scope.startExcursion = function ()
    {
        interval = setInterval(function ()
        {
            navigator.geolocation.getCurrentPosition(
                   function (position)
                   {
                       locationService.addLocation(position)
                           .then(function (data)
                           {
                               console.log(data);
                               if (data.length > 0)
                               {
                                   for (var key in data)
                                   {
                                       if (!isInPrompt) {
                                           var dist = data[key];
                                           isInPrompt = true;

                                           var alertPopup = $ionicPopup.confirm({
                                               title: 'Distance',
                                               template: 'You are ' + dist.Distance + 'meters away from ' + dist.User.UserName + '\n Click OK to show on map'
                                           }).then(function (res) {
                                               if (res)
                                               {
                                                   clearInterval(interval);
                                                   $state.go('app.map', { latitude: dist.Coordinate.Latitude, longitude: dist.Coordinate.Longitude });
                                               }
                                               else
                                               {
                                                   isInPrompt = false;
                                               }                                               
                                           });
                                       }
                                   }
                               }
                           }, function (err)
                           {
                               console.log(err);
                           });

                   },
                   function (error)
                   {
                       //default map coordinates
                       navigator.notification.alert("Unable to determine current location. Cannot connect to GPS satellite.",
                           function () { }, "Location failed", 'OK');
                   },
                   {
                       enableHighAccuracy: true
                   }
               );
        }, 3000);

    }

    $scope.stopExcursion = function ()
    {
        clearInterval(interval);
    }
});