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
            })
    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function ()
        {
            navigator.notification.alert(window.plugins + cordova.plugins);
            window.navigator.geolocation.getCurrentPosition(function (location)
            {
                navigator.notification.alert(location);
            });

            navigator.notification.alert(window.plugins.backgroundGeoLocation);

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
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
