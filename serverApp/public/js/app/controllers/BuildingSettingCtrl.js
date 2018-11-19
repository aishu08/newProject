app.controller("BuildingSettingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog', 'Upload',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog, Upload) {

        console.log('BuildingSettingCtrl')
        $scope.direction = "right";
        $scope.selection = 0;

        function getbuildingwithfloors() {

            $http.get('/app/api/getbuildings').then(function (response) {

                $scope.buildinglist = response.data;

                if ($scope.buildinglist.length > 0) {

                    $http.get('/app/api/getfloors', { params: { fids: $scope.buildinglist[$scope.selection].floors } }).then(function (response) {
                        console.log(response);
                        $scope.floors = response.data;
                        $scope.floors.sort(function (a, b) { return (a.name < b.name) ? 1 : ((b.name < a.name) ? -1 : 0); });
                        /* for (var i = 0; i < $scope.floors.length; i++) {
                            if ($scope.floors[i].hosts && $scope.floors[i].hosts.length > 0) {
                                $scope.floors[i].hosts.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); })
                            }
                        } */
                       /*  $scope.hostslist = [];
                        $scope.floors.map(function (item) {
                            Array.prototype.push.apply($scope.hostslist, item.hosts);
                        }) */


                        // $http.get('/app/api/getcertificates', { params: { bname: $scope.buildinglist[$scope.selection].name } }).then(function (response) {
                        //     console.log(response);
                        //     $scope.certificateslist = response.data;
                        // }, function (err) {
                        //     console.log(err);
                        //     $rootScope.showToast(err.data.err, 'error-toast');
                        // });

                    }, function (err) {
                        console.log(err);
                        $rootScope.showToast(err.data.err, 'error-toast');
                    });
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast');
            });
        }
        getbuildingwithfloors();

        $scope.leftClick = function () {
            $scope.direction = "left";
            getbuildingwithfloors()
            $scope.selection = decrementSelection();
        };

        $scope.rightClick = function () {
            $scope.direction = "right";
            getbuildingwithfloors()
            $scope.selection = incrementSelection();
        };

        function decrementSelection() {
            return ($scope.selection + ($scope.buildinglist.length - 1)) % $scope.buildinglist.length;
        }

        function incrementSelection() {
            return ($scope.selection + 1) % $scope.buildinglist.length;
        }

        $scope.timezonelist = moment.tz.names();

        $scope.selectedItemChange = function (item) {

            var tzoffset = moment.tz(item).format('Z');

            var timeParts = tzoffset.split(":");
            var tzoffsetmillisec = (+timeParts[0] * (60000 * 60)) + (+timeParts[1] * 60000)

            $scope.building_details.timezoneOffset = ((item) ? tzoffsetmillisec : undefined);
        }

        $scope.addbuilding = function (floors) {
            $scope.building_details = {};
            $mdDialog.show({
                templateUrl: 'template/addbuilding',
                clickOutsideToClose: false,
                scope: $scope,
                preserveScope: true
            }).then(function () {

                $scope.blur_content = false;
            }, function () {

                $scope.blur_content = false;

            });

        }

        $scope.UpdateFloor = function (Floor, form) {

            console.log(Floor);

            if (form && form.$valid) {

                chechforduplicates($scope.floors, 'name', function (status) {

                    if (status) {

                        $rootScope.showToast("Floor names are repeating", 'error-toast');

                    } else {

                        Upload.upload({
                            url: '/app/api/updateFloor/' + Floor.name + '/' + $scope.buildinglist[$scope.selection].name + '/' + Floor._id,
                            data: { file: $scope.file, 'floor_details': Floor }
                        }).then(function (resp) {

                            $rootScope.showToast(resp.data.msg, 'success-toast');
                            getbuildingwithfloors();
                            $scope.closeDialog()
                        }, function (resp) {

                            $rootScope.showToast(resp.status, 'error-toast');
                            $scope.closeDialog()
                        }, function (evt) {
                            $scope.closeDialog();
                            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);

                        });
                    }
                })


            }
        }

        $scope.RemoveFloor = function (floor) {

            $http.put('/app/api/removefloor', floor).then(function (response) {

                $rootScope.showToast(response.data, 'success-toast');
                getbuildingwithfloors();
                $scope.closeDialog()
            })

        }
        $scope.onfileselect = function (floor) {
            console.log(floor);
        }

        $scope.closeDialog = function () {
            $scope.blur_content = false;
            $mdDialog.hide();

        }

        $scope.editfloor = function (floor) {
            $scope.floor = floor;
            $mdDialog.show({
                templateUrl: 'template/editfloor',
                clickOutsideToClose: false,
                scope: $scope,
                preserveScope: true
            }).then(function () {

                $scope.blur_content = false;
            }, function () {

                $scope.blur_content = false;

            });

        }

        $scope.editbuilding = function (building) {
            $scope.building_details = building;
            $scope.building_details.nof = $scope.building_details.floors.length;
            $mdDialog.show({
                templateUrl: 'template/editbuilding',
                clickOutsideToClose: false,
                scope: $scope,
                preserveScope: true
            }).then(function () {

                $scope.blur_content = false;
            }, function () {

                $scope.blur_content = false;

            });

        }
        $scope.editfloor = function (floor) {
            $scope.floor = floor;
            $mdDialog.show({
                templateUrl: 'template/editfloor',
                clickOutsideToClose: false,
                scope: $scope,
                preserveScope: true
            }).then(function () {

                $scope.blur_content = false;
            }, function () {

                $scope.blur_content = false;

            });

        }


        $scope.updateBuilding = function (buldingform) {

            if ($scope.building_details.nof < $scope.building_details.floors.length) {

                $rootScope.showToast("Please delete floors individually", 'success-toast');

            } else if (buldingform.$valid) {

                $http.put('/app/api/updateBuilding', $scope.building_details).then(function (response) {
                    console.log(response)

                    getbuildingwithfloors();
                    $scope.blur_content = false;
                    $mdDialog.hide();
                    $rootScope.showToast(response.data, 'success-toast');

                }, function (err) {

                    $rootScope.showToast(err.data.err, 'error-toast');
                });
            }
        }

        $scope.CreateBuildingdetails = function (building_details) {
            building_details.floors = [];

            $http.post('/app/api/createBuilding', building_details).then(function (response) {

                $rootScope.showToast(response.data.msg, 'success-toast');
                getbuildingwithfloors();
                $scope.blur_content = false;
                $mdDialog.hide();
            }, function (err) {
                $scope.blur_content = false;
                $mdDialog.hide();
                $rootScope.showToast(err.data.err, 'error-toast');
            });

        }



        function chechforduplicates(list, key, callback) {

            var valueArr = list.map(function (item) { return item[key] });
            var isDuplicate = valueArr.some(function (item, idx) {
                return valueArr.indexOf(item) != idx;
            });
            callback(isDuplicate);
        }


    }]);