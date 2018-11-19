
// Commision Create Function declared as $scope.CreateNewCommission By darshan on 15-11-2017.

// Commision Create Function declared as $scope.ContinueToCommission By darshan on 15-11-2017.

app.controller("CommissionCtrl", ['$scope', '$rootScope', '$cookies', '$state', '$transitions', "$http", function ($scope, $rootScope, $cookies, $state, $transitions, $http) {

  $scope.continueflag = false;
  localStorage.clear();
  $http.get('/app/api/getbuildings').then(function (response) {

    $scope.commision_details = response.data;

  }, function (err) {

    $rootScope.showToast(err.data.err, 'error-toast');
  });

  // Function to create New Commision

  $scope.CreateNewCommission = function () {
    localStorage.clear();
    $rootScope.continuetocommision = false;
    $state.go('commission.add');

  }

  // Function to continue with old Commision

  $scope.ContinueToCommission = function () {

    $rootScope.building = JSON.parse($scope.building_details);
    localStorage.setItem('id', $rootScope.building.id);
    $rootScope.continuetocommision = true;
    $state.go('commission.add');

  }

  $scope.selectedBuldingChange = function (id) {

    if (id) {
      $scope.continueflag = true;
    } else {
      $scope.continueflag = false;
    }
  }

}])