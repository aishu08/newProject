app.controller('lightAnalytics', ['$rootScope','$scope','$mdDateRangePicker','$http','$timeout','$mdDialog','$stateParams', '$mdMenu', function($rootScope,$scope, $mdDateRangePicker, $http,$timeout,$mdDialog, $stateParams, $mdMenu) {
    var buildingId = $stateParams.bldgId;
    $scope.building = $stateParams.bldgId;
    $scope.loadingOccupancyChart = true;
    $scope.excelText = "Download"
    $scope.downloadingExcel = false
    $scope.pageTitle = "Analytics";
    $scope.sidenav_btn=false;
    $scope.back_btn = true;
    $scope.timedata = moment.tz(new Date(), "Asia/Kolkata");
    $scope.timeslot = 'month'
    $scope.pattern = 'percent'
    $scope.floorView = 'lightsCount'
    $scope.hourlypattern = 'percenthourly'
    $scope.view = 'floor'
    $scope.hourlyOccupancyDate = new Date();
    $scope.maxDate = new Date();
    $scope.formulaClicked = false;
    $scope.formulaClicked1 = false;
    $scope.selectedParam = 'lights';
    
    $scope.buPercent = {
        size:110,
        barColor:'#0183A5',
        trackColor: '#2A2A2A',
        lineWidth:4,
        scaleColor: false,
        lineCap:'round'
    }
    $scope.minData = {
        _id:1,
        total:380,
        filled:10,
        name:"Level1",
        percentFilled: "4.3%"
    }
    $scope.maxData = {
        _id:1,
        total:380,
        filled:100,
        name:"Level10",
        percentFilled: "63%"
    }


    $scope.graphDetails = function(image)
    {
        $scope.graphImage = image;
        $mdDialog.show({
            templateUrl:'template/graphDetails',
            clickOutsideToClose:false,
            scope : $scope,
            preserveScope : true
        });
        $scope.blur_content = true;
    }
    $scope.closeDialog = function()
    {
        $scope.blur_content = false;
        $mdDialog.hide();
    }

    $scope.changeclass = function(){
        $scope.formulaClicked = !$scope.formulaClicked;
        $scope.iconClicked = !$scope.iconClicked;
    }
    $scope.changeclass1 = function(){
        $scope.formulaClicked1 = !$scope.formulaClicked1;
        $scope.iconClicked1 = !$scope.iconClicked1;
    }


//****************************HTTP_CALL********************************************


    $http.get('/app/api/floors/'+buildingId).then(function(response){
        $scope.floorSelections = response.data;
        $scope.selectedFloor = $scope.floorSelections[0];
        var now = moment.tz(new Date(), "Asia/Kolkata");
        // updateRoomUtilData($scope.selectedFloor._id, now.format('YYYY') , now.format('M'), now.format("D"), now.format('YYYY') , now.format('M'), now.format("D"))
        // updateUtilData($scope.selectedFloor._id, now.format('YYYY') , now.format('M'), now.format("D"), now.format('YYYY') , now.format('M'), now.format("D"))
    }, function(err){
        console.log(err)
    });



    $http.get('/light/floorLightUsage/'+buildingId).then(function(response){
        $scope.floors = response.data.floorOccupancy;
        $scope.minData = response.data.minPercentData;
        $scope.maxData = response.data.maxPercentData;  
    }, function(err){
        console.log(err)
    });

//***************************************UPDATE_CHARTS**************************************
    $scope.occupancychart_data = 
    {
        occupancy : [],
        title :"Occupancy Data for Jul 20 2017 12:00:00AM",
        labels : []
    }
    var now = moment.tz(new Date(), "Asia/Kolkata");
    var startDate = moment(now).startOf('M');
    var endDate = moment(now).endOf('M');
    var sdate = startDate.format('D');
    var edate = endDate.format('D');
    var smonth = startDate.format('M');
    var emonth = endDate.format('M');
    var syear = startDate.format('YYYY');
    var eyear = endDate.format('YYYY');

    updateOccupancyPattern(sdate, smonth, syear, edate, emonth, eyear);
    updateHourlyOccupancyPattern(now.format("D"), now.format('M'), now.format('YYYY'), now.format("D"), now.format('M'), now.format('YYYY'));
    updateFloorLightsUsagePattern(now.format("D"), now.format('M'), now.format('D'), now.format("D"), now.format('M'), now.format('YYYY'));
    // updateRoomUtilData(now.format("YYYY"), now.format('M'), now.format('YYYY'), now.format("D"), now.format('M'), now.format('YYYY'))
    updateRoomUtilData(syear, smonth, now.format("D"), eyear, emonth, now.format("D"))
    $scope.updateLightUsed = function()
    {
        // var now = moment.tz($scope.hourlyOccupancyDate, 'Asia/Kolkata');
        updateOccupancyPattern(sdate, smonth, syear, edate, emonth, eyear);
    }

    $scope.updatePowerUsed = function(){
        // var now = moment.tz($scope.hourlyOccupancyDate, 'Asia/Kolkata');
        updatePowerPattern(sdate, smonth, syear, edate, emonth, eyear);
    }

    var occupancyPatternData;


    function updateOccupancyPattern(sday, smonth, syear, eday, emonth, eyear)
    {
        $scope.loadingOccupancyChart = true;
        $http.get("/light/lightUsagePattern/" + buildingId, {params: {sday: sday, smonth: smonth, syear: syear, eday: eday, emonth: emonth, eyear: eyear}}).then(function(response, headers){
            $scope.loadingOccupancyChart = false;
            occupancyPatternData = JSON.parse(JSON.stringify(response.data.occupancyPattern));
            $scope.occupancychart_data.occupancy = response.data.occupancyPattern;
            if($scope.pattern == 'percent'){
                for(var i = 0; i<occupancyPatternData.length;i++){
                    $scope.occupancychart_data.occupancy[i].values = response.data.occupancyPattern[i].values.map(function(val){return Math.floor((val/occupancyPatternData[i].totalSeats)*100)});
                }
                $scope.occupancychart_data.yTitle = '% of Lights Used'
            }else{
                $scope.occupancychart_data.yTitle = 'Total Lights Used'
            }
            $scope.occupancychart_data.labels = response.data.labels;
            $scope.occupancychart_data.title = "Light Usage Data from " + sday + "-" + smonth + "-" + syear + " 12:00:00 AM to " + eday + "-" + emonth + "-" + eyear + " 11:59:59 PM";
            $scope.occupancychart_data.maxBuildingOccupancy = response.data.maxBuildingOccupancy;
            $scope.occupancychart_data.minBuildingOccupancy = response.data.minBuildingOccupancy;
            $scope.occupancychart_data.maxBuildingOccupancyPercent = response.data.maxBuildingOccupancyPercent;
            $scope.occupancychart_data.minBuildingOccupancyPercent = response.data.minBuildingOccupancyPercent;
            $scope.occupancychart_data.maxBuildingOccupancyTime = response.data.maxBuildingOccupancyTime;
            $scope.occupancychart_data.minBuildingOccupancyTime = response.data.minBuildingOccupancyTime;
            $scope.totalBuildingAverage = response.data.totalBuildingAverage;
            $scope.totalBuildingSeats = response.data.totalBuildingSeats;
            $scope.averagepercentage = Math.floor(($scope.totalBuildingAverage / $scope.totalBuildingSeats)*100);
            $scope.occupancychart_data.xTitle = "Time(days)";
        }, function(err){
            console.log(err)
            $scope.loadingOccupancyChart = false;
        })
    }

    function updatePowerPattern(sday, smonth, syear, eday, emonth, eyear)
    {
        totalFloorPower = Math.round((107*62*24)/1000);
        $scope.loadingOccupancyChart = true;
        $http.get("/light/powerUsagePattern/" + buildingId, {params: {sday: sday, smonth: smonth, syear: syear, eday: eday, emonth: emonth, eyear: eyear}}).then(function(response, headers){
            $scope.loadingOccupancyChart = false;
            occupancyPatternData = JSON.parse(JSON.stringify(response.data.occupancyPattern));
            $scope.occupancychart_data.occupancy = response.data.occupancyPattern;
            if($scope.pattern == 'percent'){
                var totalPower  = (107*24*62)/1000
                for(var i = 0; i<occupancyPatternData.length;i++){

                    $scope.occupancychart_data.occupancy[i].values = response.data.occupancyPattern[i].values.map(function(val){return Math.floor((val/totalPower)*100)});
                }
                $scope.occupancychart_data.yTitle = '% of Power Consumed'
            }else{
                $scope.occupancychart_data.yTitle = 'Total Power Consumed in kWh'
            }
            $scope.occupancychart_data.labels = response.data.labels;
            $scope.occupancychart_data.title = "Power consumption data from " + sday + "-" + smonth + "-" + syear + " 12:00:00 AM to " + eday + "-" + emonth + "-" + eyear + " 11:59:59 PM";
            $scope.occupancychart_data.maxBuildingOccupancy = response.data.maxBuildingOccupancy;
            $scope.occupancychart_data.minBuildingOccupancy = response.data.minBuildingOccupancy;
            $scope.occupancychart_data.maxBuildingOccupancyPercent = response.data.maxBuildingOccupancyPercent;
            $scope.occupancychart_data.minBuildingOccupancyPercent = response.data.minBuildingOccupancyPercent;
            $scope.occupancychart_data.maxBuildingOccupancyTime = response.data.maxBuildingOccupancyTime;
            $scope.occupancychart_data.minBuildingOccupancyTime = response.data.minBuildingOccupancyTime;
            $scope.totalBuildingAverage = response.data.totalBuildingAverage;
            $scope.totalBuildingSeats = totalFloorPower;
            $scope.averagepercentage = Math.floor(($scope.totalBuildingAverage / totalFloorPower)*100);
            $scope.occupancychart_data.xTitle = "Time(days)";
        }, function(err){
            console.log(err)
            $scope.loadingOccupancyChart = false;
        });
    }

    $scope.select_all_occ  = function(){
        for(var i =0;i< $scope.occupancychart_data.occupancy.length;i++){
            $scope.occupancychart_data.occupancy[i].visible = $scope.selectallocc;
        }
    }

    $scope.$watch("occupancychart_data.occupancy",function(oldValue,newValue){
            console.log($scope.occupancychart_data.occupancy);
    }, true)

//*********************************************************************************************
    $scope.percentoccupancychart_data = 
    {
        occupancy : [],
        title :"Occupancy Percentage for Jul 20 2017 12:00:00AM",
        labels : []
    }
     $scope.updateHourlyOccupancy = function()
    {
        var now = moment.tz($scope.hourlyOccupancyDate, 'Asia/Kolkata');
        if($scope.view=='bu'){
            updateHourlyBuOccupancyPattern(now.format("D"), now.format('M'), now.format('YYYY'), now.format("D"), now.format('M'), now.format('YYYY'));

        }else{
            updateHourlyOccupancyPattern(now.format("D"), now.format('M'), now.format('YYYY'), now.format("D"), now.format('M'), now.format('YYYY'));
        }
    }

    var hourlyOccupancyPatternData;

function updateHourlyOccupancyPattern(sday, smonth, syear, eday, emonth, eyear)
    {
        $scope.loadingHourlyOccupancyChart = true;
        $http.get("/light/powerUsagePattern/" + buildingId, {params: {sday: sday, smonth: smonth, syear: syear, eday: eday, emonth: emonth, eyear: eyear}}).then(function(response, headers){
            $scope.loadingHourlyOccupancyChart = false;
            hourlyOccupancyPatternData = JSON.parse(JSON.stringify(response.data.occupancyPattern));
            $scope.percentoccupancychart_data.occupancy = response.data.occupancyPattern;
            if($scope.hourlypattern == 'percenthourly'){
                totalPower = (107*62)/1000
                for(var i = 0; i<hourlyOccupancyPatternData.length;i++){
                    $scope.percentoccupancychart_data.occupancy[i].values = response.data.occupancyPattern[i].values.map(function(val){return Math.floor((val/totalPower)*100)});
                }
                $scope.percentoccupancychart_data.yTitle = "% power used";
            }
            $scope.percentoccupancychart_data.labels = response.data.labels;
            $scope.percentoccupancychart_data.title = "Power used from " + sday + "-" + smonth + "-" + syear + " 12:00:00 AM to " + eday + "-" + emonth + "-" + eyear + " 11:59:59 PM";
            $scope.percentoccupancychart_data.maxBuildingOccupancyPercent = response.data.maxBuildingOccupancyPercent;
            $scope.percentoccupancychart_data.minBuildingOccupancyPercent = response.data.minBuildingOccupancyPercent;
            $scope.percentoccupancychart_data.maxBuildingOccupancyTime = response.data.maxBuildingOccupancyTime;
            $scope.percentoccupancychart_data.minBuildingOccupancyTime = response.data.minBuildingOccupancyTime;
            $scope.percentoccupancychart_data.xTitle = "Time(hours)";
        }, function(err){
            console.log(err)
            $scope.loadingHourlyOccupancyChart = false;
        })
    }

     $scope.updateHourlyBuOccupancy = function()
    {
        var now = moment.tz($scope.hourlyOccupancyDate, 'Asia/Kolkata');
        updateHourlyBuOccupancyPattern(now.format("D"), now.format('M'), now.format('YYYY'), now.format("D"), now.format('M'), now.format('YYYY'));
    }
    function updateHourlyBuOccupancyPattern(sday, smonth, syear, eday, emonth, eyear)
    {
        $scope.loadingHourlyOccupancyChart = true;
        $http.get("/light/zonePowerUsagePattern/" + buildingId, {params: {sday: sday, smonth: smonth, syear: syear, eday: eday, emonth: emonth, eyear: eyear}}).then(function(response, headers){
            $scope.loadingzonePowerUsagePattern = false;
            hourlyOccupancyPatternData = JSON.parse(JSON.stringify(response.data.occupancyPattern));
            $scope.percentoccupancychart_data.occupancy = response.data.occupancyPattern;
            if($scope.hourlypattern == 'percenthourly'){
                for(var i = 0; i<hourlyOccupancyPatternData.length;i++){
                    // TODO: FIX percentage values
                        $scope.percentoccupancychart_data.occupancy[i].values = response.data.occupancyPattern[i].values.map(function(val){
                            if(val == 0){
                                return 0;   
                            } else if(hourlyOccupancyPatternData[i].totalSeats == 0){
                                return 0;
                            }else{
                                console.log(val)

                                return Math.round((val/hourlyOccupancyPatternData[i].totalSeats)*100)
                            }
                        
                        });
                        // $scope.percentoccupancychart_data.occupancy[i].values = 0

                }
                $scope.percentoccupancychart_data.yTitle = "% of Power Consumed";
            }
            console.log($scope.percentoccupancychart_data)
            $scope.percentoccupancychart_data.labels = response.data.labels;
            $scope.percentoccupancychart_data.title = "Light Data from " + sday + "-" + smonth + "-" + syear + " 12:00:00 AM to " + eday + "-" + emonth + "-" + eyear + " 11:59:59 PM";
            $scope.percentoccupancychart_data.maxBuildingOccupancyPercent = response.data.maxBuildingOccupancyPercent;
            $scope.percentoccupancychart_data.minBuildingOccupancyPercent = response.data.minBuildingOccupancyPercent;
            $scope.percentoccupancychart_data.maxBuildingOccupancyTime = response.data.maxBuildingOccupancyTime;
            $scope.percentoccupancychart_data.minBuildingOccupancyTime = response.data.minBuildingOccupancyTime;
            $scope.loadingHourlyOccupancyChart = false;
            $scope.percentoccupancychart_data.xTitle = "Time(hours)";

        }, function(err){
            console.log(err)
            $scope.loadingHourlyOccupancyChart = false;
        })
    }


    $scope.select_all_pocc  = function(){
        for(var i =0;i< $scope.percentoccupancychart_data.occupancy.length;i++){
            $scope.percentoccupancychart_data.occupancy[i].visible = $scope.selectallpocc;
        }
    }
    //*********************************************************************************************
    $scope.floorLightUsage_data = 
    {
        data : [],
        title :"Power Percentage for Jul 20 2017 12:00:00AM",
        labels : []
    }
     $scope.updateFloorLightUsage = function()
    {
        // var now = moment.tz($scope.hourlyOccupancyDate, 'Asia/Kolkata');
        // updateFloorLightsUsagePattern(now.format("D"), now.format('M'), now.format('YYYY'), now.format("D"), now.format('M'), now.format('YYYY'));
        // updateRoomUtilData(now.format('YYYY'), now.format('M'), now.format("D"),now.format('YYYY'), now.format('M'), now.format("D"))
    }

    var floorLightUsagePatternData;

    function updateFloorLightsUsagePattern(sday, smonth, syear, eday, emonth, eyear)
    {
        $scope.loadingFloorLightUsageChart = true;
        $http.get("/light/floorUsagePercent/" + buildingId, {params: {sday: sday, smonth: smonth, syear: syear, eday: eday, emonth: emonth, eyear: eyear}}).then(function(response, headers){
            $scope.loadingFloorLightUsageChart = false;
            floorLightUsagePatternData = JSON.parse(JSON.stringify(response.data.data.occupancyPattern));
            $scope.floorLightUsage_data.data = response.data.data.occupancyPattern;
            console.log('printing floorlightusage ')
            console.log($scope.floorLightUsage_data.data)
            // if($scope.hourlypattern == 'percenthourly'){
            //     for(var i = 0; i<hourlyOccupancyPatternData.length;i++){
            //         $scope.percentoccupancychart_data.occupancy[i].values = response.data.data.occupancyPattern[i].values.map(function(val){return Math.floor((val/hourlyOccupancyPatternData[i].totalSeats)*100)});
            //     }
            //     $scope.percentoccupancychart_data.yTitle = "% of Seats filled";
            // }
            $scope.floorLightUsage_data.labels = response.data.data.labels;
            $scope.floorLightUsage_data.title = "Light Data from " + sday + "-" + smonth + "-" + syear + " 12:00:00 AM to " + eday + "-" + emonth + "-" + eyear + " 11:59:59 PM";
            // $scope.floorLightUsage_data.maxBuildingOccupancyPercent = response.data.maxBuildingOccupancyPercent;
            // $scope.percentoccupancychart_data.minBuildingOccupancyPercent = response.data.minBuildingOccupancyPercent;
            // $scope.percentoccupancychart_data.maxBuildingOccupancyTime = response.data.maxBuildingOccupancyTime;
            // $scope.percentoccupancychart_data.minBuildingOccupancyTime = response.data.minBuildingOccupancyTime;
            $scope.percentoccupancychart_data.xTitle = "Time(hours)";
        }, function(err){
            console.log(err)
            $scope.loadingHourlyOccupancyChart = false;
        });
    }

    //  $scope.updateHourlyBuOccupancy = function()
    // {
    //     var now = moment.tz($scope.hourlyOccupancyDate, 'Asia/Kolkata');
    //     updateHourlyBuOccupancyPattern(now.format("D"), now.format('M'), now.format('YYYY'), now.format("D"), now.format('M'), now.format('YYYY'));
    // }
    // function updateHourlyBuOccupancyPattern(sday, smonth, syear, eday, emonth, eyear)
    // {
    //     $scope.loadingHourlyOccupancyChart = true;
    //     $http.get("/app/api/buPattern/" + buildingId, {params: {sday: sday, smonth: smonth, syear: syear, eday: eday, emonth: emonth, eyear: eyear}}).then(function(response, headers){
    //         $scope.loadingHourlyOccupancyChart = false;
    //         hourlyOccupancyPatternData = JSON.parse(JSON.stringify(response.data.occupancyPattern));
    //         $scope.percentoccupancychart_data.occupancy = response.data.occupancyPattern;
    //         if($scope.hourlypattern == 'percenthourly'){
    //             for(var i = 0; i<hourlyOccupancyPatternData.length;i++){
    //                 $scope.percentoccupancychart_data.occupancy[i].values = response.data.occupancyPattern[i].values.map(function(val){return Math.floor((val/hourlyOccupancyPatternData[i].totalSeats)*100)});
    //             }
    //             $scope.percentoccupancychart_data.yTitle = "% of Seats Filled";
    //         }
    //         $scope.percentoccupancychart_data.labels = response.data.labels;
    //         $scope.percentoccupancychart_data.title = "Occupancy Data from " + sday + "-" + smonth + "-" + syear + " 12:00:00 AM to " + eday + "-" + emonth + "-" + eyear + " 11:59:59 PM";
    //         $scope.percentoccupancychart_data.maxBuildingOccupancyPercent = response.data.maxBuildingOccupancyPercent;
    //         $scope.percentoccupancychart_data.minBuildingOccupancyPercent = response.data.minBuildingOccupancyPercent;
    //         $scope.percentoccupancychart_data.maxBuildingOccupancyTime = response.data.maxBuildingOccupancyTime;
    //         $scope.percentoccupancychart_data.minBuildingOccupancyTime = response.data.minBuildingOccupancyTime;
    //         $scope.percentoccupancychart_data.xTitle = "Time(hours)";

    //     }, function(err){
    //         console.log(err)
    //         $scope.loadingHourlyOccupancyChart = false;
    //     })
    // }


    $scope.select_all_pocc  = function(){
        for(var i =0;i< $scope.percentoccupancychart_data.occupancy.length;i++){
            $scope.percentoccupancychart_data.occupancy[i].visible = $scope.selectallpocc;
        }
    }
//***********************************************************************************************
    $scope.seatUtilchart_data = 
    {
        seatData : [],
        title :"Light Utilization Data for Jul 20 2017 12:00:00AM",
        labels : []
    }
    $scope.seatwizeUtil_data = 
    {
        used : [],
        title :"Light Utilization Data for Jul 20 2017 12:00:00AM",
        seats : []
    }
    $scope.roomUtil_data = 
    {
        used : [],
        title :"Light Utilization Data for Jul 20 2017 12:00:00AM",
        rooms : []
    }
    $scope.updateUtilChart = function(floor)
     {
        
        if($scope.seat_usage_date_Range)
        {
            //console.log($scope.seat_usage_date_Range)
            var startDate = moment($scope.seat_usage_date_Range.dateStart, 'DD/MM/YYYY');
            var endDate = moment($scope.seat_usage_date_Range.dateEnd, 'DD/MM/YYYY');
            var sdate = startDate.format('D');
            var edate = endDate.format('D');
            var smonth = startDate.format('M');
            var emonth = endDate.format('M');
            var syear = startDate.format('YYYY');
            var eyear = endDate.format('YYYY');
            updateUtilData(floor._id,  syear, smonth, sdate, eyear, emonth, edate)
        }
        else
        {
            var now = moment.tz(new Date(), "Asia/Kolkata");
            updateUtilData(floor._id, now.format('YYYY') , now.format('M'), now.format("D"),  now.format('YYYY') , now.format('M'), now.format("D"))
        }
        
    }
    $scope.updateRoomUtilChart = function(floor)
     {
        
        if($scope.room_usage_date_Range)
        {
            //console.log($scope.seat_usage_date_Range)
            var startDate = moment($scope.room_usage_date_Range.dateStart, 'DD/MM/YYYY');
            var endDate = moment($scope.room_usage_date_Range.dateEnd, 'DD/MM/YYYY');
            var sdate = startDate.format('D');
            var edate = endDate.format('D');
            var smonth = startDate.format('M');
            var emonth = endDate.format('M');
            var syear = startDate.format('YYYY');
            var eyear = endDate.format('YYYY');
            updateRoomUtilData( syear, smonth, sdate, eyear, emonth, edate)
        }
        else
        {
            var now = moment.tz(new Date(), "Asia/Kolkata");
            updateRoomUtilData(now.format('YYYY') , now.format('M'), now.format("D"),  now.format('YYYY') , now.format('M'), now.format("D"))
        }
        
    }
    var updateUtilData = function(floorId, syear, smonth, sday, eyear, emonth, eday)
    {
        var labels = ['Unused Seats', 'Seats used for 10 minutes-4 hours', 'Seats used for 4-8 hours', 'Seats used for 8-16 hours', 'Seats used for > 16 hours']
        $scope.loadingUtilChart = true;
        $http.get("/app/api/utilData/" + floorId, {params: {year:syear, month: smonth, day:sday}}).then(function(response, headers){
            var seatStatusData = [0,0,0,0,0];
            //console.log(seatStatusData);
            $scope.seatwizeUtil_data.used = [
                {
                    name: 'Used hours',
                    data: response.data.used,
                    color:'#CB0A25'
                }
            ]
            $scope.seatwizeUtil_data.seats = response.data.names;
            $scope.seatwizeUtil_data.title = "Light Utilization Data from " + sday + "-" + smonth + "-" + syear + " 12:00:00 AM to " + eday + "-" + emonth + "-" + eyear + " 11:59:59 PM";

            response.data.used.forEach(function(value){
                if(value == 0.000 && value < 0.166)
                    seatStatusData[0]++;
                else if(value >= 0.166 && value <= 4)
                    seatStatusData[1]++;
                else if(value > 4 && value <= 8)
                    seatStatusData[2]++;
                else if(value > 8 && value <= 16)
                    seatStatusData[3]++;
                else if(value > 16)
                    seatStatusData[4]++;
            })
            var seatCount = response.data.used.length;
            var remainingSeats = []
            remainingSeats[0] = seatCount - seatStatusData[0];
            remainingSeats[1] = seatCount - seatStatusData[1];
            remainingSeats[2] = seatCount - seatStatusData[2];
            remainingSeats[3] = seatCount - seatStatusData[3];
            remainingSeats[4] = seatCount - seatStatusData[4];
            
            $scope.loadingUtilChart = false;
            $scope.seatUtilchart_data.seatData = [
                {
                    name: 'Empty',
                    maxPointWidth: 50,
                    showInLegend: true,
                    data: remainingSeats,
                    color:'#5a5a5a'
                }, {
                    name: 'Filled',
                    maxPointWidth: 50,
                    showInLegend: true,
                    data: seatStatusData,
                    color:'#CB0A25'
                }
            ]

            $scope.seatUtilchart_data.labels = labels;
            $scope.seatUtilchart_data.title = "Light Utilization Data from " + sday + "-" + smonth + "-" + syear + " 12:00:00 AM to " + eday + "-" + emonth + "-" + eyear + " 11:59:59 PM";
            $scope.loadingUtilChart = false;
        }, function(err){
            $scope.loadingUtilChart = false;
            if(err.status == -1)
            {
                alert("Unable to communicate to server");
                $scope.makingAjaxCall = false
            }
            else 
            if(err.status == 401 || err.status == 403)
            {
                $rootScope.invalidRequest();
            }
            $scope.makingAjaxCall = false
        });
    }
    function updateRoomUtilData(syear, smonth, sday, eyear, emonth, eday)
    {
        $scope.loadingRoomUtilChart = true;
        $http.get("/light/lightUtil/5a45d83042ee8a4833474314?", {params: {syear:syear, smonth: smonth, sday:sday, eyear:eyear, emonth: emonth, eday:eday}}).then(function(response, headers){
            data = response.data[0].roomData
            $scope.roomUtil_data.used = [
                {
                    name: 'Used hours',
                    data: data.used,
                    color:'#0183A5'
                }
            ]
            $scope.roomUtil_data.rooms = data.rooms;
            $scope.roomUtil_data.title = "Light Utilization Data from " + sday + "-" + smonth + "-" + syear + " 12:00:00 AM to " + eday + "-" + emonth + "-" + eyear + " 11:59:59 PM";
            $scope.loadingRoomUtilChart = false;
        }, function(err){
            $scope.loadingRoomUtilChart = false;
            if(err.status == -1)
            {
                alert("Unable to communicate to server");
                $scope.loadingRoomUtilChart = false
            }
            else 
            if(err.status == 401 || err.status == 403)
            {
                $rootScope.invalidRequest();
            }
            $scope.loadingRoomUtilChart = false
        });
    }

//*******************************DATE_PICKER_MODEL************************************

    $scope.occupancy_pattern_date_Range = {
        selectedTemplate: 'TD',
        dateStart: null,
        dateEnd: null
    };

    $scope.percentage_occ_date_Range = {
        selectedTemplate: 'TD',
        dateStart: null,
        dateEnd: null
    };

    $scope.seat_usage_date_Range = {
        selectedTemplate: 'TD',
        dateStart: null,
        dateEnd: null
    };

    $scope.dialog_box_date_range = {
        selectedTemplate: 'TD',
        dateStart: null,
        dateEnd: null
    };
    $scope.report_date_range = {
        selectedTemplate: 'TD',
        dateStart: null,
        dateEnd: null
    };

    

//***********************************DATE_PICKER_FUNCTION************************************

    $scope.occupancy_ok = function(startDate,endDate) {
        var startDate = moment(startDate, 'DD/MM/YYYY');
        var endDate = moment(endDate, 'DD/MM/YYYY');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        // updateOccupancyPattern(sdate, smonth, syear, edate, emonth, eyear);
        if($scope.floorView == "lightsCount"){
            updateOccupancyPattern(sdate, smonth, syear, edate, emonth, eyear);
        }else{
            updatePowerPattern(sdate, smonth, syear, edate, emonth, eyear);
        }
        $mdMenu.hide();
    }

    $scope.hourly_occ_ok = function(startDate,endDate) {
        var startDate = moment(startDate, 'DD/MM/YYYY');
        var endDate = moment(endDate, 'DD/MM/YYYY');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        if($scope.view=='floor'){
            updateHourlyOccupancyPattern(sdate, smonth, syear, edate, emonth, eyear);
        }else{
            updateHourlyBuOccupancyPattern(sdate, smonth, syear, edate, emonth, eyear);
        }
        $mdMenu.hide();
    }

    $scope.seat_util_ok = function(startDate,endDate) {
        var startDate = moment(startDate, 'DD/MM/YYYY');
        var endDate = moment(endDate, 'DD/MM/YYYY');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        // updateUtilData($scope.selectedFloor._id, syear, smonth, sdate, eyear, emonth, edate)
        // updateFloorLightsUsagePattern(syear, smonth, sdate, eyear, emonth, edate)
        updateRoomUtilData(syear, smonth, sdate, eyear, emonth, edate)
        $mdMenu.hide();
    }
    $scope.room_util_ok = function(startDate,endDate) {
        var startDate = moment(startDate, 'DD/MM/YYYY');
        var endDate = moment(endDate, 'DD/MM/YYYY');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        updateRoomUtilData( syear, smonth, sdate, eyear, emonth, edate)
        $mdMenu.hide();
    }
       

    $scope.dialog_ok = function(startDate,endDate) {
        var startDate = moment(startDate, 'DD/MM/YYYY');
        var endDate = moment(endDate, 'DD/MM/YYYY');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        $mdMenu.hide();
    }

//*******************************MONTH&WEEK_DATA************************************


    $scope.getMonthdata = function(){
        var d = moment.tz(new Date(), "Asia/Kolkata");
        var startDate = moment(d).startOf('M');
        var endDate = moment(d).endOf('M');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        if($scope.floorView == "lightsCount"){
            updateOccupancyPattern(sdate, smonth, syear, edate, emonth, eyear);
        }else{
            updatePowerPattern(sdate, smonth, syear, edate, emonth, eyear);
        }
    }

    $scope.getWeekData = function(){
        var d = moment.tz(new Date(), "Asia/Kolkata");
        var startDate = moment(d).startOf('week');
        var endDate = moment(d).endOf('week');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        // updateOccupancyPattern(sdate, smonth, syear, edate, emonth, eyear)
        if($scope.floorView == "lightsCount"){
            updateOccupancyPattern(sdate, smonth, syear, edate, emonth, eyear);
        }else{
            updatePowerPattern(sdate, smonth, syear, edate, emonth, eyear);
        }
    }


    $scope.changepattern = function(){
        if( $scope.pattern == 'percent'){
            
            if($scope.floorView == "lightsCount"){
                for(var i = 0; i<occupancyPatternData.length;i++){
                $scope.occupancychart_data.occupancy[i].values = occupancyPatternData[i].values.map(function(val){return Math.floor((val/occupancyPatternData[i].totalSeats)*100) });
            }
                $scope.occupancychart_data.yTitle = "% of light used";   
            }else{
                totalPower = (107*24*72)/1000
                for(var i = 0; i<occupancyPatternData.length;i++){
                $scope.occupancychart_data.occupancy[i].values = occupancyPatternData[i].values.map(function(val){return Math.floor((val/(totalPower))*100) });
            }
                $scope.occupancychart_data.yTitle = "% of power consumed";
            }

        }
        else
        {
            $scope.occupancychart_data.occupancy = JSON.parse(JSON.stringify(occupancyPatternData));
            if($scope.floorView == "lightsCount"){
                $scope.occupancychart_data.yTitle = "Total lights used";   
            }else{
                $scope.occupancychart_data.yTitle = "Total power consumed (in kWh)";
            }
        }
    }

    $scope.changehourlypattern = function(){
        if( $scope.hourlypattern == 'percenthourly'){
            totalPower = (107*62)/1000
            for(var i = 0; i<hourlyOccupancyPatternData.length;i++){
                $scope.percentoccupancychart_data.occupancy[i].values = hourlyOccupancyPatternData[i].values.map(function(val){return Math.floor((val/totalPower)*100) });
            }
                $scope.percentoccupancychart_data.yTitle = "% power used";
        }
        else
        {
            $scope.percentoccupancychart_data.occupancy = JSON.parse(JSON.stringify(hourlyOccupancyPatternData));
            $scope.percentoccupancychart_data.yTitle = "Total power used (in kWh)";
        }
    }

    $scope.changeview = function(){
        if($scope.view == 'floor'){
            $scope.updateHourlyOccupancy();
        }
        else 
            $scope.updateHourlyBuOccupancy();
    }
    $scope.changeFloorView = function(){
          if($scope.floorView == 'lightsCount'){
            $scope.selectedParam = 'lights'
            $scope.updateLightUsed();

        }
        else {
            $scope.selectedParam = 'power'
            $scope.updatePowerUsed();
        }
    }

   
//*******************************SHOW_PROMPT*********************************

    $scope.showDialogue = function() {
        $mdDialog.show({
        templateUrl:'template/dialogtemp',
        clickOutsideToClose:false,
        scope : $scope,
        preserveScope : true
        });
        $scope.blur_content = true;
    };

            
   function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    $scope.finish = function()
    {
        if(validateEmail($scope.clientEmail))
        {
            $rootScope.showToast("Report will be mailed to '" + $scope.clientEmail + "'", 'success-toast');
            $scope.blur_content = false;
            $mdDialog.hide();
            //console.log($scope.report_date_range);
            var startDate = moment($scope.report_date_range.dateStart, 'DD/MM/YYYY');
            var endDate = moment($scope.report_date_range.dateEnd, 'DD/MM/YYYY');
            var sdate = startDate.format('D');
            var edate = endDate.format('D');
            var smonth = startDate.format('M');
            var emonth = endDate.format('M');
            var syear = startDate.format('YYYY');
            var eyear = endDate.format('YYYY');
            $http.post("/app/api/mailReport",{sday: sdate, smonth: smonth, syear: syear, eday: edate, emonth: emonth, eyear: eyear, email: $scope.clientEmail, bldgId: buildingId}).then(function(response){
                console.log(response)
            }, function(err){
                console.log(err)
            })
            $scope.clientEmail = '';
        }
        else
        {
            $rootScope.showToast("Invalid Email ID", 'error-toast');
        }
    };
    $scope.finish_excel = function()
    {
        $scope.excelText = "Downloading..."
        $scope.downloadingExcel = true;
        var startDate = moment($scope.report_date_range.dateStart, 'DD/MM/YYYY');
        var endDate = moment($scope.report_date_range.dateEnd, 'DD/MM/YYYY');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        $http.get("/app/api/exportExcel", {params:{sday: sdate, smonth: smonth, syear: syear, eday: edate, emonth: emonth, eyear: eyear, bldgId: buildingId}}).then(function(response, headers){
            var blob = new Blob([response.data], {type: 'text/csv'});
            var filename =  "Report.csv"
            if(window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveBlob(blob, filename);
            }
            else{
                var elem = window.document.createElement('a');
                elem.href = window.URL.createObjectURL(blob);
                elem.download = filename;
                document.body.appendChild(elem);
                elem.click();
                document.body.removeChild(elem);
            }
            $scope.excelText = "Download"
            $scope.downloadingExcel = false;
            $scope.blur_content = false;
            $mdDialog.hide();
        }, function(err){
            $rootScope.showToast(err.data.err, 'error-toast');
            $scope.excelText = "Download"
            $scope.downloadingExcel = false;
        })
    }

    $scope.cancelReport = function()
    {
        $scope.blur_content = false;
        $mdDialog.hide();
    }


    // $scope.showlayout=function(){
    //     $scope.blur_content = true;
    //     $mdDialog.show({
    //     templateUrl:'template/layout-popup',
    //     clickOutsideToClose:false,
    //     scope : $scope,
    //     preserveScope : true,
    //     fullscreen:true
    //     });
       
    // }

    // $scope.hidelayout=function(){
    //     $scope.blur_content = false;
    //     $mdDialog.hide();
    // }
//*****************************************SOCKET*******************************************


     // var socket = io();
        $scope.myFunc = function () {
            socket.emit('layoutData', $scope.analytics_data);
        }
        
        // socket.on('layoutData', function(data){ 
        //      $scope.analytics_data;
        //      $scope.apply();
        // });


}]);



//***************************************************************************************************************************