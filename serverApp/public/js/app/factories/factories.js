'use strict';

var apiPrefix = 'app/api';

app.factory('Login',['$resource',function($resource){
    return $resource(apiPrefix+'/login');
}]);
app.factory('ChangePassword',['$resource',function($resource){
    return $resource(apiPrefix+'/changePassword');
}]);
app.factory('Floors',['$resource', function($resource){
    return $resource(apiPrefix+'/floors')
}]);
app.factory('Floordata',['$resource', function($resource){
    return $resource(apiPrefix+'/floordata/:floorId',{floorId:'@floorId'})
}]);
app.factory('SeatStatus',['$resource', function($resource){
    return $resource(apiPrefix+'/seatStatus/:floorId',{floorId:'@floorId'})
}]);
app.factory('SeatData',['$resource', function($resource){
    return $resource(apiPrefix+'/seatData/:floorId',{floorId:'@floorId'})
}]);
app.factory('UtilData',['$resource', function($resource){
    return $resource(apiPrefix+'/utilData/:floorId',{floorId:'@floorId'})
}]);
app.factory('OccupancyData',['$resource', function($resource){
    return $resource(apiPrefix+'/occupancyData/:floorId',{floorId:'@floorId'})
}]);
app.factory('TemperatureData',['$resource', function($resource){
    return $resource(apiPrefix+'/tempdata/:floorId',{floorId:'@floorId'})
}]);
app.factory('TemperatureStatus',['$resource', function($resource){
    return $resource(apiPrefix+'/tempStatus/:floorId',{floorId:'@floorId'})
}]);
app.factory('RoomData',['$resource', function($resource){
    return $resource(apiPrefix+'/roomData/:floorId',{floorId:'@floorId'})
}]);
app.factory('RoomStatus',['$resource', function($resource){
    return $resource(apiPrefix+'/roomStatus/:floorId',{floorId:'@floorId'})
}]);
app.factory('FloorPlots',['$resource', function($resource){
    return $resource(apiPrefix+'/floorPlots')
}]);
app.factory('SectionNames',['$resource', function($resource){
    return $resource(apiPrefix+'/getSectionNames/:floorId', {floorId:'@floorId'})
}]);
app.factory('BuComparison',['$resource', function($resource){
    return $resource(apiPrefix+'/buComparisonPlot/');
}]);
app.factory('RoomUtil',['$resource', function($resource){
    return $resource(apiPrefix+'/roomUtil/');
}]);
app.factory('AvgFloorTemp',['$resource', function($resource){
    return $resource(apiPrefix+'/avgFloorsTemp/');
}]);
app.factory('HourTempData',['$resource', function($resource){
    return $resource(apiPrefix+'/getTempData/');
}]);
