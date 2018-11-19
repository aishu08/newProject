app.controller('lightDashboardCtrl',['$rootScope','$scope','$timeout','$mdSidenav','$state','mapStyles', function ($rootScope,$scope,$timeout,$mdSidenav,$state,mapStyles) {
    $rootScope.pageTitle = "Building Analytics";
    $rootScope.sidenav_btn = true;
    $rootScope.back_btn=false;
    $rootScope.currentpath = $state;
    $scope.build_data = {
        totallights : 250,
        totalstaff : 2500,
        totalseats : 2500,
        activelights : 230,
        activestaff : 1500,
        activeseats : 1500,
        temp : 23,
        schedules:5,
        power:"2500W",
        occupiedseats : 1500,
        totalunoccseats : 2500
    }

    $scope.timedata = moment.tz(new Date(), "Asia/Kolkata");

//***************************SOCKET*******************************

    // var socket = io();
        $scope.myFunc = function () {
            socket.emit('dashboardData', $scope.build_data);
        }
        
        // socket.on('dashboardData', function(data){ 
        //      $scope.build_data;
        //      $scope.apply();
        // });

//**************************BUILDING_DATA*************************
    $scope.buildings = [{
        bid:1,
        val: false
    },{     
        bid:2,
        val: false
    },{
        bid:3,
        val: false
    },{
        bid:4,
        val: false
    },{
        bid:5,
        val: false
    }];

//******************************COMPARE_BUTTON********************

    $scope.showcmpbtn = false;
    var comparebid = [];
     $scope.compareitems = function(eachbid){
        console.log(eachbid.val);
        var buid = eachbid.bid;
        if(eachbid.val == true){
            comparebid.push({buid});
        }
        else{
            comparebid.pop({buid});
        }

        if(comparebid.length>1){
            $scope.showcmpbtn = true;
        }
        else{
            $scope.showcmpbtn = false;
            console.log("Comparision not possible");
        }
         $scope.count = comparebid.length;
    }   
   
}]);

//************************************************************************************************************
