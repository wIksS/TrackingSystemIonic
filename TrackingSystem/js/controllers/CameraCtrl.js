app.controller('CameraCtrl', function ($scope, $cordovaCamera, $ionicLoading, identity, usersService)
{
    $scope.data = { "ImageURI": "Select Image" };
    $scope.profilePic = null;
    var user = identity.getUser();
    
    $scope.getImage = function()
    {
        // Retrieve image file location from specified source
        navigator.camera.getPicture(uploadPhoto, function (message)
        {
            alert('get picture failed');
        }, {
            quality: 30,
            destinationType: navigator.camera.DestinationType.FILE_URI,
            sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
            targetWidth: 100, targetHeight: 100,
        }
        );

    }

    function uploadPhoto(imageURI)
    {
        var img = $('#hidden-image');
        img.load(function ()
        {
            $(img).imageBlob().ajax('http://localhost:63810/api/file/UploadFile', {
                complete: function (jqXHR, textStatus)
                {
                    console.log('Uploaded pic');
                },
                headers: { "Authorization": "Bearer " + user.token },
            });
        })

        $scope.profilePic = imageURI;
        $scope.$apply();
    }

    function win(r)
    {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
        alert(r.response);
    }

    function fail(error)
    {
        alert("An error has occurred: Code = " + error.code);
    }
})
