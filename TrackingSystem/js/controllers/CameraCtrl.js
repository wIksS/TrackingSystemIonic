"use strict";

app.controller('CameraCtrl', function ($scope, $cordovaCamera, $ionicLoading, identity, usersService, baseUrl, imageUploadService, notifier, errorHandler) {
    $scope.url = baseUrl;
    $scope.data = { "ImageURI": "Select Image" };
    $scope.profilePic = null;
    identity.setScopeData($scope);
    // this object is used to set directive functions so that they 
    // can be use from the controller because the scope is different
    $scope.uploadImgDirective = {};

    $scope.sendPhotoToServer = function (jqueryImg) {
        var imageBlob = jqueryImg.imageBlob();
        imageUploadService.upload(imageBlob, $scope.uploadImgDirective.onUploadComplete, function (error) {
            errorHandler.handle(error);
        });
    }

    function uploadPhoto(imageURI) {
        $scope.uploadImgDirective.uploadImgJqueryOnUpload();
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
})
