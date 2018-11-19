app.controller("LightDeviceCreationCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    // '$location',
    '$transitions',
    '$http', '$mdDialog', 'Upload',
    function($scope, $rootScope, $cookies, $log, $state, $timout, $transitions, $http, $mdDialog, Upload) {
        $scope.deviceType = '';
        $scope.selectedlights = [];
        $scope.selected = {};
        $scope.closeDialog = function() {
            $scope.blur_content = false;
            $mdDialog.hide();

        }
        $scope.done = function() {
            $scope.closeDialog();
        }
        var leavingPageText = "You'll lose your changes if you leave";
        window.onbeforeunload = function() {
            // return leavingPageText;
            if (!confirm(leavingPageText + "\n\nAre you sure you want to leave this page  \n you`ll lose your changes if you leave?")) {
                event.preventDefault();
            }
        };

        // $scope.$on('$stateChangeStart', function(event, next, current) {
        //     if(!confirm(leavingPageText + "\n\nAre you sure you want to leave this page?")) {
        //         event.preventDefault();
        //     }
        // });
        $scope.$on('$destroy', function iVeBeenDismissed() {
            // say goodbye to your controller here
            // debugger;
            if (!confirm(leavingPageText + "\n\nAre you sure you want to leave this page  \n you`ll lose your changes if you leave?")) {
                event.preventDefault();
            }
        })

        $scope.getstyleobj = function(shape) {

            if (shape == 'rectangle') {
                var width = 30;
                var height = 15;
                $scope.rectstyobj = { width: width, height: height };
                return $scope.rectstyobj;
            } else {
                var width = 15;
                var height = 15;
                $scope.styobj = { width: width, height: height }
                return $scope.styobj;
            }
        }

        $scope.openDialog = function($event, item) {
            if ($scope.selectedfloor && $scope.selectedfloor._id) {

                if (item === "Lights") {
                    $scope.UpdateAllLights();
                }
            } else {

                $rootScope.showToast("Please select Floor to Update " + item, 'success-toast', 'top center')
            }
        };

        $scope.items = [
            { name: "Save Devices", type: "Lights", direction: "top", icon: "save" },
        ];

        $http.get('/app/api/getbuildings').then(function(response) {

            $scope.buildings = response.data;

        }, function(err) {

            $rootScope.showToast(err.data.err, 'error-toast');
        });

        $scope.OnBuildingChange = function(building) {
            console.log(building);
            $scope.selectedBuilding = building;
            $http.get('/app/api/getfloors', { params: { fids: building.floors } }).then(function(response) {
                $scope.floors = response.data;
                $scope.floors.sort(function(a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });
            }, function(err) {
                console.log(err);
                $rootScope.showToast(err.data.err, 'error-toast');
            });
        }

        $scope.OnFloorChange = function(floor) {
            console.log(floor);
            $scope.selectedfloor = floor;
            $scope.showlayout = true;
            $scope.Getlights();
            $scope.GetSensors();
            $scope.getTouchpanels();
        }
        $scope.$watch('devices', function() {
            console.log($scope.devices)
        })
        $scope.onDeviceChange = function(deviceType) {
            $scope.devices = [];
            debugger
            if (deviceType == "light") {
                $scope.devices = $scope.lights;
            } else if (deviceType == "sensor") {
                $scope.devices = $scope.sensors;
            } else if (deviceType == "touch") {
                $scope.devices = $scope.touchpanels;
            }
        }
        $scope.toggleselection = function(event, light) {

            if (event.ctrlKey) {

                if (light.selected) {
                    light.selected = !light.selected;
                    console.log(light);
                    for (var i = 0; i < $scope.selectedlights.length; i++) {
                        if (light._id == $scope.selectedlights[i]._id) {
                            $scope.selectedlights.splice(i, 1);
                        }
                    }
                } else {
                    light.selected = !light.selected;
                    for (var i = 0; i < $scope.selectedlights.length; i++) {
                        if (light._id == $scope.selectedlights[i]._id) {
                            $scope.selectedlights.splice(i, 1);
                        }
                    }
                    $scope.selectedlights.push(light);
                }
            }

        }

        $scope.selectionStart = function(event, ui, selected, list) {
            console.log("selectionStart");
            console.log(selected)
        };

        $scope.selectionStop = function(selected) {
            console.log("selectedionstop")
            console.log(selected)
            $scope.selectedlights = [];
            if (selected.length > 0) {
                angular.forEach(selected, function(selecteditem, index) {
                    if ($scope.deviceType == "light") {
                        angular.forEach($scope.lights, function(item, index) {
                            if (selecteditem._id == item._id) { item["selected"] = true; }
                        })
                    } else if ($scope.deviceType == "sensor") {
                        angular.forEach($scope.sensors, function(item, index) {
                            if (selecteditem._id == item._id) {
                                console.log(selecteditem);
                                item["selected"] = true;
                            }
                        })
                    } else if ($scope.deviceType == "touch") {
                        angular.forEach($scope.touchpanels, function(item, index) {
                            if (selecteditem._id == item._id) { item["selected"] = true; }
                        })
                    }
                })
                angular.forEach($scope.lights, function(item, index) {
                    if (item["selected"] === true) {
                        $scope.selectedlights.push(item);
                    };
                })
            } else {

                angular.forEach($scope.lights, function(item, index) {
                    item["selected"] = false;
                })
                angular.forEach($scope.sensors, function(item, index) {
                    item["selected"] = false;
                })
                angular.forEach($scope.touchpanels, function(item, index) {
                    item["selected"] = false;
                })
            }

        };

        $scope.Getlights = function() {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/light/getlights', { params: { floorId: fid } }).then(function(response) {
                $scope.makingAjaxCall = false;
                $scope.lights = response.data.document;
                console.log("lights", $scope.lights)
                if ($scope.selectedsensor && $scope.selectedsensor.id) {
                    $scope.GetSensors();
                }


                if ($scope.lights.length === 0) {
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }

            }, function(err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };


        $scope.GetSensors = function() {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/light/getsensorsWBles', { params: { floorId: fid } }).then(function(response) {
                $scope.makingAjaxCall = false;
                $scope.sensors = response.data.sensorlist;
                console.log($scope.selectedsensor);
                if ($scope.selectedsensor) {
                    for (var i = 0; i < $scope.sensors.length; i++) {
                        if ($scope.sensors[i].id == $scope.selectedsensor.id) {

                            $scope.markBuassignedseats();
                        }
                    }
                }


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
            $http.get('/light/getTouchPanelsWBles', { params: { floorId: fid } }).then(function(response) {
                $scope.makingAjaxCall = false;
                $scope.touchpanels = response.data.tplist;
                if ($scope.selectedtp) {
                    for (var i = 0; i < $scope.sensors.length; i++) {
                        if ($scope.touchpanels[i]._id == $scope.selectedtp._id) {
                            $scope.touchpanels[i].selected = true;
                            $scope.markSensorassignedlights();
                        }
                    }
                }


                if ($scope.touchpanels.length === 0) {
                    $rootScope.showToast("No sensors found for selected floor", 'success-toast', 'top center')
                }

            }, function(err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })
        }
        $scope.sensortypes = [{
                name: "Smart Occupancy Sensor",
                discription: "Smart Sensors",
                shape: "sos",
                shapename: "Triangle",
                id: "1"
            },
            {
                name: "Day Light Sensor",
                wattage: 32,
                shape: "dls",
                shapename: "dls",
                id: "2"
            }
        ];
        $scope.tptypes = [{
            name: "Touch Panel",
            shape: "touch-panel",
            shapename: "Hexahon",
            id: "1"
        }];
        $scope.addDevices = function(floors) {

            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $http.get('/lightcommission/api/getlighttypes').then(function(response) {
                    $scope.lighttypes = response.data;
                    $scope.lighttypes.sort(function(a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });

                    $scope.styobj = { width: "15", height: "15" }
                    $scope.tunstyobj = { width: "15", height: "15" }
                    $scope.rectstyobj = { width: "30", height: "15" }

                    $mdDialog.show({
                        templateUrl: 'includes/addLightDevices',
                        clickOutsideToClose: false,
                        scope: $scope,
                        preserveScope: true
                    }).then(function() {

                        $scope.blur_content = false;
                    }, function() {

                        $scope.blur_content = false;

                    });
                }, function(err) {
                    console.log(err);
                    $rootScope.showToast(err.data.err, 'error-toast');

                })
            } else {
                $rootScope.showToast("Please select floor to add lights", 'error-toast', 'top center')
            }
        };

        $scope.deviceTypes = [{
            'type': "Lights",
            "value": 'light'
        }, {
            'type': "Sensors",
            "value": 'sensor'
        }, {
            'type': "Touch Panels",
            "value": 'touch'
        }];

        $scope.deleteDevices = function(floors) {
            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $http.get('/lightcommission/api/getlighttypes').then(function(response) {
                    $scope.lighttypes = response.data;
                    $scope.lighttypes.sort(function(a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });

                    $scope.styobj = { width: "15", height: "15" }
                    $scope.tunstyobj = { width: "15", height: "15" }
                    $scope.rectstyobj = { width: "30", height: "15" }

                    $mdDialog.show({
                        templateUrl: 'includes/deleteLightDevices',
                        clickOutsideToClose: false,
                        scope: $scope,
                        preserveScope: true
                    }).then(function() {

                        $scope.blur_content = false;
                    }, function() {

                        $scope.blur_content = false;

                    });
                }, function(err) {
                    console.log(err);
                    $rootScope.showToast(err.data.err, 'error-toast');

                })
            } else {
                $rootScope.showToast("Please select floor to add lights", 'error-toast', 'top center')
            }
        }
        $scope.addsensors = function(floors) {
            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $scope.lighttypes = [{
                        name: "Smart Occupancy Sensor",
                        discription: "Smart Sensors",
                        shape: "sos",
                        shapename: "Triangle",
                        id: "1"
                    },
                    {
                        name: "Day Light Sensor",
                        wattage: 32,
                        shape: "dls",
                        shapename: "dls",
                        id: "2"
                    }
                ];
                $mdDialog.show({
                    templateUrl: 'template/addLightSensors',
                    clickOutsideToClose: false,
                    scope: $scope,
                    preserveScope: true
                }).then(function() {

                    $scope.blur_content = false;
                }, function() {

                    $scope.blur_content = false;

                });
            } else {
                $rootScope.showToast("Please select floor to add sensors", 'error-toast', 'top center')
            }
        };
        $scope.addTouchPanels = function(floors) {
            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $scope.lighttypes = [{
                    name: "Touch Panel",
                    shape: "touch-panel",
                    shapename: "Hexahon",
                    id: "1"
                }];
                $mdDialog.show({
                    templateUrl: 'template/addTouchPanels',
                    clickOutsideToClose: false,
                    scope: $scope,
                    preserveScope: true
                }).then(function() {

                    $scope.blur_content = false;
                }, function() {

                    $scope.blur_content = false;

                });
            } else {
                $rootScope.showToast("Please select floor to add touch panels", 'error-toast', 'top center')
            }
        }
        $scope.demolightshape = function(lighttype, form) {
            console.log("lighttype", lighttype)
            $scope.selected = {};
            $scope.selected.id = lighttype._id;
            $scope.selected.class = lighttype.shape;
            $scope.selected.width = ((lighttype.width && lighttype.width <= 45) ? lighttype.width : 45);
            $scope.selected.height = ((lighttype.height && lighttype.height <= 45) ? lighttype.height : 45);
            var width = ((lighttype.width) ? lighttype.width : 15);
            var height = ((lighttype.height) ? lighttype.height : 15);
            lighttype.styobj = { width: width, height: height };
        };
        $scope.demoTubLightShape = function(lighttype, form) {
            $scope.selected = {};
            $scope.selected.id = lighttype._id;
            console.log("lighttype", lighttype)
            $scope.selected.class = lighttype.shape;
            $scope.selected.width = ((lighttype.tunWidth && lighttype.tunWidth <= 45) ? lighttype.tunWidth : 45);
            $scope.selected.height = ((lighttype.tunHeight && lighttype.tunHeight <= 45) ? lighttype.tunHeight : 45);
            var width = ((lighttype.tunWidth) ? lighttype.tunWidth : 15);
            var height = ((lighttype.tunHeight) ? lighttype.tunHeight : 15);
            lighttype.tunstyobj = { width: width, height: height };
        };
        $scope.changeSensorShape = function(sensorType, form) {
            $scope.selected = {};
            $scope.selected.id = sensorType._id;
            $scope.selected.class = sensorType.shape;
            $scope.selected.width = ((sensorType.width && sensorType.width <= 45) ? sensorType.width : 45);
            $scope.selected.height = sensorType.width
            var width = ((sensorType.width) ? sensorType.width : 15);
            var height = width;
            sensorType.styobj = { width: width, height: height };
        }
        $scope.creatlights = function(lighttypes, form) {
            var lighttoadd = [];

            var nos = 0;
            if (form.$valid) {
                for (var i = 0; i < lighttypes.length; i++) {
                    if (lighttypes[i].selected) {
                        nos = nos + lighttypes[i].nos;
                        var posx = getposx(lighttypes[i].shape);
                        posx = parseInt(posx) + (60 * i);
                        var width;
                        var height;
                        if (lighttypes[i].shape == 'rectangle') {
                            width = ((lighttypes[i].width) ? lighttypes[i].width : 30);
                            height = ((lighttypes[i].height) ? lighttypes[i].height : 30);

                        } else {
                            width = ((lighttypes[i].width) ? lighttypes[i].width : 25);
                            height = ((lighttypes[i].height) ? lighttypes[i].height : 25);
                        }
                        var obj = { count: lighttypes[i].nos, lighttype: lighttypes[i].shape, wattage: lighttypes[i].wattage, width: width, height: height, posx: posx };
                        lighttoadd.push(obj);
                    }
                }
                if (nos <= 50) {
                    console.log($scope.selectedfloor._id);
                    console.log($scope.selectedBuilding.id);
                    $scope.buttonclicked = true;
                    $http.post('/light/createLights/' + $scope.selectedfloor._id, { buid: $scope.selectedBuilding.id, lightcount: lighttoadd }).then(function(response) {
                        $scope.closeDialog();
                        $scope.Getlights();
                        $scope.buttonclicked = false;
                    }, function(err) {

                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                    })
                } else {

                    $rootScope.showToast("You can add Maximum of 50 Lights at a time", 'error-toast', 'top center')
                }
            } else {
                $rootScope.showToast("Please fill the required fields", 'error-toast', 'top center')
            }
        }

        $scope.createSensors = function(sensorTypes, form) {
            var sensors = [];
            var nos = 0;
            if (form.$valid) {
                for (var i = 0; i < sensorTypes.length; i++) {
                    if (sensorTypes[i].nos) {
                        nos += sensorTypes[i].nos;
                        var posx = getposx(sensorTypes[i].shape);
                        var width;
                        var height;
                        width = ((sensorTypes[i].width) ? sensorTypes[i].width : 25);
                        height = width;
                        var obj = { count: sensorTypes[i].nos, type: sensorTypes[i].shape, width: width, height: height, posx: posx, posy: 0 };
                        sensors.push(obj);
                    }
                }
                if (nos <= 20) {
                    $scope.buttonclicked = true;
                    // $http.post('/lightcommission/api/creatlights/' + $scope.selectedfloor._id,
                    $http.post('/light/createSensorsWBles/' + $scope.selectedfloor._id, { buid: $scope.selectedBuilding.id, sensorsToAdd: sensors }).then(function(response) {
                        console.log(response);
                        $scope.closeDialog();
                        $scope.GetSensors();
                        $scope.buttonclicked = false;
                    }, function(err) {

                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                    })
                } else {
                    $rootScope.showToast("You can add Maximum of 20 Sensors at a time", 'error-toast', 'top center')
                }
            } else {
                $rootScope.showToast("Please fill the required fields", 'error-toast', 'top center')
            }
        }

        $scope.createTouchPanels = function(sensorTypes, form) {
            var sensors = [];
            var nos = 0;
            if (form.$valid) {
                for (var i = 0; i < sensorTypes.length; i++) {
                    if (sensorTypes[i].nos) {
                        nos += sensorTypes[i].nos;
                        var posx = getposx(sensorTypes[i].shape);
                        var width;
                        var height;
                        width = ((sensorTypes[i].width) ? sensorTypes[i].width : 25);
                        height = width;
                        var obj = { count: sensorTypes[i].nos, type: sensorTypes[i].shape, width: width, height: height, posx: posx, posy: 0 };
                        sensors.push(obj);
                    }
                }
                if (nos <= 20) {
                    $scope.buttonclicked = true;
                    // $http.post('/lightcommission/api/creatlights/' + $scope.selectedfloor._id,
                    $http.post('/light/createTPWBles/' + $scope.selectedfloor._id, { buid: $scope.selectedBuilding.id, sensorsToAdd: sensors }).then(function(response) {
                        console.log(response);
                        $scope.closeDialog();
                        $scope.getTouchpanels();
                        $scope.buttonclicked = false;
                    }, function(err) {

                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                    })
                } else {
                    $rootScope.showToast("You can add Maximum of 20 Sensors at a time", 'error-toast', 'top center')
                }
            } else {
                $rootScope.showToast("Please fill the required fields", 'error-toast', 'top center')
            }
        }
        $scope.deleteselectdevices = function(deleteform) {
            if (deleteform.selectedradio) {
                console.log($scope.deleteform.selectedradio);
                console.log(deleteform.selectedradio)
                $scope.closeDialog();
                $scope.deviceType = $scope.deleteform.selectedradio;
                if ($scope.deleteform.selectedradio == "light") {
                    $scope.devices = $scope.lights;
                } else if ($scope.deleteform.selectedradio == "sensor") {
                    $scope.devices = $scope.sensors;
                } else if ($scope.deleteform.selectedradio == "touch") {
                    $scope.devices = $scope.touchpanels;
                }
                $rootScope.showToast("Drag and select devices to proceed", 'success-toast', 'top center');
            } else {
                $scope.closeDialog();
                $rootScope.showToast("Please select the type of device to proceed", 'error-toast', 'top center');
            }
        }
        $scope.deleteform = {};
        // $scope.changedRadio = function(data){
        //     console.log(data)
        // }
        $scope.createdevices = function(lighttypes, sensorTypes, touchpanelTypes, form) {
            var lights = [];
            var tunLights = [];
            var sensors = [];
            var touchpanles = [];
            console.log("lighttypes", lighttypes)
            if (form.$valid) {
                lightnos = 0;
                for (var i = 0; i < lighttypes.length; i++) {
                    if (lighttypes[i].selected) {
                        lightnos = lightnos + lighttypes[i].nos;
                        var posx = getposx(lighttypes[i].shape);
                        console.log("posxxx", posx)
                        posx = parseInt(posx) + (60 * i);
                        console.log("pos11", posx)
                        var width;
                        var height;
                        if (lighttypes[i].shape == 'rectangle') {
                            width = ((lighttypes[i].width) ? lighttypes[i].width : 30);
                            height = ((lighttypes[i].height) ? lighttypes[i].height : 30);

                        } else {
                            width = ((lighttypes[i].width) ? lighttypes[i].width : 25);
                            height = ((lighttypes[i].height) ? lighttypes[i].height : 25);
                        }
                        var obj = { count: lighttypes[i].nos, lighttype: lighttypes[i].shape, wattage: lighttypes[i].wattage, width: width, height: height, posx: posx, isTunable: false };
                        lights.push(obj);
                        console.log("lights", lights)
                    }
                }
                for (var i = 0; i < lighttypes.length; i++) {
                    tunLightNos = 0;
                    if (lighttypes[i].tunSelected) {
                        tunLightNos = tunLightNos + lighttypes[i].tunNos;
                        var posx = getposx(lighttypes[i].shape);
                        console.log("inside tube posxxx", posx)
                        posx = (100 + parseInt(posx)) + (100 * i);
                        console.log("inside tube", posx)
                        var width;
                        var height;
                        if (lighttypes[i].shape == 'rectangle') {
                            width = ((lighttypes[i].tunWidth) ? lighttypes[i].tunWidth : 30);
                            height = ((lighttypes[i].tunHeight) ? lighttypes[i].tunHeight : 30);

                        } else {
                            width = ((lighttypes[i].tunWidth) ? lighttypes[i].tunWidth : 25);
                            height = ((lighttypes[i].tunHeight) ? lighttypes[i].tunHeight : 25);
                        }
                        var obj = { count: lighttypes[i].nos, lighttype: lighttypes[i].shape, wattage: lighttypes[i].wattage, width: width, height: height, posx: posx, isTunable: true };
                        tunLights.push(obj);
                        console.log("tunLights", tunLights)
                    }

                }
                for (var i = 0; i < sensorTypes.length; i++) {
                    sensornos = 0;
                    if (sensorTypes[i].nos) {
                        sensornos += sensorTypes[i].nos;
                        var posx = getposx(sensorTypes[i].shape);
                        var width;
                        var height;
                        width = ((sensorTypes[i].width) ? sensorTypes[i].width : 25);
                        height = width;
                        var obj = { count: sensorTypes[i].nos, type: sensorTypes[i].shape, width: width, height: height, posx: posx, posy: 0, timeout: sensorTypes[i].timeout };
                        sensors.push(obj);
                    }
                }
                for (var i = 0; i < touchpanelTypes.length; i++) {
                    tpnos = 0
                    if (touchpanelTypes[i].nos) {
                        tpnos += touchpanelTypes[i].nos;
                        var posx = getposx(touchpanelTypes[i].shape);
                        var width;
                        var height;
                        width = ((touchpanelTypes[i].width) ? touchpanelTypes[i].width : 25);
                        height = width;
                        // timeout = 
                        var obj = { count: touchpanelTypes[i].nos, type: touchpanelTypes[i].shape, width: width, height: height, posx: posx, posy: 0 };
                        touchpanles.push(obj);
                    }
                }
                if ((lightnos > 0 || tunLightNos > 0 || sensornos > 0 || tpnos > 0)) {
                    // if (lightnos <= 50) {
                    $scope.buttonclicked = true;
                    $http.post('/light/createDevices/' + $scope.selectedfloor._id, { buid: $scope.selectedBuilding.id, lightcount: lights, tunLightCount: tunLights, sensorcount: sensors, touchpanelcount: touchpanles }).then(function(response) {
                            $scope.closeDialog();
                            $scope.Getlights();
                            $scope.GetSensors();
                            $scope.getTouchpanels();
                            $scope.buttonclicked = false;
                        }, function(err) {

                            $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                        })
                        // } else {

                    //     $rootScope.showToast("You can add Maximum of 50 Lights at a time", 'error-toast', 'top center')
                    // }
                } else {
                    $rootScope.showToast("Please select atleast one type of device to create", 'error-toast', 'top center')
                }
            } else {
                $rootScope.showToast("Please fill the required fields", 'error-toast', 'top center')
            }
        }
        $scope.deletelights = function() {
            var confirm = $mdDialog.confirm()
                .title('Are you sure to delete selected Lights?')
                .textContent('Click OK to continue.')
                .ariaLabel('confirmation')
                .targetEvent()
                .ok('OK')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {

                $scope.RemoveSelectedLights();

            }, function() {
                $scope.selectedseats = [];
                $scope.selectionStop($scope.selectedseats);
            });
        }
        $scope.deletesensors = function() {
            var confirm = $mdDialog.confirm()
                .title('Are you sure to delete selected Lights?')
                .textContent('Click OK to continue.')
                .ariaLabel('confirmation')
                .targetEvent()
                .ok('OK')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {

                $scope.RemoveSelectedSensors();

            }, function() {
                $scope.selectedseats = [];
                $scope.selectionStop($scope.selectedseats);
            });
        }
        $scope.deleteTouchPanels = function() {
            var confirm = $mdDialog.confirm()
                .title('Are you sure to delete selected touch panels?')
                .textContent('Click OK to continue.')
                .ariaLabel('confirmation')
                .targetEvent()
                .ok('OK')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {

                $scope.RemoveSelectedTouchPanels();

            }, function() {
                $scope.selectedseats = [];
                $scope.selectionStop($scope.selectedseats);
            });
        }
        $scope.RemoveSelectedLights = function() {
            $scope.selectedlights = [];
            angular.forEach($scope.lights, function(item, index) {
                if (item["selected"] === true) {
                    $scope.selectedlights.push(item);
                };
            })

            $scope.makingAjaxCall = true;
            $http.put('/light/removeSelectedLights', { selectedlights: $scope.selectedlights }).then(function(response) {
                $scope.selectedlights = [];
                $scope.Getlights()
                $scope.closeDialog();
                $scope.makingAjaxCall = false;
                $rootScope.showToast(response.data, 'success-toast', 'top center')
            }, function(err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        };
        $scope.RemoveSelectedSensors = function() {
            $scope.selectedlights = [];
            angular.forEach($scope.sensors, function(item, index) {
                if (item["selected"] === true) {
                    $scope.selectedlights.push(item);
                };
            })

            $scope.makingAjaxCall = true;
            $http.put('/light/removeSelectedSensors', { selectedlights: $scope.selectedlights }).then(function(response) {
                $scope.selectedlights = [];
                $scope.Getlights();
                $scope.GetSensors()
                $scope.closeDialog();
                $scope.makingAjaxCall = false;
                $rootScope.showToast(response.data, 'success-toast', 'top center')
            }, function(err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        }

        $scope.RemoveSelectedTouchPanels = function() {
            $scope.selectedlights = [];
            angular.forEach($scope.touchpanels, function(item, index) {
                if (item["selected"] === true) {
                    $scope.selectedlights.push(item);
                };
            })

            $scope.makingAjaxCall = true;
            $http.put('/light/removeSelectedTPs', { selectedlights: $scope.selectedlights }).then(function(response) {
                $scope.selectedlights = [];
                $scope.Getlights();
                $scope.GetSensors();
                $scope.getTouchpanels();
                $scope.closeDialog();
                $scope.makingAjaxCall = false;
                $rootScope.showToast(response.data, 'success-toast', 'top center')
            }, function(err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        }

        $scope.showPopover = function(ev, light) {
            $scope.lightDetail = light
            console.log(light);

            $mdDialog.show({
                templateUrl: 'template/light_mapping_popup',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                scope: $scope,
                preserveScope: true,
                hasBackdrop: false
            })

        };

        $scope.UpdateLight = function() {

            $scope.makingAjaxCall = true;

            $http.put('/light/UpdateLight', $scope.lightDetail).then(function(response) {

                $scope.makingAjaxCall = false;
                if (response.data.status) {
                    $scope.Getlights();
                    $scope.closeDialog();
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                } else {
                    $rootScope.showToast(response.data.msg, 'error-toast', 'top center')
                }
            }, function(err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        };

        $scope.deleteLight = function() {

            $scope.makingAjaxCall = true;
            $http.put('/light/removeSelectedLights', { selectedlights: [$scope.lightDetail] }).then(function(response) {

                $scope.Getlights()
                $scope.closeDialog();
                $scope.makingAjaxCall = false;
                $rootScope.showToast("Light Removed Successfully", 'success-toast', 'top center')
            }, function(err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })

        };
        $scope.chooseUpload = function() {

            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $mdDialog.show({
                    templateUrl: 'template/lightDevicesUpload',
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
        $scope.uploadDevices = function(sheet, form) {

            if (form.$valid) {

                Upload.upload({
                    url: '/light/uploadDevices/' + $scope.selectedfloor._id,
                    data: { file: sheet[0], 'data': { size: "25", buid: $scope.selectedBuilding.id, seattype: "square" } }
                }).then(function(response) {

                    if (response.data.status) {
                        // $scope.getBles();
                        // $scope.onDeviceChange();
                        // $scope.done();
                        $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                    } else {
                        $rootScope.showToast(response.data.msg, 'error-toast', 'top center');
                    }

                }, function(resp) {
                    $rootScope.showToast(resp.status, 'error-toast');

                }, function(evt) {

                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);

                });

            } else {

                $rootScope.showToast("Please select valid template", 'error-toast', 'top center')
            }
        };

        $scope.UpdateAllLights = function() {

            if ($scope.lights && $scope.lights.length > 0) {

                $scope.makingAjaxCall = true;
                $http.put('/light/updateAllLightswithoutsensor', { lights: $scope.lights }).then(function(response) {

                    console.log(response);
                    if (response.data.lights.length > 0) {
                        $scope.lights = response.data.lights;
                    } else {
                        $scope.Getlights();
                    }

                    $scope.makingAjaxCall = false;

                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function(err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                })
            } else {
                $rootScope.showToast("No Lights to update", 'error-toast', 'top center')
            }
        };

        $scope.UpdateAllLights = function() {
            $scope.makingAjaxCall = true;
            $http.put('/light/updateAllDevicesWBle', { lights: $scope.lights, sensors: $scope.sensors, touchpanels: $scope.touchpanels }).then(function(response) {

                console.log(response);
                // if (response.data.lights.length > 0) {
                // $scope.lights = response.data.lights;
                // } else {
                $scope.Getlights();
                $scope.GetSensors();
                $scope.getTouchpanels();
                // }

                $scope.makingAjaxCall = false;

                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
            }, function(err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        }

        $scope.choosetemplate = function() {

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

                $rootScope.showToast("Please select Floor add Lights", 'success-toast', 'top center')
            }

        }


        $scope.UploadLights = function(sheet, form) {

            if (form.$valid) {

                Upload.upload({
                    url: '/lightcommission/api/uploadlights/' + $scope.selectedfloor._id,
                    data: { file: sheet[0], 'data': { size: "25", buid: $scope.selectedBuilding.id, seattype: "square" } }
                }).then(function(response) {

                    if (response.data.status) {
                        $scope.GetSeats();
                        $scope.done();
                        $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                    } else {
                        $rootScope.showToast(response.data.msg, 'error-toast', 'top center');
                    }
                }, function(resp) {
                    console.log(resp);
                    $rootScope.showToast(resp.status, 'error-toast');

                }, function(evt) {

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
                case "rectangle":
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
                case "sos":
                    return "360";
                case "dls":
                    return "420";
                case "touch-panel":
                    return "480";
                default:
                    return "0"
            }
        }

        $scope.addsensor = function(floors) {
            $scope.sensorobj = {};
            if ($scope.selectedfloor && $scope.selectedfloor._id) {

                $mdDialog.show({
                    templateUrl: 'template/addsensor',
                    clickOutsideToClose: false,
                    scope: $scope,
                    preserveScope: true
                }).then(function() {

                    $scope.blur_content = false;
                }, function() {

                    $scope.blur_content = false;

                });
            } else {
                $rootScope.showToast("Please select floor to add Sensor", 'error-toast', 'top center')
            }
        }

        $scope.SaveSensor = function(sensorobj, sensorform) {

            console.log(sensorform);
            if (sensorform.$valid) {
                $http.post('/lightcommission/api/addBu/' + $scope.selectedfloor._id, sensorobj).then(function(response) {
                    console.log(response);
                    $scope.closeDialog();
                    $scope.GetSensors();
                    $rootScope.showToast(response.data, 'success-toast', 'top center')
                }, function(err) {

                    $rootScope.showToast(err.data, 'error-toast', 'top center')

                })
            }
        }


        $scope.MapSelectedLightswithSensor = function() {
            var finallightsforupdate = [];
            angular.forEach($scope.lights, function(item, index) {

                if (item["selected"] === true) {
                    finallightsforupdate.push(item);
                }
            });
            console.log(finallightsforupdate);
            if ($scope.selectedsensor && $scope.selectedsensor.id) {

                $scope.makingAjaxCall = true;
                $http.put('/lightcommission/api/MapSelectedLightswithSensor', { lights: finallightsforupdate, sensorid: $scope.selectedsensor.id }).then(function(response) {
                    console.log(response.data);

                    $scope.selectedsensor = response.data.section;

                    $scope.makingAjaxCall = false;

                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function(err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                })
            } else if (!$scope.selectedbu || !$scope.selectedbu.id) {
                $rootScope.showToast("Please select BU", 'error-toast', 'top center')
            }

        };


        $scope.markSensorassignedlights = function() {

            for (var k = 0; k < $scope.lights.length; k++) {
                $scope.lights[k].selected = false;
            }
            for (var i = 0; i < $scope.selectedsensor.lightBles.length; i++) {
                for (var j = 0; j < $scope.lights.length; j++) {

                    if ($scope.lights[j]._id == $scope.selectedsensor.lightBles[i]) {
                        $scope.lights[j].selected = true;

                    }
                }
            }
        }

    }
])