app.controller('dateCtrl', function($scope, $http,$timeout) {
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

    $scope.loading = function(data){
        if(data == true){
            $timeout(function(){
                $scope.loadingOccupancyChart = false;
                $scope.loadingPoccupancyChart = false;
                $scope.loadingmaxstack = false;
                $scope.loadingminstack = false;
                $scope.loadingBarChart = false;
                $scope.loadingbullet = false;
                $scope.loadingSeatUtil = false;
                $scope.loadingBooked = false;
            },5000);
        }
        else
        {
            $scope.loadingOccupancyChart = false;
            $scope.loadingPoccupancyChart = false;
            $scope.loadingmaxstack = false;
            $scope.loadingminstack = false;
            $scope.loadingBarChart = false;
            $scope.loadingbullet = false;
            $scope.loadingSeatUtil = false;
            $scope.loadingBooked = false;
            $scope.chartData = false;
            $scope.loadingError = true;
        }
    }

    $scope.sidenav=false;
    var tmpToday = new Date();

    $scope.selectedRange = {
        selectedTemplate: 'TD',
        dateStart: null,
        dateEnd: null
    };

    $scope.clickedbooked = function(){
        $scope.bookeduseddata = [{
                name: 'Booked hours',
                color: '#fbfd0b',
                data:[10,10,10,10,10,10,10,10,10]
            },
            {
                name: 'Used Hours',
                color: '#CB0A25',
                data: [7,8,9,1,2,3,4,5,6]
                
            }]
        $scope.bookedusedtitle = "Changed Data";
        $scope.empname = "B";
        $scope.intime = "8:00AM";
        $scope.outtime = "6:00PM";
    }
    $scope.radiobuttonval = "dark";

    // $scope.darktheme = function(){
    //     alert($scope.checkboxvalue);
    // }

    // $scope.lighttheme = function(){
        
    // }

    $scope.paramvar = true;
    // $scope.parameters = function(){
    //     $scope.paramvar = true;
    // }

    $scope.clear = function() {
        $scope.selectedRange.selectedTemplate = null;
        $scope.selectedRange.selectedTemplateName = null;
        $scope.selectedRange.dateStart = null;
        $scope.selectedRange.dateEnd = null;
    }
    $scope.onlyWeekendsPredicate = function(date) {
        var day = date.getDay();
        return day === 0 || day === 6;
    }

    $scope.clicked = function (){
        $scope.ncdata = [{
                name: 'Empty',
                maxPointWidth: 50,
                showInLegend: true,
                data: [300, 100, 400],
                color:'#5a5a5a'
            }, {
                name: 'Filled',
                maxPointWidth: 50,
                showInLegend: true,
                data: [200, 400, 100],
                color:'#CB0A25'
            }];
        $scope.nctitle = "Changed Data";
    }


    $scope.nctitle = "Hourly Occupancy"

    $scope.occupancydata = [{
        y:2
    },{
        y:5
    },{
        y:1
    },{
        y:3
    },{
        y:7
    },{
        y:5
    },{
        y:7
    },{
        y:20
    },{
        y:15
    },{
        y:15
    },{
        y:15
    },{
        y:19
    },{
        y:22
    },{
        y:14
    },{
        y:10
    },{
        y:11
    },{
        y:12
    },{
        y:12
    },{
        y:13
    },{
        y:13
    },{
        y:0
    },{
        y:0
    },{
        y:0
    },{
        y:0
    }]

    $scope.occupanytitle = "Power Consumption Data for Jul 20 2017 12:00:00AM";

    $scope.ncdata = [{
        name: 'Empty',
        maxPointWidth: 50,
        showInLegend: true,
        data: [200, 300, 350],
        color:'#5a5a5a'
    }, {
        name: 'Filled',
        maxPointWidth: 50,
        showInLegend: true,
        data: [200, 100, 50],
        color:'#CB0A25'
    }]

    // $scope.ncdata1 = [{
    //     name: 'Empty',
    //     maxPointWidth: 50,
    //     showInLegend: true,
    //     data: [500, 400, 250,130,200],
    //     color:'#5a5a5a'
    // }, {
    //     name: 'Filled',
    //     maxPointWidth: 50,
    //     showInLegend: true,
    //     data: [100, 400, 50,20,80],
    //     color:'#CB0A25'
    // }]

    // $scope.ncdata1 = [{
    //     name: 'Empty',
    //     maxPointWidth: 30,
    //     showInLegend: true,
    //     data: [200, 300, 350, 230, 100],
    //     color:'#5a5a5a'
    // }, {
    //     name: 'Filled',
    //     maxPointWidth: 30,
    //     showInLegend: true,
    //     data: [200, 100, 50, 200, 50],
    //     color:'#0183A5'
    // }]

    // $scope.ncdata2 =  [{
    //     name: 'Empty',
    //     maxPointWidth: 50,
    //     showInLegend: true,
    //     data: [200, 300, 350],
    //     color:'#5a5a5a'
    // }, {
    //     name: 'Filled',
    //     maxPointWidth: 50,
    //     showInLegend: true,
    //     data: [200, 100, 50],
    //     color:'#CB0A25'
    // }]

    // $scope.percentoccupancy = [{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:10
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // },{
    //     y:0
    // }]

    // $scope.percentocctitle = "Occupancy Percentage for Jul 20 2017 12:00:00AM";

    $scope.maxstackdata = [{
                showInLegend: true,
                name: 'Saved',
                data: [200],
                pointWidth: 30,
                maxPointWidth: 50,
                color:'#5a5a5a'
            }, {
                name: 'Consumed',
                showInLegend: true,
                pointWidth: 30,
                maxPointWidth: 50,
                data: [300],
                color:'#ff0000'
            }]

    $scope.maxstacktitle = "Power Consumption Chart for Jul 20 2017 12:00:00AM";


    // $scope.minstackdata = [{
    //         showInLegend: true,
    //         name: 'Empty',
    //         data: [400],
    //         pointWidth: 30,
    //         color:'#5a5a5a'
    //     }, {
    //         name: 'Filled',
    //         showInLegend: true,
    //         pointWidth: 30,
    //         data: [100],
    //         color:'#0183A5'
    //     }]

    // $scope.minstacktitle = "Min Stack Chart for Jul 20 2017 12:00:00AM";

    // $scope.bulletdata =  [{
    //         showInLegend: true,
    //         name: 'Empty',
    //         data: [400],
    //         pointWidth: 30,
    //         color:'#5a5a5a'
    //     }, {
    //         name: 'Filled',
    //         showInLegend: true,
    //         pointWidth: 30,
    //         data: [100],
    //         color:'#0183A5'
    //     }]

    // $scope.bullettitle = "Bullet Graph for Jul 20 2017 12:00:00AM";

    $scope.bargraphdata = [{
            name: 'Saved',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 300, 350, 230, 100],
            color:'#5a5a5a'
        }, {
            name: 'Consumed',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 100, 50, 200, 50],
            color:'#ff0000'
        }]

    $scope.bargraphtitle = "Power Consumption Graph for Jul 20 2017 12:00:00AM";

    // $scope.seatutildata =  [{
    //         name: 'Empty',
    //         maxPointWidth: 50,
    //         showInLegend: true,
    //         data: [200, 300, 350],
    //         color:'#5a5a5a'
    //     }, {
    //         name: 'Filled',
    //         maxPointWidth: 50,
    //         showInLegend: true,
    //         data: [200, 100, 50],
    //         color:'#CB0A25'
    //     }]

    //     $scope.seatutiltitle = "Seat-Util-Graph for Jul 20 2017 12:00:00AM";

        // $scope.peakutildata = [{
        //     name: 'Brands',
        //     colorByPoint: true,
        //     data: [{
        //         name: 'Microsoft Internet Explorer',
        //         y: 56.33
        //     }, {
        //         name: 'Chrome',
        //         y: 24.03,
        //         sliced: true,
        //         selected: true
        //     }, {
        //         name: 'Firefox',
        //         y: 10.38
        //     }, {
        //         name: 'Safari',
        //         y: 4.77
        //     }, {
        //         name: 'Opera',
        //         y: 0.91
        //     }, {
        //         name: 'Proprietary or Undetectable',
        //         y: 0.2
        //     }]
        // }]

        // $scope.peakutiltitle = "Peak-Utilization-Graph for Jul 20 2017 12:00:00AM";

        // $scope.bookeduseddata = [{
        //         name: 'Booked hours',
        //         color: '#fbfd0b',
        //         data:[8,8,8,8,8,8,8,8,8]
        //     },
        //     {
        //         name: 'Used Hours',
        //         color: '#CB0A25',
        //         data: [4,3,2,4,5,1,6,7,2]
                
        //     }]
            

        // $scope.bookedusedtitle = "Booked vs Used for Jul 20 2017 12:00:00AM"

});
