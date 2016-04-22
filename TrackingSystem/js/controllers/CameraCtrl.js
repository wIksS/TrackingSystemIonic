"use strict";

app.controller('CameraCtrl', function ($scope, $cordovaCamera, $ionicLoading, identity, usersService, baseUrl) {
    $scope.url = baseUrl;
    $scope.data = { "ImageURI": "Select Image" };
    $scope.profilePic = null;

    function uploadPhoto(imageURI) {
        var user = identity.getUser();

        var img = $('#hidden-image');
        img.load(function () {
            $(img).imageBlob().ajax($scope.url + '/api/file/UploadFile', {
                complete: function (jqXHR, textStatus) {
                    $(".profile-image").attr("src", $scope.url + "/api/File/" + user.username + "?timestamp=" + new Date().getTime());
                    console.log('Uploaded pic');
                },
                error: function (err) {
                    console.log(err);
                },
                headers: { "Authorization": "Bearer " + user.token },
            });
        })

        $scope.profilePic = imageURI;
        $scope.$apply();
    }

    function win(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
        alert(r.response);
    }

    function fail(error) {
        alert("An error has occurred: Code = " + error.code);
    }

    $scope.getImage = function () {
        // Retrieve image file location from specified source
        navigator.camera.getPicture(uploadPhoto, function (message) {
            alert('get picture failed');
        },
        {
            quality: 30,
            destinationType: navigator.camera.DestinationType.FILE_URI,
            sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
            targetWidth: 100, targetHeight: 100,
        });
    }

    $scope.takeImage = function () {
        navigator.camera.getPicture(uploadPhoto, function (message) {
            alert('get picture failed');
        },
        {
            quality: 30,
            destinationType: navigator.camera.DestinationType.FILE_URI,
            sourceType: navigator.camera.PictureSourceType.CAMERA,
            targetWidth: 100, targetHeight: 100,
        }
        );
    }
})
