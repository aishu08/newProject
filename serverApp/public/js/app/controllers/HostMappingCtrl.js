app.controller("HostMappingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog) {


        console.log('HostMappingCtrl');
        $scope.selectedseats = [];
        $scope.dragselected = [];
        $scope.selected = {};
        $scope.rooms = [];

        $scope.closeDialog = function () {
            $scope.blur_content = false;
            $mdDialog.hide();

        }

        $scope.done = function () {
            $scope.closeDialog();
        }

        $scope.openDialog = function ($event, item) {
            if ($scope.selectedfloor && $scope.selectedfloor._id) {

                if (item === "Seats") {
                    $scope.UpdateAllSeats();
                } else {
                    $scope.UpdateAllRooms();
                }

            } else {

                $rootScope.showToast("Please select Floor to Update " + item, 'success-toast', 'top center')
            }
        };

        $scope.items = [
            { name: "Save Seats", type: "Seats", direction: "top", icon: "event_seat" },
            { name: "Save Rooms", type: "Rooms", direction: "top", icon: "people" }

        ];

        $http.get('/app/api/getbuildings').then(function (response) {

            $scope.buildings = response.data;

        }, function (err) {

            $rootScope.showToast(err.data.err, 'error-toast');
        });

        $scope.OnBuildingChange = function (building) {
            console.log(building);
            $scope.selectedBuilding = building;
            $http.get('/app/api/getfloors', { params: { fids: building.floors } }).then(function (response) {
                $scope.floors = response.data;
                $scope.floors.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });
            }, function (err) {
                console.log(err);
                $rootScope.showToast(err.data.err, 'error-toast');
            });
        }

        $scope.OnFloorChange = function (floor) {
            console.log(floor);
            $scope.showlayout = true;
            $scope.selectedfloor = floor;
            $scope.GetSeats();
            $scope.GetHosts();
            $scope.selectedhost = {};
            $scope.selection.host = {};

        }

        $scope.OnHostChange = function (host) {
            console.log(host);
            $scope.selectedhost = host;
            $scope.markHostassignedseats();
        }

        $scope.toggleselection = function (event, seat) {
            console.log(seat);
            if (event.ctrlKey) {
                if (!$scope.selectedhost || !$scope.selectedhost.id) {
                    $rootScope.showToast("Please select Host", 'error-toast', 'top center')
                } else {
                    seat.selected = !seat.selected;
                    if (seat.selected) {

                        for (var i = 0; i < $scope.dragselected.length; i++) {
                            if (seat._id == $scope.dragselected[i]._id) {
                                $scope.dragselected.splice(i, 1);
                            }
                        }

                        var finalseatsforupdate = [];
                        angular.forEach($scope.seats, function (item, index) {

                            if (item["selected"] === true) {
                                finalseatsforupdate.push(item);
                            }
                        });

                        console.log($scope.selectedhost);
                        $http.put('/app/api/checkseatsMappingwithotheHost', { seatids: [seat._id], hid: $scope.selectedhost.id }).then(function (response) {

                            console.log(response);
                            if (response.data.status) {
                                var confirm = $mdDialog.confirm()
                                    .title('Some Seats are already mapped to other Host')
                                    .textContent('We cannot map same seats for two different Hosts.')
                                    .ariaLabel('confirmation')
                                    .targetEvent()
                                    .ok('OK');


                                $mdDialog.show(confirm).then(function () {

                                    seat.selected = !seat.selected;

                                }, function () {
                                    seat.selected = !seat.selected;
                                });



                            } else {
                                $scope.dragselected.push(seat);
                            }

                            $scope.makingAjaxCall = false;


                        }, function (err) {
                            $scope.makingAjaxCall = false;
                            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                        })

                    } else {

                        for (var i = 0; i < $scope.dragselected.length; i++) {
                            if (seat._id == $scope.dragselected[i]._id) {
                                $scope.dragselected.splice(i, 1);
                            }
                        }
                    }
                }
            }
        }

        $scope.selectionStart = function (event, ui, selected, list) {
            //  console.log(list)
        };
        $scope.selectionStop = function (selected) {
            if (!$scope.selectedhost || !$scope.selectedhost.id) {
                $rootScope.showToast("Please select Host", 'error-toast', 'top center')
            } else {
                if (selected.length > 0) {
                    $scope.dragselected = selected;

                    angular.forEach($scope.dragselected, function (selecteditem, index) {
                        angular.forEach($scope.seats, function (item, index) {
                            if (selecteditem._id == item._id) { item["selected"] = true; }
                        })
                    })
                    var finalseatsforupdate = [];
                    var ids = [];
                    angular.forEach($scope.seats, function (item, index) {

                        if (item["selected"] === true) {
                            finalseatsforupdate.push(item);
                            ids.push(item._id);
                        }
                    });

                    $http.put('/app/api/checkseatsMappingwithotheHost', { seatids: ids, hid: $scope.selectedhost.id }).then(function (response) {

                        console.log(response);
                        if (response.data.status) {

                            var confirm = $mdDialog.confirm()
                                .title('Some Seats are already mapped to other Host')
                                .textContent('We cannot map same seats for two different Hosts.')
                                .ariaLabel('confirmation')
                                .targetEvent()
                                .ok('OK');


                            $mdDialog.show(confirm).then(function () {

                                //  $scope.dragselected.push(seat);
                                $scope.dragselected = [];
                                $scope.markHostassignedseats();
                            }, function () {
                                $scope.dragselected = [];
                                $scope.markHostassignedseats();
                            });
                        }

                        $scope.makingAjaxCall = false;


                    }, function (err) {
                        $scope.makingAjaxCall = false;
                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                    })

                } else {
                    $scope.markHostassignedseats();
                }
            }
        }


        $scope.markHostassignedseats = function () {
            $scope.selectedseats = [];
            for (var k = 0; k < $scope.seats.length; k++) {
                $scope.seats[k].selected = false;
            }
            console.log($scope.selectedhost)
            for (var j = 0; j < $scope.seats.length; j++) {

                if ($scope.seats[j].hostId == $scope.selectedhost.id) {
                    $scope.seats[j].selected = true;
                    $scope.selectedseats.push($scope.seats[j]);
                }
            }

        }

        $scope.GetSeats = function () {

            var fid = $scope.selectedfloor._id;

            $http.get('/app/api/getseats', { params: { floorId: fid } }).then(function (response) {

                $scope.seats = response.data.document;

                console.log($scope.seats);

                if ($scope.seats.length === 0) {
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };

        $scope.GetHosts = function () {


            $http.get('/app/api/getcertificates', { params: { bname: $scope.selectedBuilding.name, fname: $scope.selectedfloor.name } }).then(function (response) {
                console.log(response);
                $scope.certificateslist = response.data;
                var fid = $scope.selectedfloor._id;
                var bid = $scope.selectedBuilding.id;
                $http.get('/app/api/gethosts', { params: { buildingId: bid, floorId: fid } }).then(function (response) {
                    console.log(response);

                    $scope.hosts = response.data;
                    console.log($scope.selectedhost)
                    if ($scope.selectedhost.name) {
                        $scope.selection.host = $scope.selectedhost;
                        $scope.markHostassignedseats();
                    }
                    $scope.availablecerts = [];
                    for (var i = 0; i < $scope.hosts.length; i++) {

                        for (var j = 0; j < $scope.certificateslist.length; j++) {
                            if ($scope.hosts[i].certificates.crt === $scope.certificateslist[j].crt
                                && $scope.hosts[i].certificates.pem === $scope.certificateslist[j].pem
                                && $scope.hosts[i].certificates.ppk === $scope.certificateslist[j].ppk) {
                                $scope.certificateslist[j].flag = true;
                            }
                        }
                    }
                    for (var j = 0; j < $scope.certificateslist.length; j++) {
                        if (!$scope.certificateslist[j].flag) {
                            $scope.availablecerts.push($scope.certificateslist[j]);
                        }
                    }
                    $scope.certificates = $scope.certificateslist;

                }, function (err) {

                    $rootScope.showToast(err.data.err, 'error-toast');

                });

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast');

            });
        };


        $scope.UpdateAllSeats = function () {
            var finalseatsforupdate = [];
            angular.forEach($scope.seats, function (item, index) {

                if (item["selected"] === true) {
                    finalseatsforupdate.push(item);
                }
            });
            console.log(finalseatsforupdate);
            if ($scope.selectedhost && $scope.selectedhost.id) {

                $scope.makingAjaxCall = true;
                $http.put('/app/api/MapHostswithSeats', { seats: finalseatsforupdate, hid: $scope.selectedhost.id }).then(function (response) {
                    console.log(response.data);

                    $scope.GetSeats();
                    $scope.markHostassignedseats();
                    $scope.makingAjaxCall = false;

                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function (err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                })
            } else if (!$scope.selectedhost || !$scope.selectedhost.id) {
                $rootScope.showToast("Please select Host", 'error-toast', 'top center')
            }

        };

        $scope.addhost = function (floors) {
            $scope.hostobj = {};
            $scope.hostobj.certificates = {};
            if ($scope.selectedfloor && $scope.selectedfloor._id) {

                $mdDialog.show({
                    templateUrl: 'template/addnewhost',
                    clickOutsideToClose: false,
                    scope: $scope,
                    preserveScope: true
                }).then(function () {

                    $scope.blur_content = false;
                }, function () {

                    $scope.blur_content = false;

                });
            } else {
                $rootScope.showToast("Please select floor to add Host", 'error-toast', 'top center')
            }
        }

        $scope.creathost = function (hostobj, hostform) {

            console.log(hostform);
            console.log($scope.selectedBuilding);
            if (hostform.$valid) {
                hostobj.buildingId = $scope.selectedBuilding.id;
                hostobj.floorId = $scope.selectedfloor._id;
                $http.post('/app/api/createHost', hostobj).then(function (response) {
                    console.log(response);
                    $scope.closeDialog();
                    $scope.GetHosts();
                    $scope.GetSeats();
                    $rootScope.showToast(response.data, 'success-toast', 'top center')
                }, function (err) {

                    $rootScope.showToast(err.data, 'error-toast', 'top center')

                })
            } else {
                $rootScope.showToast("Please fill required fields", 'error-toast', 'top center')
            }
        }

        $scope.edithost = function (host) {
            $scope.hostobj = host;
            console.log($scope.hostobj);


            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                for (var j = 0; j < $scope.certificates.length; j++) {
                    if ($scope.hostobj.certificates.crt === $scope.certificates[j].crt
                        && $scope.hostobj.certificates.pem === $scope.certificates[j].pem
                        && $scope.hostobj.certificates.ppk === $scope.certificates[j].ppk) {
                        $scope.certificates[j].flag = false;
                    }
                }
                $mdDialog.show({
                    templateUrl: 'template/edithost',
                    clickOutsideToClose: false,
                    scope: $scope,
                    preserveScope: true
                }).then(function () {
                    for (var j = 0; j < $scope.certificates.length; j++) {
                        if ($scope.hostobj.certificates.crt === $scope.certificates[j].crt
                            && $scope.hostobj.certificates.pem === $scope.certificates[j].pem
                            && $scope.hostobj.certificates.ppk === $scope.certificates[j].ppk) {
                            $scope.certificates[j].flag = true;
                        }
                    }
                    $scope.blur_content = false;
                }, function () {
                    for (var j = 0; j < $scope.certificates.length; j++) {
                        if ($scope.hostobj.certificates.crt === $scope.certificates[j].crt
                            && $scope.hostobj.certificates.pem === $scope.certificates[j].pem
                            && $scope.hostobj.certificates.ppk === $scope.certificates[j].ppk) {
                            $scope.certificates[j].flag = true;
                        }
                    }
                    $scope.blur_content = false;

                });
            } else {
                $rootScope.showToast("Please select floor to add Host", 'error-toast', 'top center')
            }
        }

        $scope.UpdateHost = function (hostobj, hostform) {

            console.log(hostform);
            console.log($scope.selectedBuilding);
            if (hostform.$valid) {

                $http.post('/app/api/updateHost', hostobj).then(function (response) {
                    console.log(response);
                    $scope.closeDialog();
                    $scope.selectedhost = response.data.host;
                    $scope.GetHosts();
                    $scope.GetSeats();
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function (err) {

                    $rootScope.showToast(err.data, 'error-toast', 'top center')

                })
            } else {
                $rootScope.showToast("Please fill required fields", 'error-toast', 'top center')
            }
        }

        $scope.SendToHost = function () {
            getmappedseats(function () {

                $scope.makingAjaxCall = true;

                var finalbodytohost = {}

                if ($scope.selectedhost.id) {


                    finalbodytohost.hostName = $scope.selectedhost.name;
                    finalbodytohost.floorConfig = {
                        "layout": $scope.selectedfloor.layout,

                        "name": $scope.selectedfloor.name
                    };

                    finalbodytohost.buildingName = $scope.selectedBuilding.name;

                    finalbodytohost.seatConfig = [];
                    finalbodytohost.roomConfig = [];
                    console.log($scope.selectedseats);

                    for (var i = 0; i < $scope.seats.length; i++) {
                        if ($scope.seats[i].selected) {
                            var obj = {
                                "rotate": $scope.seats[i].rotate,
                                "name": $scope.seats[i].name,
                                "width": $scope.seats[i].width,
                                "class": $scope.seats[i].class,
                                "height": $scope.seats[i].height,
                                "posx": $scope.seats[i].posX,
                                "posy": $scope.seats[i].posY,
                                "ble": $scope.seats[i].bles.address,
                                "type": 3

                            }

                            finalbodytohost.seatConfig.push(obj);
                        }
                    }

                    for (var i = 0; i < $scope.rooms.length; i++) {

                        var obj = {
                            "rotate": $scope.rooms[i].rotate,
                            "name": $scope.rooms[i].name,
                            "width": $scope.rooms[i].width,
                            "class": $scope.rooms[i].class,
                            "height": $scope.rooms[i].height,
                            "posx": $scope.rooms[i].posX,
                            "posy": $scope.rooms[i].posY,
                            "ble": $scope.rooms[i].bles.address,
                            "type": 5

                        }

                        finalbodytohost.roomConfig.push(obj);
                    }

                    console.log(finalbodytohost);


                    $http.post('/app/api/SubmitToHost', { cloudConfig: finalbodytohost }).then(function (response) {

                        console.log(response);

                        $scope.makingAjaxCall = false;

                        $rootScope.showToast(response.data, 'success-toast', 'top center')

                    }, function (err) {
                        $scope.makingAjaxCall = false;
                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                    })

                } else {

                    $rootScope.showToast("Please select Floor and Host", 'success-toast', 'top center')
                }

            })

        };

        function getmappedseats(callback) {
            $scope.markHostassignedseats();
            callback();
        }

    }])