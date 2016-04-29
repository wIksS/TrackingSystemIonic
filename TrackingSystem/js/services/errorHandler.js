"use strict";

app.factory('errorHandler', function (notifier) {
    var title = 'Error';

    return {
        handle: function (err) {
            console.log(err);
            var modelState = err.ModelState;
            if (modelState) {
                var isNotified = true;
                for (var model in modelState) {
                    for (var i = 0; i < modelState[model].length; i++) {
                        isNotified = false;
                        notifier.alert(title, modelState[model][i]);
                    }
                }

                if (isNotified) {
                    if (err.message) {
                        notifier.alert(title, err.message);
                    }
                    else if (err.Message) {
                        notifier.alert(title, err.Message);
                    }
                    else if (err.error_description) {
                        notifier.alert(title, err.error_description);
                    }
                }
            }
            else {
                if (err.message) {
                    notifier.alert(title, err.message);
                }
                else if (err.Message) {
                    notifier.alert(title, err.Message);
                }
                else if (err.error_description) {
                    notifier.alert(title, err.error_description);
                }
                else if (err.responseText) {
                    var response = JSON.parse(err.responseText);
                    if (response && response.error_description) {
                        notifier.alert(title, response.error_description);
                    }
                    else {
                        notifier.alert(title, err.responseText);
                    }
                }
            }
        }
    }
});