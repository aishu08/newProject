app.controller('openVPN', ['$rootScope', '$scope', '$http', '$mdDialog', 'uiGridExporterService', 'uiGridExporterConstants', function($rootScope, $scope, $http, $mdDialog, uiGridExporterService, uiGridExporterConstants) {
    console.log("heeeeeeeee");
    $scope.options = ["HOST", "PCS"];
    $scope.makingAjaxCall = false;


    var getData = function() {
        $http.get('/clientApi/getCertificate').then(function(response) {
            console.log("oooooo", response.data);
            $scope.gridOptions.data = response.data;



        });
    }

    getData();

    $scope.gridOptions = {

        paginationPageSizes: [25, 50, 75],

        paginationPageSize: 5,

        enableFiltering: true,

        columnDefs: [

            { field: 'name', enableFiltering: true },

            { field: 'ipAddress' },


            { field: 'action', enableFiltering: false, cellTemplate: '<i class="material-icons pointer"  ng-click="grid.appScope.cancel(row.entity, $event)">highlight_off</i> <i class="material-icons pointer" ng-click="grid.appScope.download(row.entity)">cloud_download</i><i class="material-icons pointer" ng-click="grid.appScope.sendEmail(row.entity, $event)">mail_outline</i>' }

        ],

        onRegisterApi: function(gridApi) {

            $scope.grid1Api = gridApi;

        }

    };


    $scope.$watch("chosenOption", function(newValue) {
        if (angular.isDefined(newValue)) {
            console.log(newValue);
        }
    });


    $scope.cancel = function(row, ev) {
        console.log("i am here");
        console.log("eeeeee", ev)
        var confirm = $mdDialog.confirm()
            .title("would you like to delete")
            .textContent("Are you sure want to delete this file")
            .ariaLabel("i am ok")
            .targetEvent(ev)
            .ok('ok')
            .cancel("cancel");
        $mdDialog.show(confirm).then(function() {
            $scope.status = 'true';
            $http.post('/clientApi/deletion', { id: row.id, status: row.status }).then(function(response) {
                $scope.status = response.data
                console.log("i deleted data", $scope.status);
                getData();
                console.log("valueeeeeeeeeeeeee", $scope.status)
            })
        }, function() {

            $scope.status = 'false';
            console.log("nextvale", $scope.status)

        })




    };
    $scope.sendEmail = function(row, ev) {

        var confirm = $mdDialog.prompt()
            .title('certificate')
            .textContent('Whom you want to send certificate')
            .placeholder('email address')
            .ariaLabel('Certificate')
            .initialValue()
            .targetEvent(ev)
            .ok('sure')
            .cancel('cancel');

        $mdDialog.show(confirm).then(function(result) {
            console.log("row", row)
            $http.post('/clientApi/emailCertificate', { emailid: result, name: row.name }).then(function(response) {
                $rootScope.showToast(response.data.msg, 'success-toast');

            })

        }, function() {

        });


    }


    $scope.download = function(row) {

        console.log("sweeeetttt", row);
        var name = row.name

        $http.get('/clientApi/download/' + name).then(function(response) {
            console.log(response)
            var data = response.data
            var link = document.createElement("a")
            link.download = row.name + ".ovpn"
            link.href = "data:" + data
            link.click();



        });
    }



    $scope.delete = function() {
        $mdDialog.hide();
    }

    $scope.certificateDetails = function() {
        console.log("okkkkk");
        $mdDialog.show({
            templateUrl: 'template/addCertificate',
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true
        });

    };
    $scope.generateFile = function() {

    }

    $scope.submit = function() {
        $scope.makingAjaxCall = true;
        $scope.certificateName = $scope.name + "-" + $scope.location + "-" + $scope.chosenOption + "-" + $scope.device_number
        $http.post('/clientApi/script', { certificateName: $scope.certificateName, type: $scope.chosenOption.toLowerCase() }).then(function(response) {
            $scope.value = response.data
            console.log("PPPP", $scope.value);
            $scope.makingAjaxCall = false;
            getData();
        }, function(err) {
            $scope.makingAjaxCall = false;
            console.log("okkkkk", err);
            $rootScope.showToast(err.data.err, 'error-toast');
        })


        $mdDialog.hide();
    }



}]);