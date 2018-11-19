app.controller("LightMappingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    '$transitions', '$http', '$mdDialog',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, $transitions, $http, $mdDialog) {
        $scope.selectedlights = [];
        $scope.selected = {};
        $scope.closeDialog = function () {
            $scope.blur_content = false;
            $mdDialog.hide();

        }
        $scope.done = function () {
            $scope.closeDialog();
        }

        $scope.getstyleobj = function (shape) {

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

        $scope.openDialog = function ($event, item) {
            if ($scope.selectedfloor && $scope.selectedfloor._id) {

                if (item === "Lights") {
                    $scope.UpdateAllLights();
                }
            } else {

                $rootScope.showToast("Please select Floor to Update " + item, 'success-toast', 'top center')
            }
        };

        $scope.items = [
            { name: "Save Lights", type: "Lights", direction: "top", icon: "event_seat" },
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
        }

        $scope.toggleselection = function (event, light) {

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

        $scope.selectionStart = function (event, ui, selected, list) {
            //  console.log(list)
        };

        $scope.selectionStop = function (selected) {
            console.log(selected)
            $scope.selectedlights = [];
            if (selected.length > 0) {
                angular.forEach(selected, function (selecteditem, index) {
                    angular.forEach($scope.lights, function (item, index) {
                        if (selecteditem._id == item._id) { item["selected"] = true; }
                    })
                })
                angular.forEach($scope.lights, function (item, index) {
                    if (item["selected"] === true) {
                        $scope.selectedlights.push(item);
                    };
                })
            } else {

                angular.forEach($scope.lights, function (item, index) {
                    item["selected"] = false;
                })
            }

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


        $scope.addlights = function (floors) {

            if ($scope.selectedfloor && $scope.selectedfloor._id) {
                $http.get('/lightcommission/api/getlighttypes').then(function (response) {
                    $scope.lighttypes = response.data;
                    $scope.lighttypes.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });

                    $scope.styobj = { width: "15", height: "15" }
                    $scope.rectstyobj = { width: "30", height: "15" }

                    $mdDialog.show({
                        templateUrl: 'template/addlights',
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
                $rootScope.showToast("Please select floor to add lights", 'error-toast', 'top center')
            }
        }

        $scope.demolightshape = function (lighttype, form) {
            // console.log(lighttype);
            $scope.selected = {};
            $scope.selected.id = lighttype._id;
            $scope.selected.class = lighttype.shape;
            $scope.selected.width = ((lighttype.width && lighttype.width <= 45) ? lighttype.width : 45);
            $scope.selected.height = ((lighttype.height && lighttype.height <= 45) ? lighttype.height : 45);
            /*  if (lighttype.shape == 'rectangle') {
                 var width = ((lighttype.width) ? lighttype.width : 30)
                 var height = ((lighttype.height) ? lighttype.height : 15)
                 $scope.rectstyobj = { width: width, height: height }
             } else { */

            var width = ((lighttype.width) ? lighttype.width : 15)
            var height = ((lighttype.height) ? lighttype.height : 15)
            lighttype.styobj = { width: width, height: height }
            /*    } */
        }

        $scope.creatlights = function (lighttypes, form) {
            var lighttoadd = [];

            console.log(lighttypes);
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
                console.log(lighttoadd);
                if (nos <= 50) {
                    console.log($scope.selectedfloor._id);
                    console.log($scope.selectedBuilding.id);
                    $scope.buttonclicked = true;
                    // $http.post('/lightcommission/api/creatlights/' + $scope.selectedfloor._id,
                    $http.post('/light/createLights/' + $scope.selectedfloor._id,
                        { buid: $scope.selectedBuilding.id, lightcount: lighttoadd }).then(function (response) {
                            console.log(response);
                            $scope.closeDialog();
                            $scope.Getlights();
                            $scope.buttonclicked = false;
                        }, function (err) {

                            $rootScope.showToast(err.data.err, 'error-toast', 'top center')

                        })
                } else {

                    $rootScope.showToast("You can add Maximum of 50 Lights at a time", 'error-toast', 'top center')
                }
            } else {
                $rootScope.showToast("Please fill the required fields", 'error-toast', 'top center')
            }
        }


        $scope.deletelights = function () {
            var confirm = $mdDialog.confirm()
                .title('Are you sure to delete selected Lights?')
                .textContent('Click OK to continue.')
                .ariaLabel('confirmation')
                .targetEvent()
                .ok('OK')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function () {

                $scope.RemoveSelectedLights();

            }, function () {
                $scope.selectedseats = [];
                $scope.selectionStop($scope.selectedseats);
            });
        }

        $scope.RemoveSelectedLights = function () {
            $scope.selectedlights = [];
            angular.forEach($scope.lights, function (item, index) {
                if (item["selected"] === true) {
                    $scope.selectedlights.push(item);
                };
            })

            $scope.makingAjaxCall = true;
            $http.put('/light/removeSelectedLights', { selectedlights: $scope.selectedlights }).then(function (response) {
                $scope.selectedlights = [];
                $scope.Getlights()
                $scope.closeDialog();
                $scope.makingAjaxCall = false;
                $rootScope.showToast(response.data, 'success-toast', 'top center')
            }, function (err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })

        };

        $scope.showPopover = function (ev, light) {
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

        $scope.UpdateLight = function () {

            $scope.makingAjaxCall = true;

            $http.put('/light/UpdateLight', $scope.lightDetail).then(function (response) {

                $scope.makingAjaxCall = false;
                if (response.data.status) {
                    $scope.Getlights();
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

        $scope.deleteLight = function () {

            $scope.makingAjaxCall = true;
            $http.put('/light/removeSelectedLights', { selectedlights: [$scope.lightDetail] }).then(function (response) {

                $scope.Getlights()
                $scope.closeDialog();
                $scope.makingAjaxCall = false;
                $rootScope.showToast("Light Removed Successfully", 'success-toast', 'top center')
            }, function (err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })

        };

        $scope.UpdateAllLights = function () {

            if ($scope.lights && $scope.lights.length > 0) {

                $scope.makingAjaxCall = true;
                $http.put('/light/updateAllLightswithoutsensor', { lights: $scope.lights }).then(function (response) {

                    console.log(response);
                    if (response.data.lights.length > 0) {
                        $scope.lights = response.data.lights;
                    } else {
                        $scope.Getlights();
                    }

                    $scope.makingAjaxCall = false;

                    $rootScope.showToast(response.data.msg, 'success-toast', 'top center')
                }, function (err) {
                    $scope.makingAjaxCall = false;
                    $rootScope.showToast(err.data.err, 'error-toast', 'top center')
                })
            } else {
                $rootScope.showToast("No Lights to update", 'error-toast', 'top center')
            }
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

                $rootScope.showToast("Please select Floor add Lights", 'success-toast', 'top center')
            }

        }


        $scope.UploadLights = function (sheet, form) {

            if (form.$valid) {

                Upload.upload({
                    url: '/lightcommission/api/uploadlights/' + $scope.selectedfloor._id,
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
                default:
                    return "0"
            }
        }

        $scope.addsensor = function (floors) {
            $scope.sensorobj = {};
            if ($scope.selectedfloor && $scope.selectedfloor._id) {

                $mdDialog.show({
                    templateUrl: 'template/addsensor',
                    clickOutsideToClose: false,
                    scope: $scope,
                    preserveScope: true
                }).then(function () {

                    $scope.blur_content = false;
                }, function () {

                    $scope.blur_content = false;

                });
            } else {
                $rootScope.showToast("Please select floor to add Sensor", 'error-toast', 'top center')
            }
        }

        $scope.SaveSensor = function (sensorobj, sensorform) {

            console.log(sensorform);
            if (sensorform.$valid) {
                $http.post('/lightcommission/api/addBu/' + $scope.selectedfloor._id, sensorobj).then(function (response) {
                    console.log(response);
                    $scope.closeDialog();
                    $scope.GetSensors();
                    $rootScope.showToast(response.data, 'success-toast', 'top center')
                }, function (err) {

                    $rootScope.showToast(err.data, 'error-toast', 'top center')

                })
            }
        }


        $scope.MapSelectedLightswithSensor = function () {
            var finallightsforupdate = [];
            angular.forEach($scope.lights, function (item, index) {

                if (item["selected"] === true) {
                    finallightsforupdate.push(item);
                }
            });
            console.log(finallightsforupdate);
            if ($scope.selectedsensor && $scope.selectedsensor.id) {

                $scope.makingAjaxCall = true;
                $http.put('/lightcommission/api/MapSelectedLightswithSensor', { lights: finallightsforupdate, sensorid: $scope.selectedsensor.id }).then(function (response) {
                    console.log(response.data);

                    $scope.selectedsensor = response.data.section;

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

        $scope.GetSensors = function () {

            var fid = $scope.selectedfloor._id;
            $scope.makingAjaxCall = true;
            $http.get('/lightcommission/api/getsensors', { params: { floorId: fid } }).then(function (response) {
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

            }, function (err) {

                $rootScope.showToast(err.data.err, 'error-toast', 'top center')

            })

        };

        $scope.markSensorassignedlights = function () {

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

    }])