app.service('multipartForm', ['$http', '$rootScope', function($http, $rootScope) {
    this.post = function(uploadUrl, img, data) {
        console.log(img, data);
        var fd = new FormData();
        for (var key in data)
            fd.append(key, data[key]);
        fd.append('employeeImg', img);
        return $http.post(uploadUrl, fd, {
            transformRequest: angular.indentity,
            headers: { 'Content-Type': undefined }
        })
    };
}]);

app.service('multipartFormExcel', ['$http', '$rootScope', function($http, $rootScope) {
    this.post = function(uploadUrl, data) {
        console.log(data);
        var fd = new FormData();
        // for (var key in data)
        //     fd.append(key, data[key]);
        fd.append('importFile', data);
        return $http.post(uploadUrl, fd, {
            transformRequest: angular.indentity,
            headers: { 'Content-Type': undefined }
        })
    };
}]);