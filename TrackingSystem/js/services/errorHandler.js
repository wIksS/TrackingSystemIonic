app.factory('errorHandler', function () {
     return {
        handle: function (err) {
            console.log(err);
            var modelState = err.ModelState;
            if (modelState) {
                var isNotified = true;
                for (var model in modelState) {
                    for (var i = 0; i < modelState[model].length; i++) {
                        isNotified = false;
                        navigator.notification.alert(modelState[model][i]);
                    }
                }

                if (isNotified) {
                    if (err.message) {
                        navigator.notification.alert(err.message);
                    }
                    else if (err.Message) {
                        navigator.notification.alert(err.Message);
                    }
                    else if (err.error_description) {
                        navigator.notification.alert(err.error_description);
                    }
                }
            }
            else {
                if(err.message){
                    navigator.notification.alert(err.message);
                }
                else if (err.Message) {
                    navigator.notification.alert(err.Message);
                }
                else if (err.error_description) {
                    navigator.notification.alert(err.error_description);
                }
                else if(err.responseText){
                    navigator.notification.alert(err.responseText);
                }
            }        
        }
    }
});