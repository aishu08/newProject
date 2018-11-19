app.controller('empDetailsCtrl', ['$rootScope', '$scope', '$http', '$timeout', '$mdDialog', '$interval', '$state', function($rootScope, $scope, $http, $timeout, $mdDialog, $interval, $state) {
    $rootScope.pageTitle = "Employee Data";
    $rootScope.routes = false;
    $rootScope.settingroutes = true;
    $rootScope.button = true;
    $rootScope.userContent();

    $scope.startTimeSettings = {
        display: 'inline',
        timeFormat: 'HH:ii',
        timeWheels: 'HHii',
        onChange: function() {
            $scope.sTime = ($scope.sTime.getHours() < 10 ? "0" + $scope.sTime.getHours() : $scope.sTime.getHours()) + ":" + ($scope.sTime.getMinutes() < 10 ? "0" + $scope.sTime.getMinutes() : $scope.sTime.getMinutes());
        }
    };

    $scope.endTimeSettings = {
        display: 'inline',
        timeFormat: 'HH:ii',
        timeWheels: 'HHii',
        onChange: function() {
            $scope.eTime = ($scope.eTime.getHours() < 10 ? "0" + $scope.eTime.getHours() : $scope.eTime.getHours()) + ":" + ($scope.eTime.getMinutes() < 10 ? "0" + $scope.eTime.getMinutes() : $scope.eTime.getMinutes());
        }
    };

    var shifts = function() {
        $http.get('/employeeApi/allShifts').then(function(response) {
            $scope.shifts = response.data;
        }, function(err) {
            console.log(err);
        });
    }
    shifts();

    var assets = function() {
        $http.get('/employeeApi/allAssets').then(function(response) {
            $scope.assets = response.data;
        }, function(err) {
            console.log(err);
        });
    }
    assets();

    var seatTypes = function() {
        $http.get('/employeeApi/allSeatTypes').then(function(response) {
            $scope.seatTypes = response.data;
        }, function(err) {
            console.log(err);
        });
    }
    seatTypes();

    var reportingManagers = function() {
        $http.get('/employeeApi/reportingManagers').then(function(response) {
            $scope.reportingManagers = response.data;
        }, function(err) {
            console.log(err);
        });
    }
    reportingManagers();

    $scope.addShift = function() {
        var shift = {};
        shift.sTime = $scope.sTime;
        shift.eTime = $scope.eTime;
        $http.post('/employeeApi/addNewShift', shift).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            shifts();
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        });   
    }

    $scope.addAsset = function() {
        var asset = {};
        asset.name = $scope.asset;
        $http.post('/employeeApi/addNewAsset', asset).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        });
        $scope.asset = '';
        assets();
    }

    $scope.addSeatType = function() {
        var seatType = {};
        seatType.type = $scope.seatType;
        $http.post('/employeeApi/addNewSeatType', seatType).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        });
        $scope.seatType = '';
        seatTypes();
    }

    $scope.addReportingManager = function() {
        var reportingManager = {};
        reportingManager.name = $scope.reportingManager;
        $http.post('/employeeApi/addReportingManager', reportingManager).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        });
        $scope.reportingManager = '';
        reportingManagers();
    }


}]);