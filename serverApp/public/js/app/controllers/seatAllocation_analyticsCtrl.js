app.controller('seatAnalyticsCtrl', ['$rootScope', '$scope', '$mdDateRangePicker', '$http', '$timeout', '$mdDialog', '$stateParams', '$mdMenu', function($rootScope, $scope, $mdDateRangePicker, $http, $timeout, $mdDialog, $stateParams, $mdMenu) {
    var buildingId = $stateParams.bldgId;
    $scope.building = $stateParams.bldgId;
    $scope.loadingOccupancyChart = true;
    $scope.excelText = "Download";
    $scope.downloadingExcel = false;
    $scope.pageTitle = "Analytics";
    $scope.sidenav_btn = false;
    $scope.back_btn = true;
    $scope.timedata = moment.tz(new Date(), "Asia/Kolkata");
    $scope.timeslot = 'month';
    $scope.pattern = 'percent';
    $scope.hourlypattern = 'percenthourly';
    $scope.view = 'floor';
    $scope.hourlyOccupancyDate = new Date();
    $scope.maxDate = new Date();
    $scope.formulaClicked = false;
    $scope.formulaClicked1 = false;
    $rootScope.button = false;
    $rootScope.userContent();
    // $scope.level1 = false;
    // $scope.level2 = false;
    $scope.level = false;
    console.log($scope.level);

    $http.get('/app/api/floors/' + buildingId).then(function(response) {
        $scope.floorSelections = response.data;
        $scope.selectedFloor = $scope.floorSelections[0];
        console.log($scope.floorSelections);
    }, function(err) {
        console.log(err)
    });

    $scope.barChartData = 
        {
            barData : [{
                        name: 'Alloted',
                        values: [5, 3, 4, 7, 2]
                    }, {
                        name: 'Unalloted',
                        values: [2, 2, 3, 2, 1]
                    }],
            title :"Seat Allocation Pattern",
            labels : ['Level1', 'Level2', 'Level3', 'Level4', 'Level5']
        }


    $scope.donutChartData = {
        title: "Seat Allocation Pattern",
        donutData: [{
            type: 'pie',
            name: 'Area Analytics',
            innerSize: '50%',
            values: [
                ['Open Area', 70],
                ['Seating Area', 30]
            ]
        }]

    }

    $scope.donutChartCostData = {
        title: "Seat Allocation Pattern",
        donutData: [{
            type: 'pie',
            name: 'Area Analytics',
            innerSize: '50%',
            values: [
                ['Open Area Cost', 50],
                ['Seating Area Cost', 50]
            ]
        }]

    }

    $scope.level2trial = function(){
        $scope.level2 = !$scope.level2;
        
        $scope.donutChartData = 
        {
            title :"Seat Allocation Pattern",
            donutData : [{
                        type: 'pie',
                        name: 'Area Analytics',
                        innerSize: '50%',
                        values: [
                            ['Open Area', 80],
                            ['Seating Area', 20]
                        ]
                    }]
            
        }

        $scope.donutChartCostData = 
        {
            title :"Seat Allocation Pattern",
            donutData : [{
                        type: 'pie',
                        name: 'Area Analytics',
                        innerSize: '50%',
                        values: [
                            ['Open Area Cost', 60],
                            ['Seating Area Cost', 40]
                        ]
                    }]
            
        }
    }
                


}]);



//***************************************************************************************************************************