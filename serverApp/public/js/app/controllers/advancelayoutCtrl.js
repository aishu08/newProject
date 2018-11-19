app.controller('advancelayoutCtrl', ['$rootScope', '$scope', '$mdDateRangePicker', '$http', '$timeout', '$mdDialog', '$stateParams', '$filter', '$mdMenu', '$timeout', '$interval', function($rootScope, $scope, $mdDateRangePicker, $http, $timeout, $mdDialog, $stateParams, $filter, $mdMenu, $timeout, $interval) {

    var buildingId = $stateParams.bldgId;
    $scope.building = $stateParams.bldgId;
    $scope.pageTitle = "Seat-Utiliztion Layout";
    $scope.seatClass;
    $scope.heatmapData = [];
    $rootScope.userContent();


    //*************************************API'S***************************************

    $http.get('/app/api/floors/' + buildingId).then(function(response) {
        $scope.floors = response.data;
        console.log(response.data);
        $scope.selectedFloor = $scope.floors[0];
        $scope.setBus($scope.selectedFloor);
        console.log($scope.selectedFloor)
        $scope.pageTitle = $scope.selectedFloor.name
    }, function(err) {
        console.log(err)
    });

    var user;
    $http.get('/app/api/userProfile/' + $rootScope.userId).then(function(response) {
        user = response.data;
        $rootScope.isAdmin = user.isAdmin;
    }, function(err) {
        console.log(err)
    });

    //*******************************Popup-Categories**************************************

    $scope.categories = [{
        class: "Least-used"
    }, {
        class: "Moderate-used"
    }, {
        class: "Maximum-used"
    }]

    $scope.Category = {
        min: 0,
        max: 24,
        options: {
            floor: 0,
            ceil: 24,
            step: 1,
            precision: 1
        }
    }

    var max = 24;
    $scope.$watch("Category", function(newValue, oldValue) {
        console.log(newValue);
        max = newValue.max;
        utilStatus();
    }, true)



    $scope.selclicked = function() {
        var containerTop = $(".my-md-select").offset().top - (-30) + "px";
        setTimeout(function() {
            $(".my-container").css({ 'top': containerTop });
        }, 50);

    };

    //*************************************Update_Layout********************************

    $scope.setBus = function(floor) {
        $http.get('/app/api/getSectionNames/' + floor._id).then(function(response) {
            $scope.bus = response.data;
            $scope.pageTitle = floor.name;
            $scope.seats = [];
            updateFloorData(floor._id)
        }, function(err) {
            console.log(err)
        });
    }

    var updateFloorData = function(floorId) {
        $http.get('/app/api/seatData/' + floorId).then(function(response) {
            $scope.seats = response.data;
            var startDate = moment($scope.advance_layout_date_range.dateStart)
            var endDate = moment($scope.advance_layout_date_range.dateEnd)
            getUtilSeatData(floorId, startDate.format('YYYY'), startDate.format('M'), startDate.format("D"), endDate.format('YYYY'), endDate.format('M'), endDate.format("D"));
        }, function(err) {
            console.log(err)
        });
    }

    $scope.advance_layout_date_range = {
        selectedTemplate: 'TD',
        dateStart: null,
        dateEnd: null
    };

    var now = moment.tz(new Date(), "Asia/Kolkata");
    $scope.startDay = now.format('D') + '-' + now.format('M') + '-' + now.format('YYYY');
    $scope.endDay = now.format('D') + '-' + now.format('M') + '-' + now.format('YYYY');

    $scope.advance_ok = function(startDate, endDate) {
        var startDate = moment(startDate, 'DD/MM/YYYY');
        var endDate = moment(endDate, 'DD/MM/YYYY');
        var sdate = startDate.format('D');
        var edate = endDate.format('D');
        var smonth = startDate.format('M');
        var emonth = endDate.format('M');
        var syear = startDate.format('YYYY');
        var eyear = endDate.format('YYYY');
        $scope.startDay = sdate + '-' + smonth + '-' + syear;
        $scope.endDay = edate + '-' + emonth + '-' + eyear;
        getUtilSeatData($scope.selectedFloor._id, syear, smonth, sdate, eyear, emonth, edate);
        $mdMenu.hide();
    }

    //**********************************Seat_Data_API********************************************
    var utilStatusData;
    var getUtilSeatData = function(floorId, syear, smonth, sday, eyear, emonth, eday) {
        $http.get("/app/api/utilData/" + floorId, { params: { year: syear, month: smonth, day: sday } }).then(function(response, headers) {
            utilStatusData = response.data;
            console.log(response);
            utilStatus()
        }, function(err) {
            console.log(err)
        });
    }

    var points = [{
            x: 510,
            y: 149,
            value: 22,
            radius: 20

        },
        {
            x: 541,
            y: 189,
            value: 23,
            radius: 20
        },
        {
            x: 581,
            y: 199,
            value: 21,
            radius: 20
        },
        {
            x: 641,
            y: 129,
            value: 19,
            radius: 20
        },
        {
            x: 681,
            y: 229,
            value: 20,
            radius: 20
        }
    ];

    $scope.passed_data = {
        max: max,
        data: points
    };

    var utilStatus = function() {
        if ($scope.heatmapData.length > 0) {
            $scope.heatmapData = [];
        }
        if (utilStatusData) {
            for (var i = 0; i < $scope.seats.length; i++) {
                $scope.heatmapData.push({ x: $scope.seats[i].posX, y: $scope.seats[i].posY, value: utilStatusData.used[i], radius: 45 });
            }
            $scope.passed_data = {
                max: max,
                data: $scope.heatmapData
            };
        }

    }

    //**************************************************************************************************************************


}]);