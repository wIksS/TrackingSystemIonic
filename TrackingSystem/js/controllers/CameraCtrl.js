"use strict";

app.controller('CameraCtrl', function ($scope, $cordovaCamera, $ionicLoading, identity, usersService, baseUrl, imageUploadService, notifier, errorHandler) {
    $scope.url = baseUrl;
    $scope.data = { "ImageURI": "Select Image" };
    $scope.profilePic = null;
    identity.setScopeData($scope);
    debugger;
    function uploadPhoto(imageURI) {
        $scope.$broadcast("uploadImg");
        $scope.profilePic = imageURI;
        $scope.$apply();
    }

    function getPicture(picSourceType) {
        navigator.camera.getPicture(uploadPhoto, function (message) {
            notifier.alert('Get picture failed');
        },
        {
            quality: 30,
            destinationType: navigator.camera.DestinationType.FILE_URI,
            sourceType: picSourceType,
            targetWidth: 100, targetHeight: 100,
        });
    }

    // Retrieve image file location from specified source
    $scope.getImage = function () {        
        getPicture( navigator.camera.PictureSourceType.PHOTOLIBRARY);
    }

    // Retrieve image file from camera
    $scope.takeImage = function () {
        getPicture(navigator.camera.PictureSourceType.CAMERA);
    }

    $scope.sendPhotoToServer = function (jqueryImg) {
        var imageBlob = jqueryImg.imageBlob();
        imageUploadService.upload(imageBlob)
        .then(function () {
            $scope.$broadcast("uploadImgComplete", $scope.url, $scope.user.username);
        }, function (error) {
            errorHandler.handle(error);
        });
    }
})
