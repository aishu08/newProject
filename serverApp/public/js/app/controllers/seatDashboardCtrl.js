app.controller('seatDashboardCtrl', ['$rootScope', '$scope', '$timeout', '$mdSidenav', '$state', '$interval', '$http', 'mapStyles', function($rootScope, $scope, $timeout, $mdSidenav, $state, $interval, $http, mapStyles) {
    $rootScope.pageTitle = "Building Analytics";
    $rootScope.sidenav_btn = true;
    $rootScope.back_btn = false;
    $rootScope.currentpath = $state;
    $rootScope.comparebid = [];
    $rootScope.count = '';
    $rootScope.showcmpbtn = false;
    $rootScope.routes = true;
    $rootScope.settingroutes = false;
    $rootScope.button = false;
    $rootScope.userContent();
    // $rootScope.pageActive = "seatPage";



    var timeInterval = $interval(function() {
        timedata = moment.tz(new Date(), "Asia/Kolkata");
        $scope.day = timedata.format("dddd, DD MMM YYYY");
        $scope.time = timedata.format("hh:mm:ss A");
    }, 100)


    var user;
    $http.get('/app/api/userProfile/' + $rootScope.userId).then(function(response) {
        user = response.data;
        $rootScope.isAdmin = user.isAdmin;
        $scope.acc_loc = user.accessibleLocation;
    }, function(err) {
        console.log(err)
    });


    //********************************http_calls***************************

    $http.get('/app/api/dashboardData').then(function(response) {
        $scope.dashboard_data = response.data;
        console.log($scope.dashboard_data)
    }, function(err) {
        console.log(err)
    });

    $http.get('/app/api/buildingData').then(function(response) {
        $scope.buildings = response.data.buildingData;
        $scope.mostOptimal = response.data.maxFloor;
        $scope.leastOptimal = response.data.minFloor;
        var locations = []
        $scope.buildings.forEach(function(bldg) {
            var temp = [];
            temp.push("<h4>" + bldg.bldgName + " - <b>" + bldg.occupancyPercentage + "%</b><h4>")
            temp.push(bldg.latitude)
            temp.push(bldg.longitude)
            var tempMarker = bldg.occupancyPercentage < 30 ? "img/map-marker-red.png" : (bldg.occupancyPercentage >= 30 && bldg.occupancyPercentage <= 70 ? "img/map-marker-yellow.png" : "img/map-marker.png")
            temp.push(tempMarker);
            locations.push(temp)
        })
        $scope.buildings.val = false;
        console.log(locations);
        initialize(locations)

    }, function(err) {
        console.log(err)
    });

    $scope.button_disable = function(bldgId) {
        var idVal = $scope.acc_loc.indexOf(bldgId);
        if (idVal > -1)
            return false;
        else
            return true;
    }

    var employeeData;
    var employeeIds = [];
    $http.get('/employeeApi/employeeData').then(function(response) {
        console.log(response);
        employeeData = response.data;
        for (var i = 0; i < employeeData.length; i++) {
            employeeIds.push(employeeData[i]._id);
        }
        localStorage.setItem('empIds', JSON.stringify(employeeIds));
    }, function(err) {
        console.log(err);
    });





    //********************************SOCKET******************************

    // var socket = io();
    $scope.myFunc = function() {
        socket.emit('dashboardData', $scope.build_data);
    }

    // socket.on('dashboardData', function(data){ 
    //      $scope.build_data;
    //      $scope.apply();
    // });


    // ******************************javascript google map***********************************


    function initialize(locations) {
        var mapOptions = {
            center: new google.maps.LatLng(25, 0),
            zoom: 2,
            styles: mapStyles.shades,
            minZoom: 2
        };

        var map = new google.maps.Map(document.getElementById("Adappt-map"), mapOptions);
        var infowindow = new google.maps.InfoWindow();
        var marker, i;

        for (i = 0; i < locations.length; i++) {
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

        setTimeout(function() {
            var currCenter = map.getCenter();
            google.maps.event.trigger(map, 'resize');
            map.setCenter(currCenter);
        }, 500)
    }
    // If the map position is out of range, move it back
    function checkBounds(map) {
        var latNorth = map.getBounds().getNorthEast().lat();
        var latSouth = map.getBounds().getSouthWest().lat();
        var newLat;

        if (latNorth < 85 && latSouth > -85) /* in both side -> it's ok */
            return;
        else {
            if (latNorth > 85 && latSouth < -85) /* out both side -> it's ok */
                return;
            else {
                if (latNorth > 85)
                    newLat = map.getCenter().lat() - (latNorth - 85); /* too north, centering */
                if (latSouth < -85)
                    newLat = map.getCenter().lat() - (latSouth + 85); /* too south, centering */
            }
        }
        if (newLat) {
            //console.log("current center" + map.getCenter() );
            var newCenter = new google.maps.LatLng(newLat, map.getCenter().lng());
            //console.log("setting new center" + newCenter);
            map.setCenter(newCenter);
        }
    }
}]);

//****************************************************************************************************************