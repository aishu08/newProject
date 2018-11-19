app.controller('lightDashboard',['$rootScope','$scope','$timeout','$mdSidenav','$state', '$interval','$http', 'mapStyles', function ($rootScope,$scope,$timeout,$mdSidenav,$state, $interval, $http, mapStyles) {
    $rootScope.pageTitle = "Lighting Dashboard";
    $rootScope.sidenav_btn = true;
    $rootScope.back_btn=false;
    $rootScope.currentpath = $state;
    $scope.LightingPage = 'LightingPage';
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
    };

    $scope.pageActive;
    $scope.lightClick=function () {
        $scope.pageActive = 'LightingPage';
    };
    $scope.OccuClick=function () {
        $scope.pageActive = 'OccupancyPage';
    };

    $scope.day ="tuesday";$scope.mostOptimal;
        $scope.leastOptimal;
    $scope.time="3:00 PM";
    $scope.pageActive=true; 
    $scope.pageId="LightingC4";
        var timeInterval = $interval(function(){
            timedata = moment.tz(new Date(), "Asia/Kolkata");
            $scope.day = timedata.format("dddd, DD MMM YYYY");
            $scope.time = timedata.format("hh:mm:ss A");
        }, 100);



    $http.get('light/buildingData').then(function(response){
        $scope.buildings = response.data.buildingData;
        // $scope.totalSavings = response.data.buildingData.
        console.log($scope.buildings);
        // $scope.mostOptimal = response.data.maxFloor;
        // $scope.leastOptimal = response.data.minFloor;
        var locations = []
        $scope.buildings.buildings.forEach(function(bldg){
            var temp = [];
            temp.push("<h4>" + bldg.bldgName + " - <b>" + bldg.occupancyPercentage + "%</b><h4>")
            temp.push(bldg.latitude)
            temp.push(bldg.longitude)
            var tempMarker = bldg.occupancyPercentage < 30 ? "img/map-marker-red.png" : (bldg.occupancyPercentage >= 30 && bldg.occupancyPercentage <= 70 ? "img/map-marker-yellow.png" : "img/map-marker.png")
            temp.push(tempMarker);
            locations.push(temp)
        })
        $scope.buildings.val = false;
        initialize(locations)
    }, function(err){
        console.log(err)
    });
    //$scope.buildings = [0,1]

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
    // $scope.buildings = [{
    //     bid:1,
    //     val: false
    // }];
    // console.log($scope.buildings)
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


// ******************************javascript google map***********************************


    function initialize(locations)
    {
        var mapOptions = {
            center: new google.maps.LatLng(25,0),
            zoom: 2,
            styles:mapStyles.shades,
            minZoom:2
        };

        var map = new google.maps.Map(document.getElementById("Adappt-map"), mapOptions);
        var infowindow = new google.maps.InfoWindow();
        var marker, i;

        for (i = 0; i < locations.length; i++)
        {  
            // console.log(loactions);
            marker = new google.maps.Marker({
                position: new google.maps.LatLng(locations[i][1], locations[i][2]),
                map: map,
                // icon:  './img/adapptmarker.png'
                icon: (locations[i][3])
            });


            google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {
                    infowindow.setContent(locations[i][0]);
                    infowindow.open(map, marker);
                }
            })(marker, i));
        }
        google.maps.event.addListener(map, 'center_changed', function() {
            checkBounds(map);
        });

        setTimeout(function(){
            var currCenter = map.getCenter();
            google.maps.event.trigger(map, 'resize');
            map.setCenter(currCenter);
            }, 500)
    }
    // If the map position is out of range, move it back
    function checkBounds(map)
    {
        var latNorth = map.getBounds().getNorthEast().lat();
        var latSouth = map.getBounds().getSouthWest().lat();
        var newLat;

        if(latNorth<85 && latSouth>-85)      /* in both side -> it's ok */
        return;
        else
        {
            if(latNorth>85 && latSouth<-85)   /* out both side -> it's ok */
            return;
            else
            {
                if(latNorth>85)   
                newLat =  map.getCenter().lat() - (latNorth-85);   /* too north, centering */
                if(latSouth<-85) 
                newLat =  map.getCenter().lat() - (latSouth+85);   /* too south, centering */
            }
        }
        if(newLat)
        {
            //console.log("current center" + map.getCenter() );
            var newCenter= new google.maps.LatLng( newLat ,map.getCenter().lng() );
            //console.log("setting new center" + newCenter);
            map.setCenter(newCenter);
        }
    }
}]);

//************************************************************************************************************



