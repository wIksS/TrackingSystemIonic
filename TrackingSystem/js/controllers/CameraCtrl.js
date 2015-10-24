app.controller('CameraCtrl', function ($scope, $cordovaCamera, $ionicLoading) {
    $scope.data = { "ImageURI" :  "Select Image" };
    $scope.takePicture = function() {
        var options = {
            quality: 50,
            destinationType: Camera.DestinationType.FILE_URL,
            sourceType: Camera.PictureSourceType.CAMERA
        };
        $cordovaCamera.getPicture(options).then(
          function(imageData) {
              $scope.picData = imageData;
              $scope.ftLoad = true;
              //$localstorage.set('fotoUp', imageData);
              $ionicLoading.show({template: 'Foto acquisita...', duration:500});
          },
          function(err){
              $ionicLoading.show({template: 'Errore di caricamento...', duration:500});
          })
    }

    $scope.selectPicture = function() { 
        var options = {
            quality: 50,
            destinationType: Camera.DestinationType.FILE_URL,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY
        };

        $cordovaCamera.getPicture(options).then(
          function(imageURI) {
              window.resolveLocalFileSystemURL(imageURI, function (fileEntry)
              {
                  debugger;
                  $scope.picData = fileEntry.nativeURL;
                  $scope.ftLoad = true;
                  var image = document.getElementById('myImage');
                  image.src = fileEntry.nativeURL;
                  $scope.$apply();
              }, function (err)
              {
                  navigator.notification.alert(err);
              });

              $ionicLoading.show({template: 'Foto acquisita...', duration:500});
          },
          function(err){
              $ionicLoading.show({template: 'Errore di caricamento...', duration:500});
          })
    };

    $scope.uploadPicture = function() {
        $ionicLoading.show({template: 'Saving the photo'});
        var fileURL = $scope.picData;
        //var options = new FileUploadOptions();
        //options.fileKey = "file";
        //options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
        //options.mimeType = "image/jpeg";
        //options.chunkedMode = true;

        //var params = {};
        //params.value1 = "someparams";
        //params.value2 = "otherparams";

        //options.params = params;

        //var ft = new FileTransfer();
        //ft.upload(fileURL, encodeURI("http://www.yourdomain.com/upload.php"), viewUploadedPictures, function(error) {$ionicLoading.show({template: 'Connecting to server'});
        //    $ionicLoading.hide();}, options);
    }
})
