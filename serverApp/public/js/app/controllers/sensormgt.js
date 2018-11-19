app.controller('sensormgtCtrl', ['$rootScope','$scope','$mdDateRangePicker','$http','$timeout','$mdDialog','$stateParams','$filter' , '$mdMenu', '$timeout' , '$interval' , function($rootScope,$scope, $mdDateRangePicker, $http,$timeout,$mdDialog, $stateParams, $filter, $mdMenu, $timeout, $interval) {
        $rootScope.userContent();

        // var buildingId = $stateParams.bldgId;
        // $scope.building = $stateParams.bldgId;
        $scope.pageTitle = "Sensor-Management";
        $rootScope.button = false;


//*************************************API'S***************************************

        $http.get('/app/api/buildingData').then(function(response){
            console.log(response);
            $scope.buildings = response.data.buildingData;
            $scope.selectedBuilding = $scope.buildings[0];
            $scope.setfloor($scope.selectedBuilding);
            console.log($scope.selectedBuilding)
            }, function(err){
                console.log(err)
        });

        var user;
        $http.get('/app/api/userProfile/'+$rootScope.userId).then(function(response){
            user = response.data;
            $rootScope.isAdmin = user.isAdmin;
        }, function(err){
            console.log(err)
        });
        

    
//*************************************Update_Layout********************************

        $scope.setfloor = function(building){
            $http.get('/app/api/floors/'+building.bldgId).then(function(response){
                $scope.floors = response.data;
                $scope.selectedFloor = $scope.floors[0];
                $scope.setBus($scope.selectedFloor);
                console.log($scope.selectedFloor)
                $scope.pageTitle = "Sensor-Management - " + $scope.selectedFloor.name
                var now = moment.tz(new Date(), "Asia/Kolkata");
            }, function(err){
                console.log(err)
            });
        }

        $scope.setBus = function(floor){
            $http.get('/app/api/getSectionNames/'+floor._id).then(function(response){
                $scope.bus = response.data;
                $scope.pageTitle = "Sensor-Management - " + floor.name;
                $scope.seats = [];
                updateFloorData(floor._id)
            },function(err){
                console.log(err)
            });
        }

        var updateFloorData = function(floorId){
            $http.get('/app/api/seatBleData/'+floorId).then(function(response){
                $scope.seats = response.data;
                var now = moment.tz(new Date(), "Asia/Kolkata");
                
            }, function(err){
                console.log(err)
            });
        }

//*************************SHOW_POPUP**********************************************
        
        $scope.sensormgt = function(sensor){
            $mdDialog.show({
                templateUrl:'template/sensormgtDialog',
                clickOutsideToClose:false,
                scope : $scope,
                preserveScope : true
            }); 
            $scope.selectedSensor = sensor;
            $scope.sensorname = sensor.name;
            $scope.sensorble = sensor.ble;
        }
//*******************************Popup-Categories**************************************
       
        $scope.changeseatData = function(){
            $scope.selectedSensor.name = $scope.sensorname;
            $scope.selectedSensor.ble = $scope.sensorble;
            $http.post('/app/api/saveSeatConfiguration', $scope.selectedSensor).then(function(response){
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err){
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            console.log
            $scope.blur_content = false;
            $mdDialog.hide();
        }

        $scope.cancel = function(){
            $scope.blur_content = false;
            $mdDialog.hide();   
        }

        $scope.savePos = function(){
            console.log($scope.seats);
            $http.post('/app/api/saveSeatConfiguration', $scope.seats).then(function(response){
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err){
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        }
      
        
//**************************************************************************************************************************


}]);



      