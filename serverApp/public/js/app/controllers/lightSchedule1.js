app.controller('lightSchedule1', function($scope, $http, $mdDialog, $mdSidenav) {
    $scope.Lightsdata ;
    $scope.new = false;
    $scope.edit = false;
    $scope.schedules = [];
    $scope.floors = [1,2,3,4,5]
    $scope.parent;
    $scope.child;
    $scope.ExistingLight
    $scope.scheduleSelected;
    $scope.previousSchedule = "noSchedule";
    $scope.glowLight = false;
    $scope.lightIndex;
    $scope.layout = false;
    $scope.selectedDays = []
    $scope.previousEdit = "edit";
    $scope.presentEdit;

    $scope.startTimeSettings = {
        // theme: 'ios-dark',
        display: 'inline',
        timeFormat: 'HH:ii',
        timeWheels: 'HHii',
        onChange: function(){
            $scope.sTime = $scope.sTime.getHours() + ":" + $scope.sTime.getMinutes();
        }
    };

    $scope.endTimeSettings = {
        // theme: 'ios-dark',
        display: 'inline',
        timeFormat: 'HH:ii',    
        timeWheels: 'HHii' ,
        onChange: function(){
            $scope.eTime = $scope.eTime.getHours() + ":" + $scope.eTime.getMinutes();    
        }    
    };


   var today = new Date();
    $scope.hour = today.getHours();
    $scope.minute = Math.floor(today.getMinutes() / 5) * 5;
    $scope.hours1 = 10;
    $scope.minutes1 = 40; 
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

    // $('#startTime').timepicker({
    //     'step':15,
    //     'timeFormat': 'H:i:s'
    // });

    //  $('#endTime').timepicker({
    //     'step':15,
    //     'timeFormat': 'H:i:s'
    // });
    
    // $scope.toggleLeft = buildToggler('scheduleside');

    // function buildToggler(componentId) {
    //   return function() {
    //     $mdSidenav(componentId).toggle();
    //   };
    // }
    $scope.toggleLeft = function(){
        $mdSidenav('scheduleside').toggle();
    }

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


     $scope.newSchedule = function()
     {
        $scope.new = true;
        $scope.edit = false;
        $scope.sName = "";
        $scope.sTime = "";
        $scope.eTime = "";
        $scope.days.forEach(function(d){
            d.isDaySelected = 'no'
        })
        $scope.selectedDays = [];
        $mdDialog.show({
            templateUrl: 'template/scheduleDialog2',
            clickOutsideToClose:true,
            scope : $scope,
            preserveScope : true
        })     
     }

     $scope.editSchedule = function(num)
     {
        $scope.new = false;
        $scope.edit = true;
        $scope.sName = $scope.schedules[num].name;
        $scope.sTime = $scope.schedules[num].sTime;
        $scope.eTime = $scope.schedules[num].eTime;
        $scope.selectedDays = [];
        if($scope.previousEdit == "edit")
        {
            $scope.previousEdit = num;
            $scope.presentEdit = num;
        }
        else
        {
            $scope.previousEdit = $scope.presentEdit;
            $scope.presentEdit = num;
        }
        $scope.schedules[$scope.previousEdit].days.forEach(function(day){
            $scope.days[day].isDaySelected = 'no'
        })
        $scope.schedules[num].days.forEach(function(day){
            $scope.days[day].isDaySelected = 'yes'
            $scope.selectedDays.push(day);
        })
        $mdDialog.show({
            templateUrl: 'template/scheduleDialog2',
            clickOutsideToClose:true,
            scope : $scope,
            preserveScope : true
        })  
        console.log($scope.previousEdit)
        console.log($scope.presentEdit) 
     }

     $scope.updateSchedule = function(){
        $scope.schedules[$scope.scheduleSelected].name = $scope.sName;
        $scope.schedules[$scope.scheduleSelected].sTime = $scope.sTime;
        $scope.schedules[$scope.scheduleSelected].eTime = $scope.eTime;
        $scope.schedules[$scope.presentEdit].days = [];
        $scope.schedules[$scope.presentEdit].days = $scope.selectedDays;
        $mdDialog.hide();
     }

    $scope.addSchedule = function(){
            // $scope.sTime = $scope.hours + ":" + $scope.minutes;
            // $scope.eTime = $scope.hours1 + ":" + $scope.minutes1;
            // $scope.sTime = $scope.sTime.getHours() + ":" + $scope.sTime.getMinutes();
            // $scope.eTime = $scope.eTime.getHours() + ":" + $scope.eTime.getMinutes();
            $scope.schedules.push({'name':$scope.sName,'sTime':$scope.sTime,'eTime':$scope.eTime,'ladLights':[],'relayLights':[], 'days':$scope.selectedDays});
            alert($scope.eTime);
            alert($scope.sTime);
            $mdDialog.hide();
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
            templateUrl: 'template/scheduleDialog3',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            scope : $scope,
            preserveScope : true
        })           
    }   

    $scope.selectSchedule = function(num)
    {
        if($scope.previousSchedule == "noSchedule")
        {
            $scope.previousSchedule = num;
            $scope.scheduleSelected = num;
        }
        else
        {
            $scope.previousSchedule = $scope.scheduleSelected;
            $scope.scheduleSelected = num;
        }
        if($scope.schedules[$scope.previousSchedule].relayLights.length > 0){
            $scope.schedules[$scope.previousSchedule].relayLights.forEach(function(light){
                $scope.Lightsdata.sections[light.parent].lights[light.child].isSelected = 'no';
                $scope.Lightsdata.sections[light.parent].lights[light.child].dimValue = 99;
            })
        }
        if($scope.schedules[$scope.previousSchedule].ladLights.length > 0){
            $scope.schedules[$scope.previousSchedule].ladLights.forEach(function(light){
                $scope.Lightsdata.sections[light.parent].lights[light.child].isSelected = 'no';
                $scope.Lightsdata.sections[light.parent].lights[light.child].dimValue = 99;
            })
        }
        if($scope.schedules[num].relayLights.length > 0){
            $scope.schedules[num].relayLights.forEach(function(light){
                $scope.Lightsdata.sections[light.parent].lights[light.child].isSelected = 'yes';
                $scope.Lightsdata.sections[light.parent].lights[light.child].dimValue = light.dimLevel/100;
            }) 
        }
        if($scope.schedules[num].ladLights.length > 0){
            $scope.schedules[num].ladLights.forEach(function(light){
                $scope.Lightsdata.sections[light.parent].lights[light.child].isSelected = 'yes';
                $scope.Lightsdata.sections[light.parent].lights[light.child].dimValue = light.dimLevel/100;
            })
        }

        // $scope.schedules[$scope.previousSchedule].days.forEach(function(day){
        //     $scope.days[day].isDaySelected = 'no'
        // })
        // $scope.schedules[num].days.forEach(function(day){
        //     $scope.days[day].isDaySelected = 'yes'
        // })
        // $scope.sTime = $scope.schedules[num].sTime
        // $scope.eTime = $scope.schedules[num].eTime

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
            for(var i in $scope.selectedDays)
            {
                if($scope.selectedDays[i] == daysId)
                    $scope.selectedDays.splice(i, 1)
            }
        }
        else
        {
            $scope.days[daysId].isDaySelected = 'yes';
             $scope.selectedDays.push(daysId)
        }
        // $scope.selectedDays.push(daysId)
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


