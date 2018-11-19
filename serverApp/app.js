var express = global.express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var mongoose = global.mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var expressJWT = require('express-jwt');
var jwt = global.jwt = require('jsonwebtoken');
var bcrypt = global.bcrypt = require('bcrypt-nodejs');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var timeout = require('connect-timeout');
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/lms', { useMongoClient: true }, function(err) {
    if (err)
        console.log("Failed to establish a connection to Mongo DB");
    else {
        console.log("Connection established to Mongo DB");
    }
});

var allowedRoutes = [{ path: "/login", method: "post" },
    { path: "/changePassword", method: "post" }
];

const port = 3000;

var _ = global._ = require('lodash');
var authFilter = function(req) {

    var path = req.path;
    var method = req.method.toLowerCase();

    var index = _.findIndex(allowedRoutes, function(route) {
        var regPat = new RegExp(route.path);
        return regPat.test(path) && method === route.method;
    });
    return index != -1;
};
global.authFilter = authFilter;


var secret = global.secret = "credit-suisse-adappt-lms-application";
var apiSecret = "adappt-software-api";
var reportSecret = "credit-suisse-report-api";

var viewRoutes = require('./routes/views');
var apiRoutes = require('./routes/new_api');
var apiApp = require("./routes/apiApp");
var extApi = require("./routes/extApi");
var iotApi = require('./routes/iotApi')
var reportApi = require('./routes/reportApi');
var employeeApi = require('./routes/employeeApi');
var commissionApi = require('./routes/commissionAPIs');
var light = require('./routes/lights');
var light_commissionApi = require('./routes/light_commissionAPIs')
var sendcommands = require('./routes/sendcommand.js')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(timeout('900s'));
app.use(express.static(path.join(__dirname, 'public')));
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    parameterLimit: 100000,
    limit: '100mb',
    extended: true
}));
app.use(bodyParser.json({
    limit: '100mb',
    extended: true
}));

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var _middleware = require('./middlewares/api_middleware');
var middleware = function(req, res, next) {
    if (req.headers.hasOwnProperty('authorization')) {
        next();
    } else
        res.status(400).json({ error: "unauthorized access" });
}

var reportMiddleware = function(req, res, next) {
    if (req.headers.hasOwnProperty('authorization')) {
        console.log("Here")
        next();
    } else {
        res.status(400).json({ error: "unauthorized access" });
    }
}
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
})
app.use('/app1/api', apiApp)
app.use('/api', middleware, expressJWT({ secret: apiSecret }), extApi)
app.use('/reportApi', reportApi)
app.use('/employeeApi', employeeApi)
app.use('/app/api', _middleware.api_middleware, expressJWT({ secret: secret }).unless(authFilter), apiRoutes);
app.use('/app/api', commissionApi)
app.use('/lightcommission/api', light_commissionApi)
app.use('/iot/', iotApi);
app.use('/light/', light);
app.use('/sendcommand/', sendcommands)
app.all('*', viewRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
/*if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
*/
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



module.exports = app;

app.listen(port, function() {
    console.log(`Server running on port ${port}`);
})