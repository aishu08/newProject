app.controller('wireframeCtrl', ['$rootScope', '$scope', '$mdSidenav', '$http', '$state', function($rootScope, $scope, $mdSidenav, $http, $state) {
    $scope.pageActive = $state.current.url;

    $rootScope.changeView = function(state) {
        $scope.pageActive = state;
        $state.go("index." + state);
    };
}]);