app.directive('rotatable', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {


            element.rotatable({
                containment: 'parent',
                wheelRotate: false,
                rotate: function (event, ui) {
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