"use strict";

app.factory('notifier', function ($ionicPopup) {
    // creating a closure because otherwise 
    // there will be code dublication
    function notify(type) {
        var closureFunc = function (title, template) {
            $ionicPopup[type]({
                title: title,
                template: template
            });
        }

        return closureFunc;
    }

    return {
        alert: notify("alert"),
        confirm: notify("confirm")
    }
});