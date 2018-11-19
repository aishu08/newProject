app.controller("CommissionHostCtrl", ['$scope', '$rootScope', '$cookies', '$state', '$transitions', "$http", 'Upload', '$mdDialog', function ($scope, $rootScope, $cookies, $state, $transitions, $http, Upload, $mdDialog) {

    function onload() {

        $scope.host = {};

        if (localStorage.getItem('id')) {

            $http.get('/app/api/getBuildingbyId', { params: { id: localStorage.getItem('id') } }).then(function (response) {

                $rootScope.building = response.data;
                $scope.building_details = $rootScope.building;
                $scope.host.buildingname = $rootScope.building.name;
                $scope.host.buildingId = $rootScope.building.id;

                $http.get('/app/api/getfloors', { params: { fids: $rootScope.building.floors } }).then(function (response) {
                    console.log(response);
                    $scope.floors = response.data;

                }, function (err) {
                    console.log(err);
                    $rootScope.showToast(err.data.err, 'error-toast');
                });

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast');
            })

        } else {

            var confirm = $mdDialog.confirm()
                .title('Please select Building or add Building details to configure Hosts')
                .textContent('Click on ok to continue.')
                .ariaLabel('Host confirmation')
                .targetEvent("ev")
                .ok('OK')
                .cancel();


            $mdDialog.show(confirm).then(function () {

                $state.go('commission.index');

            }, function () {
                $state.go('commission.index');
            });
        }


    }

    onload();

    $scope.CreateHosts = function (host, floorform) {

        if (host.certificates && host.certificates.crt && floorform.$valid) {

            $http.post('/app/api/createHost', host).then(function (response) {

                $rootScope.showToast(response.data, 'success-toast');
                $scope.host.name="";
                $scope.OnFloorChange(host.floorId, host.buildingId)

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast');

            });
        } else if (!host.certificates || (host.certificates && !host.certificates.crt)) {
            $rootScope.showToast("Please choose certificate", 'error-toast');

        }

    };

    $scope.OnFloorChange = function (fid, bid) {

        $http.get('/app/api/getcertificates', { params: { fid: fid } }).then(function (response) {
            console.log(response);
            $scope.certificateslist = response.data;

            $http.get('/app/api/gethosts', { params: { buildingId: bid, floorId: fid } }).then(function (response) {

                $scope.hosts = response.data;

                for (var i = 0; i < $scope.hosts.length; i++) {

                    for (var j = 0; j < $scope.certificateslist.length; j++) {
                        if ($scope.hosts[i].certificates.crt === $scope.certificateslist[j].crt
                            && $scope.hosts[i].certificates.pem === $scope.certificateslist[j].pem
                            && $scope.hosts[i].certificates.ppk === $scope.certificateslist[j].ppk) {
                            $scope.certificateslist[j].flag = true;
                        }
                    }
                }
                $scope.certificates=$scope.certificateslist;
                $scope.host.certificates = {};
            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast');

            });

        }, function (err) {

            $rootScope.showToast(err.data.err, 'error-toast');

        });



    };

    $scope.hostDetails = function (floors) {

        $mdDialog.show({
            templateUrl: 'template/hostDetails',
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true
        });

        $scope.blur_content = true;

    };

    $scope.closeDialog = function () {

        $scope.blur_content = false;
        $mdDialog.hide();

    };


    $scope.selecthost = function (host) {

        $scope.selectedhost = JSON.parse(host);

    };

    $scope.deleteHost = function () {


    }

    $scope.ContinuetoMapping = function () {

        $state.go('commission.mapping');

    };


}])