app.controller("LightTypeSettingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog) {

        console.log('LightTypeSettingCtrl');



        function onload() {
            $http.get('/lightcommission/api/getlighttypes').then(function (response) {
                $scope.lighttypes = response.data;

                $scope.lighttypes.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });

            }, function (err) {
                console.log(err);
                $rootScope.showToast(err.data.err, 'error-toast');

            })
            $http.get('/lightcommission/api/getlightshapes').then(function (response) {
                $scope.shapes = response.data;
                console.log($scope.shapes)
            }, function (err) {
                console.log(err);
                $rootScope.showToast(err.data.err, 'error-toast');

            })
        }
        onload();

        $scope.addlighttype = function () {
            $scope.selectedshape = {};
            $scope.lighttype = {};
            $mdDialog.show({
                templateUrl: 'template/newlighttype',
                clickOutsideToClose: false,
                scope: $scope,
                preserveScope: true
            }).then(function () {

                $scope.blur_content = false;
            }, function () {

                $scope.blur_content = false;

            });
        }

        $scope.editlighttype = function (lighttype) {
            $scope.lighttype = lighttype;
            $scope.selectedshape = { name: lighttype.shapename, class: lighttype.shape, active: true };
            console.log($scope.selectedshape);
            $mdDialog.show({
                templateUrl: 'template/editlighttype',
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

        }

        $scope.createlighttype = function (lighttype, lighttypeform) {
            console.log(lighttypeform)
            if ($scope.selectedshape && lighttypeform.$valid) {
                lighttype.shape = $scope.selectedshape.class;
                lighttype.shapename = $scope.selectedshape.name;
                $http.post('/lightcommission/api/creatlighttype', lighttype).then(function (response) {
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

        $scope.updatelighttype = function (lighttype, lighttypeform) {

            if ($scope.selectedshape && lighttypeform.$valid) {
                lighttype.shape = $scope.selectedshape.class;
                lighttype.shapename = $scope.selectedshape.name;
                $http.put('/lightcommission/api/updatelighttype', lighttype).then(function (response) {

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
        $scope.deletelighttype = function (lighttype) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure to delete Light Type?')
                .textContent('Click on ok to continue.')
                .ariaLabel('confirmation')
                .targetEvent()
                .ok('OK')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function () {

                $scope.removelighttype(lighttype);

            }, function () {


            });
        }

        $scope.removelighttype = function (lighttype) {
            $http.put('/lightcommission/api/removelighttype', lighttype).then(function (response) {

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