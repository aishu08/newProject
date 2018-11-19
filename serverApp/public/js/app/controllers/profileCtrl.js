app.controller('profileCtrl', ['$rootScope', '$scope', '$http', '$timeout', '$mdDialog', function($rootScope, $scope, $http, $timeout, $mdDialog) {
    $scope.pageTitle = "Profile Settings";
    $scope.open = false;
    $rootScope.button = false;
    $rootScope.userContent();

    var userId = $rootScope.userId;

    //****************************USER_DATA****************************************
    var userProfile = function() {
        $http.get('/app/api/userProfile/' + userId).then(function(response) {
            $scope.user = response.data;
            $rootScope.isAdmin = response.data.isAdmin;
            console.log($scope.user);
            if ($scope.user.emailPriority == 2) {
                $scope.user.emailPriority = "Enabled";
            } else if ($scope.user.emailPriority == 0) {
                $scope.disableEmail = true;
                $scope.user.emailPriority = "Disabled";
            } else
                $scope.user.emailPriority = "Disabled";

            if ($scope.user.reportPriority == 2) {
                $scope.user.reportPriority = "Enabled";
            } else if ($scope.user.reportPriority == 0) {
                $scope.disableReport = true;
                $scope.user.reportPriority = "Disabled";
            } else
                $scope.user.reportPriority = "Disabled";
        }, function(err) {
            console.log(err)
        });
    }
    userProfile();

    //*************************************EDIT*************************************

    $scope.saveData = function() {
        $scope.chpassword = !$scope.chpassword;
        $http.post('/app/api/saveUserData', $scope.user).then(function(response) {
            console.log(response);
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })
    }

    $scope.userEmail = function(email) {
        if (email.emailPriority == 'Enabled') {
            email.emailPriority = 2;
            email._id = email.id;
            $http.post('/app/api/updateEmailPriority', email).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            userProfile();
        } else {
            email.emailPriority = 1;
            email._id = email.id;
            $http.post('/app/api/updateEmailPriority', email).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            userProfile();
        }
    }

    $scope.userReport = function(report) {
        console.log(report.reportPriority);
        if (report.reportPriority == "Enabled") {
            report.reportPriority = 2;
            report._id = report.id;
            $http.post('/app/api/updateReportPriority', report).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            userProfile();
        } else {
            report.reportPriority = 1;
            report._id = report.id;
            $http.post('/app/api/updateReportPriority', report).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            userProfile();
        }
    }

    //**************************************CHANGE_PASSWORD***************************
    $scope.changePassword = function() {
        $mdDialog.show({
            templateUrl: 'template/chPasswordDialog',
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true
        });
    }

    $scope.cancel = function() {
        $scope.userProfile = {};
        $scope.blur_content = false;
        $mdDialog.hide();
    }

    $scope.change = function() {
            $http.post('app/api/changePassword', $scope.userProfile).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            $scope.userProfile = {};
            $scope.blur_content = false;
            $mdDialog.hide();
            $rootScope.logout();
        }
        //*******************************************************************************************************
}]);