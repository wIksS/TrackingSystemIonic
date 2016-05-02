app.directive('imageUpload', function () {
    function onUploadComplete(event, url, username) {
        $(".profile-image").attr("src", url + "/api/File/" + username + "?timestamp=" + new Date().getTime());
    }

    return {
        scope: {
            sendImgToServer: '&'
        },
        link: function ($scope, $element, $attr) {
            $scope.$on("uploadImg", function (event, args) {
                var img = $('#hidden-image');
                img.load(function () {
                    $scope.sendImgToServer()($(img));
                });
            });

            $scope.$on("uploadImgComplete", onUploadComplete);
        }
    }
});
