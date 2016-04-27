'use strict';

var app = angular.module('TrackingSystem', ['ionic', 'TrackingSystem.directives','ngCordova'])
            .constant('baseUrl', 'http://trackingsystemserverspringconf.apphb.com/')//http://trackingsystemserver.apphb.com')//http://localhost:63810')

            .config(function ($ionicConfigProvider)
            {
                $ionicConfigProvider.tabs.position('bottom');
                $ionicConfigProvider.tabs.style('standard').position('bottom');
                $ionicConfigProvider.navBar.alignTitle('center').positionPrimaryButtons('left');
            })
    .run(function ($ionicPlatform, signalrService, locationService)
    {
        $ionicPlatform.ready(function ()
        {
            signalrService.initConnection();            

            //window.navigator.geolocation.getCurrentPosition(function (location) {
            //    console.log('Location from Phonegap');
            //});

            var bgGeo = backgroundGeoLocation;//window.BackgroundGeolocation;

            var yourAjaxCallback = function (response) {

                bgGeo.finish();
            };

            /**
            * This callback will be executed every time a geolocation is recorded in the background.
            */
            var callbackFn = function (location) {
                locationService.addLocation(position)
                    .then(function (data) {
                        if (data.length > 0) {
                            navigator.notification.beep(3);

                            for (var key in data) {
                                if (!isInPrompt) {
                                    var dist = data[key];
                                    isInPrompt = true;

                                    if (window.localNotification && localNotification) {
                                        localNotification.add(id, {
                                            seconds: 0,
                                            message: 'You are ' + dist.Distance + 'meters away from ' + dist.User.UserName + '\n Click OK to show on map',
                                            badge: 1
                                        });
                                    }

                                    var alertPopup = $ionicPopup.confirm({
                                        title: 'Distance',
                                        template: 'You are ' + dist.Distance + 'meters away from ' + dist.User.UserName + '\n Click OK to show on map'
                                    }).then(function (res) {
                                        if (res) {
                                            clearInterval(interval);
                                            $state.go('app.map', { date: dist.Coordinate.Date, latitude: dist.Coordinate.Latitude, longitude: dist.Coordinate.Longitude });
                                        }
                                        else {
                                            isInPrompt = false;
                                        }
                                    });
                                }
                            }
                        }
                    }, function (err) {
                        console.log(err);
                    });
                localNotification.add(150, {
                    seconds: 0,
                    message: '[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude,
                    badge: 1
                });

                navigator.notification.beep(3);
                yourAjaxCallback.call(this);
            };

            var failureFn = function (error) {
                console.log('BackgroundGeoLocation error');
            }

            // BackgroundGeoLocation is highly configurable.
            bgGeo.configure(callbackFn, failureFn, {               
                desiredAccuracy: 10,
                stationaryRadius: 20,
                distanceFilter: 1,
                locationTimeout: 0,
                locationUpdateInterval:1,
                notificationTitle: 'Background tracking', // <-- android only, customize the title of the notification
                notificationText: 'ENABLED', // <-- android only, customize the text of the notification
                activityType: 'AutomotiveNavigation',
                debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
                stopOnTerminate: false // <-- enable this to clear background location settings when the app terminates
            });

            // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
            bgGeo.start();

            if (window.cordova && window.cordova.plugins.Keyboard) {
              cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
              cordova.plugins.Keyboard.disableScroll(true);
    
            }
            if (window.StatusBar) {
              // org.apache.cordova.statusbar required
              StatusBar.styleDefault();
            }
        });
    })

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

 .state('app', {
     url: '/app',
     abstract: true,
     templateUrl: 'templates/menu.html',
     controller: 'LoginCtrl'
 })

  .state('app.home', {
      url: '/home',
      templateUrl: 'templates/home.html',
      controller: 'ExcursionCtrl'
  })

  .state('app.register', {
      url: '/register',
      templateUrl: 'templates/register.html',
      controller: 'RegisterCtrl'
  })

  .state('app.students', {
      url: '/students',
      templateUrl: 'templates/students.html',
      controller: 'StudentGroupsCtrl'
  })

  .state('app.users', {
      url: '/users',
      templateUrl: 'templates/users.html',
      controller: 'UsersCtrl'
  })

  .state('app.settings', {
      url: '/settings',
      templateUrl: 'templates/settings.html',
      controller: 'SettingsCtrl'
  })

  .state('app.group', {
      url: '/group',
      templateUrl: 'templates/group.html',
      controller: 'GroupCtrl'
  })

  .state('app.map', {
      url: '/map?:date:latitude/:longitude',
      templateUrl: 'templates/map.html',
      controller: 'MapCtrl'
  })

  .state('app.eventmap', {
      url: '/eventmap',
      templateUrl: 'templates/event.html',
      controller: 'MapCtrl'
  })
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/home');
});
