app.controller('empSettingsCtrl', ['$rootScope', '$scope', '$http', '$timeout', '$mdDialog', '$interval', '$state', '$timeout', 'multipartForm', 'uiGridExporterService', 'uiGridExporterConstants', 'multipartFormExcel', function($rootScope, $scope, $http, $timeout, $mdDialog, $interval, $state, $timeout, multipartForm, uiGridExporterService, uiGridExporterConstants, multipartFormExcel) {
    $rootScope.pageTitle = "Employee Management";
    $rootScope.routes = false;
    $rootScope.settingroutes = true;
    $rootScope.button = true;
    $rootScope.userContent();
    $scope.selectedRows = [];
    $scope.delete = true;



    //********************************API CALLS FOR USER_DATA & BUILDINGS***********************

    var updateEmployeeData = function() {
        $http.get('/employeeApi/employeeData').then(function(response) {
            var empData = response.data;
            $scope.gridOptions.data = response.data;
        }, function(err) {
            console.log(err);
        });
        $timeout(function() {
            $scope.rowsEdited = [];
            $scope.selectAll = true;
        }, 1000);
    }
    updateEmployeeData();

    $timeout(function() {
        $scope.rowsEdited = [];
        $scope.selectAll = true;
    }, 1000);

    $http.get('/employeeApi/allSectionNames').then(function(response) {
        $scope.sections = response.data;
    }, function(err) {
        console.log(err);
    });

    $http.get('/employeeApi/allShifts').then(function(response) {
        $scope.shifts = response.data;
    }, function(err) {
        console.log(err);
    });

    $http.get('/employeeApi/allAssets').then(function(response) {
        $scope.assets = response.data;
    }, function(err) {
        console.log(err);
    });

    $http.get('/app/api/getseattypes').then(function(response) {
        $scope.seatTypes = response.data;
    }, function(err) {
        console.log(err);
    });

    $http.get('/employeeApi/reportingManagers').then(function(response) {
        $scope.managers = response.data;
    }, function(err) {
        console.log(err);
    });

    //*****************************************UI_GRID*****************************************************

    $scope.gridOptions = {
        enableSorting: true,
        enableColumnResizing: true,
        enableFiltering: true,
        rowHeight: 45,
        enableHorizontalScrollbar: 1,
        columnDefs: [
            { field: 'employeeId', displayName: 'Employee ID', enableCellEdit: true, enableFiltering: true, minWidth: 128 },
            { field: 'firstName', displayName: 'First Name', enableCellEdit: true, enableFiltering: true, minWidth: 128 },
            { field: 'lastName', displayName: 'Last Name', enableCellEdit: true, enableFiltering: true, minWidth: 128 },
            { field: 'email', displayName: 'Email', enableCellEdit: true, enableFiltering: true, minWidth: 128 },
            { field: 'assetNames', displayName: 'Assets', enableCellEdit: true, enableFiltering: true, cellTemplate: '<md-input-container md-no-float><md-select class="drop" ng-model="row.entity.assets" ng-change="grid.appScope.selectChange(row.entity)" multiple><md-optgroup layout="column"  label="Assets"><md-option class="md-primary" ng-repeat="asset in grid.appScope.assets" ng-value="asset.id"><span class="capitalize">{{asset.name}}</span></md-option></md-optgroup></md-select></md-input-container>', minWidth: 128 },
            { field: 'reportingManager.name', displayName: 'Reporting Manager', enableCellEdit: false, enableFiltering: true, cellTemplate: '<md-autocomplete  md-search-text="searchText" class="capitalize" md-selected-item-change="grid.appScope.selectChange(row.entity)" md-items="manager in grid.appScope.mngSearch(searchText)" md-selected-item="row.entity.reportingManager" md-item-text="manager.name"  md-min-length="0" placeholder="Reporting Manager"><md-item-template><span md-highlight-text="searchText">{{manager.name}}</span></md-item-template></md-autocomplete>', minWidth: 128 },
            { field: 'shiftTimings', displayName: 'Shift Timings', enableCellEdit: false, enableFiltering: true, cellTemplate: '<md-input-container class="capitalize" md-no-float><md-select class="drop" ng-model="row.entity.shift" ng-change="grid.appScope.selectChange(row.entity)" ><md-optgroup layout="column"  label="Shifts"><md-option class="md-primary" ng-repeat="shift in grid.appScope.shifts" ng-value="shift._id">{{shift.shift}}</md-option></md-optgroup></md-select></md-input-container>', minWidth: 128 },
            { field: 'location', displayName: 'Location', enableCellEdit: false, enableFiltering: true, cellTemplate: '<span ng-if="row.entity.location == null"> -- </span><span ng-if="row.entity.location != null" class="padding_seat">{{row.entity.location}}</span>  ', minWidth: 128 },
            { field: 'seatName', displayName: 'Seat Name', enableCellEdit: false, enableFiltering: true, cellTemplate: '<div class="padding_seat" ng-if="row.entity.seatId == \'\'">Seat UnAssigned</div><div class="padding_seat capitalize" ng-if="row.entity.seatId != \'\'">{{row.entity.seatName}}</div>', minWidth: 128 },
            { field: 'seatTypeName', displayName: 'Seat Type', enableCellEdit: false, enableFiltering: true, cellTemplate: '<md-input-container md-no-float class="capitalize"><md-select class="drop" ng-model="row.entity.seatType" ng-change="grid.appScope.selectChange(row.entity)"><md-optgroup layout="column"  label="Seat Types"><md-option class="md-primary" ng-repeat="seatType in grid.appScope.seatTypes" ng-value="seatType._id">{{seatType.name}}</md-option></md-optgroup></md-select></md-input-container>', minWidth: 128 },
            { field: 'department', displayName: 'Business Units', enableCellEdit: false, enableFiltering: true, cellTemplate: '<md-input-container md-no-float class="capitalize"><md-select class="drop" ng-model="row.entity.department" ng-multiple=false ng-change="grid.appScope.selectChange(row.entity)"><md-optgroup layout="column"  label="Business Units"><md-option class="md-primary" ng-repeat="section in grid.appScope.sections" ng-value="section.name">{{section.name}}</md-option></md-optgroup></md-select></md-input-container>', minWidth: 128 },
            { field: 'profileImage', displayName: 'Image', enableCellEdit: false, enableFiltering: false, cellTemplate: '<div ng-if="row.entity.profileImage != \'\'" class="container"><img class="image"  width=\"35px\" height=\"35px\" border-radius=\"50%\" ng-src=\"./img/employee_imgs/{{row.entity.employeeId}}-{{row.entity.profileImage}}\" lazy-src><div class="overlay"><md-button class="md-icon-button medium-icon-button text" ng-click= "grid.appScope.removeImg(row.entity)"><i class="material-icons">close</i></md-button></div></div><form ng-if="row.entity.profileImage == \'\'"><md-button type="file" file-model="grid.appScope.empImage" name="employeeImg" class="md-icon-button medium-icon-btn" ngf-select="grid.appScope.saveImg(row.entity, $file)"  ngf-pattern="\'image/*\'" ngf-accept="\'image/*\'" name="employeeImg"><i class="material-icons">attach_file</i></md-button></form>', minWidth: 128 },
            { field: 'qrCode', displayName: 'QR Code', enableCellEdit: false, enableFiltering: false, enableHiding: false, cellTemplate: '<md-button class="md-icon-button medium-icon-btn" ng-click="grid.appScope.downloadQr(row.entity)"><i class="material-icons">file_download</i><md-tooltip md-direction="bottom" class="md-block md-tooltip md-tooltip-bottom">Download</md-tooltip></md-button><span>/</span><md-button class="md-icon-button medium-icon-btn" ng-click="grid.appScope.mailQr(row.entity)"><i class="material-icons">email</i><md-tooltip md-direction="bottom" class="md-block md-tooltip md-tooltip-bottom">Mail to Employee</md-tooltip></md-button>', minWidth: 132 }
        ]
    };

    //***************************************INLINE_EDIT*************************************


    $scope.gridOptions.onRegisterApi = function(gridApi) {
        $scope.gridApi = gridApi;
        gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {
            var edited = {};
            edited.id = rowEntity._id;
            edited.colDef = colDef.field;
            edited.newValue = newValue;
            $http.post('/employeeApi/saveEditedEmp', edited).then(function(response) {
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center');
            })
        });

        gridApi.selection.on.rowSelectionChanged($scope, function(row) {
            if (row.isSelected) {
                $scope.selectedRows.push(row.entity._id);
                $scope.delete = false;
            } else
                $scope.selectedRows.pop(row.entity._id);
            if ($scope.selectedRows.length == 0)
                $scope.delete = true;
        });
    };

    $scope.rowsEdited = [];
    $scope.selectChange = function(row) {
        $scope.rowsEdited.push(row);
        $scope.selectAll = false;
    }

    $scope.exportExcel = function() {
        var grid = $scope.gridApi.grid;
        var rowTypes = uiGridExporterConstants.ALL;
        var colTypes = uiGridExporterConstants.ALL;
        uiGridExporterService.excelExport(grid, rowTypes, colTypes);
    };



    $scope.saveAll = function(rowsEdited) {
        $http.post('/employeeApi/updateAllData', rowsEdited).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center');
        })
        $scope.selectAll = true;
    }


    $scope.saveImg = function(row, file) {
        var uploadUrl = '/employeeApi/upload';
        multipartForm.post(uploadUrl, file, row).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
            updateEmployeeData();
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center');
        });
    }

    $scope.redirect = function() {
        var _renderedRows = $scope.gridApi.grid.renderContainers.body.renderedRows;
        if ($scope.selectedRows.length == 0) {
            if (_renderedRows) {
                for (var i = 0; i < _renderedRows.length; i++) {
                    $scope.selectedRows.push(_renderedRows[i].entity._id);
                }
            } else {
                $scope.selectedRows = $scope.gridOptions.data;
            }
        }
        localStorage.setItem('empIds', JSON.stringify($scope.selectedRows));
    }

    $scope.removeImg = function(row) {
        $http.post('/employeeApi/removeImg', row).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center');
        })
        updateEmployeeData();
    }

    $scope.importExcel = function(file) {
        var uploadUrl = '/employeeApi/uploadExcel';
        multipartFormExcel.post(uploadUrl, file).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
            updateEmployeeData();
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center');
        });
    }

    $scope.mailQr = function(row) {
        console.log(row);
        var qrData = {};
        qrData.employeeId = row.employeeId;
        qrData.email = row.email;
        $http.post('/employeeApi/mailQrCode', qrData).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center');
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast');
        });
    }

    $scope.downloadQr = function(row) {
        var qrData = {};
        qrData.employeeId = row.employeeId;
        qrData.email = row.email;
        $http.post('/employeeApi/qrCode', qrData).then(function(response) {
            var filename = "EmployeeId - " + row.employeeId + ".png";
            var elem = window.document.createElement('a');
            elem.href = response.data;
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast');
        });
    }

    //*************************************USER_ACTIONS**************************************


    $scope.addDummyCol = function() {
        $scope.gridOptions.columnDefs.push({ name: 'newCol', displayName: 'My new col', minWidth: 128 });
    }

    //*****************************************ADD_USER***************************************

    $scope.employeeDialog = function() {
        $mdDialog.show({
            templateUrl: 'template/addEmployee',
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true
        });
    }

    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    $scope.addEmployee = function() {
        var employee = $scope.employee;
        if (validateEmail(employee.email)) {
            $http.post('/employeeApi/addEmployee', employee).then(function(response) {
                console.log(response);
                $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

            }, function(err) {
                $rootScope.showToast(err.data.err, 'error-toast', 'top center')
            })
            updateEmployeeData();
            $scope.employee = {};
            $scope.blur_content = false;
            $scope.selectAll = true;
            $mdDialog.hide();
        } else {
            $rootScope.showToast("Invalid Email ID", 'error-toast');
        }
        console.log(employee);
    };

    $scope.cancelEmp = function() {
        $scope.employee = {};
        $scope.blur_content = false;
        $mdDialog.hide();
    }

    //***************************************DELETE_USER*************************************

    $scope.deleteEmployee = function(employees) {
        $http.post('/employeeApi/deleteEmployee', employees).then(function(response) {
            $rootScope.showToast(response.data.msg, 'success-toast', 'top center')

        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast', 'top center')
        })
        updateEmployeeData();
    }

    $scope.mngSearch = mngSearch;
    $scope.mngChange = mngChange;

    function mngSearch(query) {
        var results = query ? $scope.managers.filter(createFilterFor(query)) : $scope.managers,
            deferred;
        return results;
    }

    function mngChange(item) {
        if (item) {
            mid = item.id;
            console.log(mid);
        } else
            mid = null;
    }

    function createFilterFor(query) {
        var lowercaseQuery = angular.lowercase(query);
        return function filterFn(mng) {
            return angular.lowercase(mng.name).indexOf(lowercaseQuery) === 0;
        };
    }

    //***************************************************************************************************************************************
}]);