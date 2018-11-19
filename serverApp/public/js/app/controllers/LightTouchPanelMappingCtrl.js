app.controller("LightTouchPanelMappingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog) {
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

                if (item === "Lights") {
                    $scope.MapSelectedLightswithTouchPanel();
                } else {
                    $scope.UpdateTPPosition();
                }
            } else {

                $rootScope.showToast("Please select Floor to Update " + item, 'success-toast', 'top center')
            }
        };

        $scope.items = [
            { name: "Save Mapping", type: "Lights", direction: "top", icon: "save" },
        ];

        $scope.MapSelectedLightswithTouchPanel = function () {
            var finallightsforupdate = [];
            angular.forEach($scope.lights, function (item, index) {

                if (item["selected"] === true) {
                    finallightsforupdate.push(item._id);
                }
            });
            if ($scope.selectedtp && $scope.selectedtp._id) {

                $scope.makingAjaxCall = true;
                $http.put('/light/MapSelectedLightswithTP',
                    { lights: finallightsforupdate, touchpanelid: $scope.selectedtp.touchPaneltobles._id }).then(function (response) {
                        angular.forEach($scope.touchpanels, function (item, index) {
                            console.log(response.data)
                            $scope.makingAjaxCall = false;
                            if ($scope.selectedtp._id === item._id) {
                                $scope.selectedtp.touchpaneltobles.lights = response.data.touchpanels.lights;
                                item = $scope.selectedtp;
                            }
                        });

                        $scope.markSensorassignedlights();
   

                        $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                    }, function (err) {
                        $scope.makingAjaxCall = false;
                        $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                    })
            } else if (!$scope.selectedbu || !$scope.selectedbu.id) {
                $rootScope.showToast("Please select BU", 'error-toast', 'top center')
            }

        };

        // $scope.UpdateSensorPosition = function () {

        //     if ($scope.sensors.length > 0) {

        //         $scope.makingAjaxCall = true;
        //         $http.put('/light/savetouchPanelPosition', { sensors: $scope.sensors }).then(function (response) {
        //             console.log(response.data);
        //             $scope.GetSensors();
        //             $scope.selectedsensor = {};
        //             $scope.makingAjaxCall = false;

        //             $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
        //         }, function (err) {
        //             $scope.makingAjaxCall = false;
        //             $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        //         })
        //     } else {
        //         $rootScope.showToast("No Sensors to Update", 'error-toast', 'top center')
        //     }
        // };
        $scope.UpdateTPPosition = function(){
            if($scope.touchpanels.length > 0){
                $scope.makingAjaxCall = true;
                $http.put('/light/savetouchPanelPosition', { sensors: $scope.touchpanels }).then(function (response) {
                    console.log(response.data);
                    $scope.getTouchpanels();
                    $scope.selectedsensor = {};
                    $scope.makingAjaxCall = false;

                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function (err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                })
            }else{
                $rootScope.showToast("No Touch Panels    to Update", 'error-toast', 'top center')
            }
        }
        $http.get('/app/api/getbuildings').then(function (response) {

            $scope.buildings = response.data;

        }, function (err) {

            $rootScope.showToast(err.data.err, 'error-toast');
        });

        $scope.OnBuildingChange = function (building) {
            // console.log(building);
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
            $scope.getTouchpanels();
        }

        $scope.selectionStart = function (event, ui, selected, list) {
            //  console.log(list)
        };

        $scope.selectionStop = function (selected) {
            if (!$scope.selectedtp || !$scope.selectedtp._id) {
                if (selected.length > 0) {
                    $rootScope.showToast("Please select Touch panel to map", 'error-toast', 'top center')
                }
            } else {

                if (selected.length > 0) {
                    $scope.dragselected = selected;

                    angular.forEach($scope.dragselected, function (selecteditem, index) {
                        angular.forEach($scope.lights, function (item, index) {
                            if (selecteditem._id == item._id) { item["selected"] = true; }
                        })
                    })
                    var finallightsforupdate = [];
                    var finalsensorsforupdate = [];
                    var ids = [];
                    var sensorIds = []
                    angular.forEach($scope.lights, function (item, index) {

                        if (item["selected"] === true) {
                            finallightsforupdate.push(item);
                            ids.push(item._id);
                        }
                    });
                    var maxlights = finallightsforupdate.length;
                    if (maxlights >= 20) {
                        $rootScope.showToast("You can only Map 20 Lights for selected Touch Panel", 'error-toast', 'top center')
                        //  $scope.markSensorassignedlights;
                    } else {
                        $http.put('/light/checkLightTouchpanelMapping', { lightsids: ids, touchPanelId: $scope.selectedtp._id }).then(function (response) {
                            if (response.data.status) {
                                var confirm = $mdDialog.confirm()
                                    .title('Some Lights are already mapped to other Touch Panel?')
                                    .textContent('Please unmap from other Touch Panel to continue.')
                                    .ariaLabel('confirmation')
                                    .targetEvent()
                                    .ok('OK');
                                $mdDialog.show(confirm).then(function () {
                                    $scope.markSensorassignedlights();
                                }, function () {
                                    $scope.dragselected = [];
                                    $scope.markSensorassignedlights();
                                });
                            }

                            $scope.makingAjaxCall = false;


                        }, function (err) {
                            $scope.makingAjaxCall = false;
                            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                        })
                    }

                } else {
                    $scope.markSensorassignedlights();
                }
            }

        };

        $scope.deselectLight = function(event,light){
            light.selected = false;
        }

        $scope.toggleselection = function (event, light) {
                if (!$scope.selectedtp || !$scope.selectedtp._id) {
                    $rootScope.showToast("Please select Touch Panel", 'error-toast', 'top center')
                } else {
                    light.selected = !light.selected;
                    console.log(light)
                    if (light.selected) {
                        for (var i = 0; i < $scope.dragselected.length; i++) {
                            if (light._id == $scope.dragselected[i]._id) {
                                $scope.dragselected.splice(i, 1);
                            }
                        }

                        var finallightsforupdate = [];
                        angular.forEach($scope.lights, function (item, index) {

                            if (item["selected"] === true) {
                                finallightsforupdate.push(item);
                            }
                        });
                        var maxlights = finallightsforupdate.length;
                        if (maxlights <= 20) {

                            $http.put('/light/checkLightTouchpanelMapping', { lightsids: ids, touchPanelId: $scope.selectedtp._id }).then(function (response) {

                                console.log(response);
                                if (response.data.status) {

                                    var confirm = $mdDialog.confirm()
                                        .title('Light are already mapped to other Sensor?')
                                        .textContent('Please unmap with other sensor to continue.')
                                        .ariaLabel('confirmation')
                                        .targetEvent()
                                        .ok('OK')


                                    $mdDialog.show(confirm).then(function () {

                                        light.selected = !light.selected;

                                    }, function () {
                                        light.selected = !light.selected;

                                    });

                                } else {
                                    $scope.dragselected.push(light);
                                }

                                $scope.makingAjaxCall = false;


                            }, function (err) {
                                $scope.makingAjaxCall = false;
                                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                            })
                        } else {
                            light.selected = !light.selected;
                            $rootScope.showToast("You can only Map 20 Light for selected Sensor", 'error-toast', 'top center')
                        }

                    } else {


                        for (var i = 0; i < $scope.dragselected.length; i++) {
                            if (light._id == $scope.dragselected[i]._id) {
                                $scope.dragselected.splice(i, 1);
                            }
                        }
                    }
                }
            
        }


        $scope.selectsensor = function (event, sensor) {
            if (event.ctrlKey) {
                angular.forEach($scope.sensors, function (item, index) {
                    if (sensor._id === item._id) {
                        sensor.selected = !sensor.selected;
                        if (sensor.selected) {
                            $scope.selectedsensor = sensor;
                            console.log($scope.selectedsensor)
                            $scope.markSensorassignedlights();
                        } else {
                            $scope.selectedsensor = {};
                            $scope.markSensorassignedlights();
                        }
                    } else {
                        item["selected"] = false
                    }
                });
            }
        }
        $scope.selecttp = function (event, tp) {
               angular.forEach($scope.touchpanels, function (item, index) {
                    if (tp._id === item._id) {
                        tp.selected = !tp.selected;
                        if (tp.selected) {
                            $scope.selectedtp = tp;
                            $scope.markSensorassignedlights();
                        } else {
                            $scope.selectedtp = {};
                            $scope.markSensorassignedlights();
                        }
                    } else {
                        item["selected"] = false
                    }
                });
        }


        $scope.markSensorassignedlights = function () {

            for (var k = 0; k < $scope.lights.length; k++) {
                $scope.lights[k].selected = false;
            }
            if ($scope.selectedtp && $scope.selectedtp._id) {
                for (var i = 0; i < $scope.selectedtp.touchPaneltobles.lights.length; i++) {
                    for (var j = 0; j < $scope.lights.length; j++) {

                        if ($scope.lights[j]._id == $scope.selectedtp.touchPaneltobles.lights[i]) {
                            $scope.lights[j].selected = true;

                        }
                    }
                }
            }
        }


       

        $scope.Getlights = function () {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/light/getLightsBle', { params: { floorId: fid } }).then(function (response) {
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


        $scope.addsensors = function () {
            $scope.sensortype = {};
            if ($scope.selectedfloor && $scope.selectedfloor._id) {

                $scope.styobj = { width: "30", height: "30" }

                $mdDialog.show({
                    templateUrl: 'template/addPanels',
                    clickOutsideToClose: false,
                    scope: $scope,
                    preserveScope: true
                }).then(function () {

                    $scope.blur_content = false;

                }, function () {

                    $scope.blur_content = false;

                });

            } else {
                $rootScope.showToast("Please select floor to add Sensors", 'error-toast', 'top center')
            }
        }

        $scope.demolightshape = function (sensortype, form) {
            // console.log(sensortype);
            $scope.selected = {};

            $scope.selected.width = ((sensortype.width && sensortype.width <= 45) ? sensortype.width : 45);
            $scope.selected.height = ((sensortype.height && sensortype.height <= 45) ? sensortype.height : 45);

            var width = ((sensortype.width) ? sensortype.width : 15)
            var height = ((sensortype.height) ? sensortype.height : 15)
            $scope.styobj = { width: width, height: height }

        }

        $scope.createPanels = function (sensors, form) {
            var panelstoadd = [];
            var nos = 0;
            if (form.$valid) {

                nos = sensors.nos;
                var posx = 0;

                var obj = { count: nos, posx: posx };
                panelstoadd.push(obj);
                if (nos <= 10) {
                    $scope.buttonclicked = true;
                    $http.post('/light/createTouchPanels/' + $scope.selectedfloor._id,
                        { buid: $scope.selectedBuilding.id, panelcount: panelstoadd }).then(function (response) {
                            $scope.closeDialog();
                            // $scope.GetSensors();
                            $scope.getTouchpanels();
                            $scope.buttonclicked = false;
                            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                        }, function (err) {

                            $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                        })
                } else {

                    $rootScope.showToast("You can add Maximum of 10 Touch panels at a time", 'error-toast', 'top center')
                }
            } else {
                $rootScope.showToast("Please fill the required fields", 'error-toast', 'top center')
            }
        }


        $scope.showPopover = function (ev, tp) {
            $scope.tp = tp
            $mdDialog.show({
                templateUrl: 'template/editTouchPanel',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                scope: $scope,
                preserveScope: true,
                hasBackdrop: false
            })

        };

        $scope.updateTouchPanel  = function(){
            $scope.makingAjaxCall = true;
            $http.put('/light/updateTouchPanel',$scope.tp).then(function(response){
                $scope.makingAjaxCall = false;
                if(response.data.status){
                    $scope.getTouchpanels();
                    $scope.closeDialog();
                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }else{
                    $rootScope.showToast(response.data.msg, 'error-toast', 'top center')
                }

            },function(err){
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            });
        };

        $scope.deleteSensor = function () {
            $scope.makingAjaxCall = true;
            $http.put('/light/removeTouchPanel', $scope.sensorDetail).then(function (response) {
                $scope.selectedsensor = {};
                $scope.GetSensors()
                $scope.closeDialog();
                $scope.markSensorassignedlights();
                $scope.makingAjaxCall = false;
                $rootScope.showToast("Light Removed Successfully", 'success-toast', 'top center')
            }, function (err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            });
        };
        $scope.deleteTouchPanel = function () {
            $scope.makingAjaxCall = true;
            console.log($scope.tp)
            $http.put('/light/removeTouchPanel', $scope.tp).then(function (response) {
                $scope.selectedsensor = {};
                $scope.getTouchpanels()
                $scope.closeDialog();
                // $scope.markSensorassignedlights();
                $scope.makingAjaxCall = false;
                $rootScope.showToast("Touch Panel Removed Successfully", 'success-toast', 'top center')
            }, function (err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
        };

      

  
        $scope.GetSensors = function () {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/lightcommission/api/getsensors', { params: { floorId: fid } }).then(function (response) {
                $scope.makingAjaxCall = false;
                $scope.sensors = response.data.sensorlist;
                console.log($scope.sensors);
                console.log($scope.selectedsensor);
                if ($scope.selectedsensor) {
                    for (var i = 0; i < $scope.sensors.length; i++) {
                        if ($scope.sensors[i]._id == $scope.selectedsensor._id) {
                            $scope.sensors[i].selected = true;
                            $scope.markSensorassignedlights();
                        }
                    }
                }


                if ($scope.sensors.length === 0) {
                    $rootScope.showToast("No sensors found for selected floor", 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };

        $scope.getTouchpanels = function(){
            var fid  = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/light/getTouchPanels',{ params: { floorId: fid } }).then(function (response) {
                $scope.makingAjaxCall = false;
                console.log(response.data)
                $scope.touchpanels = response.data.tplist;
                 if ($scope.selectedtp) {
                    for (var i = 0; i < $scope.sensors.length; i++) {
                        if ($scope.touchpanels[i]._id == $scope.selectedtp._id) {
                            $scope.touchpanels[i].selected = true;
                            $scope.markSensorassignedlights();
                        }
                    }
                }


                if ($scope.sensors.length === 0) {
                    $rootScope.showToast("No sensors found for selected floor", 'success-toast', 'top center')
                }

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })
        }

    }])