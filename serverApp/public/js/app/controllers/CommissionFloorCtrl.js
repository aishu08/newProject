// Commision Create Function declared as $scope.CreateNewCommission By darshan on 15-11-2017.


app.controller("CommissionFloorCtrl", ['$scope', '$rootScope', '$cookies', '$state', '$transitions', "$http", 'Upload', '$mdDialog', function ($scope, $rootScope, $cookies, $state, $transitions, $http, Upload, $mdDialog) {

    $scope.floor_details = {};
    var count = 0;

    $scope.floor_details.hosts = [];

    $scope.floors = [];

    $scope.addhosttofloor = function () {
        var emptyhostobj = {
            name: "",
            certificates: {
                crt: "",
                pem: "",
                ppk: ""
            }
        }
        $scope.floor_details.hosts.push(emptyhostobj);
        console.log($scope.floor_details.hosts)
    }

    $scope.hidden = false;
    $scope.isOpen = false;
    $scope.hover = false;
    $scope.$watch('isOpen', function (isOpen) {
        if (isOpen) {
            $timeout(function () {
                $scope.tooltipVisible = $scope.isOpen;
            }, 600);
        } else {
            $scope.tooltipVisible = $scope.isOpen;
        }
    });

    function onload() {

        if (localStorage.getItem('id')) {

            $http.get('/app/api/getBuildingbyId', { params: { id: localStorage.getItem('id') } }).then(function (response) {

                $rootScope.building = response.data;
                $scope.building_details = $rootScope.building;
                console.log(response);

                $http.get('/app/api/getfloors', { params: { fids: $rootScope.building.floors } }).then(function (response) {
                    console.log(response);
                    $scope.floors = response.data;
                    $scope.floors.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });
                    for (var i = 0; i < $scope.floors.length; i++) {
                        if ($scope.floors[i].hosts && $scope.floors[i].hosts.length > 0) {
                            $scope.floors[i].hosts.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); })
                        }
                    }
                    $scope.hostslist = [];
                    $scope.floors.map(function (item) {
                        Array.prototype.push.apply($scope.hostslist, item.hosts);
                    })


                    $http.get('/app/api/getcertificates', { params: { bname: $scope.building_details.name } }).then(function (response) {
                        console.log(response);
                        $scope.certificateslist = response.data;
                    }, function (err) {
                        console.log(err);
                        $rootScope.showToast(err.data.err, 'error-toast');
                    });

                }, function (err) {
                    console.log(err);
                    $rootScope.showToast(err.data.err, 'error-toast');
                });

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast');
            });
        } else {

            var confirm = $mdDialog.confirm()
                .title('Please select Building or add Building details to configure Floors')
                .textContent('Click on ok to continue.')
                .ariaLabel('Floors confirmation')
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

    $scope.CreateFloors = function () {

        $http.get('/app/api/getfloors', { params: { fids: $scope.building_details.floors } }).then(function (response) {

            $scope.floorstocheck = response.data;
            $scope.floorstocheck.push($scope.floor_details);

            chechforduplicates($scope.floorstocheck, 'name', function (status) {

                if (status) {

                    $rootScope.showToast("Floor name already exists", 'error-toast');

                } else {
                    if ($rootScope.building.nof <= $scope.floors.length) {

                        $rootScope.showToast("You already reached maximum Floors", 'error-toast');

                    } else if ($scope.file) {

                        $scope.floor_details.layout = $scope.file.name;
                        $scope.floor_details.bid = $rootScope.building.id;
                        $scope.floor_details.bname = $rootScope.building.name;
                        console.log($scope.floor_details);
                        Upload.upload({
                            url: '/app/api/createFloor/' + $scope.floor_details.name + '/' + $scope.floor_details.bname,
                            data: { file: $scope.file, 'floor_details': $scope.floor_details }
                        }).then(function (resp) {

                            $rootScope.building = resp.data.bulding;
                            onload();
                            $rootScope.showToast(resp.data.msg, 'success-toast');
                            $scope.floor_details = {};
                            $scope.floor_details.hosts = [];
                            $scope.file = "";
                        }, function (resp) {

                            $rootScope.showToast(resp.status, 'error-toast');
                        }, function (evt) {

                            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);

                        });

                    }
                }
            })
        })

    }

    $scope.GotoHostconfig = function (ev) {

        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .title('Are you sure all Floors configured?')
            .textContent('Click on ok to continue.')
            .ariaLabel('Floors confirmation')
            .targetEvent(ev)
            .ok('OK')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {

            $state.go('commission.host');

        }, function () {
            console.log('Canceled');
        });

    }


    $scope.floorDetails = function (floors) {

        $mdDialog.show({
            templateUrl: 'template/floorDetails',
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true
        }).then(function () {

            $scope.blur_content = false;
        }, function () {

            $scope.blur_content = false;

        });


    }

    $scope.removehostfromselectedfloor = function (hindex, findex, host) {

        console.log(hindex, findex)
        console.log($scope.floors);
        if (host._id) {
            $scope.floors[findex].hosts[hindex].delete = true;
        } else {
            $scope.floors[findex].hosts.splice(hindex, 1);
        }

    }

    $scope.removehostfromfloor = function (index, floor_details) {
        $scope.floor_details.hosts.splice(index, 1);
        console.log($scope.floor_details);
    }

    $scope.removecertsfromselectedhost = function (hindex, findex, host) {

        for (var i = 0; i < $scope.certificateslist.length; i++) {

            if ($scope.certificateslist[i].crt === $scope.floors[findex].hosts[hindex].certificates.crt
                && $scope.certificateslist[i].pem === $scope.floors[findex].hosts[hindex].certificates.pem
                && $scope.certificateslist[i].ppk === $scope.floors[findex].hosts[hindex].certificates.ppk) {

                $scope.certificateslist[i].selected = false;
            }
        }
        $scope.floors[findex].hosts[hindex].certificates = {};
    }

    $scope.removecerts = function (index, floor_details) {
        for (var i = 0; i < $scope.certificateslist.length; i++) {

            if ($scope.certificateslist[i].crt === $scope.floor_details.hosts[index].certificates.crt
                && $scope.certificateslist[i].pem === $scope.floor_details.hosts[index].certificates.pem
                && $scope.certificateslist[i].ppk === $scope.floor_details.hosts[index].certificates.ppk) {

                $scope.certificateslist[i].selected = false;
            }
        }
        $scope.floor_details.hosts[index].certificates = {};
    }

    $scope.choosecertificate = function (host) {

        console.log(host)
        $scope.selectedhost = host;

        $scope.floor_details.hosts.map(function (item) {
            if (item.certificates.crt) {
                $scope.hostslist.push(item);
            }
        })
        console.log($scope.certificateslist);
        console.log($scope.hostslist);
        for (var i = 0; i < $scope.certificateslist.length; i++) {
            for (var j = 0; j < $scope.hostslist.length; j++) {

                if ($scope.certificateslist[i].crt === $scope.hostslist[j].certificates.crt && $scope.certificateslist[i].pem === $scope.hostslist[j].certificates.pem
                    && $scope.certificateslist[i].ppk === $scope.hostslist[j].certificates.ppk) {
                    $scope.certificateslist[i].selected = true;
                }
            }
        }
        console.log($scope.certificateslist);
        $scope.certs = {};
        $mdDialog.show({
            templateUrl: 'template/ChooseCertificates',
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true
        }).then(function () {

            $scope.blur_content = false;
        }, function () {

            $scope.blur_content = false;

        });

    }

    $scope.onfileselect = function (filename, floor) {
        console.log(filename);
        if (!filename) {
            var confirm = $mdDialog.confirm()
                .title('Please select valid file or filetype')
                .textContent('Click on ok to continue.')
                .ariaLabel('Layout')
                .targetEvent("ev")
                .ok('OK')
                .cancel();
            $mdDialog.show(confirm).then(function () {


            }, function () {

            });
        } else if (floor) {

            floor.layout = filename;
        }
    }

    $scope.certselection = function (certs) {

        $scope.certs = certs;
    }

    $scope.setcertificate = function () {

        $scope.selectedhost.certificates = $scope.certs
        for (var i = 0; i < $scope.certificateslist.length; i++) {

            if ($scope.certificateslist[i].crt === $scope.certs.crt
                && $scope.certificateslist[i].pem === $scope.certs.pem
                && $scope.certificateslist[i].ppk === $scope.certs.ppk) {

                $scope.certificateslist[i].selected = true;
            }
        }
        $scope.blur_content = false;
        $mdDialog.hide();

    }

    $scope.closeDialog = function () {
        $scope.blur_content = false;
        $mdDialog.hide();

    }


    $scope.selectfloor = function (floor) {

        $scope.selectedfloor = JSON.parse(floor);

    }


    $scope.UpdateFloor = function (Floor, form) {

        console.log(Floor);
        Floor.bid = $scope.building_details.id;
        if (form && form.$valid) {
            chechforduplicates(Floor.hosts, 'name', function (status) {
                console.log(status);
                if (status) {

                    $rootScope.showToast("Host names are repeating", 'error-toast');

                } else {

                    chechforduplicates($scope.floors, 'name', function (status) {

                        if (status) {

                            $rootScope.showToast("Floor names are repeating", 'error-toast');

                        } else {

                            Upload.upload({
                                url: '/app/api/updateFloor/' + Floor.name + '/' + $scope.building_details.name + '/' + Floor._id,
                                data: { file: Floor.file, 'floor_details': Floor }
                            }).then(function (resp) {

                                $rootScope.building = resp.data.bulding;
                                onload();
                                $rootScope.showToast(resp.data.msg, 'success-toast');
                                $scope.floor_details = {};
                                $scope.floor_details.hosts = [];

                            }, function (resp) {

                                $rootScope.showToast(resp.status, 'error-toast');
                            }, function (evt) {

                                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);

                            });
                        }
                    })

                }
            })
        }
    }

    $scope.ContinuetoMapping = function () {

        $state.go('commission.mapping');

    };

    $scope.RemoveFloor = function (floor) {

        floor.bid = $scope.building_details.id;

        $http.put('/app/api/removefloor', floor).then(function (response) {

            $rootScope.showToast(response.data, 'success-toast');
            onload();
        })

    }

    $scope.addhosttoexistingfloor = function (floor) {
        var emptyhostobj = {
            name: "",
            certificates: {
                crt: "",
                pem: "",
                ppk: ""
            }
        }
        floor.hosts.push(emptyhostobj);
    }


    $scope.collectmailids = function () {

        $mdDialog.show({
            templateUrl: 'template/mailidentrybox',
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true
        }).then(function () {

            $scope.blur_content = false;
        }, function () {

            $scope.blur_content = false;

        });

    }

    $scope.sendemail = function (floor, host) {

        $scope.blur_content = true;
        $scope.sendemailcall = true;

        $http.post('/app/api/mailFloordetails', { building: $scope.building_details.name, floor: floor, host: host }).then(function (response) {
            // console.log(response);
            $scope.sendemailcall = false;
            $scope.blur_content = false;
            $rootScope.showToast(response.data, 'success-toast');
        }, function (err) {
            $scope.sendemailcall = false;
            $scope.blur_content = false;
            console.log(err);
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

}])