"use strict";

app.factory('errorHandler', ['notifier', function (notifier) {
    var title = 'Error';

    function checkModelState(err) {
        var modelState = err.ModelState;
        if (modelState) {
            for (var model in modelState) {
                for (var i = 0; i < modelState[model].length; i++) {
                    notifier.alert(title, modelState[model][i]);
                }
            }
        }
    }

    return {
        handle: function (err) {
            var message = '';
            console.log(err);
            checkModelState(err);

            message = err.message || err.Message;
            if (!message) {
                message = err.error_description;
            }

            if (!message && err.responseText) {
                var response = JSON.parse(err.responseText);
                if (response && response.error_description) {
                    message = response.error_description;
                }
                else {
                    message = err.responseText;
                }
            }

            notifier.alert(title, message);
        }
    }
}]);