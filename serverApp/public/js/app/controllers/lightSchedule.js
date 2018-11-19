app.controller('lightSchedule', function($scope, $http, $mdDialog, $mdSidenav) {
    $scope.Lightsdata ;
    $scope.schedules = [];
    $scope.parent;
    $scope.child;
    $scope.ExistingLight
    $scope.scheduleSelected;
    $scope.previousSchedule;
    $scope.glowLight = false;
    $scope.lightIndex;
    $scope.layout = false;
    $scope.days = [
                    {
                        'id':'S',
                        'name':'Sun',
                        'isDaySelected':'no'
                    },
                    {
                         'id':'M',
                        'name':'Mon',
                        'isDaySelected':'no'
                    },
                    {
                         'id':'T',
                        'name':'Tue',
                        'isDaySelected':'no'
                    },
                    {
                         'id':'W',
                        'name':'Wed',
                        'isDaySelected':'no'
                    },
                    {
                         'id':'T',
                        'name':'Thu',
                        'isDaySelected':'no'
                    },
                    {
                         'id':'F',
                        'name':'Fri',
                        'isDaySelected':'no'
                    },
                    {
                        'id':'S',
                        'name':'Sat',
                        'isDaySelected':'no'
                    }
                  ];

    $('#startTime').timepicker({
        'step':15,
        'timeFormat': 'H:i:s'
    });

     $('#endTime').timepicker({
        'step':15,
        'timeFormat': 'H:i:s'
    });
    
    $http({ method: 'GET', url: 'Lights.json'
     }).then(function(response){
         $scope.Lightsdata = response.data;
     },function(error){
         console.log(error);
     })

     $http.get("/api/readSchedule").then(function(response){
        console.log(response.data)
        $scope.schedules = response.data;
     })

    $scope.addSchedule = function(){
        if(($scope.sTime == "") || ($scope.eTime == ""))
        {
            console.log("select start and end time");
            alert("select start and end time");
        }
        else
        {
            $scope.schedules.push({'name':'Schedule','sTime':$scope.sTime,'eTime':$scope.eTime,'ladLights':[],'relayLights':[], 'days':[]});
            console.log($scope.eTime);
        }
    }

    $scope.singleLight = function(ev, light, parent, child)        /*pop-up window on right-click*/
    {                 
        $scope.parent = parent;
        $scope.child = child;               
        $scope.lightSelected = light;
        $scope.lightIndex = 0;
        $scope.ExistingLight = 0;
        $scope.ladLightPresent = false;
        $scope.relayLightPresent = false;
        $scope.ExistingLights($scope.lightSelected)
        $mdDialog.show({
            templateUrl: 'template/scheduleDialog',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            scope : $scope,
            preserveScope : true
        })           
    }   

    $scope.selectSchedule = function(num)
    {
        if($scope.scheduleSelected == num)
        {
            $scope.previousSchedule = $scope.previousSchedule;
            $scope.scheduleSelected = num;
        }
        else
        {
            $scope.previousSchedule = $scope.scheduleSelected;
            $scope.scheduleSelected = num;
        }
        $scope.schedules[$scope.previousSchedule].relayLights.forEach(function(light){
            $scope.Lightsdata.sections[light.parent].lights[light.child].isSelected = 'no';
            $scope.Lightsdata.sections[light.parent].lights[light.child].dimValue = 99;
        })
        $scope.schedules[$scope.previousSchedule].ladLights.forEach(function(light){
            $scope.Lightsdata.sections[light.parent].lights[light.child].isSelected = 'no';
            $scope.Lightsdata.sections[light.parent].lights[light.child].dimValue = 99;
        })
        
        $scope.schedules[num].relayLights.forEach(function(light){
            $scope.Lightsdata.sections[light.parent].lights[light.child].isSelected = 'yes';
            // $scope.Lightsdata.sections[light.parent].lights[light.child].dimValue = light.dimLevel/100;
        }) 
        $scope.schedules[num].ladLights.forEach(function(light){
            $scope.Lightsdata.sections[light.parent].lights[light.child].isSelected = 'yes';
            // $scope.Lightsdata.sections[light.parent].lights[light.child].dimValue = light.dimLevel/100;
        })

        $scope.schedules[$scope.previousSchedule].days.forEach(function(day){
            $scope.days[day].isDaySelected = 'no'
        })
        $scope.schedules[num].days.forEach(function(day){
            $scope.days[day].isDaySelected = 'yes'
        })
        $scope.sTime = $scope.schedules[num].sTime
        $scope.eTime = $scope.schedules[num].eTime

    }

    $scope.ExistingLights = function(light)
    {
        if(light.address == "")
        {
            $scope.schedules[$scope.scheduleSelected].relayLights.forEach(function(addr){
                if($scope.relayLightPresent == false)
                {
                    if(addr.command == light.cmdOn || addr.command == light.cmdOff)
                    {
                        $scope.ExistingLight = 1;
                        $scope.relayLightPresent = true;
                    }
                    else
                    {
                        $scope.lightIndex = $scope.lightIndex + 1;
                    }
                }
            })
        }
        else
        {
            $scope.schedules[$scope.scheduleSelected].ladLights.forEach(function(addr){
                if($scope.ladLightPresent == false)
                {
                    if(addr.address == light.address)
                    {
                        $scope.ExistingLight = 1;
                        $scope.ladLightPresent = true;
                    }
                    else
                    {
                        $scope.lightIndex = $scope.lightIndex + 1;
                    }
                }
            })
        }
    }

    $scope.scheduleLights = function(light, parent, child)
    {
        if($scope.ExistingLight == 1)
       {
            if(light.address == "")
            {
                if($scope.lightSwitch == true)
                {
                    $scope.schedules[$scope.scheduleSelected].relayLights[$scope.lightIndex].command = light.cmdOn;
                    // $scope.schedules[$scope.scheduleSelected].relayLights[$scope.lightIndex].dimLevel = 99;
                    // $scope.schedules[$scope.scheduleSelected].relayLights[$scope.lightIndex].status = $scope.lightSwitch;
                    $scope.Lightsdata.sections[parent].lights[child].dimValue = $scope.lightSlider/100;
                    $scope.Lightsdata.sections[parent].lights[child].schedules.forEach(function(addr){
                        if(addr.schedule == $scope.scheduleSelected)
                        {
                            addr.dimLevel = 99;
                        }
                    })
                }
                else
                {
                    $scope.schedules[$scope.scheduleSelected].relayLights[$scope.lightIndex].command = light.cmdOff;
                   // $scope.schedules[$scope.scheduleSelected].relayLights[$scope.lightIndex].dimLevel = 0;
                   // $scope.schedules[$scope.scheduleSelected].relayLights[$scope.lightIndex].status = $scope.lightSwitch;
                    $scope.Lightsdata.sections[parent].lights[child].dimValue = $scope.lightSlider/100;
                    $scope.Lightsdata.sections[parent].lights[child].schedules.forEach(function(addr){
                        if(addr.schedule == $scope.scheduleSelected)
                        {
                            addr.dimLevel = 0;
                        }
                    })
                }
                
            }
            else
            {
                //$scope.schedules[$scope.scheduleSelected].ladLights[$scope.lightIndex].status = $scope.lightSwitch;
                $scope.schedules[$scope.scheduleSelected].ladLights[$scope.lightIndex].dimLevel = $scope.lightSlider;
                $scope.Lightsdata.sections[parent].lights[child].dimValue = $scope.lightSlider/100;
                $scope.Lightsdata.sections[parent].lights[child].schedules.forEach(function(addr){
                    if(addr.schedule == $scope.scheduleSelected)
                    {
                        addr.dimLevel = $scope.lightSlider;
                    }
                })
            }
       }
       else
       {    
            if(light.address == "")
            {
                if($scope.lightSwitch == true)
                {

                   $scope.schedules[$scope.scheduleSelected].relayLights.push({'command':light.cmdOn,'parent':$scope.parent,'child':$scope.child})
                   light.isSelected = 'yes'
                   $scope.Lightsdata.sections[parent].lights[child].schedules.push($scope.scheduleSelected)
                }
                else
                {
                    $scope.schedules[$scope.scheduleSelected].relayLights.push({'command':light.cmdOff,'parent':$scope.parent,'child':$scope.child})
                    light.isSelected = 'yes'
                    $scope.Lightsdata.sections[parent].lights[child].schedules.push($scope.scheduleSelected)
                }
            }
            else
            {
                var timeZone = 0;
                var psTime = $scope.schedules[$scope.scheduleSelected].sTime.split(':');
                var peTime = $scope.schedules[$scope.scheduleSelected].eTime.split(':');
                var psString = psTime[0]+"."+psTime[1]
                var peString = peTime[0]+"."+peTime[1]
                light.schedules.forEach(function(t){
                    $scope.schedules[$scope.scheduleSelected].days.forEach(function(d){
                        $scope.schedules[t].days.forEach(function(d1){
                            if(d == d1)
                            {
                                var tsTime = $scope.schedules[t].sTime.split(':');
                                var teTime = $scope.schedules[t].eTime.split(':');
                                var tsString = tsTime[0]+"."+tsTime[1];
                                var teString = teTime[0]+"."+teTime[1];
                                if(timeZone == 0)
                                {
                                    if((psString > tsString) && (psString < teString))
                                    {
                                        alert("scheduled")
                                        timeZone = 1;
                                    }
                                    else if((peString >= tsString) && (peString <= teString))
                                    {
                                        alert("scheduled")
                                        timeZone = 1;
                                    }
                                    else if((psString < tsString) && (peString > teString))
                                    {
                                        alert("scheduled")
                                        timeZone = 1;
                                    }
                                    else if((psString < teString) && (peString > teString))
                                    {
                                        alert("scheduled")
                                        timeZone = 1;
                                    }
                                    else
                                    {
                                        timeZone = 0;
                                    }
                                }
                            }
                        })
                    })
                })
                if(timeZone == 0)
                {
                    $scope.schedules[$scope.scheduleSelected].ladLights.push({'address':light.address,'parent':$scope.parent,'child':$scope.child, 'dimLevel':$scope.lightSlider})
                    light.isSelected = 'yes'
                    $scope.Lightsdata.sections[parent].lights[child].schedules.push($scope.scheduleSelected)
                    $scope.Lightsdata.sections[parent].lights[child].dimValue = $scope.lightSlider/100;
                }
            } 
       }
       $mdDialog.hide();
    }

    $scope.deleteLights = function(light, parent, child)
    {
        if(light.address == "")
        {
            $scope.schedules[$scope.scheduleSelected].relayLights.splice($scope.lightIndex,1)
            light.isSelected = 'no';
            for(var i in $scope.Lightsdata.sections[parent].lights[child].schedules)
            {
                if($scope.Lightsdata.sections[parent].lights[child].schedules[i].schedule == $scope.scheduleSelected)
                {
                    $scope.Lightsdata.sections[parent].lights[child].schedules.splice(i,1)
                    $scope.Lightsdata.sections[parent].lights[child].dimValue = 99;
                }
            }
            
        }
        else
        {
            $scope.schedules[$scope.scheduleSelected].ladLights.splice($scope.lightIndex,1)
             light.isSelected = 'no';
            for(var i in $scope.Lightsdata.sections[parent].lights[child].schedules)
            {
                if($scope.Lightsdata.sections[parent].lights[child].schedules[i].schedule == $scope.scheduleSelected)
                {
                    $scope.Lightsdata.sections[parent].lights[child].schedules.splice(i,1)
                    $scope.Lightsdata.sections[parent].lights[child].dimValue = 99;
                }
            }
        }
        $mdDialog.hide();
    }

    $scope.switchAndSlider = function()
    {
        if($scope.lightSwitch == true)
            $scope.lightSlider = 99;
        else
            $scope.lightSlider = 0;
    }

    $scope.runSchedules = function(num)
    {
        $scope.schedules[num].relayLights.forEach(function(addr){
            $http.post('http://192.168.1.7:8080/setOnOffLights',{command:addr.command}).then(function(response){ 
            })
        })

        $scope.schedules[num].ladLights.forEach(function(addr){
            $http.post('http://192.168.1.7:8080/intensityLevel',{value:addr.dimLevel, address: addr.address}).then(function(response){  
            })
        })
    }

    $scope.selectDays = function(daysId){
        if($scope.days[daysId].isDaySelected == 'yes')
        {
            $scope.days[daysId].isDaySelected = 'no';
            for(var i in $scope.schedules[$scope.scheduleSelected].days)
            {
                if($scope.schedules[$scope.scheduleSelected].days[i] == daysId)
                    $scope.schedules[$scope.scheduleSelected].days.splice(i, 1)
            }
        }
        else
        {
            $scope.days[daysId].isDaySelected = 'yes';
             $scope.schedules[$scope.scheduleSelected].days.push(daysId)
        }
    }   

    $scope.saveSTime = function(){
        $scope.schedules[$scope.scheduleSelected].sTime = $scope.sTime;
    }

    $scope.saveETime = function(){
        $scope.schedules[$scope.scheduleSelected].eTime = $scope.eTime;
    }

    $scope.scheduleSave = function(data) {
        console.log(data)
        $http.post('/api/scheduleFile',data).then(function(response){
            console.log(response.data)
        })
    }

})
