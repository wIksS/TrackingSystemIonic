
app.controller('SettingsCtrl', function ($scope, identity, errorHandler, $state, $timeout, groupService)
{
    var user = identity.getUser();
    $scope.isAdmin = identity.isAdmin();
    $scope.isTeacher = identity.isInRole('Teacher');

    $scope.min = 50;
    $scope.max = 5000;

    $scope.currentDistance = user.group.MaxDistance;

    if (!$scope.isTeacher)
    {
        $timeout(function ()
        {
            $state.go('app.home', {}, { reload: true });
        });
    }

    $scope.changeGroupDistance = function (newDistance)
    {
        groupService.changeGroupDistance(newDistance)
            .then(function (data)
            {
                $scope.currentDistance = data.MaxDistance;
                identity.setGroup(data);
            },
            function (err)
            {
                errorHandler.handle(err);
            })
    }

});