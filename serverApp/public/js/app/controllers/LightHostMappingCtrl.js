app.controller("LightHostMappingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog) {

        $scope.deviceType = '';
        $scope.selectedlights = [];
        $scope.dragselected = [];
        $scope.selected = {};
        $scope.closeDialog = function () {
            $scope.blur_content = false;
            $mdDialog.hide();

        }
        $scope.done = function () {
            $scope.closeDialog();
        }

        $scope.$watch('devices',function(){
            console.log($scope.devices)
        })

        $scope.onDeviceChange = function(deviceType){
            $scope.devices=[];
            if(deviceType == "light"){
                $scope.devices = $scope.lights;
            }else if(deviceType == "sensor"){
                $scope.devices = $scope.sensors;
            }else if(deviceType ==  "touch"){
                $scope.devices = $scope.touchpanels;
            } 
        }

        $scope.openDialog = function ($event, item) {
            if ($scope.selectedfloor && $scope.selectedfloor._id) {

                if (item === "Lights") {
                    $scope.MapAllLightsAndSensors();
                }
            } else {

                $rootScope.showToast("Please select Floor to Update " + item, 'success-toast', 'top center')
            }
        };

        $scope.items = [
            { name: "Save Mapping", type: "Lights", direction: "top", icon: "save" },
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
            $scope.Getlights();
            $scope.GetSensors();
            $scope.GetHosts();
            $scope.getTouchpanels();
            $scope.selectedhost = {};
            $scope.selection.host = {};
        }

        $scope.OnHostChange = function (host) {
            console.log(host);
            $scope.selectedhost = host;
            $scope.markHostassignedlightsandsensors();
        }


        $scope.GetHosts = function () {


            // $http.get('/app/api/getcertificates', { params: { bname: $scope.selectedBuilding.name, fname: $scope.selectedfloor.name } }).then(function (response) {
            //     console.log(response);
                $scope.certificateslist = [];
                var fid = $scope.selectedfloor._id;
                var bid = $scope.selectedBuilding.id;
                $http.get('/app/api/gethosts', { params: { buildingId: bid, floorId: fid } }).then(function (response) {
                    console.log(response);

                    $scope.hosts = response.data;
                    console.log($scope.selectedhost)
                    if ($scope.selectedhost.name) {
                        $scope.selection.host = $scope.selectedhost;

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

            // }, function (err) {

            //     $rootScope.showToast(err.data.err, 'error-toast');

            // });
        };

        $scope.Getlights = function () {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/light/getlights', { params: { floorId: fid } }).then(function (response) {
                $scope.makingAjaxCall = false;
                $scope.lights = response.data.document;
                if ($scope.selectedsensor && $scope.selectedsensor.id) {
                    $scope.GetSensors();
                }
                console.log($scope.lights);

                if ($scope.lights.length === 0) {
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };

        $scope.getTouchpanels = function(){
            var fid  = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/light/getTouchPanelBle',{ params: { floorId: fid } }).then(function (response) {
                $scope.makingAjaxCall = false;
                
                $scope.touchpanels = response.data.data;

                if ($scope.touchpanels.length === 0) {
                    $rootScope.showToast("No sensors found for selected floor", 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })
        }

        $scope.GetSensors = function () {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/lightcommission/api/getsensors', { params: { floorId: fid } }).then(function (response) {
                $scope.makingAjaxCall = false;
                $scope.sensors = response.data.sensorlist;
                console.log(response);
               


                if ($scope.sensors.length === 0) {
                    $rootScope.showToast("No sensors found for selected floor", 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };

        $scope.toggleselection = function (event, selectedobj) {
                if (!$scope.selectedhost || !$scope.selectedhost.id) {
                    $rootScope.showToast("Please select Host", 'error-toast', 'top center')
                } else {
                    selectedobj.selected = !selectedobj.selected;
                    if (selectedobj.selected) {

                        var finallightsforupdate = [];
                        var finallightsensorsforupdate = [];
                        angular.forEach($scope.lights, function (item, index) {

                            if (item["selected"] === true) {
                                finallightsforupdate.push(item);
                            }
                        });
                        angular.forEach($scope.lights, function (item, index) {

                            if (item["selected"] === true) {
                                finallightsensorsforupdate.push(item);
                            }
                        });

                        var totaldevicecount = finallightsforupdate.length + finallightsensorsforupdate.length;
                        if (totaldevicecount > 700) {

                            var confirm = $mdDialog.confirm()
                                .title('Mapping for a Host is limited to 700')
                                .textContent('We cannot map more than 700 device per Host.')
                                .ariaLabel('confirmation')
                                .targetEvent()
                                .ok('OK');


                            $mdDialog.show(confirm).then(function () {

                                selectedobj.selected = !selectedobj.selected;

                            }, function () {
                                selectedobj.selected = !selectedobj.selected;
                            });

                        } else {
                            $http.put('/lightcommission/api/checkMappingwithotheHost', { ids: [selectedobj._id],fid:$scope.selectedfloor._id, hid: $scope.selectedhost.id }).then(function (response) {

                                console.log(response);
                                if (response.data.status) {
                                    var confirm = $mdDialog.confirm()
                                        .title('Selected device is already mapped to other Host')
                                        .textContent('We cannot map same device for two different Hosts.')
                                        .ariaLabel('confirmation')
                                        .targetEvent()
                                        .ok('OK');


                                    $mdDialog.show(confirm).then(function () {

                                        selectedobj.selected = !selectedobj.selected;

                                    }, function () {
                                        selectedobj.selected = !selectedobj.selected;
                                    });
                                }

                                $scope.makingAjaxCall = false;


                            }, function (err) {
                                $scope.makingAjaxCall = false;
                                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                            })
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
            } else if($scope.deviceType == ""){
                $rootScope.showToast("Please select device type to map", 'error-toast', 'top center')
            }else {
                if (selected.length > 0) {
                    $scope.dragselected = selected;

                    angular.forEach($scope.dragselected, function (selecteditem, index) {
                        // angular.forEach($scope.lights, function (item, index) {
                        //     if (selecteditem._id == item._id) { item["selected"] = true; }
                        // })
                        if($scope.deviceType == "light"){
                            angular.forEach($scope.lights, function (item, index) {
                                if (selecteditem._id == item._id) { item["selected"] = true; }
                            })
                        }else if($scope.deviceType == "sensor"){
                            angular.forEach($scope.sensors, function (item, index) {
                                if (selecteditem._id == item._id) {console.log(selecteditem); item["selected"] = true; }
                            })
                        }else if($scope.deviceType == "touch"){
                            angular.forEach($scope.touchpanels, function (item, index) {
                                if (selecteditem._id == item._id) { item["selected"] = true; }
                            })
                        }
                    })

                    var finallightsforupdate = [];
                    var finallightsensorsforupdate = [];
                    var ids = [];
                    angular.forEach($scope.lights, function (item, index) {

                        if (item["selected"] === true) {
                            finallightsforupdate.push(item);
                            ids.push(item._id);
                        }
                    });

                    angular.forEach($scope.sensors, function (item, index) {

                        if (item["selected"] === true) {
                            finallightsensorsforupdate.push(item);
                            ids.push(item._id);
                        }
                    });
                    var totaldevicecount = finallightsforupdate.length + finallightsensorsforupdate.length;
                    if (totaldevicecount > 700) {

                        var confirm = $mdDialog.confirm()
                            .title('Mapping for a Host is limited to 700')
                            .textContent('We cannot map more than 700 device per Host.')
                            .ariaLabel('confirmation')
                            .targetEvent()
                            .ok('OK');


                        $mdDialog.show(confirm).then(function () {
                            $scope.markHostassignedlightsandsensors();

                        }, function () {
                            $scope.markHostassignedlightsandsensors();
                        });

                    } else {

                        $http.put('/lightcommission/api/checkMappingwithotheHost', { ids: ids,fid:$scope.selectedfloor._id, hid: $scope.selectedhost.id }).then(function (response) {

                            console.log(response);
                            if (response.data.status) {

                                var confirm = $mdDialog.confirm()
                                    .title('Selected device is already mapped to other Host')
                                    .textContent('We cannot map same device for two different Hosts.')
                                    .ariaLabel('confirmation')
                                    .targetEvent()
                                    .ok('OK');



                                $mdDialog.show(confirm).then(function () {

                                    //  $scope.dragselected.push(seat);
                                    $scope.dragselected = [];
                                    $scope.markHostassignedlightsandsensors();
                                }, function () {
                                    $scope.dragselected = [];
                                    $scope.markHostassignedlightsandsensors();
                                });
                            }

                            $scope.makingAjaxCall = false;


                        }, function (err) {
                            $scope.makingAjaxCall = false;
                            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                        })
                    }

                } else {
                    $scope.markHostassignedlightsandsensors();
                }
            }
        }


        $scope.markHostassignedlightsandsensors = function () {
            $scope.selectedlights = [];
            for (var k = 0; k < $scope.lights.length; k++) {
                $scope.lights[k].selected = false;
            }

            for (var j = 0; j < $scope.lights.length; j++) {

                if ($scope.lights[j].hostId == $scope.selectedhost.id) {
                    $scope.lights[j].selected = true;

                }
            }

            for (var k = 0; k < $scope.sensors.length; k++) {
                $scope.sensors[k].selected = false;
            }

            for (var j = 0; j < $scope.sensors.length; j++) {
                if ($scope.sensors[j].hostId == $scope.selectedhost.id) {
                    $scope.sensors[j].selected = true;
                }
            }
            for (var k = 0; k < $scope.touchpanels.length; k++) {
                $scope.touchpanels[k].selected = false;
            }
            for (var j = 0; j < $scope.touchpanels.length; j++) {
                if ($scope.touchpanels[j].hostId == $scope.selectedhost.id) {
                    $scope.touchpanels[j].selected = true;
                }
            }
        }



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

            if (hostform.$valid) {
                hostobj.buildingId = $scope.selectedBuilding.id;
                hostobj.floorId = $scope.selectedfloor._id;
                $http.post('/light/createHost', hostobj).then(function (response) {
                    console.log(response);
                    $scope.closeDialog();
                    $scope.GetHosts();
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

                $http.post('/light/updateHost', hostobj).then(function (response) {
                    console.log(response);
                    $scope.closeDialog();
                    $scope.selectedhost = response.data.host;
                    $scope.GetHosts();
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function (err) {

                    $rootScope.showToast(err.data, 'error-toast', 'top center')

                })
            } else {
                $rootScope.showToast("Please fill required fields", 'error-toast', 'top center')
            }
        }

        $scope.MapAllLightsAndSensors = function () {

            var finallightsforupdate = [];
            var finallightsensorsforupdate = [];
            var finaltouchpanlesforupdate = [];
            angular.forEach($scope.lights, function (item, index) {

                if (item["selected"] === true) {
                    finallightsforupdate.push(item);

                }
            });

            angular.forEach($scope.sensors, function (item, index) {

                if (item["selected"] === true) {
                    finallightsensorsforupdate.push(item);

                }
            });
            angular.forEach($scope.touchpanels, function (item, index) {

                if (item["selected"] === true) {
                    finaltouchpanlesforupdate.push(item);

                }
            });

            $scope.makingAjaxCall = true;
            $http.put('/light/MapDevciesWithHost',
                { lights: finallightsforupdate, sensors: finallightsensorsforupdate,touchpanels:finaltouchpanlesforupdate, hid: $scope.selectedhost.id }).then(function (mapping) {

                    $http.get('/light/getlights', { params: { floorId: $scope.selectedfloor._id } }).then(function (lights) {

                        $scope.lights = lights.data.document;
                        $http.get('/lightcommission/api/getsensors', { params: { floorId: $scope.selectedfloor._id } }).then(function (response) {
                            
                            $scope.sensors = response.data.sensorlist;
                            $http.get('/light/getTouchPanelBle',{ params: { floorId: $scope.selectedfloor._id } }).then(function (response) {
                                $scope.touchpanels = response.data.data;
                                $scope.makingAjaxCall = false;
                                $scope.markHostassignedlightsandsensors();
                                $rootScope.showToast(mapping.data.msg, 'success-toast', 'top center')
                                
                            }, function (err) {
                
                                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                
                            })
                          
                        }, function (err) {

                            $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                        })

                    }, function (err) {

                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                    })


                }, function (err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                })
        }


        $scope.SendLightsToHost = function () {

            $scope.makingAjaxCall = true;

            getmappedlightsandsensors(function () {
                var finalbodytohost = {}

                if ($scope.selectedfloor._id) {


                    finalbodytohost.hostName = $scope.selectedhost.name;
                    finalbodytohost.host = $scope.selectedhost;
                    finalbodytohost.floorConfig = {
                        "layout": $scope.selectedfloor.layout,

                        "name": $scope.selectedfloor.name
                    };

                    finalbodytohost.buildingName = $scope.selectedBuilding.name;

                    finalbodytohost.lightConfig = [];
                    finalbodytohost.lightSensorConfig = [];


                    for (var i = 0; i < $scope.lights.length; i++) {
                        if ($scope.lights[i].selected) {
                            var obj = {
                                "rotate": $scope.lights[i].rotate,
                                "name": $scope.lights[i].name,
                                "width": $scope.lights[i].width,
                                "class": $scope.lights[i].class,
                                "height": $scope.lights[i].height,
                                "posx": $scope.lights[i].posX,
                                "posy": $scope.lights[i].posY,
                                "ble": $scope.lights[i].bleAddress,
                                "type": 8

                            }

                            finalbodytohost.lightConfig.push(obj);
                        }
                    }

                    for (var i = 0; i < $scope.sensors.length; i++) {
                        if ($scope.sensors[i].selected) {
                            var obj = {

                                "name": $scope.sensors[i].name,
                                "posx": $scope.sensors[i].posX,
                                "posy": $scope.sensors[i].posY,
                                "ble": $scope.sensors[i].bleAddress,
                                // "lights": getlights($scope.sensors[i].lightsensortobles.lights),
                                "type": 4

                            }

                            finalbodytohost.lightSensorConfig.push(obj);
                        }
                    }



                    console.log(finalbodytohost);

                    $http.post('/light/getHostDevices', { cloudConfig: finalbodytohost }).then(function (response) {

                            console.log(response);
                            
                            var data = response.data;
                            
                            if (typeof data === 'object') {
                                data = "text/json;charset=utf-8,"+JSON.stringify(data, undefined, 2);
                              }
                            var link = document.createElement("a");
                            link.download = $scope.selectedhost.name+".json";
                            link.href = "data:" + data;
                            link.click();
                          $scope.makingAjaxCall = false;

                        $rootScope.showToast("Host data downloaded successfully", 'success-toast', 'top center')

                    }, function (err) {
                        $scope.makingAjaxCall = false;
                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                    })

                } else {

                    $rootScope.showToast("Please select Floor and Host", 'success-toast', 'top center')
                }
            })
        };


        function getlights(array) {
            var lights = [];
            for (var i = 0; i < array.length; i++) {
                for (var k = 0; k < $scope.lights.length; k++) {
                    if (array[i] === $scope.lights[k]._id) {
                        var obj = {};
                        obj.light = $scope.lights[k].bles.address;
                        lights.push(obj)
                    }
                }
            }
            return lights;
        }

        function getmappedlightsandsensors(callback) {
            $scope.markHostassignedlightsandsensors();
            callback();
        }
    }])