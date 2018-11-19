app.controller("LightAdddressMappingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog', 'Upload',
    function($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog, Upload) {
        $scope.selectedlights = [];
        $scope.selected = {};
        $scope.lights = [];
        $scope.closeDialog = function() {
            $scope.blur_content = false;
            $mdDialog.hide();

        }
        $scope.done = function() {
            $scope.closeDialog();
        }

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
            { name: "Save Devcies", type: "Lights", direction: "top", icon: "save" },
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
        $scope.assignBle = function(ble, device, type) {
            console.log("pppppppppppppppppppppppp")
                // ble.mapped = true;
            var mapDevice = false;
            // device
            if ($scope.deviceType == 'light') {
                if (type == 1) {

                    mapDevice = true;
                    // $rootScope.showToast("success", 'error-toast', 'top center');
                } else {
                    mapDevice = false;
                    $rootScope.showToast("Device type must be light", 'error-toast', 'top center');
                }
            } else if ($scope.deviceType == 'ssensor' || $scope.deviceType == 'dsensor') {
                if (type == 2) {
                    if (ble.mapped != true) {
                        if ($scope.deviceType == 'ssensor') {
                            if (ble.isCOS == true && device.isSOS == true) {
                                mapDevice = true;
                            } else {
                                $rootScope.showToast("Device type must be smart sensor", 'error-toast', 'top center');
                            }
                        } else if ($scope.deviceType == 'dsensor') {
                            if (ble.isDLS == true && device.isDLS == true) {
                                mapDevice = true;
                            } else {
                                $rootScope.showToast("Device type must be day light sensor", 'error-toast', 'top center');
                            }
                        }
                    } else {
                        $rootScope.showToast("Cannot map an already mapped BLE into device", 'error-toast', 'top center');
                    }
                } else {
                    $rootScope.showToast("Device type must be sensor", 'error-toast', 'top center');
                }
            } else if ($scope.deviceType == 'touch') {
                if (ble.mapped != true) {
                    if (type == 3) {
                        mapDevice = true;
                    } else {
                        $rootScope.showToast("Device type must be touch panel", 'error-toast', 'top center');
                    }
                } else {
                    $rootScope.showToast("Cannot map an already mapped BLE into device", 'error-toast', 'top center');
                }
            }
            if (mapDevice == true) {
                $scope.makingAjaxCall = true;
                device.mapped = true;
                ble.mapped = true;
                $http.post('/light/mapBle/' + $scope.selectedfloor._id, { buid: $scope.selectedBuilding.id, ble: ble, device: device, type: type }).then(function(response) {
                    $scope.makingAjaxCall = false;

                    // $scope.closeDialog();
                    $scope.Getlights();
                    $scope.GetSensors();
                    $scope.getTouchpanels();
                    // $scope.buttonclicked = false;
                }, function(err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                })
            }
        }
        $scope.OnFloorChange = function(floor) {
            console.log(floor);
            $scope.showlayout = true;
            $scope.selectedfloor = floor;
            $scope.Getlights();
            $scope.GetSensors();
            $scope.getBles();
            $scope.getTouchpanels();
            $scope.onDeviceChange($scope.deviceType);
        }
        $scope.$watch('devices', function() {
            console.log($scope.devices)
        });
        $scope.getBles = function() {
            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/light/getAllBles/' + $scope.selectedfloor._id, { params: { floorId: fid } }).then(function(response) {
                $scope.makingAjaxCall = false;
                console.log(response.data);
                $scope.bles = response.data;
                // $scope.bles = response.data.bles;
                // if ($scope.selectedsensor && $scope.selectedsensor.id) {
                //     $scope.GetSensors();
                // }
                // console.log($scope.lights);

                // if ($scope.lights.length === 0) {
                //     $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                // }

            }, function(err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            });
            $scope.makingAjaxCall = false;
        }
        $scope.onDeviceChange = function(deviceType) {

            $scope.devices = [];
            $scope.getDeviceBles(deviceType);
            if (deviceType == "light") {
                $scope.devices = $scope.lights;
            } else if (deviceType == "ssensor") {
                $scope.devices = $scope.sensors;
            } else if (deviceType == "dsensor") {
                $scope.devices = $scope.sensors;
            } else if (deviceType == "touch") {
                $scope.devices = $scope.touchpanels;
            }
        }

        $scope.getDeviceBles = function(deviceType) {
            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/light/getAllBles/' + $scope.selectedfloor._id, { params: { floorId: fid } }).then(function(response) {
                $scope.makingAjaxCall = false;
                if (deviceType == "light") {
                    $scope.deviceBles = response.data.lightBles;
                } else if (deviceType == "ssensor") {
                    $scope.deviceBles = response.data.SOSBles;
                } else if (deviceType == "dsensor") {
                    $scope.deviceBles = response.data.DLSBles;
                } else if (deviceType == "touch") {
                    $scope.deviceBles = response.data.TPBles;
                }


            }, function(err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            });
            // $scope.makingAjaxCall = false;
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
            $http.get('/light/getLightsBle', { params: { floorId: fid } }).then(function(response) {
                $scope.makingAjaxCall = false;
                console.log("response.data", response.data.document)
                var lt = response.data.document;
                lt.forEach(function(light) {
                    if (light.isTunable == false) {
                        $scope.lights.push(light)
                    }
                })
                console.log("inside getlight", $scope.lights)
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
            $http.get('/light/getSensorsBle', { params: { floorId: fid } }).then(function(response) {
                $scope.makingAjaxCall = false;
                $scope.sensors = response.data.data;
                console.log($scope.selectedsensor);
                // if ($scope.selectedsensor) {
                //     for (var i = 0; i < $scope.sensors.length; i++) {
                //         if ($scope.sensors[i].id == $scope.selectedsensor.id) {

                //             $scope.markBuassignedseats();
                //         }
                //     }
                // }


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
            $http.get('/light/getTouchPanelBle', { params: { floorId: fid } }).then(function(response) {
                $scope.makingAjaxCall = false;

                $scope.touchpanels = response.data.data;

                //  if ($scope.selectedtp) {
                //     for (var i = 0; i < $scope.sensors.length; i++) {
                //         if ($scope.touchpanels[i]._id == $scope.selectedtp._id) {
                //             $scope.touchpanels[i].selected = true;
                //             $scope.markSensorassignedlights();
                //         }
                //     }
                // }


                if ($scope.touchpanels.length === 0) {
                    $rootScope.showToast("No sensors found for selected floor", 'success-toast', 'top center')
                }

            }, function(err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })
        }

        $scope.chooseUpload = function() {

            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $mdDialog.show({
                    templateUrl: 'template/lightAddressupload',
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

        $scope.uploadAddress = function(sheet, form) {

            if (form.$valid) {

                Upload.upload({
                    url: '/light/uploadaddress/' + $scope.selectedfloor._id,
                    data: { file: sheet[0], 'data': { size: "25", buid: $scope.selectedBuilding.id, seattype: "square" } }
                }).then(function(response) {

                    if (response.data.status) {
                        $scope.getBles();
                        $scope.onDeviceChange();
                        $scope.done();
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

        // Delete from here
        $scope.addlights = function(floors) {

            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $http.get('/lightcommission/api/getlighttypes').then(function(response) {
                    $scope.lighttypes = response.data;
                    $scope.lighttypes.sort(function(a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });

                    $scope.styobj = { width: "15", height: "15" }
                    $scope.rectstyobj = { width: "30", height: "15" }

                    $mdDialog.show({
                        templateUrl: 'template/addlights',
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
            $scope.selected = {};
            $scope.selected.id = lighttype._id;
            $scope.selected.class = lighttype.shape;
            $scope.selected.width = ((lighttype.width && lighttype.width <= 45) ? lighttype.width : 45);
            $scope.selected.height = ((lighttype.height && lighttype.height <= 45) ? lighttype.height : 45);
            var width = ((lighttype.width) ? lighttype.width : 15);
            var height = ((lighttype.height) ? lighttype.height : 15);
            lighttype.styobj = { width: width, height: height };
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
                        // $scope.Getlights();
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
                        // $scope.Getlights();
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

        $scope.showPopover = function(ev, device, type) {
            $scope.lightDetail = device;
            console.log("device value", $scope.lightDetail)
            $scope.selectedDeviceType = type;
            if (device.bleAddress.length > 0) {
                $mdDialog.show({
                    templateUrl: 'includes/lightBleMappingPopOver',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    scope: $scope,
                    preserveScope: true,
                    hasBackdrop: false
                })
            } else {
                $rootScope.showToast("No BLE is mapped with the device", 'error-toast', 'top center')
            }
        };

        function checkUniqueAddr() {
            $scope.lightDetail.bleAddress = _.uniq($scope.lightDetail.bleAddress);
            console.log($scope.lightDetail.bleAddress)
        }
        $scope.addRow = function(index) {
            checkUniqueAddr();
            //  var address = {address:""};
            var address = '';
            if ($scope.lightDetail.bleAddress.length <= index + 1) {
                $scope.lightDetail.bleAddress[index + 1] = address;
            }
        };

        $scope.deleteRow = function($event, address) {
            var index = $scope.lightDetail.bleAddress.indexOf(address);
            if ($event.which == 1)
                $scope.lightDetail.bleAddress.splice(index, 1);
        }

        $scope.UpdateLight = function() {

            $scope.makingAjaxCall = true;
            console.log("$scope.selectedDeviceType ", $scope.lightDetail)
            console.log("$scope.selectedDeviceType ", $scope.selectedDeviceType)

            $http.put('/light/UpdateDeviceAddress/' + $scope.selectedfloor._id, { device: $scope.lightDetail, deviceType: $scope.selectedDeviceType }).then(function(response) {

                $scope.makingAjaxCall = false;
                if (response.data.status) {
                    $scope.Getlights();
                    $scope.closeDialog();
                    // $scope.getDeviceBles();
                    $scope.onDeviceChange($scope.deviceType);
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                } else {
                    $rootScope.showToast(response.data.msg, 'error-toast', 'top center')
                }
            }, function(err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        };

        $scope.cancelAdd = function() {
            $scope.closeDialog();
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
                        console.log(response.data)
                            // var noerrors = [{ Error: "No Errors" }]
                            // var data1 = ((response.data.err.dupseatsindb.length > 0) ? response.data.err.dupseatsindb : noerrors);
                            // var data2 = ((response.data.err.dupaddressindb.length > 0) ? response.data.err.dupaddressindb : noerrors);
                            // var data3 = ((response.data.err.seataddressdups.length > 0) ? response.data.err.seataddressdups : noerrors);
                            // var data4 = ((response.data.err.seatnamedups.length > 0) ? response.data.err.seatnamedups : noerrors);
                            // console.log(data1);
                        var opts = [{ sheetid: 'Seats Duplication in DB', header: true }, { sheetid: 'Address Duplication in DB', header: true }, { sheetid: 'Address Duplication in Uploaded Seats', header: true }, { sheetid: 'Address Duplication  in Uploaded Seats', header: true }];

                        function exporJsontData() {
                            // console.log('calling export');
                            alasql('SELECT INTO XLSX("ErrorLogs.xlsx",?) FROM ?', [opts, [data1, data2, data3, data4]]);
                            // alasql("SELECT * INTO CSV('names.xlsx',{headers:true}) FROM ?", [data1]);
                        }
                        exporJsontData();
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
                    return "60";
                case "dls":
                    return "120";
                case "touch-panel":
                    return "160";
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
        $scope.scrollTo = function(target) {};

    }
]).directive('setClassWhenAtTop', function($window) {
    var $win = angular.element($window); // wrap window object as jQuery object

    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var topClass = attrs.setClassWhenAtTop, // get CSS class from directive's attribute value
                offsetTop = element.offset().top; // get element's top relative to the document

            $win.on('scroll', function(e) {
                if ($win.scrollTop() >= offsetTop) {
                    element.addClass(topClass);
                } else {
                    element.removeClass(topClass);
                }
            });
        }
    };
})