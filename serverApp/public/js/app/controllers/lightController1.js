app.controller('lightcontrol1',['$stateParams', '$resource', '$location','$scope','$http','$timeout','$mdDialog','$mdToast', function($stateParams, $resource, $location, $scope, $http, $timeout, $mdDialog, $mdToast) {
    $scope.Lightsdata ;
    $scope.selectedLight;
    var buildingId = $stateParams.bldgId
    $scope.parent_switch = true;
    $scope.group = true;
    $scope.num;
    $scope.slideGroups = 99;
    $scope.lightSlider = 99;
    $scope.lightSwitch;
    $scope.selectedRoom;
    $scope.customLights = [];
    $scope.Tunelightslider = 0;
    // $scope.warmArray = [71, 67, 63, 59, 56, 52, 48, 44, 40, 36, 32, 28, 25, 21, 17, 13, 10, 7, 5]
    // $scope.coolArray = [5, 7, 10, 13, 17, 21, 25, 28, 32, 36, 40, 44, 48, 52, 56, 59, 63, 67, 71]
    $scope.arrayCount = 0;
    $scope.presentZone;
    $scope.previousZone = 'noZone';
    $scope.sceneSelected = 'Scene1';
    $scope.floors;
    $scope.zoneLights;
    // var socket = io.connect('http://localhost:3031');
    // socket.on('sensorData', function(data) {
    //     $scope.$apply(function() {
    //         console.log('socketdata')
    //         console.log(data)
    //         $scope.Lightsdata = data.msg;
            
    //         //Test this code

    //         // var sockLights = data.msg
    //         // $scope.Lightsdata.forEach(function(light){
    //         //     for(var i = 0;i<sockLights.length;i++){
    //         //         if(sockLights[i].id == light.id){
    //         //             light.intensity = sockLights[i].intensity;
    //         //         }
    //         //     }
    //         // })
    //         console.log('socket changed')
    //         console.log($scope.Lightsdata)
    //     });
    // });
    $http.get('/app/api/floors/'+buildingId).then(function(response){
        $scope.floors = response.data;
        // $scope.selectedFloor = $scope.floors[0];
        // $scope.floorSelected = $scope.floors[0]._id;
        $scope.pageTitle = $scope.selectedFloor.alias
        getAllLightsFloor($scope.selectedFloor)
        getZones($scope.floorSelected)
        getAllrooms($scope.selectedFloor)
    }, function(err){
        console.log(err)
    });
    $scope.onFloorChange = function(floor){
        console.log(floor)
        console.log($scope.selectedFloor)
        $scope.currentFloor = JSON.parse(floor);
        getZones(JSON.parse($scope.selectedFloor)._id);
        getAllLightsFloor(JSON.parse($scope.selectedFloor))
    }
    function getZones(floorId){
        console.log('in get zones')
            $http.get('/light/getZonesFloor/'+floorId).then(function(response){
            $scope.zones = response.data.msg;
            $scope.selectedZones = $scope.zones[0];
            console.log(response.data)
        }, function(err){
            console.log(err)
        });    
    }
    function getZoneLights(){
        $scope.noScene = true
        var floorId = JSON.parse($scope.selectedFloor)._id
        var zoneId = $scope.roomSelected
        console.log(zoneId)    
        if(zoneId=='all'){
            $scope.noScene = true
            $scope.zoneLights = $scope.Lightsdata
             $scope.Lightsdata.forEach(function(light){
                light.isSelected = 'yes'    
                $scope.zoneScenes = 'No Scene'
            })
        }else if(zoneId=="custom"){
            $scope.noScene = true
             $scope.Lightsdata.forEach(function(light){
                light.isSelected = 'no'
                $scope.zoneScenes = 'No Scene'    
            })

        }else{
            $scope.noScene = false
            $http.get('/light/getZoneLights/'+floorId+'/'+zoneId).then(function(response){
                 data = response.data.msg
                 $scope.zoneLights = data.lights
                 $scope.zoneScenes = data.scenes
                 $scope.Lightsdata.forEach(function(light){
                    light.isSelected = 'no'
                    $scope.zoneLights.forEach(function(zl){
                        if(zl.address === light.address){
                            light.isSelected = 'yes'    
                        }
                    })
                 })
            }, function(err){
                console.log(err)
            });
        }
        }
        function getAllrooms(floor){
            var floorId = floor._id 
        $http.get('/app/api/roomData/'+floorId).then(function(response){
            $scope.rooms = response.data
        })
    }
    function getRoomStatus(floor){
        var floorId = floor._id
        $http.get('/app/api/roomStatus/5a8aacdd1c2043b454275713').then(function(response){
            $sope.roomData = response.data
        })
    }
    // $http({ method: 'GET', url: 'Lights.json'
    //  }).then(function(response){
    //      $scope.Lightsdata = response.data;
    //  },function(error){
    //      console.log(error);
    //  })

    function getAllLightsFloor(floor){
        console.log("in get light floor")
        var floorId = floor._id; 
        $http.get('/light/getlights',{params:{floorId:floorId}}).then(function(response){
             $scope.Lightsdata = response.data.document;
        }, function(err){
            console.log(err);
        });
         $http.get('/light/getAllSOS/'+floorId).then(function(response){
             $scope.smartSensorData = response.data.msg;
             console.log($scope.smartSensorData)
        }, function(err){
            console.log(err)
        });
    }
     $scope.showActionToast = function() {
        $mdToast.show (
          $mdToast.simple()
          .textContent('Select Some Lights To Control')                       
          .position('top')
          .theme('error-toast')
          .hideDelay(300)
       );
    };

    $scope.showActionToast1 = function() {
        $mdToast.show (
          $mdToast.simple()
          .textContent('Select Custom Control')                       
          .position('top')
          .theme('error-toast')
          .hideDelay(300)
       );
    };

    $scope.showActionToast2 = function() {
        $mdToast.show (
          $mdToast.simple()
          .textContent('Select Some Divisions')                       
          .position('top')
          .theme('error-toast')
          .hideDelay(300)
       );
    };

    $scope.saveSection = function()         /*runs when md-select changes*/
    {
        $scope.num = $scope.roomSelected;
        console.log($scope.roomSelected)
        getZoneLights()
    }

    $scope.singleLight = function(ev, light, num)        /*pop-up window on right-click*/
    {                                
        $scope.lightSelected = light;
        $scope.lightSwitch = light.state;
        $scope.lightSlider = light.dimValue;
        $scope.selectedIndex = num;
        $mdDialog.show({
            templateUrl: 'template/lightDialog',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            scope : $scope,
            preserveScope : true
        })           
    }   
    $scope.singleSwitch = function(light)           /*md-switch in pop-up window*/
    {      
        console.log('in single switch')
        if($scope.selectedIndex == 5 || $scope.selectedIndex == 6 || $scope.selectedIndex == 7)
        {
            console.log("in if 1")
            if($scope.lightSwitch){
                if(light.address)
                {
                    console.log("in if 2")
                    // $http.post('http://192.168.1.7:8080/intensityLevel',{value:light.dimValue, address: light.address}).then(function(response){  
                    // })
                }
                else
                {
                    console.log("in if 3")
                    light.state = $scope.lightSwitch;
                    // $http.post('http://192.168.1.7:8080/setOnOffLights',{command:light.cmdOn}).then(function(response){  
                    // })
                }   
            }
            else
            {
                console.log("in if 4")
                 if(light.address)
                {
                    console.log("in if 5")
                }
                else
                {
                    console.log("in if 6")
                    light.state = $scope.lightSwitch;
                    // $http.post('http://192.168.1.7:8080/setOnOffLights',{command:light.cmdOff}).then(function(response){  
                    // })
                }   
            }
        }   
        else
        { 
            console.log("in if 7")
            if($scope.lightSwitch){
                console.log("in if 8")
                console.log(light.dimValue)

                $http.post('light/setLightIntensity',{ address: light.address,hostName:light.hostName,intensity:99,lightDetail:light}).then(function(response){  
                })
                light.state = $scope.lightSwitch;
                $scope.lightSlider = light.dimValue;
            } else {
                console.log("in if 9")
                console.log($scope.lightSlider)
                $http.post('light/setLightIntensity',{intensity:0, address: light.address,hostName:light.hostName,lightDetail:light}).then(function(response){  
                })
                light.state = $scope.lightSwitch;
                $scope.lightSlider = 0;
            }
        }
    }

    $scope.singleSlider = function(light)           /*md-slider in pop-up window*/
    {
        console.log('in slider')
        if($scope.lightSlider > 0){
            $http.post('light/setLightIntensity',{intensity:$scope.lightSlider, address: light.address,hostName:light.hostName,lightDetail:light}).then(function(response){ })
            $scope.lightSwitch= true;
            light.state = true;
        }
        light.dimValue = $scope.lightSlider;
        light.intensity =  $scope.lightSlider;
        console.log($scope.lightSlider)
    }

    $scope.groupSwitch = function(zoneId, state)       /*md-switch when division selected and custom controll*/
    {
        var data  ={}
        var intensity
        if(state == true){
            intensity = 99
        } else{
            intensity =0 
        }
        if($scope.num == 'all'){
            data.lights = $scope.zoneLights
            $http.post('/light/toggleAllFloorLights/'+$scope.floorSelected).then(function(response){
                console.log(response.data.msg)
            }, function(err){
                console.log(err)
            });
        } else if($scope.num == 'custom'){
             if($scope.customLights.length > 0)
                {
                    data.lights = $scope.customLights
                    data.intensity = intensity
                    $http.post('/light/toggleCustomLights',data).then(function(response){
                        console.log(response.data.msg)
                    }, function(err){
                        console.log(err)
                    });
                }
                else
                {
                    $scope.showActionToast();
                    $scope.group = true;
                }
            }else{
                data.lights = $scope.zoneLights
                data.intensity = intensity
                $http.post('/light/toggleLights',data).then(function(response){
                console.log(response.data.msg)
                }, function(err){
                    console.log(err)
                });
            }
    };

    $scope.groupSlider = function()
    {
        console.log($scope.roomSelected)
        var intensity = $scope.slideGroups
        if($scope.num == 'all')
        {
            data.floorId = $scope.floorSelected
            data.intensity = intensity
            $http.post('/light/toggleAllFloorLights/'+$scope.floorSelected).then(function(response){
                console.log(response.data.msg)
            }, function(err){
                console.log(err)
            });
        }
        else if($scope.num == 'custom'){
            console.log('in custom slider')
            if($scope.customLights.length > 0)
                {
                    data.lights = $scope.customLights
                    data.intensity = intensity
                    $http.post('/light/toggleCustomLights',data).then(function(response){
                        console.log(response.data.msg)
                    }, function(err){
                        console.log(err)
                    });
                }
                else
                {
                    $scope.showActionToast();
                    $scope.group = true;
                }
        }
        else
        {
            console.log('in zone slider')
            data.lights = $scope.zoneLights
            data.intensity = intensity
            $http.post('/light/toggleLights',data).then(function(response){
            console.log(response.data.msg)
            }, function(err){
                    console.log(err)
            });
        }
    }

    $scope.sceneChange = function(){
        console.log($scope.sceneSelected)
        sceneId = $scope.sceneSelected
         $http.get('/light/applyScene/'+sceneId).then(function(response){
             console.log(response.data.msg)
             
        }, function(err){
            console.log(err)
        });    
    }


    $scope.selectLight = function(light){
        if($scope.num == 'custom'){
            if(light.isSelected == 'yes'){
                for(var i in $scope.customLights){
                    if($scope.customLights[i] == light.id){
                        light.isSelected = 'no'
                        $scope.customLights.splice(i,1)
                    }
                }
            } else {
                $scope.customLights.push(light.id);
                light.isSelected = 'yes';
            }
        } else {
            $scope.showActionToast1();
        }
    }   

    $scope.sub = function()
    {
        if($scope.arrayCount <= 0)
        {
            $scope.Tunelightslider = 0
        }
        else
        {
            $scope.arrayCount = $scope.arrayCount - 1;
            $scope.Tunelightslider =$scope.coolArray[$scope.arrayCount]
            $scope.tunableLight();
        }
    }

    $scope.Add = function()
    {
        if($scope.arrayCount >= 19      )
        {
            $scope.Tunelightslider = 71
        }
        else
        {
            $scope.arrayCount = $scope.arrayCount + 1;
            $scope.Tunelightslider = $scope.coolArray   [$scope.arrayCount]
            $scope.tunableLight();
            
        }
    }

}])

// app.directive('ngRightClick', function($parse) {
//     return function(scope, element, attrs) {
//         var fn = $parse(attrs.ngRightClick);
//         element.bind('contextmenu', function(event) {
//             scope.$apply(function() {
//                 event.preventDefault();
//                 fn(scope);
//             });
//         });
//     };
// });
