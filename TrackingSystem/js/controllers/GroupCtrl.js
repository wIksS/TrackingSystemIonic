
app.controller('GroupCtrl', function ($scope, identity, errorHandler, $state, $timeout, groupService,locationService,baseUrl)
{
    var user = identity.getUser();
    $scope.isAdmin = identity.isAdmin();
    $scope.isTeacher = identity.isInRole('Teacher');
    $scope.url= baseUrl;

    groupService.getStudentsInGroup()
        .then(function (data)
        {
            $scope.students = data;

        }, function (err)
        {
            errorHandler.handle(err);
        });

    $scope.showOnMap = function(id)
    {
        locationService.getLocation(id)
            .then(function(data)
            {
                console.log(data);
                $state.go('app.map', {date:data.Date, latitude: data.Latitude, longitude: data.Longitude });
            }, function (err)
            {
                errorHandler.handle(err);
            })
    }

    $scope.removeFromGroup = function(currentStudent)
    {
        groupService.removeFromGroup(currentStudent.UserName)
            .then(function (data)
            {
                var index = $scope.students.indexOf(currentStudent);
                if (index > -1)
                {
                    $scope.students.splice(index, 1);
                    $scope.$apply();
                }

            }, function (err)
            {
                errorHandler.handle(err);
            })
    }
    
});