// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var app = angular.module('TrackingSystem', ['ionic', 'TrackingSystem.directives', 'ngCordova'])
            .constant('baseUrl', 'http://trackingsystemserver.apphb.com')//http://localhost:63810')

            .config(function ($ionicConfigProvider)
            {
                $ionicConfigProvider.tabs.position('bottom');
                $ionicConfigProvider.tabs.style('standard').position('bottom');
                $ionicConfigProvider.navBar.alignTitle('center').positionPrimaryButtons('left');
            })
    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function ()
        {
            //window.navigator.geolocation.getCurrentPosition(function (location) {
            //    console.log('Location from Phonegap');
            //});

            //var bgGeo = backgroundGeoLocation;//window.BackgroundGeolocation;
            //navigator.notification.alert(bgGeo);
            //navigator.notification.alert(window.BackgroundGeolocation);

            //var yourAjaxCallback = function (response) {

            //    bgGeo.finish();
            //};

            ///**
            //* This callback will be executed every time a geolocation is recorded in the background.
            //*/
            //var callbackFn = function (location) {
            //    console.log('[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude);

            //    localNotification.add(150, {
            //        seconds: 0,
            //        message: '[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude,
            //        badge: 1
            //    });

            //    navigator.notification.beep(3);
            //    yourAjaxCallback.call(this);
            //};

            //var failureFn = function (error) {
            //    console.log('BackgroundGeoLocation error');
            //}

            //// BackgroundGeoLocation is highly configurable.
            //bgGeo.configure(callbackFn, failureFn, {               
            //    desiredAccuracy: 10,
            //    stationaryRadius: 20,
            //    distanceFilter: 30,
            //    locationTimeout: 0,
            //    locationUpdateInterval:3,
            //    notificationTitle: 'Background tracking', // <-- android only, customize the title of the notification
            //    notificationText: 'ENABLED', // <-- android only, customize the text of the notification
            //    activityType: 'AutomotiveNavigation',
            //    debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
            //    stopOnTerminate: false // <-- enable this to clear background location settings when the app terminates
            //});

            //// Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
            //bgGeo.start();

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

  .state('app.group', {
      url: '/group',
      templateUrl: 'templates/group.html',
      controller: 'GroupCtrl'
  })

  .state('app.map', {
      url: '/map?:latitude/:longitude',
      templateUrl: 'templates/map.html',
      controller: 'MapCtrl'
  })

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/home');
});
