/**
 * Created by Виктор on 27.9.2014 г..
 */

app.controller('StudentGroupsCtrl',function ($scope, identity,errorHandler,studentsService) {
    var user = identity.getUser(),
        interval;
    $scope.isLogged = identity.isLogged();
    $scope.isAdmin = identity.isAdmin();
    $scope.isTeacher = identity.isInRole('Teacher');
    $scope.user = user || {};
    $scope.username = user.username;

    $scope.$on('$routeChangeStart', function (next, current) {
        user = identity.getUser();
        $scope.isLogged = identity.isLogged();
        $scope.isAdmin = identity.isAdmin();
        $scope.isTeacher = identity.isInRole('Teacher');
        $scope.user = $scope.user || {};
        $scope.username = user.username;
    });
	
	studentsService.getStudents()
    	.then(function(data){
        	$scope.students = data;
        	$scope.$apply();
    	},function(err){
        	console.log(err);
    	});
    
    $scope.addStudentToGroup = function(userName){
        studentsService.addStudentToGroup(userName)
        	.then(function(data){
            	alert('Added student to group');
        	},function(err){
            	console.log(err);
        	});
    }
});