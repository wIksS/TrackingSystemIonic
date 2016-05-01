"use strict";

app.factory('notifier', function ($ionicPopup) {
    var localNotifcationId = 1;
    // creating a closure because otherwise 
    // there will be code dublication
    function notify(type) {
        var closureFunc = function (title, template) {
            return $ionicPopup[type]({
                title: title,
                template: template
            });
        }

        return closureFunc;
    }

    return {
        alert: notify("alert"),
        confirm: notify("confirm"),
        localNotification: function (message) {
            localNotifcationId++;
            localNotification.add(localNotifcationId, {
                seconds: 0,
                message: message,
                badge: 1
            });
        }
    }
});