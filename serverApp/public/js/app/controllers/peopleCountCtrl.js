app.controller('peopleCountCtrl', ['$scope', '$rootScope', '$interval', '$http', function($scope, $rootScope, $interval, $http) {
    $scope.pageTitle = "Floor People Count"

    var timeInterval = $interval(function() {
        timedata = moment.tz(new Date(), "Asia/Kolkata");
        $scope.day = timedata.format("dddd, DD MMM YYYY");
        $scope.time = timedata.format("hh:mm:ss A");
    }, 100)

    $scope.filled = 200;
    $scope.total = 544;
    getFlapClounts();

    function getFlapClounts() {
        $http.get('/app/api/flapCounts').then(function(response) {
            $scope.filled = response.data.totalCount;
            $scope.percent = ($scope.filled / $scope.total) * 100;
            var newColor = getColor($scope.percent);
            $scope.options.barColor = newColor;
            $scope.opt.barColor = newColor;
        }, function(err) {
            console.log(err);
        });
    }
    $scope.options = {
        animate: {
            duration: 0,
            enabled: false
        },
        barColor: '#47d032',
        scaleColor: false,
        lineWidth: 12,
        lineCap: 'round',
        size: 400,
        trackColor: '#6f6565'
    };
    $scope.opt = {
        animate: {
            duration: 0,
            enabled: false
        },
        barColor: '#47d032',
        scaleColor: false,
        lineWidth: 12,
        lineCap: 'round',
        size: 200,
        trackColor: '#6f6565'
    };

    function getColor(percent) {
        if (percent < 70) {
            return '#47d032';
        } else if (percent >= 70 && percent < 80) {
            return '#f2ec58';
        } else if (percent >= 80 && percent < 90) {
            return '#FFC200';
        } else if (percent >= 90) {
            return '#dd2611';
        }
    }
}])