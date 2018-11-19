app.controller('LightCtrl', function($scope, $http, $timeout, $mdSidenav) {
	$scope.Lightsdata;
    $scope.selectedLight;
     $scope.parent_switch = true;
	$http({ method: 'GET', url: 'Lights.json'
	}).then(function(response){
		$scope.Lightsdata = response.data;
	},function(error){
		console.log(error);
	})

	$scope.sidenav = true;
    $scope.toggleLeft = function() {
        $mdSidenav('left').toggle();
      };

	$scope.ExpandLights = function(data) {
	   for(var i in $scope.Lightsdata.sections) {
	       if($scope.Lightsdata.sections[i] != data) {
	           $scope.Lightsdata.sections[i].expanded1 = false;
	       }
	   }
	   data.expanded1 = !data.expanded1;
	};
	
	$scope.MainSwitch = function(num, state){    
        if(state == false){
            for(var i in $scope.Lightsdata.sections[num].lights){
                $scope.Lightsdata.sections[num].lights[i].state = false;
                $scope.Lightsdata.sections[num].status = false;
                $scope.Lightsdata.sections[num].count = 0;
                $http.post('http://192.168.1.7:8080/intensityLevel',{value:0, address: $scope.Lightsdata.sections[num].lights[i].address}).then(function(response){  
                    intensitySlider.option("value",0);
                })
            }
        } else {
            for(var i in $scope.Lightsdata.sections[num].lights){
                $scope.Lightsdata.sections[num].lights[i].state = true;
                $scope.Lightsdata.sections[num].status = true;
                $scope.Lightsdata.sections[num].count = $scope.Lightsdata.sections[num].lights.length;
                $scope.parent_switch = true;
                $http.post('http://192.168.1.7:8080/intensityLevel',{value:99, address: $scope.Lightsdata.sections[num].lights[i].address}).then(function(response){
                    intensitySlider.option("value",99);
                })
            }     
        }
    }

	$scope.SubSwitch = function(pnum, light){
        if(light.state == false){
                $http.post('http://192.168.1.7:8080/intensityLevel', {value: 0, address: light.address}).then(function(response){
                    $scope.Lightsdata.sections[pnum].count--;
            }, function(err){
                light.state = true
            })            
        }
        else
        {
                $http.post('http://192.168.1.7:8080/intensityLevel', {value: 99, address: light.address}).then(function(response){
                        $scope.Lightsdata.sections[pnum].count++;
                }, function(err){
                    light.state = false
                })
        }
        if($scope.Lightsdata.sections[pnum].count > 0)
            $scope.Lightsdata.sections[pnum].status = true;
        else
            $scope.Lightsdata.sections[pnum].status = false;
    };


	$scope.selectLight = function(lightId ,parent, sec, light){
	 	if(lightId == $scope.isSelected)
	 	{
	 		$scope.isSelected = '';
            $scope.selectedLight = '';
	 	}
	 	else
	 	{
	 		$scope.isSelected = lightId;
            $scope.selectedLight = light;
            for(var i in $scope.Lightsdata.sections) {
                if($scope.Lightsdata.sections[i] == sec) {
                    $scope.Lightsdata.sections[i].expanded1 = true;
                } else {
                    $scope.Lightsdata.sections[i].expanded1 = false;
                }
            }   
	 	}
    }   

    $scope.selectDiv = function(lightId, light){
        if(lightId == $scope.isSelected)
        {
            $scope.isSelected = '';
            $scope.selectedLight = ''
        }
        else
        {
            $scope.isSelected = lightId; 
            $scope.selectedLight = light;           
        }
    }   



    $scope.parentSwitch = function(sta){
        for(var j in $scope.Lightsdata.sections){

            $scope.Lightsdata.sections[j].status = sta;
            for(var i in $scope.Lightsdata.sections[j].lights){
                $scope.Lightsdata.sections[j].lights[i].state = sta;
            }
        }
        if(sta == false){
            $http.post('http://192.168.1.7:8080/intensityLevel',{value: 0, address: "0000"}).then(function(response){
                //$scope.Lightsdata.sections[num].count = 0;
                intensitySlider.option("value",0);
            })
        } else {
            $http.post('http://192.168.1.7:8080/intensityLevel',{value: 99, address: "0000"}).then(function(response){
                //$scope.Lightsdata.sections[num].count = $scope.Lightsdata.sections[num].lights.length;
                //$scope.parent_switch = true;
                intensitySlider.option("value",99);
            })        
        }
    }
    // $("#slider").roundSlider({
    //     radius: 80,
    //     width: 4,
    //     min:05,
    //     max:99,
    //     circleShape: "pie",
    //     sliderType: "min-range",
    //     showTooltip: false,
    //     value: 99,
    //     startAngle: 315,
    //     handleSize: "+16",
    //     change: function(obj){
    //         console.log(obj.value);
    //         var IValue = parseInt(obj.value);
    //         var previousIvalue = 0;
    //         var address = $scope.selectedLight ? $scope.selectedLight.address : "0000"
    //         if(previousIvalue != IValue)
    //         {     
    //                 $http.post('http://192.168.1.7:8080/intensityLevel',{value:IValue, address: address}).then(function(response){
    //                 console.log("Intensity Value: "+IValue);
    //                 console.log("Light address: "+ address);
    //             });
    //             previousIvalue = IValue;
    //         }
    //     }
    // });

    // intensitySlider = $("#slider").data("roundSlider");
});

// var previousIvalue = 0;
// function setIntensity(obj)
// {
//     console.log(obj.value);
//     var IValue = parseInt(obj.value)
//     if(previousIvalue != IValue)
//     {       
//         $.post('http://192.168.1.7:8080/intensityLevel',{value:IValue, address:"0000"}).done(function(){
//             console.log("Intensity Value: "+IValue);
//             console.log("Light address: "+ "0000");
//         });
//         previousIvalue = IValue;
//     }
// }