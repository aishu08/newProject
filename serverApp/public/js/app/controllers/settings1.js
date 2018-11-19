app.controller('settings1', ['$stateParams', '$resource', '$location', '$scope', '$http', '$timeout', '$mdDialog', '$mdToast', '$mdSidenav', '$rootScope', function ($stateParams, $resource, $location, $scope, $http, $timeout, $mdDialog, $mdToast, $mdSidenav, $rootScope) {
    var buildingId = $stateParams.bldgId
    $scope.Lightsdata;
    $scope.previousZone = "noZone";
    $scope.presentZone;
    $scope.zoneIndex;
    $scope.zoneMode;
    $scope.zones = [];
    $scope.createNewZone;
    $scope.editZone = false;
    $scope.createNewScene = false;
    $scope.editScene = false;
    $scope.previousScene = "noScene"
    $scope.presentScene;
    $scope.createNewSchedule = false
    $scope.editSchedule = false;
    $scope.schedule = {};
    $scope.floors = [1, 2, 3, 4, 5]
    $scope.previousSchedule = "noSchedule";
    $scope.presentSchedule;
    $scope.zoneLights = []
    $scope.selectedSceneLights
    $scope.startTimeChanged = false;
    $scope.endTimeChanged = false;
    $scope.timings = [];
    $scope.startTimeSettings = {
        // theme: 'ios-dark',
        display: 'inline',
        timeFormat: 'HH:ii',
        timeWheels: 'HHii',
        onChange: function () {
            $scope.startTimeChanged = true;
        }
    };

    $scope.endTimeSettings = {
        // theme: 'ios-dark',
        display: 'inline',
        timeFormat: 'HH:ii',
        timeWheels: 'HHii',
        onChange: function () {
            $scope.endTimeChanged = true;
        }
    };



    Number.prototype.pad = function(size) {
        var s = String(this);
        while (s.length < (size || 2)) { s = "0" + s; }
        return s;
        };
// $scope.generateTime();
$scope.generateTime = function() {
    $scope.timings = []
    for (var i = 0; i < 24; i++) {
        var min = 0;
        for (var j = 0; j < 4; j++) {
            $scope.timings.push({ "time": parseFloat(i + "." + min), "name": (i + ":" + min.pad(2)) });
            min = min + 15
        }
    }
}


$scope.days1 = [{
    'number': 0,
    'name': 'Sunday'
    }, {
    'number': 1,
    'name': 'Monday'
    }, {
    'number': 2,
    'name': 'Tuesday'
    }, {
    'number': 3,
    'name': 'Wednesday'
    }, {
    'number': 4,
    'name': 'Thursday'
    }, {
    'number': 5,
    'name': 'Friday'
    }, {
    'number': 6,
    'name': 'Saturday'
    }]

    $scope.days = [
        {
            'id': 'S',
            'name': 'Sun',
            'isDaySelected': 'no'
        },
        {
            'id': 'M',
            'name': 'Mon',
            'isDaySelected': 'no'
        },
        {
            'id': 'T',
            'name': 'Tue',
            'isDaySelected': 'no'
        },
        {
            'id': 'W',
            'name': 'Wed',
            'isDaySelected': 'no'
        },
        {
            'id': 'T',
            'name': 'Thu',
            'isDaySelected': 'no'
        },
        {
            'id': 'F',
            'name': 'Fri',
            'isDaySelected': 'no'
        },
        {
            'id': 'S',
            'name': 'Sat',
            'isDaySelected': 'no'
        }
    ];
    $scope.toggleLeft = function () {
        $mdSidenav('scheduleside').toggle();
    }

    $scope.togglesidenav = function () {
        $mdSidenav('left').toggle();
    }
    $http.get('/light/getBuildings').then(function (response) {
        console.log(response.data)
        $scope.buildings = response.data;
        $scope.selectedBuilding = $scope.buildings[0]
        getFloors($scope.selectedBuilding)
    })

    function getFloors(building) {
        $http.get('/app/api/floors/' + building.id).then(function (response) {
            $scope.floors = response.data;
            $scope.selectedFloor = $scope.floors[0];
            $scope.getHosts($scope.selectedFloor,building);
        }, function (err) {
            console.log(err)
        });
    }
    $scope.changeBuilding = function (building) {
        $scope.floorSelected = '';
        $scope.floors = '';
        $scope.selection = {};
        $scope.zones = '';
        $scope.selectedZone = {}
        $scope.showlayout = false;
        getFloors(JSON.parse(building))
    }
    $scope.changeFloor = function (floor) {
        $scope.showlayout = true;
        $scope.floorLayout = JSON.parse(floor);
        $scope.selectedFloor = floor;
        $scope.getHosts(JSON.parse(floor),($scope.selectedBuilding));
        // getAllLightsFloor(JSON.parse(floor))
        
    }
    $scope.getHosts = function(floor,building){
    var fid = floor._id;
    var bid = building.id;
    $http.get('/app/api/gethosts', { params: { buildingId: bid, floorId: fid } }).then(function (response) {
        console.log(response);

        $scope.hosts = response.data;
        // console.log($scope.selectedhost)
        // if ($scope.selectedhost.name) {
        //     $scope.selection.host = $scope.selectedhost;

        // }
    }, function (err) {

        $rootScope.showToast(err.data.err, 'error-toast');
    });
    }
    $scope.OnHostChange = function(host){
        $scope.selectedhost = host;
        getAllLightsFloor()
        $scope.generateTime();
        getZones(JSON.parse($scope.floorSelected))
        // $scope.markHostassignedlightsandsensors();
    }
    function getZones(floorId) {
        $http.get('/light/getZones/' + floorId._id+'/'+$scope.selectedhost.id).then(function (response) {
            $scope.zones = response.data.msg;
            $scope.selectedZones = $scope.zones[0];
            console.log(response.data)
        }, function (err) {
            console.log(err)
        });
    }

    function getZoneLights(zoneId) {
        console.log('in get zone lights')
        $scope.noScene = true
        if ($scope.floorSelected) {
            var floor = JSON.parse($scope.floorSelected)
            floorId = floor._id
            var zoneId = zoneId
            $scope.selectedZoneId = zoneId
            if (zoneId == 'all') {
                $scope.noScene = true
                $scope.zoneLights = $scope.Lightsdata
                $scope.Lightsdata.forEach(function (light) {
                    light.isSelected = 'yes'
                    $scope.zoneScenes = 'No Scene'
                })
            } else if (zoneId == "custom") {
                $scope.noScene = true
                $scope.Lightsdata.forEach(function (light) {
                    light.isSelected = 'no'
                    $scope.zoneScenes = 'No Scene'
                })

            } else {
                $scope.noScene = false
                $http.get('/light/getZoneLights/' + floorId + '/' + zoneId).then(function (response) {
                    data = response.data.msg
                    $scope.zoneLights = data.lights;
                    $scope.zoneScenes = data.scenes;
                    $scope.Lightsdata.forEach(function (light) {
                        light.isSelected = 'no'
                        light.isSceneSelected = false
                        light.isSchedule = false
                        light.schedules = []
                        light.dimValue = 99
                        $scope.zoneLights.forEach(function (zl) {
                            if (zl._id === light._id) {
                                light.isSelected = 'yes'
                            }
                        })
                    })
                }, function (err) {
                    console.log(err)
                });
            }
        } else {
            $rootScope.showToast("Please select Floor", 'error-toast', 'top center')
        }
    }
    $scope.gZoneLights = function (z) {
        getZoneLights(z.id)
        num = 0
        for (var i in $scope.zones) {
            if ($scope.zones[i] != z) {
                $scope.zones[i].zoneExpand = false;
                $scope.zones[i].sceneExpand = false;
                $scope.zones[i].scheduleExpand = false;
            }
        }
        z.zoneExpand = !z.zoneExpand;
        z.sceneExpand = false;
        z.scheduleExpand = false;
        $scope.editZone = false;
        $scope.zoneIndex = num++
        $scope.zoneMode = 'zone'
        $scope.selectedZone = z
    }
    function getAllLightsFloor() {
        var floorId = $scope.selectedFloor._id
            var hid = $scope.selectedhost.id;
        $http.get('/light/getLightsHost' , { params: { floorId: floorId,hostId:hid } }).then(function (response) {
            $scope.Lightsdata = response.data.document;
        }, function (err) {
            console.log(err)
        });
    }

    /*-----------------------------------------------------------------Zone setting Functions -----------------------------------*/

    $scope.successToast = function (msg) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(msg)
                .position('top')
                .theme('success-toast')
                .hideDelay(1000)
        );
    };

    $scope.errorToast = function (msg) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(msg)
                .position('top')
                .theme('error-toast')
                .hideDelay(1000)
        );
    };

    $scope.newZones = function () {                                    /*-----------------popup to create new Zone------------*/
        $mdDialog.show({
            templateUrl: 'template/zoneDialog',
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true
        })
    }

    $scope.addZones = function () { /*---------------------save popup data------------------------*/
        if (!$scope.zName) {
            $scope.errorToast('Enter Zone Name')
        } else {
            data = {}
            floor = JSON.parse($scope.floorSelected)
            data.floorId = floor._id
            data.hostId = $scope.selectedhost.id
            data.name = $scope.zName
            $http.post('/light/createzone', data).then(function (response) {
                $scope.zoneMode = 'zone';
                $scope.createNewZone = 'new';
                $scope.selectedZoneId = response.data.id
                $mdDialog.hide();
                $scope.successToast('Select Some Lights to Zone')
            }, function (err) {
                $scope.errorToast(err.data.err)
            })
        }
    }

    $scope.addLights = function (light) /*----------------------adding lights to zones------------*/ {
        lightToAdd = light;
        lightToAdd.id = lightToAdd._id;
        if ($scope.zoneMode == 'zone') {
            if ($scope.createNewZone == 'new') {
                if (light.isSelected == 'no' || (!light.isSelected)) {
                    light.isSelected = 'yes'
                    $scope.zoneLights.push(lightToAdd)
                } else {
                    for (var i in $scope.zoneLights) {
                        //TODO: change this to id instead of address
                        if (light.lightToAdd._id == $scope.zoneLights[i]._id) {
                            $scope.zones[$scope.zoneIndex].lights.splice(i, 1);
                            $scope.zoneLights.splice(i,1);
                            light.isSelected = 'no'
                            $scope.errorToast('Light deleted from Zone')
                        }
                    }
                }
            } else if ($scope.editZone == true) {
                console.log(light)
        if (light.isSelected == 'no' || (!light.isSelected))  {   /*---------------Edit Zones-----------------*/      
                    $scope.zoneLights.push(lightToAdd)
                    light.isSelected = 'yes'
                } else {
                    for (var i in $scope.zoneLights) {
                        if (lightToAdd._id == $scope.zoneLights[i]._id) {
                            $scope.zones[$scope.zoneIndex].lights.splice(i, 1);
                            $scope.zoneLights.splice(i, 1);
                            light.isSelected = 'no'
                            $scope.errorToast('Light deleted from Zone')
                        }
                    }
                }
            } else {
                $scope.errorToast('Select edit option of zone');
            }
        } else if ($scope.zoneMode == 'scenes') /*-----------------Adding Lights to Scenes----------------------*/ {
            $scope.lightSelected = light;
            if ($scope.createNewScene == true) {
                if (light.isSelected == 'yes') {
                    if (light.isSceneSelected == false) {
                        $mdDialog.show({
                            templateUrl: 'template/sceneLightDialog',
                            clickOutsideToClose: true,
                            scope: $scope,
                            preserveScope: true
                        })
                    } else {
                        for (var i in $scope.zones[$scope.zoneIndex].scenes[$scope.presentScene].lights) {
                            if ($scope.zones[$scope.zoneIndex].scenes[$scope.presentScene].lights[i]._id == light._id) {
                                $scope.zones[$scope.zoneIndex].scenes[$scope.presentScene].lights.splice(i, 1)
                                light.isSceneSelected = false;
                                $scope.errorToast('Light deleted from scene');
                            }

                        }
                    }
                } else {
                    $scope.errorToast('Select Lights in Same Zone')
                }
            } else if ($scope.editScene == true) /*-------------------Editing Lights of Scenes----------------*/ {
                if (light.isSelected == 'yes') {
                    if (light.isSceneSelected == false) {
                        $mdDialog.show({
                            templateUrl: 'template/sceneLightDialog',
                            clickOutsideToClose: true,
                            scope: $scope,
                            preserveScope: true
                        })
                    } else {
                        // for (var i in $scope.zones[$scope.zoneIndex].scenes[$scope.presentScene].lights) {
                        //     if ($scope.zones[$scope.zoneIndex].scenes[$scope.presentScene].lights[i].address == light.address) {
                        //         $scope.zones[$scope.zoneIndex].scenes[$scope.presentScene].lights.splice(i, 1)
                        //         light.isSceneSelected = false;
                        //         $scope.errorToast('Light deleted from scene');
                        //     }

                        // }
                        $scope.zones[$scope.zoneIndex].scenes.forEach(function (sce) {
                            debugger;
                            if (sce._id == $scope.selectedSceneId) {
                                var i = 0
                                $scope.selectedSceneLights.forEach(function (scl) {
                                    console.log(light)
                                    if (light.id == scl.lightId) {
                                        $scope.selectedSceneLights.splice(i, 1)
                                        light.isSceneSelected = false
                                        light.dimValue = 99
                                        $scope.editSceneLights = 1
                                        debugger;
                                        console.log(scl)
                                    }
                                })
                            }
                        })
                    }
                } else {
                    $scope.errorToast('Select Lights in Same Zone')
                }
            } else {
                $scope.errorToast('Select edit option of scene');
            }
        } else if ($scope.zoneMode == 'schedules') {
            $scope.lightSelected = light;
            if ($scope.createNewSchedule == true) /*---------------------Adding lights to new Schedule-------------------*/ {
                if (light.isSelected == 'yes') {
                    if (light.isSchedule == false) {
                        $mdDialog.show({
                            templateUrl: 'template/scheduleDialog',
                            clickOutsideToClose: true,
                            scope: $scope,
                            preserveScope: true
                        })
                    } else {
                        for (var i in $scope.schedule.lights) {
                            if ($scope.schedule.lights[i].address == light.bles.address) {
                                $scope.schedule.lights.splice(i, 1);
                                $scope.errorToast('Light is Deselected');
                            }
                        }
                        light.dimValue = 99;
                        light.isSchedule = false;
                    }
                } else {
                    $scope.errorToast('Select Lights in Same Zone')
                }
            } else if ($scope.editSchedule == true) {
                if (light.isSelected == 'yes') {
                    if (light.isSchedule == false) {
                        $mdDialog.show({
                            templateUrl: 'template/scheduleDialog',
                            clickOutsideToClose: true,
                            scope: $scope,
                            preserveScope: true
                        })
                    } else {
                        $scope.zones[$scope.zoneIndex].schedules.forEach(function (sch) {
                            if (sch._id == $scope.selectedScheduleId) {
                                var i = 0
                                var counterRemove = 0
                                var pending = $scope.selectedScheduleLights.length
                                var counter = 0
                                $scope.selectedScheduleLights.forEach(function (scl) {
                                    i++
                                    if (scl.lightId == light._id) {

                                        light.isSchedule = false
                                        counterRemove = i - 1
                                        // $scope.schedule.lights = $scope.selectedScheduleLights
                                        light.dimValue = 99

                                        $scope.editScheduleLights = 1

                                    }
                                    $scope.editSchedLights = 1
                                    if (++counter == pending) {
                                        console.log("in looper end")
                                        $scope.selectedScheduleLights.splice(counterRemove, 1)
                                        $scope.schedule.lights = $scope.selectedScheduleLights
                                    }
                                })
                                console.log(sch)
                            }
                        })
                        // for (var i in $scope.zones[$scope.zoneIndex].schedules[$scope.presentSchedule].lights) {
                        //     if ($scope.zones[$scope.zoneIndex].schedules[$scope.presentSchedule].lights[i].address == light.address) {
                        //         $scope.zones[$scope.zoneIndex].schedules[$scope.presentSchedule].lights.splice(i, 1)
                        //         light.isSchedule = false;
                        //         light.dimValue = 99;
                        //         $scope.errorToast('Light deleted from schedule');
                        //     }
                        // }
                    }
                } else {
                    $scope.errorToast('Select Lights in Same Zone')
                }
            } else {
                $scope.errorToast('Select edit option of schedule');
            }
        } else {
            $scope.errorToast('Select some Zone');
        }

    }

    $scope.saveZone = function () {
        $scope.createNewZone = false;
        $scope.editZone = false;
        console.log('selected zoneid' + $scope.selectedZoneId)
        console.log($scope.zoneLights)
        data = {}
        data.zoneId = $scope.selectedZoneId
        data.lights = $scope.zoneLights
        $http.post('/light/addLightZone', data).then(function (response) {
            $scope.successToast(response.data.msg)
        }, function (err) {
            $scope.errorToast(err.data.err)
        })
    }

    $scope.deleteZone = function (zone) {
        console.log(zone)
        $scope.errorToast(zone.name + ' Zone deleted')
        var data = {}
        data.zoneId = zone.id
        console.log(data)
        $http.post('/light/deleteZone', data).then(function (response) {
            getZones($scope.selectedFloor)
        })
    }

    $scope.editZoneLights = function (zone) {
        $scope.editZone = true;
        console.log(zone)
        $scope.presentZone = zone;
        zonelights = $scope.zoneLights
        $scope.zoneMode = 'zone';
        $scope.successToast('Select or Deselect lights from Zone');
    }

    $scope.zoneScene = function (zone) {
        zone.sceneExpand = !zone.sceneExpand;
        if (zone.sceneExpand == true)
            zone.scheduleExpand = false;
        else
            zone.sceneExpand = false;
        $scope.zoneMode = 'scenes';
        $scope.Lightsdata.forEach(function (l) {
            l.isSceneSelected = false;
            l.isSchedule = false;
            l.dimValue = 99;
        })

    }

    $scope.zoneSchedule = function (zone) {
        zone.scheduleExpand = !zone.scheduleExpand;
        if (zone.scheduleExpand == true)
            zone.sceneExpand = false;
        else
            zone.scheduleExpand = false;
        $scope.zoneMode = 'schedules';
        $scope.Lightsdata.forEach(function (l) {
            l.isSceneSelected = false;
            l.isSchedule = false;
            l.dimValue = 99;
        })
    }
    /*---------------------------------------------------------Scenes functions of zone-------------------------------------------*/
    $scope.newScene = function () {
        if ($scope.selectedZone == undefined) {
            $scope.errorToast('Select Some Zone');
        }
        $scope.presentScene = $scope.zones[$scope.zoneIndex].scenes.length;
        $scope.previousScene = $scope.zones[$scope.zoneIndex].scenes.length;
        $scope.zoneMode = 'scenes'
        $mdDialog.show({
            templateUrl: 'template/sceneDialog',
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true
        })
    }

    $scope.addScene = function () {
        var data = {}
        if($scope.sceneName !== undefined){
            data.name = $scope.sceneName
        data.zoneId = $scope.selectedZoneId
        data.floorId = JSON.parse($scope.floorSelected)._id
        $scope.Lightsdata.forEach(function (zl) {
            zl.isSceneSelected = false;
            zl.dimValue = 99
            zl.isSchedule = false;
        })
        $http.post('/light/addScene', data).then(function (response) {
            $scope.createNewScene = true;
            console.log($scope.selectedZones)
            $scope.zones[$scope.zoneIndex].scenes.push({
                name: $scope.sceneName,
                id: response.data.id,
                lights: []
            })
            $scope.presentScene = $scope.zones[$scope.zoneIndex].scenes.length - 1;
            $scope.selectedSceneId = response.data.id;
            $scope.selectedScene = scene;
            $scope.successToast('Select Some Lights to scene')
        }, function (err) {
            $scope.errorToast(err.data.err)
        })
        $scope.successToast('Select some lights to scene')
        $mdDialog.hide();
        }else{
            $scope.errorToast('Please Enter a name')
        }
        
    }

    $scope.addSceneLights = function (light) {
        if ($scope.editScene == true) {
            if (light.isSceneSelected == false) {
                // $scope.selectedSceneLights.push({ name: light.lightName, address: light.address,id:light.id, dimLevel: $scope.sceneSlider })
                $scope.zones[$scope.zoneIndex].scenes.lights = {}
                $scope.zones[$scope.zoneIndex].scenes.forEach(function (sc) {
                    if (sc._id == $scope.selectedSceneId) {
                        console.log("before adding lights")
                        console.log(sc)
                        sc.lights = {}
                        sc.lights = $scope.selectedSceneLights
                        sc.lights.push({
                            name: light.name,
                            // address: light.bles.address,
                            lightIntensity: $scope.sceneSlider,
                            lightId: light._id
                        })
                        console.log("after adding lights")
                        console.log(sc)
                    }
                })
                // $scope.zones[$scope.zoneIndex].scenes[$scope.sceneIndex].lights.push({ name: light.lightName, address: light.address, dimLevel: $scope.sceneSlider })
                light.isSceneSelected = true;
            }
        } else {
            var len = $scope.zones[$scope.zoneIndex].scenes.length - 1;
            // $scope.zoneScene
            if (light.isSceneSelected == false) {
                $scope.zones[$scope.zoneIndex].scenes[len].lights.push({
                    name: light.name,
                    // address: light.bles.address,
                    lightIntensity: $scope.sceneSlider,
                    lightId: light._id
                })
                light.isSceneSelected = true;
            }
        }
        $mdDialog.hide();
    }

    $scope.sceneLights = function (scene) {
        console.log("printing scene in lights. get scene lights here")
        var data = {}
        $scope.selectedScene = scene
        data.sceneId = scene._id
        $scope.selectedSceneId = scene._id
        $http.post('/light/getSceneLights', data).then(function (response) {
            console.log("printing scene lights")
            console.log(response.data.msg)
            var sceneLights = response.data.msg
            $scope.selectedSceneLights = response.data.msg
            console.log("printing zone lights")
            $scope.Lightsdata.forEach(function (zl) {
                zl.isSceneSelected = false;
                zl.dimValue = 99
                sceneLights.forEach(function (sl) {
                    if (sl.lightId == zl._id) {
                        zl.isSceneSelected = true;
                        zl.dimValue = (sl.lightIntensity) / 100
                    }
                })
            })
        }, function (err) {
            console.log(err.data.err)
            $scope.selectedSceneLights = []
            $scope.Lightsdata.forEach(function (zl) {
                zl.isSceneSelected = false;
                zl.dimValue = 99
            })
            $scope.errorToast(err.data.err);
        })
    }

    $scope.editSceneLights = function () {
        $scope.zoneMode = 'scenes';
        $scope.editScene = true;
        $scope.createNewScene = false;
    }

    $scope.deleteScene = function () {
        scene = $scope.selectedScene
        $scope.zoneMode = 'scenes'
        var data = {}
        // console.log(scene)
        // console.log($scope.zones[$scope.zoneIndex].scenes)
        data.sceneId = scene._id
        data.zoneId = $scope.selectedZoneId
        $http.post('/light/deleteScene', data).then(function (response) {
            $scope.Lightsdata.forEach(function (zl) {
                zl.isSceneSelected = false;
                zl.dimValue = 99
            })
            $scope.zones.forEach(function (lz) {
                if (lz.id == $scope.selectedZoneId) {
                    for (var i = 0; i < lz.scenes.length; i++) {
                        if (lz.scenes[i]._id == scene._id) {
                            lz.scenes.splice(i, 1)
                            $scope.successToast("scene deleted successfully")
                        }
                    }
                }
            })
        }, function (err) {
            $scope.errorToast(err.data.err)
        });
    }

    $scope.saveScene = function () {
        $scope.createNewScene = false;
        $scope.editScene = false;
        // console.log("printing scenes")
        var zoneScenes = $scope.zones[$scope.zoneIndex].scenes
        zoneScenes.forEach(function (sc) {
            if (!sc._id) {
                sc._id = sc.id
            } else {
                sc.id = sc._id
            }
            if (sc.id == $scope.selectedSceneId) {

                console.log('printing scenes')
                data = {}
                // if ($scope.editScene)
                data.sceneId = sc.id
                if ($scope.editSceneLights == 1) {
                    data.lights = $scope.selectedSceneLights
                    $scope.editSceneLights = 0
                } else {
                    data.lights = sc.lights
                }
                $http.post('/light/addScenelights', data).then(function (response) {
                    $scope.successToast(response.data.msg)
                    console.log(response)
                }, function (err) {
                    $scope.errorToast(err.data.err)
                })
            }
        })
    }
    /*-------------------------------------------------------------schedule Functions Of Zones---------------------------------------*/

    $scope.newSchedule = function () {
        $scope.successToast('Select or Deselect Lights to schedule');
        $scope.zoneMode = 'schedules'
        $scope.schedule = {};
        $scope.schedule.lights = []
        $scope.schedule.days = [];
        $scope.createNewSchedule = true;
        $scope.Lightsdata.forEach(function (li) {
            li.isSceneSelected = false;
            li.isSchedule = false;
            li.dimValue = 99;
        })
        $scope.editSchedule = false;
    }

    $scope.addScheduleLights = function (light) {
        if ($scope.editSchedule == true) {
            if (light.isSchedule == false) {
                light.isSchedule = true;
                light.dimValue = $scope.lightSlider / 100;
                $scope.zones[$scope.zoneIndex].schedules.lights = {}
                $scope.zones[$scope.zoneIndex].schedules.forEach(function (sc) {
                    if (sc._id == $scope.selectedScheduleId) {
                        console.log("before adding lights")
                        console.log(sc)
                        sc.lights = []
                        if($scope.selectedScheduleLights){
                            if($scope.selectedScheduleLights.length > 0){
                                sc.lights = $scope.selectedScheduleLights
                            }
                        }
                        
                        sc.lights.push({
                            name: light.name,
                            lightIntensity: $scope.lightSlider,
                            lightId: light._id
                        })
                        console.log("after adding lights")
                        console.log(sc)
                    }
                })
                light.isScheduleSelected = true;
            }
        } else {
            if (light.isSchedule == false) {
                $scope.schedule.lights.push({
                    dimLevel: $scope.lightSlider,
                    lightId: light._id
                })
                light.isSchedule = true;
                light.dimValue = $scope.lightSlider / 100;
            }
        }
        $mdDialog.hide();
    }

    $scope.createSchedule = function () {
        $scope.zoneMode = 'schedules';
        $scope.days.forEach(function (d) {
            d.isDaySelected = 'no';
        })
        $mdDialog.show({
            templateUrl: 'template/scheduleDialog1',
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true
        })
        $scope.editSchedule = false;
    }

    $scope.selectDays = function (daysId) {
        if ($scope.editSchedule == true) {
            if ($scope.days[daysId].isDaySelected == 'yes') {
                $scope.zones[$scope.zoneIndex].schedules.forEach(function (sch) {
                    if (sch._id == $scope.selectedScheduleId) {
                        for (var i in sch.days) {
                            if (sch.days[i] == daysId) {
                                sch.days.splice(i, 1);
                                $scope.days[daysId].isDaySelected = 'no'
                            }
                        }
                    }
                })
            } else {
                $scope.zones[$scope.zoneIndex].schedules.forEach(function (sch) {
                    if (sch._id == $scope.selectedScheduleId) {
                        sch.days.push(daysId);
                        $scope.days[daysId].isDaySelected = 'yes'
                    }
                })
            }
        } else {
            if ($scope.days[daysId].isDaySelected == 'yes') {

                for (var i in $scope.schedule.days) {
                    if ($scope.schedule.days[i] == daysId) {
                        $scope.schedule.days.splice(i, 1)
                        $scope.days[daysId].isDaySelected = 'no';
                    }
                }
            } else {
                $scope.days[daysId].isDaySelected = 'yes';
                $scope.schedule.days.push(daysId)
            }
        }

    }

    $scope.scheduleLights = function (schedule) {
        $scope.selectedSchedule = schedule
        var data = {}
        data.scheduleId = schedule._id
        $scope.selectedScheduleId = schedule._id
        $http.post('/light/getScheduleLights', data).then(function (response) {
            var scheduleLights = response.data.msg
            $scope.selectedScheduleLights = response.data.msg
            $scope.Lightsdata.forEach(function (zl) {
                zl.isSchedule = false;
                zl.dimValue = 99
                scheduleLights.forEach(function (sl) {
                    if (sl.lightId == zl._id) {
                        zl.isSchedule = true;
                        zl.dimValue = (sl.lightIntensity) / 100
                    }
                })
            })
        }, function (err) {
            console.log(err.data.err)

            $scope.Lightsdata.forEach(function (zl) {
                zl.isSchedule = false;
                zl.dimValue = 99
            })
            $scope.errorToast(err.data.err);
        })
        $scope.editSchedule = false;
    }

    $scope.editScheduleLights = function (schedule) {
        $scope.editSchedule = true;
        $scope.createNewSchedule = false;
        $scope.startTimeChanged = false;
        $scope.endTimeChanged = false;
        $scope.zoneMode = 'schedules';
        $scope.successToast('Select or Deselect the lights of Schedule');
    }

    $scope.saveSchedule = function () {
        var scheduleDays = $scope.selectedRoom.scheduleDays;
        var startTimeF = $scope.selectedRoom.startTime.toString();;
        var endTimeF = $scope.selectedRoom.endTime.toString();;
        var startTimeA = startTimeF.split(".");
        var startHours = startTimeA[0];
        if(startTimeA[1]){startMinutes =  startTimeA[1]}else{startMinutes =  '00'}
        var startTime = startHours+":"+startMinutes; 
        
        var endTimeA = endTimeF.split(".");
        var endHours = endTimeA[0];
        if(endTimeA[1]){endMinutes =  endTimeA[1]}else{endMinutes =  '00'}
        var endTime = endHours+":"+endMinutes; 
        
        var days = $scope.selectedRoom.scheduleDays;
        var sameSchedule = 0
        if ($scope.editSchedule == false) {
            $scope.zones[$scope.zoneIndex].schedules.forEach(function (sch) {
                if (sch.name == $scope.sName) {
                    sameSchedule = 1;
                    $scope.errorToast('Schedule Name Exist')
                }
            })
        }
        if (sameSchedule == 0) {
            if ($scope.editSchedule == true) {
                var timeZone = 0;
                if (timeZone == 0) {
                   var i = 0
                    $scope.zones[$scope.zoneIndex].schedules.forEach(function (sch) {
                        i++
                        if (sch._id == $scope.selectedScheduleId) {
                            var schlights
                            if ($scope.editSchedLights == 1) {
                                schlights = $scope.schedule.lights
                                sch.lights = schlights
                            }
                            else
                                schlights = sch.lights
                            $scope.zones[$scope.zoneIndex].schedules.splice(i, 1)
                            var newSchedule = {
                                name: $scope.sName,
                                sTime: startTime,
                                eTime: endTime,
                                lights: schlights,
                                days: days
                            }
                            $scope.zones[$scope.zoneIndex].schedules.push(newSchedule)
                            $scope.createNewSchedule = false;
                            $scope.presentSchedule = $scope.zones[$scope.zoneIndex].schedules.length - 1;
                            $scope.previousSchedule = $scope.zones[$scope.zoneIndex].schedules.length - 1;
                            data = {}
                            data.zoneId = $scope.selectedZoneId
                            data.schedule = newSchedule
                            data.update = 1
                            $http.post('/light/createSchedule', data).then(function (response) {
                                // $http.post('/light/checkLightSchedule',data).then(function(response){
                                $scope.editSchedLights = 0
                                $scope.successToast(response.data.msg)
                            }, function (err) {
                                $scope.errorToast(err.data.err)
                            })
                            // $scope.successToast('New schedule created')
                        }
                    })

                }
            } else {
                var timeZone = 0;
                if (timeZone == 0) {
                    var newSchedule = {
                        name: $scope.sName,
                        sTime: startTime,
                        eTime: endTime,
                        lights: $scope.schedule.lights,
                        days: days
                    }
                    $scope.zones[$scope.zoneIndex].schedules.push(newSchedule)
                    $scope.createNewSchedule = false;
                    $scope.presentSchedule = $scope.zones[$scope.zoneIndex].schedules.length - 1;
                    $scope.previousSchedule = $scope.zones[$scope.zoneIndex].schedules.length - 1;
                    data = {}
                    data.zoneId = $scope.selectedZoneId
                    data.schedule = newSchedule
                    $http.post('/light/createSchedule', data).then(function (response) {
                        $scope.successToast(response.data.msg)
                    }, function (err) {
                        $scope.errorToast(err.data.err)
                    })
                    $scope.successToast('New schedule created')
                    $mdDialog.hide();
                }
            }
        }
    }
   function getHoursMinutesFloat(time){
        return (time/(60*60));
    }

    $scope.updateSchedule = function () {
        $scope.selectedRoom = {}
        $scope.zones[$scope.zoneIndex].schedules.forEach(function (sch) {
            if (sch._id == $scope.selectedScheduleId) {
                $scope.sName = sch.name;
                $scope.selectedRoom.startTime = parseFloat(getHoursMinutes(sch.startTime));
                $scope.selectedRoom.endTime = parseFloat(getHoursMinutes(sch.endTime));
                $scope.selectedRoom.scheduleDays = sch.days;    
                var counter = 0
                var pendingDays = $scope.days.length
            }
        })
        $mdDialog.show({
            templateUrl: 'template/scheduleDialog1',
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true
        })
    }

    $scope.deleteSchedule = function (schedule) {
        var data = {}
        console.log(scene)
        console.log($scope.zones[$scope.zoneIndex].scenes)
        data.scheduleId = schedule._id
        data.zoneId = $scope.selectedZoneId
        $http.post('/light/deleteSchedule', data).then(function (response) {
            $scope.Lightsdata.forEach(function (zl) {
                zl.isSchedule = false;
                zl.dimValue = 99
            })
            $scope.zones.forEach(function (lz) {
                if (lz.id == $scope.selectedZoneId) {
                    for (var i = 0; i < lz.schedules.length; i++) {
                        if (lz.schedules[i]._id == schedule._id) {
                            lz.schedules.splice(i, 1)
                            $scope.successToast("scene deleted successfully")
                        }
                    }
                }
            })
        }, function (err) {
            $scope.errorToast(err.data.err)
        })
    }


    $scope.SendToHost = function () {
        $scope.zoneSelected = (($scope.zoneSelected) ? JSON.parse($scope.zoneSelected) : $scope.zoneSelected);
        $scope.makingAjaxCall = true;

        var finalbodytohost = {}

        if ($scope.zoneSelected && $scope.zones[$scope.zoneSelected] && $scope.zones[$scope.zoneSelected].id) {

            $http.post('/light/SubmitToHost', { floorId: JSON.parse($scope.floorSelected)._id }).then(function (response) {

                console.log(response);

                $scope.makingAjaxCall = false;

                $rootScope.showToast(response.data, 'success-toast', 'top center')

            }, function (err) {
                $scope.makingAjaxCall = false;
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })

        } else {

            $rootScope.showToast("Please select Zone", 'error-toast', 'top center')
        }

    };

}])

function getHoursMinutes(sec) {
    var seconds = (sec).toFixed(0);
    var minutes = Math.floor(seconds / 60);
    var hours = "";
    if (minutes > 59) {
        hours = Math.floor(minutes / 60);
        hours = (hours >= 10) ? hours : "0" + hours;
        minutes = minutes - (hours * 60);
        minutes = (minutes >= 10) ? minutes : "0" + minutes;
    }

    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return hours + "." + minutes;
}
