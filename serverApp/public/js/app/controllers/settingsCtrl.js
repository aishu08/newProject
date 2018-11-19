app.controller('settingsCtrl', ['$rootScope', '$scope', '$http', '$timeout', '$mdDialog', '$interval', function($rootScope, $scope, $http, $timeout, $mdDialog, $interval) {
    $rootScope.pageTitle = "Settings";
    $rootScope.routes = false;
    $rootScope.settingroutes = true;
    $rootScope.button = true;
    $rootScope.userContent();


    //********************************API CALLS FOR USER_DATA & BUILDINGS***********************
    var updateUserdata = function() {
        $http.get('/app/api/userData').then(function(response) {
            var userData = response.data;
            $scope.gridOptions.data = response.data;
        }, function(err) {
            console.log(err)
        });
    }
    updateUserdata();

    var user;
    $http.get('/app/api/userProfile/' + $rootScope.userId).then(function(response) {
        user = response.data;
        $rootScope.isAdmin = user.isAdmin;
    }, function(err) {
        console.log(err)
    });


    $http.get('/app/api/buildings').then(function(response) {
        console.log(response);
        $scope.locations = response.data;
    }, function(err) {
        console.log(err)
    });

    //*****************************************UI_GRID*****************************************************

    $scope.gridOptions = {
        enableSorting: true,
        enableColumnResizing: true,
        rowHeight: 45,
        columnDefs: [
            { field: 'name', displayName: 'Login ID', enableCellEdit: true },
            { field: 'firstName', displayName: 'First Name', enableCellEdit: true },
            { field: 'lastName', displayName: 'Last Name', enableCellEdit: true },
            { field: 'email', displayName: 'Email', enableCellEdit: true },
            { field: 'ResetPassword', displayName: 'Reset Password', enableCellEdit: false, cellTemplate: '<md-button class="md-raised md-primary left" ng-click="grid.appScope.resetDialog(row.entity)">Reset</md-button>' },
            { field: 'isAdmin', displayName: 'IsAdmin', enableCellEdit: false, cellTemplate: ' <md-switch ng-model="row.entity.isAdmin" class="md-primary alignment" aria-label="Switch 1" ng-change = "grid.appScope.adminData(row.entity)"></md-switch>' },
            { field: 'emailPriority', displayName: 'Trigger Email', enableCellEdit: false, cellTemplate: ' <md-switch ng-model="row.entity.emailPriority" class="md-primary alignment" aria-label="Switch 1" ng-change = "grid.appScope.triggerEmail(row.entity)"></md-switch>' },
            { field: 'reportPriority', displayName: 'Report Generation', enableCellEdit: false, cellTemplate: ' <md-switch ng-model="row.entity.reportPriority" class="md-primary alignment" aria-label="Switch 1" ng-change = "grid.appScope.reportGeneration(row.entity)"></md-switch>' },
            { field: 'accessibleLocation', displayName: 'Location View', enableCellEdit: false, cellTemplate: '  <md-input-container md-no-float><md-select class="drop" ng-model="row.entity.accessibleLocation" ng-change="grid.appScope.saveLocation(row.entity)" multiple><md-optgroup layout="column"  label="Locations"><md-option class="md-primary" ng-repeat="location in grid.appScope.locations" ng-value="location.id" ng-model="locationValue" >{{location.alias}}</md-option></md-optgroup></md-select></md-input-container>' },
            { field: 'isActive', displayName: 'Active', enableCellEdit: false, cellTemplate: ' <md-switch ng-model="row.entity.isActive" class="md-primary alignment" aria-label="Switch 1" ng-change = "grid.appScope.userStatus(row.entity)"></md-switch>' },
            { field: 'Delete', displayName: 'Delete', enableCellEdit: false, cellTemplate: '<md-button class="md-fab md-warn md-mini delete-icon" ng-click="grid.appScope.deleteUser(row.entity)"><i class="material-icons color-class">close</i></md-button>' }
        ]
    };

    //***************************************INLINE_EDIT*************************************

    $scope.gridOptions.onRegisterApi = function(gridApi) {
        $scope.gridApi = gridApi;
        gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {
            console.log(rowEntity);
            var edited = {};
            edited.id = rowEntity._id;
            edited.colDef = colDef.field;
            edited.newValue = newValue;
            $http.post('/app/api/saveEdited', edited).then(function(response) {
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        });
    };

    //*************************************USER_ACTIONS************************************

    $scope.saveLocation = function(location) {
        $http.post('/app/api/updateLocation', location).then(function(response) {

        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })
    }

    $scope.triggerEmail = function(row) {
        if (row.emailPriority == true) {
            row.emailPriority = 2;
            $http.post('/app/api/updateEmailPriority', row).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            updateUserdata();
        } else {
            row.emailPriority = 0;
            $http.post('/app/api/updateEmailPriority', row).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            updateUserdata();
        }
    }

    $scope.reportGeneration = function(report) {
        if (report.reportPriority == true) {
            report.reportPriority = 2;
            $http.post('/app/api/updateReportPriority', report).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            updateUserdata();
        } else {
            report.reportPriority = 0;
            $http.post('/app/api/updateReportPriority', report).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            updateUserdata();
        }
    }

    $scope.userStatus = function(status) {
        $http.post('/app/api/updateUserStatus', status).then(function(response) {
            console.log(response);
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })
    }

    $scope.adminData = function(admin) {
        $http.post('/app/api/updateAdminData', admin).then(function(response) {
            console.log(response);
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })
    }


    //****************************************RESET_PASSWORD*********************************
    var passwordData;
    $scope.resetDialog = function(row) {
        $scope.newPassword = row.firstName + "-" + row.lastName;
        row.password = $scope.newPassword;
        passwordData = row;
        $mdDialog.show({
            templateUrl: 'template/resetPassword',
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true
        });
        $scope.blur_content = true;
        console.log(row);
    }

    $scope.reset = function() {
        $http.post('/app/api/resetPassword', passwordData).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })
        $scope.blur_content = false;
        $mdDialog.hide();
    }

    $scope.cancelreset = function() {
        $scope.blur_content = false;
        $mdDialog.hide();
    }


    //*****************************************ADD_USER***************************************

    $scope.userDialog = function() {
        $mdDialog.show({
            templateUrl: 'template/addUser',
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true
        });
        $scope.blur_content = true;
    }

    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    $scope.addUser = function() {

        var user = $scope.user;
        user.password = user.fname + "-" + user.lname;
        console.log(user);
        if (validateEmail(user.email)) {
            $http.post('/app/api/addUser', $scope.user).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            updateUserdata();
            $scope.user = {};
            $scope.blur_content = false;
            $mdDialog.hide();
        } else {
            $rootScope.showToast("Invalid Email ID", 'error-toast');
        }
    };

    $scope.canceladmin = function() {
        $scope.user = {};
        $scope.blur_content = false;
        $mdDialog.hide();
    }

    //***************************************DELETE_USER*************************************

    $scope.deleteUser = function(user) {
            $http.post('/app/api/deleteUser', user).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            updateUserdata();
        }
        //***************************************************************************************************************************************
}]);