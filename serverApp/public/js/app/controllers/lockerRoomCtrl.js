app.controller('lockerRoomCtrl', ['$rootScope', '$scope', '$mdDateRangePicker', '$http', '$timeout', '$mdDialog', '$stateParams', '$filter', '$mdMenu', '$timeout', '$interval', function($rootScope, $scope, $mdDateRangePicker, $http, $timeout, $mdDialog, $stateParams, $filter, $mdMenu, $timeout, $interval) {

    $scope.pageTitle = "Locker Assignment";
    $rootScope.button = false;
    $scope.selectedEmployee = {};
    $rootScope.userContent();
    var empIds = JSON.parse(localStorage.getItem('empIds'));

    //*************************************API'S***************************************

    $http.get('/app/api/buildingData').then(function(response) {
        $scope.buildings = response.data.buildingData;
        $scope.selectedBuilding = $scope.buildings[0];
        $scope.setfloor($scope.selectedBuilding);
    }, function(err) {
        console.log(err)
    });


    var user;
    $http.get('/app/api/userProfile/' + $rootScope.userId).then(function(response) {
        user = response.data;
        $rootScope.isAdmin = user.isAdmin;
    }, function(err) {
        console.log(err)
    });

    var empData = function() {
        if (empIds) {
            $http.post('/employeeApi/selectedEmployee', empIds).then(function(response) {
                $scope.empData = response.data;
            }, function(err) {
                console.log(err)
            });
        }
    }
    empData();

    var employeeDetailsHash;
    $http.get('/employeeApi/employeeData', { params: { hashMap: true } }).then(function(response) {
        employeeDetailsHash = response.data;
    }, function(err) {
        console.log(err);
    });




    //*************************SHOW_POPUP**********************************************

    $scope.empDetails = function(locker) {
        if (locker.empId) {
            $scope.selectedSeat = locker;
            $scope.selectedEmployee = employeeDetailsHash[locker.empId];
            $mdDialog.show({
                templateUrl: 'template/assignPeopleDialog',
                clickOutsideToClose: false,
                scope: $scope,
                preserveScope: true
            });
        }
    }

    $scope.cancel = function() {
        $scope.blur_content = false;
        $mdDialog.hide();
    }


    //*******************************Assign_seats**************************************

    $scope.assignLocker = function(employee) {
        if (employee.dropTargetId) {
            $http.post('/employeeApi/saveLockerRoom', employee).then(function(response) {
                empData();
                updateLockerData();
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            });

        }
    }

    $scope.removeEmp = function(locker) {
        $http.post('/employeeApi/unassignLocker', locker).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
            locker.empId = "";
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        });

        for (var i = 0; i < $scope.empData.length; i++) {
            if (locker.empId == $scope.empData[i].id) {
                $scope.empData[i].lockerId = "";
            }
        }
        $scope.blur_content = false;
        $mdDialog.hide();
    }

    //*************************************Update_Layout********************************

    $scope.setfloor = function(building) {
        $http.get('/app/api/floors/' + building.bldgId).then(function(response) {
            $scope.floors = response.data;
            $scope.selectedFloor = $scope.floors[0];
            $scope.setBus($scope.selectedFloor);
            // $scope.pageTitle = $scope.selectedFloor.name;
            var now = moment.tz(new Date(), "Asia/Kolkata");
        }, function(err) {
            console.log(err)
        });
    }

    $scope.setBus = function(floor) {
        $http.get('/app/api/getSectionNames/' + floor._id).then(function(response) {
            $scope.bus = response.data;
            $scope.pageTitle = "Locker Assignment - " + floor.name;
            $scope.seats = [];
            // updateFloorData(floor._id);
            // updateRoomData(floor._id);
            updateLockerData(floor._id);
        }, function(err) {
            console.log(err)
        });
    }

    var updateFloorData = function(floorId) {
        $http.get('/employeeApi/seatEmpData/' + floorId).then(function(response) {
            $scope.seats = response.data;
            var now = moment.tz(new Date(), "Asia/Kolkata")
        }, function(err) {
            console.log(err)
        });
    }

    var updateRoomData = function(floorId) {
        $http.get('/employeeApi/parkingSpots').then(function(response) {
            //console.log(response);
            $scope.rooms = response.data;
        }, function(err) {
            console.log(err)
        });
    }

    var updateLockerData = function() {
        $http.get('/employeeApi/lockerRooms').then(function(response) {
            //console.log(response);
            $scope.lockers = response.data;
        }, function(err) {
            console.log(err)
        });
    }



    //**************************************************************************************************************************


}]);