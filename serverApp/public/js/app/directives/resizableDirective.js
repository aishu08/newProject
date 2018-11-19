app.directive('resizable', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.resizable({
                containment: 'parent',
                stop: function (event, ui) {
                    var model = this.getAttribute('model')
                    scope[model].width = parseFloat(ui.size.width);
                    scope[model].height = parseFloat(ui.size.height);
                    scope.$apply();
                }
            });
        }
    };
});