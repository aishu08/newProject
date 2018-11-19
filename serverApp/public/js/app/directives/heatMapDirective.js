app.directive('heatMap', function(){
        return {
            restrict: 'E',
            scope: {
                data: '='
            },
            template: '<div container></div>',
            link: function(scope, ele, attr){
                scope.heatmapInstance = h337.create({
                  container: ele.find('div')[0]
                })
                scope.$watch("data",function(newval,oldval){
                    console.log(newval);
                   scope.heatmapInstance.setData(newval);
                })
            }
        
        };

    });