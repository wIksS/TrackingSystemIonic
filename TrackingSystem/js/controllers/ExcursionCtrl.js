"use strict";

app.controller('ExcursionCtrl', function ($scope, $ionicPopup, locationService, $state)
{
    var isInPrompt = false,
        interval = {},
        id = 102;

    $scope.startExcursion = function ()
    {
        if (cordova.plugins && cordova.plugins.backgroundMode)
        {
            cordova.plugins.backgroundMode.enable();
        }

        interval = setInterval(function ()
        {
            navigator.geolocation.getCurrentPosition(
                   function (position)
                   {

                       locationService.addLocation(position)
                           .then(function (data)
                           {
                               if (data.length > 0)
                               {
                                   navigator.notification.beep(3);

                                   for (var key in data)
                                   {
                                       if (!isInPrompt)
                                       {
                                           var dist = data[key];
                                           isInPrompt = true;

                                           if (window.localNotification && localNotification)
                                           {
                                               localNotification.add(id, {
                                                   seconds: 0,
                                                   message: 'You are ' + dist.Distance + 'meters away from ' + dist.User.UserName + '\n Click OK to show on map',
                                                   badge: 1
                                               });
                                           }

                                           var alertPopup = $ionicPopup.confirm({
                                               title: 'Distance',
                                               template: 'You are ' + dist.Distance + 'meters away from ' + dist.User.UserName + '\n Click OK to show on map'
                                           }).then(function (res)
                                           {
                                               if (res)
                                               {
                                                   clearInterval(interval);
                                                   $state.go('app.map', { date: dist.Coordinate.Date, latitude: dist.Coordinate.Latitude, longitude: dist.Coordinate.Longitude });
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
        if (cordova.plugins && cordova.plugins.backgroundMode)
        {
            cordova.plugins.backgroundMode.disable();
        }
    }
});