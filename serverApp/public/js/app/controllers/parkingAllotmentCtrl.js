app.controller('parkingAllotmentCtrl', ['$rootScope', '$scope', '$mdDateRangePicker', '$http', '$timeout', '$mdDialog', '$stateParams', '$filter', '$mdMenu', '$timeout', '$interval', function($rootScope, $scope, $mdDateRangePicker, $http, $timeout, $mdDialog, $stateParams, $filter, $mdMenu, $timeout, $interval) {

    $scope.pageTitle = "Seat-Utilization Layout";
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

    $scope.empDetails = function(room) {
        if (room.empId) {
            $scope.selectedSeat = room;
            $scope.selectedEmployee = employeeDetailsHash[room.empId];
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

    $scope.assignParking = function(employee) {
        if (employee.dropTargetId) {
            $http.post('/employeeApi/saveParkingSpot', employee).then(function(response) {
                empData();
                updateRoomData($scope.selectedFloor._id);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })

        }
    }

    $scope.removeEmp = function(seat) {
        $http.post('/employeeApi/unassignParking', seat).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
            seat.empId = "";
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        });

        for (var i = 0; i < $scope.empData.length; i++) {
            if (seat.empId == $scope.empData[i].id) {
                $scope.empData[i].parkingSpotId = "";
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
            $scope.pageTitle = $scope.selectedFloor.name;
            var now = moment.tz(new Date(), "Asia/Kolkata");
        }, function(err) {
            console.log(err)
        });
    }

    $scope.setBus = function(floor) {
        $http.get('/app/api/getSectionNames/' + floor._id).then(function(response) {
            $scope.bus = response.data;
            $scope.pageTitle = "Seat Assignment - " + floor.name;
            $scope.seats = [];
            updateFloorData(floor._id);
            updateRoomData(floor._id);
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
            console.log($scope.rooms);
        }, function(err) {
            console.log(err)
        });
    }



    //**************************************************************************************************************************


}]);