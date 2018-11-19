app.factory('selectedObjectFactory', function() {
    var selectedObject = {};
    selectedObject.storeSelectedObject = function(obj) {
        selectedObject.object = obj;
    };
    selectedObject.getSelectedObject = function() {
        return selectedObject.employee;
    };
    return selectedObject;
});