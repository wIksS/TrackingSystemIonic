"use strict";

app.factory('signalrService', ['$ionicPopup', '$state', 'baseUrl', 'identity', 'notifier',
function ($ionicPopup, $state, baseUrl, identity, notifier) {
    var connection = {},
        eventHubProxy = {};

    function eventReceived(event) {
        if (window.localNotification && localNotification) {
            localNotification.add(100,
            {
                seconds: 0,
                message: 'New event : ' + event.message,
                badge: 1
            });
        }


        var alertPopup = notifier.confirm('Event', event.Message)
        .then(function (res) {
            $state.go('app.map',
                {
                    date: event.Date,
                    latitude: event.Latitude,
                    longitude: event.Longitude
                });
        });
    }

    return {
        initConnection: function () {
            connection = $.hubConnection(baseUrl + '/signalr', { useDefaultPath: false });
            eventHubProxy = connection.createHubProxy('eventHub');
            eventHubProxy.on('receiveEvent', eventReceived);
            connection.start().done(function () {
                console.log('Openned connection');
            })
            .fail(function (error) {
                console.log('Invocation of start failed. Error: ' + error)
            });;

        },

        invokeServerFunc: function () {
            eventHubProxy.invoke.apply(eventHubProxy, arguments);
        },

        addToRoom: function (groupName) {
            var user = identity.getUser();

            this.invokeServerFunc('JoinRoom', groupName, user.username);
        }
    }
}]);