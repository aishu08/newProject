app.controller('comparisionCtrl', ['$rootScope','$scope','$mdDateRangePicker','$http','$timeout','$mdDialog','$state','$stateParams', '$mdMenu', function($rootScope,$scope, $mdDateRangePicker, $http,$timeout,$mdDialog,$state,$stateParams,$mdMenu) {
    $rootScope.pageTitle = "Comparision";
    $scope.sidenav_btn = false;
    $scope.currentpath = $state;
    $scope.compdatepicker = new Date();
    $scope.buildingselected =  $rootScope.comparebid;   
    $rootScope.button = false;
    $rootScope.userContent();
    

    $http.get('/app/api/buildingData').then(function(response){
        $scope.buildings = response.data;
        $scope.buildings.val = false;
        console.log($scope.buildings);
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


    $scope.floorData5 = [{
        id:1,
        occupied:30,
        unoccupied:100
    },{
        id:2,
        occupied:50,
        unoccupied:100
    },{
        id:3,
        occupied:20,
        unoccupied:100
    },{
        id:4,
        occupied:90,
        unoccupied:100
    },{
        id:5,
        occupied:40,
        unoccupied:100
    }]

 

//*****************************SOCKET*******************************************

     // var socket = io();
        // $scope.myFunc = function () {
        //     socket.emit('layoutData', $scope.analytics_data);
        // }
        
        // socket.on('layoutData', function(data){ 
        //      $scope.analytics_data;
        //      $scope.apply();
        // });

//***************************CHART_DATA*******************************************

    
    var percentoccupancychart = 
    {
        occupancy : [{
                        name:"Building1",
                        values:[9,8,7,6,5,4,3,2,1,0,1,2,3,2,3,3,4,5,6,7,8,9,10,5]
                    },{
                        name:"Building2",
                        values:[10,9,8,7,6,5,4,3,2,1,0,0,1,2,3,4,5,6,7,8,9,10,9,6] 
                    },{
                        name:"Building3",
                        values:[0,10,9,8,7,6,5,4,3,2,1,10,0,10,9,8,7,6,5,4,3,2,1,0]
                    },{
                        name:"Building4",
                        values:[1,0,0,1,2,3,4,5,6,7,8,9,10,9,6,10,9,8,7,6,5,4,3,2]
                    },{
                        name:"Building5",
                        values:[3,2,1,0,0,1,2,3,4,5,6,7,0,1,2,4,6,3,2,1,2,2,4]
                    }],
        title : "Occupancy Percentage for Jul 20 2017 12:00:00AM"              
    }


    $scope.percentoccupancychart_data = 
    {
        percentoccupancy : [],
        percentocctitle :"Occupancy Data for Jul 20 2017 12:00:00AM"
    }

    var updatePercentOccupancy = function(percentoccupancychart){
        $scope.percentoccupancychart_data = percentoccupancychart;
    }

     updatePercentOccupancy(percentoccupancychart);

    $scope.select_all = function(){
        for(var i =0;i< percentoccupancychart.occupancy.length;i++){
            percentoccupancychart.occupancy[i].visible = $scope.selectall;
        }
    }
        

      

//*******************************************Date_picker**************************

    $scope.build_cmp_date_Range = {
        selectedTemplate: 'TD',
        dateStart: null,
        dateEnd: null
    };

   $scope.compare_ok = function(startDate,endDate) {
        var startDate = moment(startDate, 'DD/MM/YYYY');
        var endDate = moment(endDate, 'DD/MM/YYYY');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        console.log(sdate, smonth, syear);
        console.log(edate, emonth, eyear);
        console.log("Working");
        $mdMenu.hide();
    }
  
}]);
//*****************************************************************************************************************

   