app.controller('densityLayoutCtrl',['$stateParams', '$resource', '$location','$scope','$http','$timeout','$mdDialog','$mdToast', '$state','$interval',function($stateParams, $resource, $location, $scope, $http, $timeout, $mdDialog, $mdToast,$state,$interval) {
    var buildingId = $stateParams.bldgId
    $scope.empname = "A";
    $scope.intime = "7:00AM";
    $scope.outtime = "5:00PM";
    $scope.loadingOccupancyChart = true;
    $scope.loadingPoccupancyChart = true;
    $scope.loadingmaxstack = true;
    $scope.loadingminstack = true;
    $scope.loadingBarChart = true;
    $scope.loadingbullet = true;
    $scope.loadingSeatUtil = true;
    $scope.loadingBooked = true;
    $scope.chartData = true;
    $scope.loaddata = true;
    $scope.peopleCount;
    $scope.render = false
    $scope.day ="tuesday";
    $scope.mostOptimal;
    $scope.leastOptimal;
    //$scope.time="3:00 PM";
    $scope.pageActive=true; 
    $scope.pageId="LightingC4";
    $scope.densityData;
    
    function time(){
        timedata = moment.tz(new Date(), "Asia/Kolkata");
        $scope.day = timedata.format("dddd, DD MMM YYYY");
        $scope.time = timedata.format("hh:mm:ss A");
    };
    $http.get('/app/api/floors/'+buildingId).then(function(response){
        $scope.floors = response.data;
        $scope.selectedFloor = $scope.floors[0];
        $scope.pageTitle = $scope.selectedFloor.alias
        // getAllLightsFloor($scope.selectedFloor)
        // getOccupancyValues()
        loadheatMap()
    }, function(err){
        console.log(err)
    });
    time()
    function loadheatMap(){
        floor = $scope.selectedFloor
        var floorId = floor._id 
        $http.get('/light/getAllSOS/'+floorId).then(function(response){
            $scope.densityData = response.data.msg
            console.log('printing density data')
            console.log($scope.densityData)
            var points = []
            var max = 20
            $scope.densityData.forEach(function(density){
                if(density.occupancy <=0 || density.occupancy=='false'){
                    $scope.peopleCount = 0;
                } else{
                    $scope.peopleCount = density.occupancy
                }
                var temp = {
                    x:density.lightPosX,
                    y:density.lightPosY,
                    value:$scope.peopleCount,
                    radius:60
                }
                points.push(temp)
            })
            $scope.passed_data = { 
                max: max, 
                data: points
            };
            $scope.render=true;
        })
    }
    // function loadheatMap(){
    // //      console.log($scope.peopleCount)
    // //      $http.get('http://192.168.1.7:3030/light/getSmartOccupancyValue/9b2d').then(function(data){
    // //     console.log(data.data.msg.count);
    // //     peopleCount = data.data.msg.count
    // //     // $scope.peopleCount = 25;
    // //     console.log($scope.peopleCount);
    // //     if(peopleCount <=0 || peopleCount=='false'){
    // //         $scope.peopleCount = 0;
    // //     } else{
    // //         $scope.peopleCount = peopleCount
    // //     }
    // //     var max=20;
        
    // //     var points = [
    // //     {
    // //        x:600,
    // //        y:120,
    // //        value:$scope.peopleCount,
    // //        radius:60

    // //     },{
    // //         x:900,
    // //         y:120,
    // //         value:$scope.peopleCount,
    // //         radius:60
 
    // //      }
    // //     ];

    // //     $scope.passed_data = { 
    // //         max: max, 
    // //         data: points
    // //     };
    // //     $scope.render=true;
    // // })

    // }
    // loadheatMap()
    callTimeOut()
    function callTimeOut(){
        $interval(function(){
            loadheatMap()
            //callTimeOut()
            // $state.reload();
            
         },60000)
    }  

}])

app.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope);
            });
        });
    };
});
