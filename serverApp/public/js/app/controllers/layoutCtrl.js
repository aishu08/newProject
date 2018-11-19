app.controller('layoutCtrl', ['$rootScope','$scope','$mdDateRangePicker','$http', '$interval', '$timeout','$filter', '$stateParams', function($rootScope,$scope, $mdDateRangePicker, $http, $interval, $timeout, $filter, $stateParams) {

    var buildingId = $stateParams.bldgId;
    $scope.pageTitle = "Layout";
    $scope.sidenav_btn=false;
    $scope.back_btn = true;
    $scope.lastRefreshed;
    $scope.seatStatus=[];
    $scope.selectedParameter = "occupancy";
    $scope.selectedHost = {};
    $scope.sections = [];

    var timeInterval = $interval(function(){
        timedata = moment.tz(new Date(), "Asia/Kolkata");
        $scope.time = timedata.format("hh:mm:ss A");
        // $scope.apply();
    }, 100)
   
//******************************http_call******************************

    $http.get('/app/api/floors/'+buildingId).then(function(response){
        $scope.floors = response.data;
        $scope.selectedFloor = $scope.floors[0];
        console.log($scope.selectedFloor)
        $scope.pageTitle = $scope.selectedFloor.name
        $scope.setBus($scope.selectedFloor);
    }, function(err){
        console.log(err)
    });


//*************************************************************************
    $scope.myFunc = function () {
        socket.emit('layoutData', $scope.analytics_data);
    }
        
        // socket.on('layoutData', function(data){ 
        //      $scope.analytics_data;
        //      $scope.apply();
        // });


    $scope.setBus = function(floor){
        $http.get('/app/api/getSectionNames/'+floor._id).then(function(response){
            //console.log(response);
            $scope.bus = response.data;
            $scope.hosts = null;
            $scope.pageTitle = floor.name;
            $scope.seats = [];
            updateSectionData(floor._id);
            updateFloorData(floor._id)
            updateRoomData(floor._id)
            getHosts(floor._id)
            //console.log($scope.bus)
        },function(err){
            console.log(err)
        });
    }
    var updateSectionData = function(floorId)
    {
        $http.get('/app/api/getSections/'+floorId).then(function(response){
            //console.log(response);
            $scope.sections = response.data;
        }, function(err){
            console.log(err)
        });
    }
    var updateFloorData = function(floorId){
        $http.get('/app/api/seatData/'+floorId).then(function(response){
            //console.log(response);
            $scope.seats = response.data;
            getSeatStatus(floorId);
        }, function(err){
            console.log(err)
        });
        $http.get('/app/api/tempData/'+floorId).then(function(response){
            //console.log(response);
            $scope.temps = response.data;
            getTempStatus(floorId);
        }, function(err){
            console.log(err)
        });
    }
    var getHosts = function(floorId){
        $http.get('/app/api/hostTime/'+ floorId).then(function(response){
            $scope.hosts = [];
            $scope.hosts = response.data
            $scope.hosts.forEach(function(host){
                $scope.selectedHost[host._id] = true;
            })
        }, function(err){
            console.log(err)
        });
    }
    var getSeatStatus = function(floorId){
        $http.get('/app/api/seatStatus/'+ floorId).then(function(response){
            //console.log(response);
            $scope.seatStatus = response.data.seats;
            var occupancycount = [];
            for(var i=0; i<$scope.seatStatus.length;i++){
                if($scope.seatStatus[i].occupied == true)
                    occupancycount.push($scope.seatStatus[i])
            }
            $scope.occ_count = occupancycount.length
            getRefreshTime(floorId)
        }, function(err){
            console.log(err)
        });
    }
    var getRefreshTime = function(floorId)
    {
        $http.get('/app/api/hostTime/'+ floorId).then(function(response){
            $scope.hostTime = {};
            response.data.forEach(function(host){
                $scope.hostTime[host._id] = host.lastUpdated;
            })            
        }, function(err){
            console.log(err)
        });
    }
    var getTempStatus = function(floorId){
        $http.get('/app/api/tempStatus/'+ floorId).then(function(response){
            //console.log(response);
            $scope.tempStatusData = response.data;
        }, function(err){
            console.log(err)
        });
    }
    var updateRoomData = function(floorId){
        $http.get('/app/api/roomData/'+floorId).then(function(response){
            //console.log(response);
            $scope.rooms = response.data;
            getRoomStatus(floorId);
        }, function(err){
            console.log(err)
        });
    }

    var getRoomStatus = function(floorId){
        $http.get('/app/api/roomStatus/'+ floorId).then(function(response){
            //console.log(response);
            $scope.roomStatus = response.data;
        }, function(err){
            console.log(err)
        });
    }
    $scope.getPeopleCount = function(roomId){
        if($scope.roomStatus)
        {
            var room = $filter('filter')($scope.roomStatus, {roomId: roomId}, true);
            if(room.length)
            {
                return room[0].peopleCount;
            }
        }
    }
    $scope.seatClass = function(seatId)
    {
        if($scope.seatStatus)
        {
            var seat = $filter('filter')($scope.seatStatus, {seatId: seatId}, true);
            if(seat.length)
            {
                if($scope.selectedParameter == 'occupancy')
                {
                    return seat[0].occupied ? '' : 'notOccupied'
                }
                else if($scope.selectedParameter == 'health')
                {
                    return seat[0].status ? 'healthy' : ''
                }
                
            }
        }
    }
    $scope.tempStatus = function(seatId){
        if($scope.tempStatusData)
        {
            var temp = $filter('filter')($scope.tempStatusData, {seatId: seatId}, true);
            if(temp.length)
            {
                return temp[0].temperature ? (temp[0].temperature <= 20 ? "cool" : (temp[0].temperature <= 27 ? "warm" : "hot")) : " cool";
            }
        }
    }
    $scope.isRoomOccupied = function(roomId)
    {
        if($scope.roomStatus)
        {
            var room = $filter('filter')($scope.roomStatus, {roomId: roomId}, true);
            if(room.length)
            {
                if($scope.selectedParameter == 'room')
                {
                    return room[0].peopleCount > 0 ? true: false;
                }
                else
                {
                    return false
                }
            }
            else
                return false
        }
    }
   
    var seatStatusIntervalPromise = $interval(function(){
        if($scope.selectedFloor)
        {
            getSeatStatus($scope.selectedFloor._id);
            getRoomStatus($scope.selectedFloor._id);
        }
        
    },3000);
    $scope.$on('$destroy', function(){
        if(seatStatusIntervalPromise)
        {
            $interval.cancel(seatStatusIntervalPromise);
        }
    });



}]);
