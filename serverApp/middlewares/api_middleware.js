module.exports = (function () {

    const jwt = global.jwt;

    const api_middleware = function (req, res, next) {
        var cookies = req.cookies;
        console.log(global.authFilter(req));
        if (global.authFilter(req)) {
            next();
        }

        else if (!cookies) {
            res.status(401).json({ err: "unauthorized access" })
        }
        else {
            var token = cookies.auth_token;
            if (!token) {
                res.status(401).json({ err: "unauthorized access" })
            } else {
                jwt.verify(token, global.secret, function (err, decoded) {
                    if (err) {
                        console.log(err.message);
                        res.status(401).json({ err: "Token expired. Please login " });

                    }
                    else {
                        validateRequest(decoded, function (status) {
                            console.log('status   ', status);
                            req.headers["authorization"] = "Bearer " + token;
                            next();

                        })
                    }

                })

            }
        }
    };
    return ({ api_middleware: api_middleware });
})();



var UserModel = require('../models/users');

var validateRequest = function (decoded, callback) {
    //callback(false);
    console.log(decoded.username);
    UserModel.findOne({ uid: decoded.uid }, function (err, user, num) {
        if (err)
            callback(false);
        else if (user) {
            if (decoded.pwd == user.password) {
                callback(true);
            }
            else
                callback(false);
        }
        else
            callback(false);
    });
}