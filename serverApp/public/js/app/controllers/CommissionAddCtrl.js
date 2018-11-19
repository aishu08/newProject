
// Building Details Create Function declared as $scope.CreateBuildingdetails By darshan on 15-11-2017.


app.controller("CommissionAddCtrl",['$scope', '$rootScope', '$cookies','$state', '$transitions', "$http", function ($scope, $rootScope, $cookies, $state, $transitions, $http){
  
    $scope.building_details={};

    if(localStorage.getItem('id')){
      $rootScope.continuetocommision=true;
      $http.get('/app/api/getBuildingbyId',{params:{id:localStorage.getItem('id')}}).then(function(response){
      console.log(response);
            $rootScope.building=response.data;
            $scope.building_details=$rootScope.building;
            
        }, function(err){
         
           $rootScope.showToast( err.data.err, 'error-toast');
        });

    }

    $scope.timezonelist= moment.tz.names();


    // Function to create New Commission Building details

    $scope.CreateBuildingdetails=function (building_details) {
      building_details.floors=[];
       
      $http.post('/app/api/createBuilding',building_details).then(function(response){
      
            $rootScope.building=response.data.bulding;
            localStorage.setItem('id',$rootScope.building.id);
            $state.go('commission.floor');
            
        }, function(err){
         
           $rootScope.showToast( err.data.err, 'error-toast');
        }); 

    }


    $scope.selectedItemChange=function(item) {

      var tzoffset=moment.tz(item).format('Z');
   
      var timeParts = tzoffset.split(":");
      var tzoffsetmillisec=(+timeParts[0] * (60000 * 60)) + (+timeParts[1] * 60000)
     
      $scope.building_details.timezoneOffset=((item)?tzoffsetmillisec:undefined);
    }
    
    $scope.updateBuilding=function(buldingform){

   
      if(buldingform.$valid){

          $http.put('/app/api/updateBuilding',$scope.building_details).then(function(response){
             console.log(response)
          $rootScope.building=$scope.building_details;        
          $rootScope.showToast( response.data, 'success-toast');

          }, function(err){
            
             $rootScope.showToast( err.data.err, 'error-toast');
          });
      }
    }

    $scope.continuetofloor=function(){
      
       $state.go('commission.floor');
    }

    
}])