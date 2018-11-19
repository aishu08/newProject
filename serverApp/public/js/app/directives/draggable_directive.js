app.directive('draggable', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.draggable({
                cursor: "move",
                containment: 'parent',
                stop: function(event, ui) {
                    var model = this.getAttribute('model')
                    scope[model].posX = parseFloat(ui.position.left);
                    scope[model].posY = parseFloat(ui.position.top);
                    scope.$apply();
                }
            });
        }
    };
});

app.directive('ddDraggable', function(selectedEmployeeFactory) {
    return {
        restrict: "A",
        scope: false,
        link: function(scope, element, attributes) {
            element.attr("draggable", true);
            element.bind("dragstart", function(event) {
                console.log("inside selector", selectedEmployeeFactory)
                var selectedEmp = scope[attributes.employee];
                selectedEmployeeFactory.storeSelectedEmployee(selectedEmp);
            });
        }
    };
});


app.directive('ddDropTarget', function(selectedEmployeeFactory) {
    return {
        restrict: "A",
        scope: {
            onDrop: '&'
        },
        link: function(scope, element, attributes) {
            element.bind("dragover", function(event) {
                event.preventDefault();
            });
            element.bind("drop", function(event) {
                // var dropTargetData = JSON.parse(attributes.data);
                var dropTargetData = selectedEmployeeFactory.employee;
                var selectedEmp = selectedEmployeeFactory.getSelectedEmployees();
                selectedEmp.dropTargetId = dropTargetData._id;
                dropTargetData.empId = selectedEmp.id;
                scope.onDrop({ employee: selectedEmp });
                event.preventDefault();
            });
        }
    };
});
app.directive('modalDraggable', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.draggable({
                cursor: "move",
                containment: 'parent',
                stop: function(event, ui) {
                    event.stopPropagation();
                }
            });
        }
    };
});

app.directive('resizable', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.resizable({
                containment: 'parent',
                stop: function(event, ui) {
                    var model = this.getAttribute('model')
                    scope[model].width = parseFloat(ui.size.width);
                    scope[model].height = parseFloat(ui.size.height);
                    scope.$apply();
                }
            });
        }
    };
});

app.directive('rotatable', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {


            element.rotatable({
                containment: 'parent',
                wheelRotate: false,
                rotate: function(event, ui) {
                    var model = this.getAttribute('model')

                    var degree = parseFloat(ui.angle.degrees);
                    degree = ((ui.angle.current >= 0) ? degree : "-" + degree);
                    degree = parseFloat(degree);
                    scope[model].rotate = degree;

                    scope.$apply();
                }
            });


        }
    };
});
app.directive("filesInput", function() {
    return {
        require: "ngModel",
        link: function postLink(scope, elem, attrs, ngModel) {
            elem.on("change", function(e) {
                var files = elem[0].files;
                ngModel.$setViewValue(files);
            })
        }
    }
})