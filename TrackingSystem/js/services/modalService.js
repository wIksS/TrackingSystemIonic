"use strict";

app.factory('modalService', function ($ionicModal) {
    var title = 'Error',
        uniqueId = 1,
        self = this;

    return {
        // id has to be unique
        create: function ($scope, url, id) {
            return $ionicModal.fromTemplateUrl(url,
            {
                id: id,
                scope: $scope
            })
            .then(function (modal) {
                self[id] = modal;
            });
        },
        open: function (id) {
            self[id].show();
        },
        close: function (id) {
            self[id].hide();
        },
        getId: function () {
            uniqueId++;
            return uniqueId;
        }
    }
});