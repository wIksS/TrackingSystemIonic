app.directive('imageUpload', function () {
    function uploadImgJqueryOnUpload($scope) {
        return function () {
            var img = $('#hidden-image');
            img.load(function () {
                $scope.sendPhotoToServer($(img));
            });
        }
    }

    function onUploadComplete($scope) {
        return function (jqXHR, textStatus) {
            $(".profile-image").attr("src", $scope.url + "/api/File/" + $scope.user.username + "?timestamp=" + new Date().getTime());
            console.log('Uploaded pic');
        }
    }

    return {
        link: function ($scope, $element, $attr) {
            $scope.uploadImgDirective.uploadImgJqueryOnUpload = uploadImgJqueryOnUpload($scope);
            $scope.uploadImgDirective.onUploadComplete = onUploadComplete($scope);
        }
    }
});
