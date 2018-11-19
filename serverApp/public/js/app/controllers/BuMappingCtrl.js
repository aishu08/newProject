app.controller("BuMappingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog) {


        console.log('BuMappingCtrl');
        $scope.selectedseats = [];
        $scope.dragselected = [];
        $scope.selected = {};
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
            $scope.GetBUs();
        }

        $scope.OnBUChange = function (bu) {
            console.log(bu);
            $scope.selectedbu = bu;
            $scope.markBuassignedseats();
        }

        $scope.toggleselection = function (event, seat) {
            console.log(seat);
            if (event.ctrlKey) {
                if (!$scope.selectedbu || !$scope.selectedbu.id) {
                    $rootScope.showToast("Please select BU", 'error-toast', 'top center')
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
                        var maxseats = finalseatsforupdate.length;
                        if (maxseats <= $scope.selectedbu.maxseats) {
                            console.log($scope.selectedbu);
                            $http.put('/app/api/checkseatsBuMapping', { seatids: [seat._id], buid: $scope.selectedbu.id }).then(function (response) {

                                console.log(response);
                                if (response.data.status) {

                                    var confirm = $mdDialog.confirm()
                                        .title('Seat are already mapped to other BU?')
                                        .textContent('Click on ok to continue.')
                                        .ariaLabel('confirmation')
                                        .targetEvent()
                                        .ok('OK')
                                        .cancel('Cancel');

                                    $mdDialog.show(confirm).then(function () {

                                        $scope.dragselected.push(seat);

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
                            seat.selected = !seat.selected;
                            $rootScope.showToast("You can only Map " + $scope.selectedbu.maxseats + " Seats for selected BU", 'error-toast', 'top center')
                        }

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
            if (!$scope.selectedbu || !$scope.selectedbu.id) {
                if (selected.length > 0) {
                    $rootScope.showToast("Please select BU", 'error-toast', 'top center')
                }
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
                    var maxseats = finalseatsforupdate.length + 1;
                    if (maxseats > $scope.selectedbu.maxseats) {
                        $rootScope.showToast("You can only Map " + $scope.selectedbu.maxseats + " Seats for selected BU", 'error-toast', 'top center')
                        $scope.markBuassignedseats();
                    } else {
                        $http.put('/app/api/checkseatsBuMapping', { seatids: ids, buid: $scope.selectedbu.id }).then(function (response) {

                            console.log(response);
                            if (response.data.status) {

                                var confirm = $mdDialog.confirm()
                                    .title('Some Seats are already mapped to other BU?')
                                    .textContent('Clicking on ok will unmap from other BU\'s. Click OK to continue.')
                                    .ariaLabel('confirmation')
                                    .targetEvent()
                                    .ok('OK')
                                    .cancel('Cancel');

                                $mdDialog.show(confirm).then(function () {

                                    //  $scope.dragselected.push(seat);

                                }, function () {
                                    $scope.dragselected = [];
                                    $scope.markBuassignedseats();
                                });
                            }

                            $scope.makingAjaxCall = false;


                        }, function (err) {
                            $scope.makingAjaxCall = false;
                            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                        })
                    }

                } else {
                    $scope.markBuassignedseats();
                }
            }
        }


        $scope.markBuassignedseats = function () {
            $scope.selectedseats = [];
            for (var k = 0; k < $scope.seats.length; k++) {
                $scope.seats[k].selected = false;
            }
            for (var i = 0; i < $scope.selectedbu.seats.length; i++) {
                for (var j = 0; j < $scope.seats.length; j++) {

                    if ($scope.seats[j]._id == $scope.selectedbu.seats[i]) {
                        $scope.seats[j].selected = true;
                        $scope.selectedseats.push($scope.seats[j]);
                    }
                }
            }
        }


        $scope.modelSelect = function (test) {

            if (!$scope.selectedbu || !$scope.selectedbu.id) {
                $rootScope.showToast("Please select BU", 'error-toast', 'top center')
            } else {
                test.selected = !test.selected;

                if (test.selected) {
                    $http.put('/app/api/checkseatsBuMapping', { seatids: [test._id], buid: $scope.selectedbu.id }).then(function (response) {

                        console.log(response);
                        if (response.data.status) {

                            var confirm = $mdDialog.confirm()
                                .title('Seat are already mapped to other BU?')
                                .textContent('Click on ok to continue.')
                                .ariaLabel('confirmation')
                                .targetEvent()
                                .ok('OK')
                                .cancel('Cancel');

                            $mdDialog.show(confirm).then(function () {
                                var maxseats = $scope.selectedseats.length + 1;
                                if (maxseats <= $scope.selectedbu.maxseats) {
                                    $scope.selectedseats.push(test);
                                } else {
                                    test.selected = !test.selected;
                                    $rootScope.showToast("You can only Map " + $scope.selectedbu.maxseats + " Seats for selected BU", 'error-toast', 'top center')
                                }


                            }, function () {
                                test.selected = !test.selected;
                                console.log('Canceled');
                            });

                        } else {

                            var maxseats = $scope.selectedseats.length + 1;
                            if (maxseats <= $scope.selectedbu.maxseats) {
                                $scope.selectedseats.push(test);
                            } else {
                                test.selected = !test.selected;
                                $rootScope.showToast("You can only Map " + $scope.selectedbu.maxseats + " Seats for selected BU", 'error-toast', 'top center')
                            }
                        }

                        $scope.makingAjaxCall = false;


                    }, function (err) {
                        $scope.makingAjaxCall = false;
                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                    })

                } else {
                    $scope.selectedseats.splice($scope.selectedseats.indexOf(test), 1);
                }
            }
            // console.log('selected', test);
        };

        $scope.GetSeats = function () {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/app/api/getseats', { params: { floorId: fid } }).then(function (response) {
                $scope.makingAjaxCall = false;
                $scope.seats = response.data.document;
                if ($scope.selectedbu && $scope.selectedbu.id) {
                    $scope.GetBUs();
                }
                console.log($scope.seats);

                if ($scope.seats.length === 0) {
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };

        $scope.GetBUs = function () {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/app/api/getBUs', { params: { floorId: fid } }).then(function (response) {
                $scope.makingAjaxCall = false;
                $scope.BUs = response.data.bulist;
                console.log($scope.selectedbu);
                if ($scope.selectedbu) {
                    for (var i = 0; i < $scope.BUs.length; i++) {
                        if ($scope.BUs[i].id == $scope.selectedbu.id) {
                            $scope.selection.BU = $scope.BUs[i];
                            $scope.selectedbu = $scope.BUs[i];
                            $scope.markBuassignedseats();
                        }
                    }
                }

                console.log($scope.BUs);

                if ($scope.BUs.length === 0) {
                    $rootScope.showToast("No BU's found for selected floor", 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };

        $scope.checkBumappingwithSeats = function () {
            $scope.seatids = [];

            if ($scope.selectedseats && $scope.selectedseats.length > 0 && $scope.selectedbu && $scope.selectedbu.id) {
                for (var i = 0; i < $scope.selectedseats.length; i++) {
                    $scope.selectedseats[i].buid = $scope.selectedbu.id;
                    $scope.seatids.push($scope.selectedseats[i]._id);
                }
                $scope.makingAjaxCall = true;
                $http.put('/app/api/checkseatsBuMapping', { seatids: $scope.seatids, buid: $scope.selectedbu.id }).then(function (response) {

                    console.log(response);
                    if (response.data.status) {

                        var confirm = $mdDialog.confirm()
                            .title('Some seats are already mapped to other BU\'s?')
                            .textContent('Click on ok to Unmap from other BU and Map to selected BU.')
                            .ariaLabel('confirmation')
                            .targetEvent()
                            .ok('OK')
                            .cancel('Cancel');

                        $mdDialog.show(confirm).then(function () {

                            $scope.UpdateAllSeats();

                        }, function () {
                            console.log('Canceled');
                        });

                    } else {
                        $scope.UpdateAllSeats();
                    }

                    $scope.makingAjaxCall = false;


                }, function (err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                })
            } else if (!$scope.selectedbu || !$scope.selectedbu.id) {
                $rootScope.showToast("Please select BU", 'error-toast', 'top center')
            } else {
                $rootScope.showToast("No Seats selected to update", 'error-toast', 'top center')
            }
        }

        $scope.UpdateAllSeats = function () {
            var finalseatsforupdate = [];
            angular.forEach($scope.seats, function (item, index) {

                if (item["selected"] === true) {
                    finalseatsforupdate.push(item);
                }
            });
            console.log(finalseatsforupdate);
            if ($scope.selectedbu && $scope.selectedbu.id) {

                $scope.makingAjaxCall = true;
                $http.put('/app/api/UpdateAllSeats', { seats: finalseatsforupdate, buid: $scope.selectedbu.id }).then(function (response) {
                    console.log(response.data);

                    $scope.selectedbu = response.data.section;
                    $scope.GetSeats();

                    $scope.makingAjaxCall = false;

                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function (err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                })
            } else if (!$scope.selectedbu || !$scope.selectedbu.id) {
                $rootScope.showToast("Please select BU", 'error-toast', 'top center')
            }

        };

        $scope.addbu = function (floors) {
            $scope.buobj = {};
            if ($scope.selectedfloor && $scope.selectedfloor._id) {

                $mdDialog.show({
                    templateUrl: 'template/addbu',
                    clickOutsideToClose: false,
                    scope: $scope,
                    preserveScope: true
                }).then(function () {

                    $scope.blur_content = false;
                }, function () {

                    $scope.blur_content = false;

                });
            } else {
                $rootScope.showToast("Please select floor to add BU", 'error-toast', 'top center')
            }
        }

        $scope.SaveBu = function (buobj, buform) {

            console.log(buform);
            if (buform.$valid) {
                $http.post('/app/api/addBu/' + $scope.selectedfloor._id, buobj).then(function (response) {
                    console.log(response);
                    $scope.closeDialog();
                    $scope.GetBUs();
                    $scope.GetSeats();
                    $rootScope.showToast(response.data, 'success-toast', 'top center')
                }, function (err) {

                    $rootScope.showToast(err.data, 'error-toast', 'top center')

                })
            }
        }

    }])