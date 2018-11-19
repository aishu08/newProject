app.controller("SeatTypeSettingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog) {

        console.log('SeatTypeSettingCtrl');



        function onload() {
            $http.get('/app/api/getseattypes').then(function (response) {
                $scope.seattypes = response.data;

                $scope.seattypes.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });

            }, function (err) {
                console.log(err);
                $rootScope.showToast(err.data.err, 'error-toast');

            })
            $http.get('/app/api/getshapes').then(function (response) {
                $scope.shapes = response.data;

            }, function (err) {
                console.log(err);
                $rootScope.showToast(err.data.err, 'error-toast');

            })
        }
        onload();

        $scope.addseattype = function () {
            $scope.seattype = {};
            $mdDialog.show({
                templateUrl: 'template/newseattype',
                clickOutsideToClose: false,
                scope: $scope,
                preserveScope: true
            }).then(function () {

                $scope.blur_content = false;
            }, function () {

                $scope.blur_content = false;

            });
        }

        $scope.editseattype = function (seattype) {
            $scope.seattype = seattype;
            $http.get('/app/api/getshapes').then(function (response) {
                $scope.shapes = response.data;

                $scope.selectedshape = { "name": seattype.shapename, "class": seattype.shape, active: true };
                $scope.shapes.push($scope.selectedshape);
                console.log($scope.shapes);
                $mdDialog.show({
                    templateUrl: 'template/editseattype',
                    clickOutsideToClose: false,
                    scope: $scope,
                    preserveScope: true
                }).then(function () {
                    // onload()
                    $scope.blur_content = false;
                }, function () {
                    // onload()
                    $scope.blur_content = false;

                });

            }, function (err) {
                console.log(err);
                $rootScope.showToast(err.data.err, 'error-toast');

            })
        }

        $scope.createseattype = function (seattype, seattypeform) {
            console.log(seattypeform)
            if ($scope.selectedshape && seattypeform.$valid) {
                seattype.shape = $scope.selectedshape.class;
                seattype.shapename = $scope.selectedshape.name;
                $http.post('/app/api/creatseattype', seattype).then(function (response) {
                    console.log(response);
                    $rootScope.showToast(response.data, 'success-toast');

                    $scope.closeDialog()
                }, function (err) {
                    console.log(err);
                    $rootScope.showToast(err.data, 'error-toast');

                })
            } else {
                $rootScope.showToast("Please fill all required filds", 'error-toast', 'top center');
            }
        }

        $scope.updateseattype = function (seattype, seattypeform) {

            if ($scope.selectedshape && seattypeform.$valid) {
                seattype.shape = $scope.selectedshape.class;
                seattype.shapename = $scope.selectedshape.name;
                $http.put('/app/api/updateseattype', seattype).then(function (response) {

                    $rootScope.showToast(response.data, 'success-toast');

                    $scope.closeDialog()
                }, function (err) {
                    console.log(err);
                    $rootScope.showToast(err.data, 'error-toast');

                })
            } else {
                $rootScope.showToast("Please fill all required filds", 'error-toast', 'top center');
            }

        }
        $scope.deleteseattype = function (seattype) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure to delete Seat Type?')
                .textContent('Click on ok to continue.')
                .ariaLabel('confirmation')
                .targetEvent()
                .ok('OK')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function () {

                $scope.removeseattype(seattype);

            }, function () {


            });
        }

        $scope.removeseattype = function (seattype) {
            $http.put('/app/api/removeseattype', seattype).then(function (response) {

                $rootScope.showToast(response.data, 'success-toast');

                $scope.closeDialog()
            }, function (err) {
                console.log(err);
                $rootScope.showToast(err.data.err, 'error-toast');

            })

        }



        $scope.closeDialog = function () {
            $scope.blur_content = false;
            $mdDialog.hide();
            onload()
        }

    }]);