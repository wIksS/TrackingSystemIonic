'use strict';

var app = angular.module('TrackingSystem', ['ionic', 'ngCordova'])
.constant('baseUrl', 'http://trackingsystemserverspringconf.apphb.com/')//http://trackingsystemserver.apphb.com')//http://localhost:63810')

.run(function ($ionicPlatform, signalrService, locationService, notifier, backgroundLocationService) {
    $ionicPlatform.ready(function () {
        signalrService.initConnection();

        var backgroundLocation = backgroundGeoLocation;
        backgroundLocationService.configure(backgroundLocation, addLocation, failureFn);
        // Turn ON the background-geolocation system.  
        // The user will be tracked whenever they suspend the app.
        backgroundLocation.start();

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

.config(function ($ionicConfigProvider) {
    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.tabs.style('standard').position('bottom');
    $ionicConfigProvider.navBar.alignTitle('center').positionPrimaryButtons('left');
})

.config(function ($stateProvider, $urlRouterProvider) {
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
        controller: 'EventCtrl'
    })
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/home');
});
