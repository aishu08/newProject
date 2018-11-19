app.controller('assignpplCtrl', ['$rootScope', '$scope', '$mdDateRangePicker', '$http', '$timeout', '$mdDialog', '$stateParams', '$filter', '$mdMenu', '$timeout', '$interval', function($rootScope, $scope, $mdDateRangePicker, $http, $timeout, $mdDialog, $stateParams, $filter, $mdMenu, $timeout, $interval) {

    $scope.pageTitle = "Seat-Utilization Layout";
    $rootScope.button = false;
    $scope.selectedEmployee = {};
    $rootScope.userContent();
    var empIds = JSON.parse(localStorage.getItem('empIds'));

    $scope.selectedShift = {};

    var buColors = ['bu1', 'bu2', 'bu3', 'bu4', 'bu5', 'bu6', 'bu7', 'bu8', 'bu9', 'bu10', 'bu11', 'bu12', 'bu13', 'bu14', 'bu15', 'bu16', 'bu17', 'bu18', 'bu19', 'bu20', 'bu21', 'bu22', 'bu23', 'bu24', 'bu25', 'bu26', 'bu27', 'bu28', 'bu29', 'bu30', 'bu31'];

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

    $scope.empDetails = function(seat) {
        if (seat.empId) {
            $scope.selectedSeat = seat;
            $scope.selectedEmployee = employeeDetailsHash[seat.empId];
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


    $scope.assignSeat = function(employee) {
        if (employee.dropTargetId) {
            $http.post('/employeeApi/saveEmployee', employee).then(function(response) {
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
                empData();
                updateFloorData($scope.selectedFloor._id);
            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })

        }
    }

    $http.get('/employeeApi/allShiftNames').then(function(response) {

        $scope.shiftData = response.data;

    }, function(err) {
        console.log(err);
    });

    $scope.removeEmp = function(seat) {
        $http.post('/employeeApi/unassignEmployee', seat).then(function(response) {
            console.log(response);
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
            seat.empId = "";
            seat.empDept = "";
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        });
        for (var i = 0; i < $scope.empData.length; i++) {
            if (seat.empId == $scope.empData[i].id) {
                $scope.empData[i].seatId = "";
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
            $scope.pageTitle = $scope.selectedFloor.name
            var now = moment.tz(new Date(), "Asia/Kolkata");
        }, function(err) {
            console.log(err)
        });
    }

    $scope.setBus = function(floor) {
        $http.get('/app/api/getSectionNames/' + floor._id).then(function(response) {
            $scope.bus = response.data;
            // console.log($scope.bus);
            $scope.colors = {};
            for (var i = 0; i < $scope.bus.length; i++) {
                $scope.colors[$scope.bus[i].name] = buColors[i];
            }
            // console.log($scope.colors);
            $scope.pageTitle = "Seat Assignment - " + floor.name;
            // $scope.seats = [];
            updateFloorData(floor._id)
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



    //**************************************************************************************************************************


}]);