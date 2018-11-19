var router = global.express.Router();
var pool = global.pool;
var bcrypt = global.bcrypt;
var jwt = global.jwt;
var _ = global._;
const mongoose = global.mongoose;
var SiteModel = require('../models/site');
var BuildingModel = require('../models/building');
var SectionModel = require('../models/sections');
var FloorModel = require('../models/floors');
var BleModel = require('../models/ble');
var SeatModel = require('../models/seats');
var SensorDataModel = require('../models/sensorData');
var SeatToBle = require('../models/sensorToBle');
var UserModel = require('../models/users');
var RoomToBle = require("../models/roomToBle");
var moment = require('moment-timezone');
var HostModel = require('../models/hosts');
var HostLogs = require('../models/hostLogs');
var EmployeeModel = require('../models/employees');
var ShiftModel = require('../models/shifts');
var AssetModel = require('../models/assets');
var SeatTypeModel = require('../models/seattypes');
var ShapeModel = require('../models/shapes');
var ParkingModel = require('../models/parking');
var LockerModel = require('../models/lockerRooms');
const excelAgg = require('../models/excelAggregation');
var json2csv = require('json2csv');
var fs = require('fs');
var reA = /[^a-zA-Z]/g;
var reN = /[^0-9]/g;
var multer = global.multer = require('multer');
var fs = require('fs');
var exceltoJson = require("xlsx-to-json");
var xlsx = require('node-xlsx');

// var SeatTypeModel = mongoose.model('SeatTypeModel');

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/img/employee_imgs/');
    },
    filename: function(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            var err = new Error();
            err.code = 'filetype';
            return cb(err);
        } else {
            cb(null, req.body.employeeId + '-' + file.originalname);
        }
    }
});

var storeExcel = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        if (!file.originalname.match(/\.(xlsx)$/)) {
            var err = new Error();
            err.code = 'filetype';
            return cb(err);
        } else {
            cb(null, file.originalname);
        }
    }
});

var upload = multer({ storage: storage }).single('employeeImg');
var uploadExcel = multer({ storage: storeExcel }).single('importFile');
var QRCode = require('qrcode');


var nodemailer = require('nodemailer');
var SMTPTransport = require("nodemailer-smtp-transport")
const path = require('path');
const util = require('util');
const exec = require('child_process').exec;

var smtpTransport = nodemailer.createTransport(SMTPTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'info@arraystorm.com',
        pass: 'arraystorm@2016'
    }
}));

var sortAlphaNum = function(a, b) {
    var aA = a.name.replace(reA, "");
    var bA = b.name.replace(reA, "");
    if (aA === bA) {
        var aN = parseInt(a.name.replace(reN, ""), 10);
        var bN = parseInt(b.name.replace(reN, ""), 10);
        return aN === bN ? 0 : aN < bN ? 1 : -1;
    } else {
        return aA < bA ? 1 : -1;
    }
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}
var sortAlphaNumrev = function(a, b) {
    var aA = a.name.replace(reA, "");
    var bA = b.name.replace(reA, "");
    if (aA === bA) {
        var aN = parseInt(a.name.replace(reN, ""), 10);
        var bN = parseInt(b.name.replace(reN, ""), 10);
        return aN === bN ? 0 : aN > bN ? 1 : -1;
    } else {
        return aA > bA ? 1 : -1;
    }
}

var styles = {
    headerDark: {
        font: {
            bold: true
        }
    }
};

var validateRequest = function(decoded, callback) {
    UserModel.findOne({ name: decoded.username }, function(err, user, num) {
        if (err)
            callback(false);
        else if (user) {
            if (decoded.pwd == user.password) {
                callback(true);
            } else
                callback(false);
        } else
            callback(false);
    });
}

