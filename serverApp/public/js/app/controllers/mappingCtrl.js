//import { calendarFormat } from "../../../../../../../.cache/typescript/2.6/node_modules/@types/moment-timezone";

app.controller('mappingCtrl', ['$scope', '$rootScope', '$http', '$mdDialog', '$state', '$mdSidenav', 'Upload', '$timeout', function ($scope, $rootScope, $http, $mdDialog, $state, $mdSidenav, Upload, $timeout) {

    $scope.makingAjaxCall = false;
    $scope.pageTitle = "Mapping Sensors to Seats";
    $scope.back = 'layout';
    $scope.next = 'buMapping';
    $scope.showlayout = false;
    $scope.addseatflag = true;
    $rootScope.seatlist = [];

    $scope.hidden = false;
    $scope.isOpen = false;
    $scope.hover = false;
    $scope.query = {
        order: 'name',
        limit: 5,
        page: 1
    };

    $scope.selected = [];
    $scope.$watch('selected', function (newVal, oldVal) {

        var hid = $scope.seatobj.hostId
        var fid = $scope.seatobj.floorId

        $http.get('/app/api/getseats', { params: { hostId: hid, floorId: fid } }).then(function (response) {
            $scope.seats = response.data.document;
            console.log($scope.selected);
            for (var i = 0; i < $scope.seats.length; i++) {
                //  console.log($scope.seats[i]._id);
                if ($scope.seats[i]._id == newVal[0]) {
                    console.log($scope.seats[i])
                    $scope.seats[i].posX = '600';
                    $scope.seats[i].posY = '0';
                    console.log($scope.seats[i])
                }
            }
        });
    }, true);




    $scope.getCSSClass = function (seat) {

        if (seat.class) {
            return seat.class
        } else {
            return 'seat';
        }
    }

    $scope.onPaginate = function (page, limit) {

        $scope.promise = $timeout(function () {

        }, 2000);
    };

    $scope.onReorder = function (order) {

        $scope.promise = $timeout(function () {

        }, 2000);
    };


    $scope.toggleLimitOptions = function () {
        $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
    };

    $scope.options = {
        rowSelection: true,
        multiSelect: false,
        autoSelect: true,
        decapitate: false,
        largeEditDialog: false,
        boundaryLinks: false,
        limitSelect: true,
        pageSelect: true
    };

    $scope.$watch('isOpen', function (isOpen) {
        if (isOpen) {
            $timeout(function () {
                $scope.tooltipVisible = $scope.isOpen;
            }, 600);
        } else {
            $scope.tooltipVisible = $scope.isOpen;
        }
    });

    $scope.items = [
        { name: "Save Seats", type: "Seats", direction: "top", icon: "event_seat" },
        { name: "Save Rooms", type: "Rooms", direction: "top", icon: "people" }

    ];

    $scope.openDialog = function ($event, item) {
        if ($scope.seatobj.hostId) {

            if (item === "Seats") {
                $scope.UpdateAllSeats();
            } else {
                $scope.UpdateAllRooms();
            }

        } else {

            $rootScope.showToast("Please select Floor and Host to Update " + item, 'success-toast', 'top center')
        }
    };


    function onload() {

        if (localStorage.getItem('id')) {

            $scope.seatobj = {};
            $scope.roomobj = {};
            $scope.buobj = {};
            $scope.bulist = [];

            $http.get('/app/api/getBuildingbyId', { params: { id: localStorage.getItem('id') } }).then(function (response) {

                $rootScope.building = response.data;
                $scope.building_details = $rootScope.building;
                $scope.selectedbulding = $rootScope.building;

                $http.get('/app/api/getfloors', { params: { fids: $rootScope.building.floors } }).then(function (response) {
                    console.log(response);
                    $scope.floors = response.data;
                    console.log($scope.selectedfloor);
                    if ($scope.selectedfloor && $scope.selectedfloor.id && $scope.selectedfloor.sections && $scope.selectedfloor.sections.length > 0) {
                        console.log($scope.selectedfloor);
                        $http.get('/app/api/getBUs', { params: { floorId: $scope.selectedfloor.id } }).then(function (response) {
                            console.log(response);
                            // $scope.selectedfloor = response.data.floor;
                            $scope.bulist = response.data.bulist;
                            $scope.flo = response.data.floor;
                        })
                    }

                }, function (err) {

                    $rootScope.showToast(err.data.err, 'error-toast');
                });

            }, function (err) {
                $rootScope.showToast(err.data.err, 'error-toast');
            })

            $http.get('/app/api/seatconfig').then(function (seatconfig) {
                console.log(seatconfig);
                $scope.seatsetting = seatconfig.data;
                $scope.size = (($scope.seatsetting.size) ? $scope.seatsetting.size : null);

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
                //console.log('confirm');
                $state.go('commission.index');

            }, function () {
                $state.go('commission.index');
            });
        }

    };

    onload();

    $scope.toggleLeft = function () {
        $mdSidenav('sidenav-left').toggle()
    }

    $scope.OnFloorChange = function (floor) {

        console.log(floor);
        $scope.ht = {};
        $scope.showlayout = true;
        $scope.selectedfloor = floor;
        console.log($scope.selectedfloor);
        var bid = $scope.selectedbulding.id;
        var fid = $scope.selectedfloor._id;

        $scope.seatobj.floorId = fid;
        $scope.seatobj.hostId = undefined;
        $scope.roomobj.floorId = fid;
        $scope.roomobj.hostId = undefined;
        $scope.buobj.floorId = fid;

        $http.get('/app/api/gethosts', { params: { buildingId: bid, floorId: fid } }).then(function (response) {
            console.log(response);
            $scope.hosts = response.data;
            if ($scope.selectedfloor._id) {
                $http.get('/app/api/getBUs', { params: { floorId: $scope.selectedfloor._id } }).then(function (response) {
                    console.log(response);
                    // $scope.selectedfloor = response.data.floor;
                    $scope.bulist = response.data.bulist;
                })
            }

        }, function (err) {

            $rootScope.showToast(err.data.err, 'error-toast');

        });

    };

    $scope.OnhostChange = function (host) {

        if (host) {
            $scope.selectedhost = JSON.parse(host);
            $scope.seatobj.hostId = $scope.selectedhost.id;
            $scope.roomobj.hostId = $scope.selectedhost.id;
            $scope.buobj.hostId = $scope.selectedhost.id;
            console.log($scope.seatobj)
            $scope.GetSeats();
            $scope.GetRooms();


        }

    };


    $scope.seat = {};
    $scope.seats = [];

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


    $scope.showroomPopover = function (ev, room) {
        $scope.selectedRoom = room

        $mdDialog.show({
            templateUrl: 'template/room-dialog',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true,
            hasBackdrop: false
        })

    };
    $scope.choosetemplate = function () {

        if ($scope.seatobj.hostId && $scope.size) {
            $mdDialog.show({
                templateUrl: 'template/fileupload',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                scope: $scope,
                preserveScope: true,
                hasBackdrop: false
            })
        } else if (!$scope.seatobj.hostId) {

            $rootScope.showToast("Please select Floor and Host to add Seat", 'success-toast', 'top center')
        } else {
            $rootScope.showToast("Please Enter Size", 'success-toast', 'top center')
        }

    }

    $scope.addseat = function () {

        $scope.seatobj.name = "";
        $scope.seatobj.address = "";
        if ($scope.seatobj.hostId && $scope.size) {
            $mdDialog.show({
                templateUrl: 'template/addseat',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                scope: $scope,
                preserveScope: true,
                hasBackdrop: false
            })
        } else if (!$scope.seatobj.hostId) {

            $rootScope.showToast("Please select Floor and Host to add Seat", 'success-toast', 'top center')
        } else {
            $rootScope.showToast("Please Enter Size", 'success-toast', 'top center')
        }

    };

    $scope.addbu = function () {

        $scope.buobj.name = "";
        $scope.buobj.address = "";
        if ($scope.buobj.floorId) {
            $mdDialog.show({
                templateUrl: 'template/addbu',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                scope: $scope,
                preserveScope: true,
                hasBackdrop: false
            })
        } else if (!$scope.seatobj.hostId) {

            $rootScope.showToast("Please select Floor add BU", 'success-toast', 'top center')
        } else {
            $rootScope.showToast("Please Enter Size", 'success-toast', 'top center')
        }

    };

    $scope.addroom = function () {

        $scope.roomobj.name = "";
        $scope.roomobj.address = "";
        $scope.roomobj.capacity = "";
        if ($scope.roomobj.hostId) {
            $mdDialog.show({
                templateUrl: 'template/addroom',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                scope: $scope,
                preserveScope: true,
                hasBackdrop: false
            })
        } else {

            $rootScope.showToast("Please select Floor and Host to add Room", 'success-toast', 'top center')
        }

    };

    $scope.addseatsettiongs = function () {

        $mdDialog.show({
            templateUrl: 'template/seatsettings',
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true,
            hasBackdrop: false
        })

    };

    $scope.done = function () {

        $mdDialog.hide();

    };


    $scope.SaveSeat = function (seatdetails, form) {

        console.log(form);
        if (form.$valid) {

            seatdetails.height = $scope.size;
            seatdetails.width = $scope.size;
            seatdetails.class = (($scope.seatsetting.type == "Circular") ? 'block' : 'seat');
            $http.post('/app/api/saveseat', seatdetails).then(function (response) {

                $scope.makingAjaxCall = false;
                if (response.data.status) {
                    $scope.GetSeats();
                    $scope.done();
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                } else {
                    $rootScope.showToast(response.data.msg, 'error-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })
        } else {

            $rootScope.showToast("Please fill required fields", 'error-toast', 'top center')
        }

    };

    $scope.UploadSeats = function (sheet, form) {

        if (form.$valid) {
            var seattype = (($scope.seatsetting.type == "Circular") ? 'block' : 'seat');
            Upload.upload({
                url: '/app/api/uploadseats/' + $scope.seatobj.floorId + '/' + $scope.seatobj.hostId,
                data: { file: sheet[0], 'data': { size: $scope.size, buid: $scope.building_details.id, seattype: seattype } }
            }).then(function (resp) {
                console.log(resp);
                $scope.GetSeats();
                $scope.done();
                $rootScope.showToast(resp.data.msg, 'success-toast');

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

    $scope.creatseats = function (nof) {
        if (nof) {
            if ($scope.seatobj.hostId && $scope.size) {
                var seatlist = [];
                nof = parseInt(nof);
                for (var i = 1; i <= nof; i++) {
                    var seatnumber = $scope.seats.length + i;
                    var seatobject = { name: "Seat" + seatnumber, address: seatnumber };
                    seatlist.push(seatobject);
                }
                var seattype = (($scope.seatsetting.type == "Circular") ? 'block' : 'seat');

                $http.post('/app/api/creatseats/' + $scope.seatobj.floorId + '/' + $scope.seatobj.hostId,
                    { data: { size: $scope.size, buid: $scope.building_details.id, list: seatlist, seattype: seattype } }).then(function (response) {
                        console.log(response);
                        if (response.data.status) {
                            $scope.GetSeats();
                            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                        } else {
                            $rootScope.showToast(response.data.msg, 'error-toast', 'top center');
                            var noerrors = [{ Error: "No Errors" }]
                            var data1 = ((response.data.err.dupseatsindb.length > 0) ? response.data.err.dupseatsindb : noerrors);
                            var data2 = ((response.data.err.dupaddressindb.length > 0) ? response.data.err.dupaddressindb : noerrors);
                            var data3 = ((response.data.err.seataddressdups.length > 0) ? response.data.err.seataddressdups : noerrors);
                            var data4 = ((response.data.err.seatnamedups.length > 0) ? response.data.err.seatnamedups : noerrors);
                            console.log(data1);
                            var opts = [{ sheetid: 'Seats Duplication', header: true }, { sheetid: 'Address Duplication', header: true }];

                            function exporJsontData() {
                                // console.log('calling export');
                                alasql('SELECT INTO XLSX("ErrorLogs.xlsx",?) FROM ?', [opts, [data1, data2]]);
                                // alasql("SELECT * INTO CSV('names.xlsx',{headers:true}) FROM ?", [data1]);
                            }
                            exporJsontData();
                        }
                    }, function (err) {

                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                    })

            } else if (!$scope.seatobj.hostId) {

                $rootScope.showToast("Please select Floor and Host to add Seat", 'success-toast', 'top center');

            } else {
                $rootScope.showToast("Please configure seat Size and type in settings", 'success-toast', 'top center')
            }


        } else {
            $rootScope.showToast("Please No. of Seat to be added", 'success-toast', 'top center');
        }

    };

    $scope.SaveRoom = function (roomdetails) {

        roomdetails.isRoom = true;
        $http.post('/app/api/saveroom', roomdetails).then(function (response) {

            if (response.data.status) {
                $scope.GetRooms();
                $scope.done();
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            } else {
                $rootScope.showToast(response.data.msg, 'error-toast', 'top center')
            }
        }, function (err) {

            $rootScope.showToast(err.data.err, 'error-toast', 'top center')

        })

    };

    $scope.SaveBu = function (roomdetails) {

        checkforduplicates(roomdetails, $scope.bulist, function (status) {
            if (status) {
                $rootScope.showToast('BU already exists for selected floor', 'success-toast', 'top center')
            } else {

                $http.post("/app/api/addBu", { bu: roomdetails.name, floorId: $scope.buobj.floorId }).then(function (response) {
                    $scope.blur_content = false;
                    onload();
                    $mdDialog.hide();
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function (err) {
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                })
            }
        })
    }


    $scope.GetSeats = function () {

        var hid = $scope.seatobj.hostId
        var fid = $scope.seatobj.floorId

        $http.get('/app/api/getseats', { params: { hostId: hid, floorId: fid } }).then(function (response) {

            $scope.seats = response.data.document;

            console.log($scope.seats);

            if ($scope.seats.length === 0) {
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            }

        }, function (err) {

            $rootScope.showToast(err.data.err, 'error-toast', 'top center')

        })
    };


    $scope.GetRooms = function () {

        var hid = $scope.seatobj.hostId
        var fid = $scope.seatobj.floorId


        $http.get('/app/api/getrooms', { params: { hostId: hid, floorId: fid } }).then(function (response) {

            $scope.rooms = response.data.document;
            console.log($scope.rooms);

            if ($scope.rooms.length === 0) {
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            }

        }, function (err) {

            $rootScope.showToast(err.data.err, 'error-toast', 'top center')

        })

    };


    $scope.UpdateSeat = function () {

        $scope.makingAjaxCall = true;
        if ($scope.size) {
            $scope.selectedSeat.height = $scope.size;
            $scope.selectedSeat.width = $scope.size;
        }
        $scope.selectedSeat.class = (($scope.seatsetting.type == "Circular") ? 'block' : 'seat');
        $http.put('/app/api/UpdateSeat', $scope.selectedSeat).then(function (response) {

            $scope.makingAjaxCall = false;
            if (response.data.status) {
                $scope.GetSeats();
                $scope.done();
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
            $scope.done();
            $scope.makingAjaxCall = false;
            $rootScope.showToast(response.data, 'success-toast', 'top center')
        }, function (err) {
            $scope.makingAjaxCall = false;
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })

    };

    $scope.UpdateAllSeats = function () {

        if ($scope.seats && $scope.seats.length > 0) {
            $scope.makingAjaxCall = true;
            $http.put('/app/api/UpdateAllSeats', { seats: $scope.seats }).then(function (response) {

                console.log(response);
                if (response.data.seats.length > 0) {
                    $scope.seats = response.data.seats;
                } else {
                    $scope.GetSeats();
                }
                $scope.done();
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

    $scope.UpdateRoom = function () {

        $scope.makingAjaxCall = true;
        /*  if ($scope.size) {
             $scope.selectedRoom.height = $scope.size;
             $scope.selectedRoom.width = $scope.size;
         } */
        $http.put('/app/api/UpdateRoom', $scope.selectedRoom).then(function (response) {
            $scope.makingAjaxCall = false;
            if (response.data.status) {
                $scope.GetRooms();
                $scope.done();
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            } else {
                $rootScope.showToast(response.data.msg, 'error-toast', 'top center')
            }
        }, function (err) {
            $scope.makingAjaxCall = false;
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })

    };

    $scope.RemoveRoom = function () {

        $scope.makingAjaxCall = true;
        $http.put('/app/api/RemoveRoom', $scope.selectedRoom).then(function (response) {

            $scope.GetRooms()
            $scope.done();
            $scope.makingAjaxCall = false;
            $rootScope.showToast(response.data, 'success-toast', 'top center')
        }, function (err) {
            $scope.makingAjaxCall = false;
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })

    };

    $scope.UpdateAllRooms = function () {

        if ($scope.rooms && $scope.rooms.length > 0) {
            $scope.makingAjaxCall = true;
            $http.put('/app/api/UpdateAllRooms', { rooms: $scope.rooms }).then(function (response) {

                if (response.data.rooms.length > 0) {
                    $scope.rooms = response.data.rooms;
                } else {
                    $scope.GetRooms();
                }
                $scope.done();
                $scope.makingAjaxCall = false;

                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            }, function (err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        } else {
            $rootScope.showToast("No Rooms to update", 'error-toast', 'top center')
        }
    };


    $scope.Saveseatsetting = function () {

        console.log($scope.seatsetting);
        $scope.makingAjaxCall = true;
        $http.put('/app/api/updatesettings', $scope.seatsetting).then(function (response) {

            onload();
            $scope.done();
            $scope.makingAjaxCall = false;
            $rootScope.showToast("Setting saved successfully", 'success-toast', 'top center')
        }, function (err) {
            $scope.makingAjaxCall = false;
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })

    };

    $scope.SendToHost = function () {

        $scope.makingAjaxCall = true;

        var finalbodytohost = {}

        if ($scope.roomobj.hostId) {


            finalbodytohost.hostName = $scope.selectedhost.name;
            finalbodytohost.floorConfig = {
                "layout": $scope.selectedfloor.layout,

                "name": $scope.selectedfloor.name
            };

            finalbodytohost.buildingName = $scope.selectedbulding.name;

            finalbodytohost.seatConfig = [];
            finalbodytohost.roomConfig = [];


            for (var i = 0; i < $scope.seats.length; i++) {

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


    };

    function checkforduplicates(bu, bulist, callback) {
        var status = false;
        for (var i = 0; i < bulist.length; i++) {
            if (bulist[i].name == bu.name) {
                status = true;
                break;
            }
        }
        callback(status);
    };

}])