app.factory('selectedEmployeeFactory', function() {
    var selectedEmployee = {};
    selectedEmployee.storeSelectedEmployee = function(employee) {
        selectedEmployee.employee = employee;
    };
    selectedEmployee.getSelectedEmployees = function() {
        return selectedEmployee.employee;
    };
    return selectedEmployee;
});