
app.controller("SeatMappingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog', 'Upload',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog, Upload) {

        console.log('SeatMappingCtrl');

        $scope.selected = {};
        /*  $scope.selection = true;   */
        $scope.selectedseats = []
        $scope.closeDialog = function () {
            $scope.blur_content = false;
            $mdDialog.hide();

        }

        $scope.toggleselection = function (event, seat) {
            if (event.ctrlKey) {

                if (seat.selected) {
                    seat.selected = !seat.selected;
                    for (var i = 0; i < $scope.selectedseats.length; i++) {
                        if (seat._id == $scope.selectedseats[i]._id) {
                            $scope.selectedseats.splice(i, 1);
                        }
                    }
                } else {
                    seat.selected = !seat.selected;
                    for (var i = 0; i < $scope.selectedseats.length; i++) {
                        if (seat._id == $scope.selectedseats[i]._id) {
                            $scope.selectedseats.splice(i, 1);
                        }
                    }
                    $scope.selectedseats.push(seat);
                }

            }
        }



        $scope.selectionStart = function (event, ui, selected, list) {
            //  console.log(list)
        };

        $scope.selectionStop = function (selected) {
            console.log(selected)
            $scope.selectedseats = selected;
            if ($scope.selectedseats.length > 0) {
                angular.forEach($scope.selectedseats, function (selecteditem, index) {
                    angular.forEach($scope.seats, function (item, index) {
                        if (selecteditem._id == item._id) { item["selected"] = true; }
                    })
                })
            } else {
                angular.forEach($scope.seats, function (item, index) {
                    item["selected"] = false;
                })
            }
        };

        $scope.done = function () {
            $scope.closeDialog();
        }

        $scope.items = [
            { name: "Save Seats", type: "Seats", direction: "top", icon: "event_seat" },
            { name: "Save Rooms", type: "Rooms", direction: "top", icon: "people" }

        ];

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

        $http.get('/app/api/getbuildings').then(function (response) {

            $scope.buildings = response.data;

        }, function (err) {

            $rootScope.showToast(err.data.err, 'error-toast');
        });

        $http.get('/app/api/getseattypes').then(function (response) {
            $scope.seattypes = response.data;

        }, function (err) {
            console.log(err);
            $rootScope.showToast(err.data.err, 'error-toast');

        })

        $scope.OnBuildingChange = function (building) {
            console.log(building);
            $scope.selectedBuilding = building;
            $scope.selectedseats = [];
            $scope.seats = [];
            $scope.selection.floor = {};
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
            $scope.selectedseats = [];
            $scope.selectedfloor = floor;
            $scope.GetSeats();
            $scope.GetBUs();
        }

        $scope.GetSeats = function () {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/app/api/getseats', { params: { floorId: fid } }).then(function (response) {
                console.log(response.data.document)
                $scope.seats = response.data.document;
                var seats = response.data.document;
                $scope.showlayout = true;
                $scope.makingAjaxCall = false;

                if ($scope.seats.length === 0) {
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };

        $scope.GetBUs = function () {

            var fid = $scope.selectedfloor._id;

            $http.get('/app/api/getBUs', { params: { floorId: fid } }).then(function (response) {

                $scope.BUs = response.data.bulist;

                //  console.log($scope.BUs);

                if ($scope.BUs.length === 0) {
                    $rootScope.showToast("No BU's found for selected floor", 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };

        $scope.addseats = function (floors) {

            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $http.get('/app/api/getseattypes').then(function (response) {
                    $scope.seattypes = response.data;
                    $scope.seattypes.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });

                    $scope.styobj = { width: "15", height: "15" }

                    $mdDialog.show({
                        templateUrl: 'template/addseats',
                        clickOutsideToClose: false,
                        scope: $scope,
                        preserveScope: true
                    }).then(function () {

                        $scope.blur_content = false;
                    }, function () {

                        $scope.blur_content = false;

                    });
                }, function (err) {
                    console.log(err);
                    $rootScope.showToast(err.data.err, 'error-toast');

                })
            } else {
                $rootScope.showToast("Please select floor to add seats", 'error-toast', 'top center')
            }
        }
        $scope.demoseatshape = function (seattype, form) {
            console.log(form);

            $scope.selected = {};
            $scope.selected.class = seattype.shape;
            $scope.selected.posY = "15%";
            $scope.selected.posX = "50%";
            $scope.selected.width = seattype.size;
            $scope.selected.height = seattype.size;

            $scope.styobj = { width: seattype.size, height: seattype.size }
        }


        $scope.UpdateAllSeats = function () {

            if ($scope.seats && $scope.seats.length > 0) {

                $scope.makingAjaxCall = true;
                $http.put('/app/api/UpdateAllSeatswithoutBU', { seats: $scope.seats }).then(function (response) {

                    console.log(response);
                    if (response.data.seats.length > 0) {
                        $scope.seats = response.data.seats;
                    } else {
                        $scope.GetSeats();
                    }

                    $scope.makingAjaxCall = false;

                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function (err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                })
            } else {
                $rootScope.showToast("No Seats to update", 'error-toast', 'top center')
            }
        };

        $scope.creatseats = function (seattypes, form) {
            var seattoadd = [];
            console.log(seattypes);
            var nos = 0;
            if (form.$valid) {
                for (var i = 0; i < seattypes.length; i++) {
                    if (seattypes[i].selected) {
                        nos = nos + seattypes[i].nos;
                        var posx = getposx(seattypes[i].shape);
                        var obj = { count: seattypes[i].nos, seattype: seattypes[i].shape, size: ((seattypes[i].size) ? seattypes[i].size : "15"), posx: posx };
                        seattoadd.push(obj);
                    }
                }
                console.log(seattoadd);
                if (nos <= 50) {
                    console.log($scope.selectedfloor._id);
                    console.log($scope.selectedBuilding.id);
                    $scope.buttonclicked = true;
                    $http.post('/app/api/creatseats/' + $scope.selectedfloor._id,
                        { buid: $scope.selectedBuilding.id, seatcount: seattoadd }).then(function (response) {
                            console.log(response);
                            $scope.closeDialog();
                            $scope.GetSeats();
                            $scope.buttonclicked = false;
                        }, function (err) {

                            $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                        })
                } else {

                    $rootScope.showToast("You can add Maximum of 50 seats at a time", 'error-toast', 'top center')
                }
            } else {
                $rootScope.showToast("Please fill the required fields", 'error-toast', 'top center')
            }
        }


        $scope.showPopover = function (ev, seat) {
            $scope.selectedSeat = seat
            $http.get('app/api/getbuid', { params: { seatid: $scope.selectedSeat._id } }).then(function (response) {
                console.log(response);
                $scope.selectedSeat.buid = response.data.id;
                console.log($scope.selectedSeat);
                $mdDialog.show({
                    templateUrl: 'template/seat-dialog',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    scope: $scope,
                    preserveScope: true,
                    hasBackdrop: false
                })
            })

        };

        $scope.UpdateSeat = function () {

            $scope.makingAjaxCall = true;

            $http.put('/app/api/UpdateSeat', $scope.selectedSeat).then(function (response) {

                $scope.makingAjaxCall = false;
                if (response.data.status) {
                    $scope.GetSeats();
                    $scope.closeDialog();
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                } else {
                    $rootScope.showToast(response.data.msg, 'error-toast', 'top center')
                }
            }, function (err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })

        };

        $scope.RemoveSeat = function () {

            $scope.makingAjaxCall = true;
            $http.put('/app/api/RemoveSeat', $scope.selectedSeat).then(function (response) {

                $scope.GetSeats()
                $scope.closeDialog();
                $scope.makingAjaxCall = false;
                $rootScope.showToast(response.data, 'success-toast', 'top center')
            }, function (err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })

        };

        $scope.deleteseats = function () {
            var confirm = $mdDialog.confirm()
                .title('Are you sure to delete selected Seats?')
                .textContent('Click OK to continue.')
                .ariaLabel('confirmation')
                .targetEvent()
                .ok('OK')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function () {

                $scope.RemoveSelectedSeats();

            }, function () {
                $scope.selectedseats = [];
                $scope.selectionStop($scope.selectedseats);
            });
        }

        $scope.RemoveSelectedSeats = function () {

            $scope.makingAjaxCall = true;
            $http.put('/app/api/RemoveselectedSeats', { selectedseats: $scope.selectedseats }).then(function (response) {
                $scope.selectedseats = [];
                $scope.GetSeats()
                $scope.closeDialog();
                $scope.makingAjaxCall = false;
                $rootScope.showToast(response.data, 'success-toast', 'top center')
            }, function (err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })

        };


        $scope.choosetemplate = function () {

            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $mdDialog.show({
                    templateUrl: 'template/fileupload',
                    parent: angular.element(document.body),
                    clickOutsideToClose: true,
                    scope: $scope,
                    preserveScope: true,
                    hasBackdrop: false
                })
            } else {

                $rootScope.showToast("Please select Floor and Host to add Seat", 'success-toast', 'top center')
            }

        }


        $scope.UploadSeats = function (sheet, form) {

            if (form.$valid) {

                Upload.upload({
                    url: '/app/api/uploadseats/' + $scope.selectedfloor._id,
                    data: { file: sheet[0], 'data': { size: "25", buid: $scope.selectedBuilding.id, seattype: "square" } }
                }).then(function (response) {

                    if (response.data.status) {
                        $scope.GetSeats();
                        $scope.done();
                        $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                    } else {
                        $rootScope.showToast(response.data.msg, 'error-toast', 'top center');
                        var noerrors = [{ Error: "No Errors" }]
                        var data1 = ((response.data.err.dupseatsindb.length > 0) ? response.data.err.dupseatsindb : noerrors);
                        var data2 = ((response.data.err.dupaddressindb.length > 0) ? response.data.err.dupaddressindb : noerrors);
                        var data3 = ((response.data.err.seataddressdups.length > 0) ? response.data.err.seataddressdups : noerrors);
                        var data4 = ((response.data.err.seatnamedups.length > 0) ? response.data.err.seatnamedups : noerrors);
                        console.log(data1);
                        var opts = [{ sheetid: 'Seats Duplication in DB', header: true }, { sheetid: 'Address Duplication in DB', header: true }
                            , { sheetid: 'Address Duplication in Uploaded Seats', header: true }, { sheetid: 'Address Duplication  in Uploaded Seats', header: true }];

                        function exporJsontData() {
                            // console.log('calling export');
                            alasql('SELECT INTO XLSX("ErrorLogs.xlsx",?) FROM ?', [opts, [data1, data2, data3, data4]]);
                            // alasql("SELECT * INTO CSV('names.xlsx',{headers:true}) FROM ?", [data1]);
                        }
                        exporJsontData();
                    }


                }, function (resp) {
                    console.log(resp);
                    $rootScope.showToast(resp.status, 'error-toast');

                }, function (evt) {

                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);

                });

            } else {

                $rootScope.showToast("Please select valid template", 'error-toast', 'top center')
            }

        };


        function getposx(shape) {

            switch (shape) {
                case "circle":
                    return "40";
                    break;
                case "triangle":
                    return "80";
                    break;
                case "trapezoid":
                    return "120";
                    break;
                case "parallelogram":
                    return "160";
                    break;
                case "rhombus":
                    return "200";
                    break;
                case "pentagon":
                    return "240";
                    break;
                case "hexagon":
                    return "280";
                    break;
                case "star":
                    return "320";
                    break;
                default:
                    return "0"
            }
        }

    }]);