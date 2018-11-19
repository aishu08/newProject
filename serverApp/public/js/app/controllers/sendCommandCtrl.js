app.controller('sendCommandCtrl', ['$scope', '$rootScope', '$mdDialog', '$http', function($scope, $rootScope, $mdDialog, $http) {
    console.log("herererere");
    // $scope.makingAjaxCall = false;
    $http.get('app/api/getbuildings').then(function(response) {
        $scope.buildings = response.data
        console.log(response.data)

    })





    function enforce_maxlength(event) {
        var t = event.target;
        if (t.hasAttribute('maxlength')) {
            t.value = t.value.slice(0, t.getAttribute('maxlength'));
        }
    }

    // Global Listener for anything with an maxlength attribute.
    // I put the listener on the body, put it on whatever.
    document.body.addEventListener('input', enforce_maxlength);
    $scope.lightTemperature = [{ status: "warm" }, { status: "cold" }]
    $scope.Getlights = function() {
        var fid = $scope.selectedfloor._id;
        $scope.makingAjaxCall = true;
        $http.get('/light/getTunLightsBle', { params: { floorId: fid } }).then(function(response) {
            $scope.makingAjaxCall = false;
            $scope.lights = response.data.document;
            console.log("lightssss", $scope.lights)
            if ($scope.selectedsensor && $scope.selectedsensor.id) {
                $scope.GetSensors();
            }
            if ($scope.lights.length === 0) {
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            }

        }, function(err) {
            $rootScope.showToast(response.data.err, 'error-toast', 'top center')
        })
    };

    $scope.GetHosts = function() {


        // $http.get('/app/api/getcertificates', { params: { bname: $scope.selectedBuilding.name, fname: $scope.selectedfloor.name } }).then(function (response) {
        //     console.log(response);
        $scope.certificateslist = [];
        var fid = $scope.selectedfloor._id;
        var bid = $scope.selectedBuilding.id;
        $http.get('/app/api/gethosts', { params: { buildingId: bid, floorId: fid } }).then(function(response) {
            console.log(response);

            $scope.hosts = response.data;
            console.log($scope.selectedhost)
            if ($scope.selectedhost.name) {
                $scope.selection.host = $scope.selectedhost;

            }
            $scope.availablecerts = [];
            for (var i = 0; i < $scope.hosts.length; i++) {

                for (var j = 0; j < $scope.certificateslist.length; j++) {
                    if ($scope.hosts[i].certificates.crt === $scope.certificateslist[j].crt &&
                        $scope.hosts[i].certificates.pem === $scope.certificateslist[j].pem &&
                        $scope.hosts[i].certificates.ppk === $scope.certificateslist[j].ppk) {
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

        }, function(err) {

            $rootScope.showToast(err.data.err, 'error-toast');

        });

        // }, function (err) {

        //     $rootScope.showToast(err.data.err, 'error-toast');

        // });
    };

    $scope.GetSensors = function() {
        var fid = $scope.selectedfloor._id;
        $scope.makingAjaxCall = true;
        $http.get('/lightcommission/api/getsensors', { params: { floorId: fid } }).then(function(response) {
            $scope.makingAjaxCall = false;
            $scope.sensors = response.data.sensorlist;
            console.log(response);
            if ($scope.sensors.length === 0) {
                $rootScope.showToast("No sensors found for selected floor", 'success-toast', 'top center')
            }
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })
    };

    $scope.getTouchpanels = function() {
        var fid = $scope.selectedfloor._id;
        $scope.makingAjaxCall = true;
        $http.get('/light/getTouchPanelBles', { params: { floorId: fid } }).then(function(response) {
            $scope.makingAjaxCall = false;
            $scope.touchpanels = response.data.data;
            if ($scope.touchpanels.length === 0) {
                $rootScope.showToast("No sensors found for selected floor", 'success-toast', 'top center')
            }
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })
    }

    $scope.OnBuildingChange = function(building) {
        console.log("llll", building.id)
        $scope.selectedBuilding = building;
        $scope.buildingid = building.id
        $http.get('app/api/getfloors', { params: { fids: building.floors } }).then(function(response) {
            console.log("floorid", response.data)
            $scope.floors = response.data;
            $scope.floors.sort(function(a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });
        }, function(err) {
            console.log(err);
            $rootScope.showToast(err.data.err, 'error-toast');
        })

    }

    $scope.showPopover = function(ev, device, type) {
        // $scope.lightDetail.warm = [];
        // $scope.lightDetail.cool = [];
        console.log("testing")
        $scope.lightDetail = device;
        $scope.lightDetail.ble.forEach(function(bl) {
            if (bl.warmble == true) {
                $scope.lightDetail.warm = bl.address
            } else if (bl.coolble == true) {
                $scope.lightDetail.cool = bl.address
            }

        })

        console.log("device", device.ble)
            // device.bleAddress.forEach(function(address) {
            //     if ()
            // })
        $scope.selectedDeviceType = type;
        // $http.get('light/geTunAddress', { params: { ltid: device._id } }).then(function(response) {
        //     var lightaddress = response.data.document
        //     console.log("data1111", response.data.document)
        //         // lightaddress.forEach(function(addata) {
        //         //     addata.ble.forEach(function(abc) {
        //         //         console.log("add", abc)

        //     //     })



        //     // })
        //     // console.log("adddd", response.data.ble)

        // })

        $mdDialog.show({
            templateUrl: 'template/lightstatus.ejs',
            clickOutsideToClose: false,
            scope: $scope,
            targetEvent: ev,
            clickOutsideToClose: true,
            preserveScope: true
        });

    }

    $scope.OnFloorChange = function(floor) {
        $scope.showlayout = true;
        $scope.selectedfloor = floor;
        $scope.Getlights();
        $scope.GetSensors();
        $scope.GetHosts();
        $scope.getTouchpanels();
        $scope.selectedhost = {};
        $scope.selection.host = {};
    }

    $scope.submit = function() {

        console.log("scopevalue", $scope)
        var ad = [{ warm: $scope.lightDetail.warm }, { cool: $scope.lightDetail.cool }]
        var ltDetail = $scope.lightDetail
        console.log("addressss", ltDetail)
        $http.post('/sendcommand/lightAddress', { address: ad, flId: ltDetail.floorId, ltId: ltDetail._id }).then(function(response) {
            var res = response.data
            console.log("response", res)
            $mdDialog.hide();

        }, function(err) {

            $rootScope.showToast(err.data.err, 'error-toast');
        })
    }


    $scope.ping = function() {


        // if ($scope.checkbox1 && $scope.checkbox2) {
        //     console.log("herererererer")
        // } else {
        // console.log("ppppppp")
        // var sendData = $scope.checkbox1 ? $scope.address1 : $scope.address2
        // console.log(sendData)
        var cmd = "ADR"
        $http.post('light/sendCommandToDevice', { address: $scope.group, setIntensity: $scope.intensity, command: cmd, deviceType: "1" }).then(function(response) {
            console.log("response111", response)
            $mdDialog.hide();

        })
    }





    $scope.setIntensity = function() {
        console.log("intensity", $scope.group)

        // var pattern = "/^[a-zA-Z ]*$/"
        // if (patter) {
        //     console.log("ppppppppppppppp")
        //     $rootScope.showToast({ err: 'intensity should be between 0 and 99' }, 'error-toast', 'top center');
        // } else {
        // if ($scope.checkbox1 && $scope.checkbox2) {
        //     console.log("herererererer")
        // } else {
        // console.log("ppppppp")
        // var sendData = $scope.checkbox1 ? $scope.lightDetail.warm : $scope.lightDetail.cool
        console.log("setInetensity", $scope.intensity)
        var cmd = "ADSPL"
        $http.post('light/sendCommandToDevice', { address: $scope.group, setIntensity: $scope.intensity, command: cmd, deviceType: "1" }).then(function(response) {
            console.log("response222", response)
            $mdDialog.hide();
        })
    }



    $scope.cancel = function() {
        $mdDialog.hide();
    }






}]);
``