router.get('/seatEmpData/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var bleData;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        SeatModel.aggregate([
                            { $match: { floorId: mongoose.Types.ObjectId(floorId) } },
                            { $lookup: { from: 'employees', localField: '_id', foreignField: 'seatId', as: 'seatEmp' } },
                            { $unwind: { path: '$seatEmp', preserveNullAndEmptyArrays: true } },
                            { $lookup: { from: 'shifts', localField: 'seatEmp.shift', foreignField: '_id', as: 'empShift' } },
                            { $unwind: { path: '$empShift', preserveNullAndEmptyArrays: true } },
                            { $lookup: { from: 'SeatTypes', localField: 'seatType', foreignField: '_id', as: 'seatTypeData' } },
                            { $unwind: { path: '$seatTypeData', preserveNullAndEmptyArrays: true } },
                            {
                                $project: {
                                    empId: "$seatEmp._id",
                                    empFirst: "$seatEmp.firstName",
                                    empLast: "$seatEmp.lastName",
                                    employeeId: "$seatEmp.employeeId",
                                    empShift: "$empShift.shiftName",
                                    empDept: "$seatEmp.department",
                                    globalName: 1,
                                    width: 1,
                                    height: 1,
                                    posX: 1,
                                    posY: 1,
                                    name: 1,
                                    seatType: 1,
                                    seatTypeClass: "$seatTypeData.shape"
                                }
                            }
                        ], function(err, seatData) {
                            if (seatData.length) {
                                res.status(200).json(seatData)
                            } else {
                                res.status(400).json({ err: "No seat Data" });
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .post('/addNewShift', function(req, res, next) {
        var data = req.body;
        if (data.sTime && data.eTime) {
            shift = new ShiftModel({
                startTime: data.sTime,
                endTime: data.eTime
            })
            shift.save(function(err, doc) {
                if (err)
                    res.json(err);
                else
                    res.status(200).json({ msg: "Shift Added" });
            })
        } else
            res.status(400).json({ err: "Please set Both Start and End Time" });
    })
    .post('/addNewAsset', function(req, res, next) {
        var data = req.body;
        data.name = data.name.toLowerCase();
        if (data) {
            shift = new AssetModel({
                name: data.name
            })
            shift.save(function(err, doc) {
                if (err)
                    res.json(err);
                else
                    res.status(200).json({ msg: "Asset Added" });
            })
        } else
            res.status(400).json({ err: "Please enter a asset" });
    })
    .post('/addNewSeatType', function(req, res, next) {
        var data = req.body;
        data.type = data.type.toLowerCase();
        if (data) {
            seatType = new SeatTypeModel({
                type: data.type
            })
            seatType.save(function(err, doc) {
                if (err)
                    res.json(err);
                else
                    res.status(200).json({ msg: "Seat Type Added" });
            })
        } else
            res.status(400).json({ err: "Please enter a Seat Type" });
    })
    .post('/addReportingManager', function(req, res, next) {
        var data = req.body;
        data.name = data.name.toLowerCase();
        if (data) {
            reportingManager = new ReportingManagerModel({
                name: data.name
            })
            reportingManager.save(function(err, doc) {
                if (err)
                    res.json(err);
                else
                    res.status(200).json({ msg: "Reporting Manager Added" });
            })
        } else
            res.status(400).json({ err: "Please enter a Manager Name" });
    })
    .post('/addEmployee', function(req, res, next) {
        var data = req.body;
        data.fname = data.fname.toLowerCase();
        data.lname = data.lname.toLowerCase();
        if (data) {
            employee = new EmployeeModel({
                firstName: data.fname,
                lastName: data.lname,
                email: data.email,
                employeeId: data.id
            })
            employee.save(function(err, doc) {
                if (err)
                    res.json(err);
                else
                    res.status(200).json({ msg: "Employee Added" });
            })
        }
    })
    .get('/employeeData', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var hashMap = req.query.hashMap;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        EmployeeModel.aggregate([
                            { $lookup: { from: 'seats', localField: 'seatId', foreignField: '_id', as: 'seatData' } },
                            { $unwind: { path: '$seatData', preserveNullAndEmptyArrays: true } },
                            { $lookup: { from: 'floors', localField: 'seatData.floorId', foreignField: '_id', as: 'seatFloor' } },
                            { $unwind: { path: '$seatFloor', preserveNullAndEmptyArrays: true } },
                            { $lookup: { from: 'buildings', localField: 'seatFloor._id', foreignField: 'floors', as: 'seatBuilding' } },
                            { $unwind: { path: '$seatBuilding', preserveNullAndEmptyArrays: true } },
                            { $lookup: { from: 'SeatTypes', localField: 'seatType', foreignField: '_id', as: 'seatTypeData' } },
                            { $unwind: { path: '$seatTypeData', preserveNullAndEmptyArrays: true } },
                            { $lookup: { from: 'shifts', localField: 'shift', foreignField: '_id', as: 'shiftData' } },
                            { $unwind: { path: '$shiftData', preserveNullAndEmptyArrays: true } },
                            { $lookup: { from: 'employees', localField: 'reportingManager', foreignField: '_id', as: 'reportingMngData' } },
                            { $unwind: { path: '$reportingMngData', preserveNullAndEmptyArrays: true } },
                            { $lookup: { from: 'assets', localField: 'assets', foreignField: '_id', as: 'assetsData' } },
                            { $unwind: { path: '$assetsData', preserveNullAndEmptyArrays: true } },
                            { $group: { _id: "$_id", assets: { $push: "$assetsData._id" }, assetNames: { $push: "$assetsData.name" }, firstName: { $first: "$firstName" }, lastName: { $first: "$lastName" }, email: { $first: "$email" }, employeeId: { $first: "$employeeId" }, seatId: { $first: "$seatId" }, seatName: { $first: "$seatName" }, shift: { $first: "$shift" }, seatType: { $first: "$seatType" }, department: { $first: "$department" }, seatBuilding: { $first: "$seatBuilding" }, seatFloor: { $first: "$seatFloor" }, seatData: { $first: "$seatData" }, seatTypeData: { $first: "$seatTypeData" }, shiftData: { $first: "$shiftData" }, profileImage: { $first: "$profileImage" }, parkingSpotId: { $first: "$parkingSpotId" }, lockerId: { $first: "$lockerId" }, reportingMngData: { $first: { _id: "$reportingMngData._id", name: { $concat: ['$reportingMngData.firstName', ' ', '$reportingMngData.lastName'] } } } } },
                            {
                                $project: {
                                    location: {
                                        $concat: ["$seatBuilding.alias", " - ", "$seatFloor.alias"]
                                    },
                                    department: {
                                        $ifNull: ["$department", []]
                                    },
                                    firstName: {
                                        $ifNull: ["$firstName", '']
                                    },
                                    lastName: {
                                        $ifNull: ["$lastName", '']
                                    },
                                    email: {
                                        $ifNull: ["$email", '']
                                    },
                                    employeeId: {
                                        $ifNull: ["$employeeId", '']
                                    },
                                    seatId: {
                                        $ifNull: ["$seatId", '']
                                    },
                                    seatName: {
                                        $ifNull: ["$seatData.name", 'Seat UnAssigned']
                                    },
                                    id: {
                                        $ifNull: ["$_id", '']
                                    },
                                    reportingManager: {
                                        $ifNull: ["$reportingMngData", null]
                                    },
                                    assets: {
                                        $ifNull: ["$assets", []]
                                    },
                                    assetNames: {
                                        $ifNull: ["$assetNames", []]
                                    },
                                    seatType: {
                                        $ifNull: ["$seatTypeData._id", '']
                                    },
                                    seatTypeName: {
                                        $ifNull: ["$seatTypeData.name", '']
                                    },
                                    shift: {
                                        $ifNull: ["$shiftData._id", '']
                                    },
                                    shiftTimings: {
                                        $concat: ["$shiftData.startTime", " - ", "$shiftData.endTime"]
                                    },
                                    profileImage: {
                                        $ifNull: ["$profileImage", '']
                                    },
                                    parkingSpotId: {
                                        $ifNull: ["$parkingSpotId", '']
                                    },
                                    lockerId: {
                                        $ifNull: ["$lockerId", '']
                                    }
                                }
                            }
                        ]).exec(function(err, empData) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                empData.forEach(function(emp) {
                                    emp.reportingManager = emp.reportingManager._id ? emp.reportingManager : null;
                                });
                                if (hashMap) {
                                    var temp = {};
                                    empData.forEach(function(emp) {
                                        temp[emp._id] = emp;
                                    })
                                    res.status(200).json(temp);
                                } else
                                    res.status(200).json(empData);
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .post('/selectedEmployee', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var empIds = req.body;
        // console.log(empIds);
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        EmployeeModel.find({ _id: { $in: empIds } }).exec(function(err, employees) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(employees);
                            }
                        })

                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .post('/deleteEmployee', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        var counter = 0;
                        var pending = data.length;
                        data.forEach(function(row) {
                            EmployeeModel.deleteOne({ _id: row }, function(err, doc) {
                                if (err)
                                    res.status(400).json(err);
                                else {
                                    if (++counter == pending) {
                                        res.status(200).json({ msg: "Employee Deleted" });
                                    }
                                }
                            })
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/saveEditedEmp', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var query = {};
        query[data.colDef] = data.newValue;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {

                        EmployeeModel.findByIdAndUpdate(data.id, query, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Details Updated" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/updateAllData', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        var counter = 0;
                        var pending = data.length;
                        data.forEach(function(row) {
                            EmployeeModel.findByIdAndUpdate(row.id, { seatType: row.seatType, shift: row.shift, reportingManager: row.reportingManager._id, assets: row.assets, department: row.department }, function(err, doc) {
                                if (err)
                                    res.status(400).json(err);
                                else {
                                    if (++counter == pending) {
                                        res.status(200).json({ msg: "All data Updated" });
                                    }
                                }
                            })
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/saveEmployee', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        EmployeeModel.findByIdAndUpdate(data.id, { seatId: data.dropTargetId }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Seat Alloted to Employee" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .get('/allSectionNames', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var bleData;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        SectionModel.find({ isRoom: false }, { name: 1, _id: 0 }, function(err, sections) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(sections);
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .post('/unassignEmployee', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        if (data.empId) {
                            EmployeeModel.findByIdAndUpdate(data.empId, { $unset: { seatId: "", seatName: "" } }, function(err, doc) {
                                if (err)
                                    res.status(400).json(err)
                                else {
                                    res.status(200).json({ msg: "Seat UnAssigned" });
                                }
                            })
                        } else {
                            res.status(401).json({ err: "No Employee Assigned" })
                        }
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .get('/reportingManagers', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var bleData;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        EmployeeModel.aggregate([{
                            $project: {
                                name: {
                                    $concat: ["$firstName", " ", "$lastName"]
                                }
                            }
                        }]).exec(function(err, managers) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(managers);
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/allShiftNames', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var bleData;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        ShiftModel.distinct(
                            "shiftName", {},
                            (function(err, docs) {
                                if (err) {
                                    return console.log(err);
                                } else {
                                    res.status(200).json(docs);
                                }
                            })
                        );
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/allShifts', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        ShiftModel.aggregate([{
                            $project: {
                                shift: {
                                    $concat: ["$startTime", " - ", "$endTime"]
                                }
                            }
                        }]).exec(function(err, shifts) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(shifts);
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/allAssets', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        AssetModel.find({}).exec(function(err, assets) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(assets);
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/allSeatTypes', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        SeatTypeModel.find({}).exec(function(err, seaTypes) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(seaTypes);
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .post('/upload', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            upload(req, res, function(err) {
                if (err) {
                    if (err.code === 'filetype') {
                        res.json({ success: false, message: "File type is invalid.Must be .jpg or .jpeg or .png" })
                    }
                } else {
                    validateRequest(decoded, function(status) {
                        if (status) {
                            var empImage = req.file;
                            var data = req.body;
                            EmployeeModel.findByIdAndUpdate(data._id, { profileImage: empImage.originalname }, function(err, doc) {
                                if (err)
                                    res.status(400).json(err)
                                else {
                                    res.status(200).json({ msg: "Image Uploaded" });
                                }
                            })
                        } else {
                            res.status(403).json({ err: "Unauthorized Request" });
                        }
                    })
                }
            })
        })
    })
    .post('/uploadExcel', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            uploadExcel(req, res, function(err) {
                if (err) {
                    if (err.code === 'filetype') {
                        res.json({ success: false, message: "File type is invalid.Must be .xlsx" })
                    }
                } else {
                    validateRequest(decoded, function(status) {
                        if (status) {
                            var data = req.file;
                            var sheet = xlsx.parse("./uploads/" + data.originalname);
                            var rows = sheet[0].data;
                            var counter = 0;
                            var pending = rows.length - 1;
                            var promises = [];
                            rows.forEach(function(row, i) {
                                    if (i > 0) {
                                        var employeeId = row[1];
                                        var firstName = row[2];
                                        var middleName = row[3];
                                        var lastName = row[4];
                                        // var email = row[4];
                                        // promises.push(row);
                                        EmployeeModel.update({ employeeId: employeeId }, { firstName: firstName, lastName: lastName, email: email }, { upsert: true }, function(err, doc) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                if (++counter == pending) {
                                                    res.status(200).json({ msg: "Excel uploaded" });
                                                }
                                            }
                                        });
                                        // console.log(promises.length);
                                    }
                                })
                                // Promise.all(promises).then(function(results) {
                                //     console.log("worked");
                                // }).catch(function(err) {
                                //     console.log("Didn't work")
                                // });
                        } else {
                            res.status(403).json({ err: "Unauthorized Request" });
                        }
                    })
                }
            })
        })
    })
    .post('/removeImg', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var data = req.body;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        fs.unlink("./public/img/employee_imgs/" + data.employeeId + '-' + data.profileImage);
                        EmployeeModel.findByIdAndUpdate(data._id, { $unset: { profileImage: "" } }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Image Removed" });
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                })
            }
        })

    })
    .post('/mailQrCode', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var data = JSON.stringify(req.body);
        var email = req.body.email;
        var empId = req.body.employeeId;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        QRCode.toDataURL(data, function(err, url) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                var data = url.replace(/^data:image\/\w+;base64,/, "");
                                var buf = new Buffer(data, 'base64');
                                const fileName = path.join(__dirname, "../public/img/qr_code/" + "EmployeeId -" + empId + ".png");
                                fs.appendFileSync(fileName, buf);
                                var mailOptions = {
                                    from: "Adappt info <info@arraystorm.com>",
                                    to: email,
                                    subject: 'Employee QR Code',
                                    attachments: [{
                                        filename: path.basename(fileName),
                                        contentType: 'image/png',
                                        path: fileName
                                    }]
                                };
                                smtpTransport.sendMail(mailOptions, function(error, response) {
                                    if (error) {
                                        console.log("Mail error")
                                        console.log(error);
                                    } else {
                                        console.log("Done");
                                        res.status(200).json({ msg: "Done" });
                                    }
                                });
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                })
            }
        })
    })
    .post('/qrCode', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var data = JSON.stringify(req.body);
        var email = req.body.email;
        var empId = req.body.employeeId;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        QRCode.toDataURL(data, function(err, url) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(url);
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                })
            }
        })
    })
    .get('/parkingSpots', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        ParkingModel.aggregate([
                            { $lookup: { from: 'employees', localField: '_id', foreignField: 'parkingSpotId', as: 'parkingEmp' } },
                            { $unwind: { path: '$parkingEmp', preserveNullAndEmptyArrays: true } },
                            {
                                $project: {
                                    empId: "$parkingEmp._id",
                                    empFirst: "$parkingEmp.firstName",
                                    empLast: "$parkingEmp.lastName",
                                    employeeId: "$parkingEmp.employeeId",
                                    width: 1,
                                    height: 1,
                                    posX: 1,
                                    posY: 1,
                                    name: 1
                                }
                            }
                        ], function(err, seatData) {
                            if (seatData.length) {
                                console.log(seatData);
                                res.status(200).json(seatData)
                            } else {
                                res.status(400).json({ err: "No seat Data" });
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .post('/saveParkingSpot', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        console.log(data);
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        EmployeeModel.findByIdAndUpdate(data.id, { parkingSpotId: data.dropTargetId }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Parking Spot Alloted to Employee" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/unassignParking', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        if (data.empId) {
                            EmployeeModel.findByIdAndUpdate(data.empId, { $unset: { parkingSpotId: "" } }, function(err, doc) {
                                if (err)
                                    res.status(400).json(err)
                                else {
                                    res.status(200).json({ msg: "Parking Spot UnAssigned" });
                                }
                            })
                        } else {
                            res.status(401).json({ err: "No Employee Assigned" })
                        }
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .get('/lockerRooms', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        LockerModel.aggregate([
                            { $lookup: { from: 'employees', localField: '_id', foreignField: 'lockerId', as: 'lockerData' } },
                            { $unwind: { path: '$lockerData', preserveNullAndEmptyArrays: true } },
                            {
                                $project: {
                                    empId: "$lockerData._id",
                                    empFirst: "$lockerData.firstName",
                                    empLast: "$lockerData.lastName",
                                    employeeId: "$lockerData.employeeId",
                                    width: 1,
                                    height: 1,
                                    posX: 1,
                                    posY: 1,
                                    name: 1
                                }
                            }
                        ], function(err, seatData) {
                            if (seatData.length) {
                                res.status(200).json(seatData)
                            } else {
                                res.status(400).json({ err: "No seat Data" });
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .post('/saveLockerRoom', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        EmployeeModel.findByIdAndUpdate(data.id, { lockerId: data.dropTargetId }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Locker Alloted to Employee" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/unassignLocker', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        if (data.empId) {
                            EmployeeModel.findByIdAndUpdate(data.empId, { $unset: { lockerId: "" } }, function(err, doc) {
                                if (err)
                                    res.status(400).json(err)
                                else {
                                    res.status(200).json({ msg: "Locker UnAssigned" });
                                }
                            })
                        } else {
                            res.status(401).json({ err: "No Employee Assigned" })
                        }
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })


module.exports = router;