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
const excelAgg = require('../models/excelAggregation');
var json2csv = require('json2csv');
var fs = require('fs');
var reA = /[^a-zA-Z]/g;
var reN = /[^0-9]/g;

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
    //callback(false);
    //console.log(decoded.username);
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

function getSeatData(floors, callback) {
    var floorData = {};
    //console.log(floors)
    SeatToBle.count({ floorId: { $in: floors } }, function(err, seatCount) {
        if (err)
            callback(err, null)
        else {
            floorData.totalSeats = seatCount;
            SeatToBle.count({ floorId: { $in: floors }, occupied: true }, function(err, filledSeats) {
                if (err)
                    callback(err, null)
                else {
                    floorData.filledSeats = filledSeats;
                    SeatToBle.count({ floorId: { $in: floors }, status: true }, function(err, healthySensors) {
                        if (err)
                            callback(err, null)
                        else {
                            floorData.healthySensors = healthySensors;
                            SeatToBle.aggregate([{ $match: { floorId: { $in: floors } } }, { $group: { _id: '$floorId', average: { $avg: '$temperature' } } }]).exec(function(err, doc) {
                                if (err)
                                    callback(err, null)
                                else {
                                    if (doc.length) {
                                        console.log(doc.length)
                                        if (doc[0].average)
                                            floorData.tempAvg = doc[0].average.toFixed(1);
                                        else
                                            floorData.tempAvg = 0.0;
                                        RoomToBle.count({ floorId: { $in: floors } }, function(err, roomCount) {
                                            if (!err) {
                                                floorData.totalrooms = roomCount;
                                                RoomToBle.count({ floorId: { $in: floors }, peopleCount: { $gt: 0 } }, function(err, roomOccupancy) {
                                                    if (err)
                                                        res.status(400).json(err);
                                                    else {
                                                        floorData.occupiedrooms = roomOccupancy;
                                                        callback(null, floorData)
                                                    }
                                                })
                                            } else
                                                callback(err, null)
                                        })
                                    } else {
                                        callback(null, floorData)
                                    }
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}

function getBlesForSection(sectionName, callback) {
    var seats = [];
    SectionModel.find({ name: sectionName }, function(err, sections) {
        sections.forEach(function(section) {
            section.seats.map(function(seat) { seats.push(seat) });
        })
        SeatToBle.find({ seatId: { $in: seats } }, function(err, bles) {
            var bleIds = bles.map(function(ble) { return ble.bleId })
            if (bleIds.length > 0) {
                callback(bleIds)
            } else {
                callback(null)
            }
        })
    });
}

function saveBleData(sensor, callback) {
    BleModel.findByIdAndUpdate(sensor.bleId, { address: sensor.ble }, function(err, ble) {
        if (err)
            callback(err, null);
        else if (ble) {
            SeatModel.findByIdAndUpdate(sensor._id, { name: sensor.name, posX: sensor.posX, posY: sensor.posY }, function(err, seat) {
                if (err)
                    callback(err, null);
                else if (seat) {
                    callback(null, true);
                }
            })
        }
    })
}

function saveRoomData(room, callback) {
    console.log(room)
    SectionModel.findByIdAndUpdate(room._id, { posX: room.posX, posY: room.posY, width: room.width, height: room.height, rotate: room.rotate ? room.rotate : 0 }, function(err, meeting) {
        if (err)
            callback(err, null);
        else
            callback(null, true);
    })
}

function meetingRoomUsage(bles, dayStart, dayEnd, timezoneOffset, callback) {
    var counter = 0;
    var pending = bles.length;
    var roomData = {};
    //console.log(dayStart, dayEnd);
    var bleIds = bles.map(function(ble) { return ble.id })
    SensorDataModel.aggregate([{ $match: { sensorId: { $in: bleIds }, time: { $gte: new Date(dayStart * 1000), $lte: new Date(dayEnd * 1000) }, density: { $gt: 5 } } },
        {
            $project: {
                interval: { $dateToString: { format: "%H", date: { $add: ["$time", timezoneOffset] } } },
                density: 1,
                sensorId: 1
            }
        },
        { $group: { _id: { interval: "$interval", sensorId: "$sensorId" }, count: { $sum: 1 } } },
        { $match: { count: { $gte: 5 } } },
        { $project: { interval: "$_id.interval", sensorId: "$_id.sensorId" } },
        { $group: { _id: "$sensorId", count: { $sum: 1 } } },
        { $project: { _id: 0, sensorId: "$_id", count: "$count" } }
    ], function(err, result) {

        var roomData = {};
        result.forEach(function(room) {
                roomData[room.sensorId] = room.count;
            })
            //console.log(roomData)
        callback(roomData)
    })
}

function getOccupancyPattern(bleIds, dayStart, dayEnd, noOfDays, timezoneOffset, format, callback) {
    var hours = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
    var stringHours = ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];

    SensorDataModel.aggregate([
        { $match: { sensorId: { $in: bleIds }, $or: [{ occupancy: { $gt: 0 } }, { occupancy: true }], time: { $gte: new Date(dayStart), $lte: new Date(dayEnd) } } },
        {
            $project: {
                interval: { $dateToString: { format: format, date: { $add: ["$time", timezoneOffset] } } },
                occupancy: "$occupancy",
                sensorId: "$sensorId"
            }
        },
        { $group: { _id: { interval: "$interval", sensorId: "$sensorId" }, count: { $sum: "$occupancy" } } },
        { $match: { count: { $gte: 40 } } },
        { $project: { interval: "$_id.interval", sensorId: "$sensorId" } },
        { $group: { _id: "$interval", count: { $sum: 1 } } },
        { $project: { _id: 0, interval: "$_id", count: "$count" } },
        { $sort: { interval: 1 } }
    ], function(err, result) {
        var occupancyPattern = {};
        occupancyPattern.labels = [];
        occupancyPattern.values = [];
        if (noOfDays == 1) {
            for (var i = 0; i < hours.length; i++) {
                var temp = _.find(result, { 'interval': hours[i] })
                if (temp) {
                    occupancyPattern.values.push(temp.count);
                } else {
                    occupancyPattern.values.push(0);
                }
                occupancyPattern.labels.push(stringHours[i]);
            }
            callback(occupancyPattern)
        } else {
            var difference = noOfDays;
            var date = moment(dayStart)
            while (difference) {
                var now = date.format("DD-MM-YYYY");
                var temp = _.find(result, { 'interval': now });
                if (temp) {
                    occupancyPattern.values.push(temp.count);
                } else {
                    occupancyPattern.values.push(0);
                }
                occupancyPattern.labels.push(now);
                date.add(1, 'days');
                difference--
            }
            callback(occupancyPattern);
        }
        //callback(result)
    })
}

function getTemperaturePattern(bleIds, dayStart, dayEnd, noOfDays, timezoneOffset, format, callback) {
    //console.log(bleIds)
    var hours = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
    var stringHours = ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];

    SensorDataModel.aggregate([
        { $match: { sensorId: { $in: bleIds }, temperature: { $gte: 19 }, time: { $gte: new Date(dayStart), $lte: new Date(dayEnd) } } },
        {
            $project: {
                interval: { $dateToString: { format: format, date: { $add: ["$time", timezoneOffset] } } },
                temperature: "$temperature",
                sensorId: "$sensorId"
            }
        },
        // {$group: {_id:{interval:"$interval", sensorId:"$sensorId"}, average: {$avg:"$temperature"}}},
        // {$project: {_id:0,interval: "$_id.interval",average:"$average",sensorId: "$_id.sensorId"}},
        // {$sort: {interval: 1}}
    ], function(err, result) {
        console.log(result)
        var temperaturePattern = {};
        temperaturePattern.labels = [];
        temperaturePattern.values = [];
        if (noOfDays == 1) {
            for (var i = 0; i < hours.length; i++) {
                var temp = _.find(result, { 'interval': hours[i] })
                if (temp) {
                    temperaturePattern.values.push(temp.count);
                } else {
                    temperaturePattern.values.push(0);
                }
                temperaturePattern.labels.push(stringHours[i]);
            }
            callback(temperaturePattern)
        } else {
            var difference = noOfDays;
            var date = moment(dayStart)
            while (difference) {
                var now = date.format("DD-MM-YYYY");
                var temp = _.find(result, { 'interval': now });
                if (temp) {
                    temperaturePattern.values.push(temp.count);
                } else {
                    temperaturePattern.values.push(0);
                }
                temperaturePattern.labels.push(now);
                date.add(1, 'days');
                difference--
            }
            callback(temperaturePattern);
        }
        //callback(result)
    })
}

router
    .post('/login', function(req, res, next) {
        var data = req.body;
        data.uname = data.uname.toLowerCase();
        UserModel.findOne({ name: data.uname }, function(err, user, num) {

            bcrypt.compare(data.password, user.password, function(err, status) {
                if (status) {
                    if (user.isActive == true) {
                        if (err)
                            res.status(400).json(err)
                        else if (user) {
                            var text = "Login from: '" + data.uname + "' at " + Date() + "\n"
                            fs.appendFileSync("loginLogs.txt", text);
                            var myToken = jwt.sign({ username: data.uname, pwd: user.password }, global.secret, { expiresIn: '1d' });
                            res.status(200).json({ name: data.uname, userId: user._id, acc_location: user.accessibleLocation, isAdmin: user.isAdmin, isActive: user.isActive, auth_token: myToken });
                        } else {
                            res.status(401).json({ err: "Account does not exist! " });
                        }
                    } else {
                        res.status(401).json({ err: "User is deactivated! Please contact Admin " });
                    }
                } else {
                    res.status(401).json({ err: "Invalid Password" });
                }
            })

        })
    })
    .post('/changePassword', function(req, res, next) {
        var data = req.body;
        data.uname = data.uname.toLowerCase();
        if (data.password == data.cnfrmPassword) {
            UserModel.findOne({ name: data.uname }, function(err, user, num) {
                if (err)
                    res.status(400).json(err)
                else if (user) {
                    console.log(data)
                    bcrypt.compare(data.oldPassword, user.password, function(err, status) {
                        if (status) {
                            UserModel.findOneAndUpdate({ name: data.uname }, { password: bcrypt.hashSync(data.password) }, function(err, doc) {
                                if (err)
                                    res.status(400).json(err)
                                else {
                                    res.status(200).json({ msg: "Password updated login to continue" });
                                }
                            })
                        } else
                            res.status(401).json({ err: "Invalid Password" });
                    })
                } else
                    res.status(401).json({ err: "User not found" });
            })
        } else
            res.status(401).json({ err: "New and Confirm Password did not match" });
    })
    .get('/dashboardData', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var dashboardData = {};
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        SeatToBle.count({}, function(err, seatCount) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                dashboardData.totalSeats = seatCount;
                                SeatToBle.count({ occupied: true }, function(err, filledSeats) {
                                    if (err)
                                        res.status(400).json(err);
                                    else {
                                        dashboardData.filledSeats = filledSeats;
                                        SeatToBle.count({ status: true }, function(err, healthySensors) {
                                            if (err)
                                                res.status(400).json(err);
                                            else {
                                                dashboardData.healthySensors = healthySensors;

                                                RoomToBle.count({}, function(err, roomCount) {
                                                    if (err)
                                                        res.status(400).json(err);
                                                    else {
                                                        dashboardData.totalrooms = roomCount;
                                                        RoomToBle.count({ peopleCount: { $gt: 0 } }, function(err, roomOccupancy) {
                                                            if (err)
                                                                res.status(400).json(err);
                                                            else {
                                                                dashboardData.occupiedrooms = roomOccupancy;
                                                                res.status(200).json(dashboardData);
                                                            }
                                                        })
                                                    }

                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/buildingData', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var buildingData = [];
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        BuildingModel.find({ hasOccupancy: true }, function(err, buildings) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                var counter = 0;
                                var pending = buildings.length
                                var floorPercent = [];
                                buildings.forEach(function(building) {
                                    getSeatData(building.floors, function(err, floorData) {
                                        if (!err) {
                                            var temp = {};
                                            temp = floorData;
                                            temp.occupancyPercentage = parseFloat(((floorData.filledSeats / floorData.totalSeats) * 100).toFixed(2))
                                            floorPercent.push(temp.occupancyPercentage)
                                            temp.bldgId = building._id;
                                            temp.bldgName = building.alias;
                                            temp.latitude = building.latitude;
                                            temp.longitude = building.longitude;
                                            temp.timezone = building.timezone;
                                            temp.hasOccupancy = building.hasOccupancy;
                                            temp.hasLMS = building.hasLMS;
                                            buildingData.push(temp);
                                            if (++counter == pending) {
                                                var maxIndex = _.indexOf(floorPercent, _.max(floorPercent), 0);
                                                var minIndex = _.indexOf(floorPercent, _.min(floorPercent), 0);
                                                var maxFloor = buildingData[maxIndex].bldgName
                                                var minFloor = buildingData[minIndex].bldgName
                                                res.status(200).json({ buildingData: buildingData, maxFloor: maxFloor, minFloor: minFloor })
                                            }
                                        }
                                    })
                                })
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/floorOccupancy/:buildingId', function(req, res, next) {
        console.log(req.params.buildingId)
        var buildingId = req.params.buildingId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        BuildingModel.findById(buildingId, function(err, building) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                SeatToBle.aggregate([
                                    { $match: { floorId: { $in: building.floors } } },
                                    { $group: { '_id': '$floorId', total: { $sum: 1 } } },
                                    { $lookup: { from: 'floors', localField: '_id', foreignField: '_id', as: 'floor' } },
                                    { $unwind: '$floor' }, { $project: { name: "$floor.name", alias: "$floor.alias", total: 1 } }
                                ]).exec(function(err, seatCount) {

                                    if (err)
                                        res.status(400).json(err);
                                    else {

                                        SeatToBle.aggregate([
                                            { $match: { floorId: { $in: building.floors }, occupied: true } },
                                            { $group: { '_id': '$floorId', filled: { $sum: 1 } } }
                                        ]).exec(function(err, filledSeats) {

                                            if (err)
                                                res.status(400).json(err);
                                            else {
                                                filledSeats.forEach(function(filled) {
                                                    var temp = _.find(seatCount, { '_id': filled._id })
                                                    if (temp) {
                                                        temp.filled = filled.filled;
                                                        temp.percentFilled = ((temp.filled / temp.total) * 100).toFixed(2);
                                                    }
                                                });

                                                var arr = [];

                                                for (var i = 0; i < seatCount.length; i++) {
                                                    seatCount[i].name = seatCount[i].name.replace(/ /g, '')
                                                    seatCount[i].alias = seatCount[i].alias.replace(/ /g, '')
                                                    arr.push(seatCount[i].percentFilled);
                                                }
                                                arr = arr.map(function(value) { return parseFloat(value) })
                                                var maxIndex = _.indexOf(arr, _.max(arr), 0);
                                                var minIndex = _.indexOf(arr, _.min(arr), 0);
                                                console.log(maxIndex);
                                                console.log(minIndex);

                                                var maxPercent = seatCount[maxIndex];
                                                var minPercent = seatCount[minIndex];

                                                seatCount.sort(sortAlphaNum)
                                                res.status(200).json({ floorOccupancy: seatCount, maxPercentData: maxPercent, minPercentData: minPercent })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/floors/:buildingId', function(req, res, next) {
        var cookies = req.cookies;
        var buildingId = req.params.buildingId;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        BuildingModel.findById(buildingId).lean().populate({ path: 'floors', select: '-sections' }).exec(function(err, floors) {
                            if (err)
                                res.status(400).json(err);
                            else if (floors) {
                                var floorData = floors.floors;
                                floorData.sort(sortAlphaNumrev)
                                res.status(200).json(floorData);
                            } else
                                res.json({ "err": "No floor data" });
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/getSectionNames/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        FloorModel.findById(floorId).lean().populate({ path: 'sections', match: { isRoom: false }, select: " -isRoom -capacity -seats " }).exec(function(err, sections) {
                            var keys = {};
                            var sectionNames = [];
                            if (sections.sections) {
                                sections.sections.forEach(function(section) {
                                    if (!(section.name in keys)) {
                                        keys[section.name] = 1;
                                        sectionNames.push({ name: section.name, class: section.class });
                                    }
                                })
                                res.json(sectionNames);
                            } else {
                                res.status(200).json({ err: "No sections found" });
                            }
                        });
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/getSections/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        FloorModel.findById(floorId).lean().populate({ path: 'sections', match: { isRoom: false }, select: " -isRoom -capacity -seats " }).exec(function(err, sections) {
                            if (sections.sections) {
                                res.json(sections.sections);
                            } else {
                                res.status(200).json([]);
                            }
                        });
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/seatStatus/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;

        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        SeatToBle.find({ floorId: floorId }, 'seatId occupied status -_id', function(err, seats) {
                            if (err) {
                                res.status(401).json(err);
                            } else if (seats) {
                                HostModel.find({ floorId: floorId }, function(err, hosts) {
                                    var hostIds = hosts.map(function(host) { return host.id })
                                    HostLogs.find({ hostId: { $in: hostIds } }, null, { sort: { lastUpdated: -1 } }, function(err, hostData) {
                                        //console.log(hostData[0]);
                                        res.status(200).json({ seats: seats })
                                    })
                                })
                            } else {
                                res.json({ "err": "No data found" })
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/hostTime/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;

        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        HostModel.find({ floorId: floorId }, function(err, hosts) {
                            if (hosts) {
                                var hostIds = hosts.map(function(host) { return host._id })
                                    //console.log(hostIds)
                                HostLogs.aggregate([
                                    { $match: { hostId: { $in: hostIds } } },
                                    { $group: { _id: "$hostId", lastUpdated: { $max: "$lastUpdated" } } },
                                    { $lookup: { from: "hosts", foreignField: "_id", localField: "_id", as: "host" } }, { $unwind: "$host" },
                                    { $project: { hostName: "$host.name", lastUpdated: "$lastUpdated" } }
                                ], function(err, hostData) {
                                    //console.log(hostData)
                                    if (hostData.length) {
                                        //console.log(hostData[0])
                                        res.status(200).json(hostData)
                                    } else {
                                        res.status(400).json({ err: "No Host Logs" });
                                    }
                                })
                            } else {
                                res.status(400).json({ err: "No Host Data" });
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/seatData/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        SeatModel.find({ floorId: floorId }, null, { sort: 'name' }, function(err, data, num) {
                            if (err)
                                res.status(400).json(err);
                            else if (data) {
                                res.status(200).json(data)
                            } else
                                res.json({ "err": "No seat data" });
                        });
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/seatBleData/:floorId', function(req, res, next) {
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
                        console.log(floorId)
                        SeatModel.aggregate([
                            { $match: { floorId: mongoose.Types.ObjectId(floorId) } },
                            { $lookup: { from: 'sensortobles', localField: '_id', foreignField: 'seatId', as: 'seatble' } },
                            { $unwind: '$seatble' },
                            { $lookup: { from: 'bles', localField: 'seatble.bleId', foreignField: '_id', as: 'ble' } }, { $unwind: "$ble" },
                            { $project: { bleId: "$ble._id", ble: "$ble.address", globalName: 1, width: 1, height: 1, posX: 1, posY: 1, name: 1 } }
                        ], function(err, seats) {
                            console.log(seats);
                            if (seats.length) {
                                res.status(200).json(seats)
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
    .post('/saveSeatConfiguration', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        if (data.length > 1) {
                            var counter = 0;
                            var pending = data.length;
                            data.forEach(function(seat) {
                                saveBleData(seat, function(err, doc) {
                                    if (!err) {
                                        if (++counter == pending) {
                                            res.status(200).json({ msg: "Done" });
                                        }
                                    }
                                });

                            })
                        } else {
                            saveBleData(data, function(err, doc) {
                                if (err)
                                    res.status(400).json(err)
                                else {
                                    res.status(200).json({ msg: "Done" });
                                }
                            });
                        }
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })

.post('/saveRoomConfiguration', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        if (data.length >= 1) {
                            var counter = 0;
                            var pending = data.length;
                            data.forEach(function(room) {
                                saveRoomData(room, function(err, doc) {
                                    console.log(err, doc)
                                    if (!err) {
                                        if (++counter == pending) {
                                            res.status(200).json({ msg: "Done" });
                                        } else
                                            console.log(err)
                                    }
                                });

                            })
                        } else {
                            saveRoomData(data, function(err, doc) {
                                if (err) {
                                    res.status(400).json(err)
                                    console.log(err)
                                } else {
                                    res.status(200).json({ msg: "Done" });
                                }
                            });
                        }
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .get('/roomData/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        FloorModel.findById(floorId).lean().populate({ path: 'sections', match: { isRoom: true } }).exec(function(err, rooms) {
                            res.json(rooms.sections);
                        });
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/roomStatus/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        RoomToBle.find({ floorId: floorId }, 'roomId peopleCount -_id', function(err, roomStatus) {
                            res.json(roomStatus)
                        });
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/tempData/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;

        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        BleModel.find({ floorId: floorId, hasTemperature: true }, '_id', function(err, bles) {
                            if (err)
                                res.status(400).json(err);
                            else if (bles) {
                                var bleIds = bles.map(function(ble) { return ble.id });
                                SeatToBle.find({ bleId: { $in: bleIds } }, 'seatId', function(err, seats) {
                                    if (err)
                                        res.status(400).json(err);
                                    else if (seats) {
                                        var seatIds = seats.map(function(seat) { return seat.seatId });
                                        SeatModel.find({ _id: { $in: seatIds } }, function(err, seatData) {
                                            if (err)
                                                res.status(400).json(err);
                                            else
                                                res.json(seatData)
                                        })
                                    } else {
                                        res.json({ "err": "No seat data" });
                                    }
                                })
                            } else {
                                res.json({ "err": "No seat data" });
                            }

                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        });
    })
    .get('/tempStatus/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var cookies = req.cookies;
        var token = cookies.auth_token;

        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                BleModel.find({ floorId: floorId, hasTemperature: true }, '_id', function(err, bles) {

                    if (err)
                        res.status(400).json(err);
                    else if (bles) {
                        var bleIds = bles.map(function(ble) { return ble.id });
                        SeatToBle.find({ bleId: { $in: bleIds } }, 'seatId temperature -_id', function(err, seats) {
                            if (err)
                                res.status(400).json(err);
                            else if (seats) {
                                //console.log(seats);
                                res.status(200).json(seats);
                            } else {
                                res.json({ "err": "No seat data" });
                            }
                        })
                    } else {
                        res.json({ "err": "No seat data" });
                    }

                })
            }
        });
    })
    .get('/occupancyPattern/:buildingId', function(req, res, next) {
        var buildingId = req.params.buildingId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var data = req.query;
        var occupancyData = [];
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        var occData = {};
                        occData.occupancyPattern = []
                        BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function(err, building) {
                            var dayStart = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', building.timezone).unix() * 1000;
                            var dayEnd = moment.tz(data.eyear + '-' + parseInt(data.emonth).pad(2) + '-' + parseInt(data.eday).pad(2) + ' 23:59:59', building.timezone).unix() * 1000;
                            var noOfDays = difference = moment.duration((dayEnd + 1000) - dayStart).asDays();
                            var format;
                            if (difference == 1)
                                format = '%H';
                            else {
                                format = '%d-%m-%Y';
                            }
                            var counter = 0;
                            var pending = building.floors.length;
                            building.floors.forEach(function(floor) {
                                SeatToBle.find({ floorId: floor._id }, "bleId -_id", function(err, bles) {
                                    var bleIds = bles.map(function(ble) { return ble.bleId });
                                    //console.log(bleIds)
                                    getOccupancyPattern(bleIds, dayStart, dayEnd, noOfDays, building.timezoneOffset, format, function(occupancyPattern) {
                                        var temp = {}
                                        temp.name = floor.name;
                                        temp.totalSeats = bleIds.length;
                                        temp.values = occupancyPattern.values;
                                        occData.labels = occupancyPattern.labels;
                                        occData.occupancyPattern.push(temp)
                                        if (++counter == pending) {
                                            var buildingAverage = _.fill(new Array(occData.labels.length), 0);
                                            var totalBuildingSeats = 0;
                                            var totalBuildingAverage = 0;
                                            //console.log(average, floorSum)
                                            for (var i = 0; i < occData.occupancyPattern.length; i++) {
                                                for (var j = 0; j < buildingAverage.length; j++) {
                                                    buildingAverage[j] += occData.occupancyPattern[i]['values'][j];
                                                }
                                                totalBuildingSeats += occData.occupancyPattern[i]['totalSeats'];
                                                /*occData.occupancyPattern[i]['maxValue'] = _.max(occData.occupancyPattern[i]['values'])
                                                occData.occupancyPattern[i]['minValue'] = Math.min.apply(null, occData.occupancyPattern[i]['values'].filter(Boolean));*/
                                            }
                                            buildingAverage.forEach(function(building) {
                                                totalBuildingAverage += building;
                                            })
                                            occData.maxBuildingOccupancy = _.max(buildingAverage);
                                            occData.maxBuildingOccupancyTime = occData.labels[_.indexOf(buildingAverage, occData.maxBuildingOccupancy, 0)];
                                            occData.minBuildingOccupancy = Math.min.apply(null, buildingAverage.filter(Boolean));
                                            occData.minBuildingOccupancyTime = occData.labels[_.indexOf(buildingAverage, occData.minBuildingOccupancy, 0)];
                                            occData.minBuildingOccupancy = occData.minBuildingOccupancyTime ? occData.minBuildingOccupancy : 0;
                                            occData.minBuildingOccupancyTime = occData.minBuildingOccupancyTime ? occData.minBuildingOccupancyTime : occData.labels[0];
                                            occData.maxBuildingOccupancyPercent = parseFloat(((occData.maxBuildingOccupancy / totalBuildingSeats) * 100).toFixed(1));
                                            occData.minBuildingOccupancyPercent = parseFloat(((occData.minBuildingOccupancy / totalBuildingSeats) * 100).toFixed(1));
                                            occData.totalBuildingSeats = totalBuildingSeats;
                                            occData.totalBuildingAverage = Math.floor(totalBuildingAverage / buildingAverage.length)
                                                //console.log(occData.minBuildingOccupancy)
                                            var temp = {};
                                            temp.name = "Building Average";
                                            temp.totalSeats = totalBuildingSeats;
                                            temp.values = buildingAverage;
                                            occData.occupancyPattern.push(temp);
                                            res.json(occData)
                                        }
                                    })
                                })
                            })
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/roomUtil/:floorId', function(req, res, next) {
        //var floorId = req.params.floorId;
        var floorId = req.params.floorId;
        var data = req.query;
        var hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

        var dayStartIST = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', 'Asia/Kolkata').unix();
        var dayEndIST = moment.tz(data.eyear + '-' + (parseInt(data.emonth).pad(2)) + '-' + parseInt(data.eday).pad(2) + 'T23:59:59', 'Asia/Kolkata').unix();
        var floorData = {};
        BuildingModel.find({ floors: { $in: [floorId] } }, function(err, building) {
            if (building) {
                RoomToBle.find({ floorId: floorId }, 'bleId roomId').lean().populate({ path: 'roomId', select: 'name', match: { name: /^(?!Flap).*$/ } }).exec(function(err, rooms) {
                    if (err)
                        res.status(400).json(err);
                    else if (rooms) {
                        var bles = rooms.map(function(room) { return { id: room.bleId } });
                        meetingRoomUsage(bles, dayStartIST, dayEndIST, building.timezoneOffset, function(roomData) {
                            var names = [];
                            var used = [];
                            //console.log(rooms)
                            rooms.forEach(function(room) {
                                if (room.roomId) {
                                    names.push(room.roomId.name);
                                    used.push(roomData[room.bleId] ? (roomData[room.bleId] % 12) : 0);
                                }
                            })
                            floorData = { 'rooms': names, 'used': used };
                            res.json(floorData);
                        })
                    } else
                        res.json({ "used": "[]", "names": "[]" });
                });
            } else {
                res.json({ "used": "[]", "names": "[]" });
            }
        })
    })
    .get('/flapCounts', function(req, res, next) {
        var roomIds = ["5a0c461d468a79cd63482667", "5a0c461d468a79cd63482660", "5a0c461d468a79cd6348265d", "5a0c461d468a79cd6348265c", "5a0c461d468a79cd6348265f", "5a0c461d468a79cd6348265e"];
        //console.log(roomIds)
        SectionModel.aggregate([{ $match: { name: /Flap/ } }, { $lookup: { from: "roomtobles", localField: "_id", foreignField: "roomId", as: "sections" } }, { $unwind: "$sections" }, { $project: { name: 1, peopleCount: "$sections.peopleCount" } }, { $group: { _id: null, totalCount: { $sum: "$peopleCount" } } }], function(err, data) {
            console.log(data)
            if (data.length) {
                res.json({ totalCount: data[0].totalCount })
            } else {
                res.json({ totalCount: 0 })

            }

        })
    })
    // .get('/temperaturePattern/:buildingId', function(req, res, next){
    //     var buildingId = req.params.buildingId;
    //     var cookies = req.cookies;
    //     var token = cookies.auth_token;
    //     var data = req.query;
    //     var temperatureData = [];
    //     jwt.verify(token, global.secret,function(err,decoded){
    //         if(err){
    //             res.status(401).json(err);
    //         }
    //         else
    //         {
    //              validateRequest(decoded, function(status){
    //                 if(status)
    //                 {
    //                     var tempData = {};
    //                     tempData.temperaturePattern = []
    //                     BuildingModel.findById(buildingId).lean().populate({path:"floors", select: 'name _id'}).exec(function(err, building){
    //                         var dayStart = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', building.timezone).unix()*1000;
    //                         var dayEnd = moment.tz(data.eyear + '-' + parseInt(data.emonth).pad(2) + '-' + parseInt(data.eday).pad(2) + ' 23:59:59', building.timezone).unix()*1000;
    //                         var noOfDays = difference = moment.duration((dayEnd + 1000) - dayStart).asDays();
    //                         var format;
    //                         if(difference == 1)
    //                             format = '%H';
    //                         else
    //                         {
    //                             format = '%d-%m-%Y';
    //                         }
    //                         var counter = 0;
    //                         var pending = building.floors.length;
    //                         building.floors.forEach(function(floor){
    //                             SeatToBle.find({floorId : floor._id},"bleId -_id", function(err, bles){
    //                                 var bleIds = bles.map(function(ble){return ble.bleId});
    //                                 //console.log(bleIds)
    //                                 console.log(dayStart)
    //                                 console.log(dayEnd)
    //                                 getTemperaturePattern(bleIds, dayStart, dayEnd, noOfDays, building.timezoneOffset, format, function(temperaturePattern){
    //                                     //console.log(temperaturePattern)
    //                                     console.log(temperaturePattern)
    //                                     // var temp = {}
    //                                     // temp.name = floor.name;
    //                                     // temp.totalSeats = bleIds.length;
    //                                     // temp.values = occupancyPattern.values;
    //                                     // tempData.labels = occupancyPattern.labels;
    //                                     // tempData.occupancyPattern.push(temp)
    //                                     // if(++counter == pending)
    //                                     // {
    //                                     //     var buildingAverage = _.fill(new Array(tempData.labels.length), 0);
    //                                     //     var totalBuildingSeats = 0;
    //                                     //     var totalBuildingAverage = 0;
    //                                     //     //console.log(average, floorSum)
    //                                     //     for(var i=0; i < tempData.occupancyPattern.length; i++)
    //                                     //     {
    //                                     //         for(var j=0; j < buildingAverage.length; j++)
    //                                     //         {
    //                                     //             buildingAverage[j] += occData.occupancyPattern[i]['values'][j];
    //                                     //         }
    //                                     //         totalBuildingSeats += occData.occupancyPattern[i]['totalSeats'];
    //                                     //         /*occData.occupancyPattern[i]['maxValue'] = _.max(occData.occupancyPattern[i]['values'])
    //                                     //         occData.occupancyPattern[i]['minValue'] = Math.min.apply(null, occData.occupancyPattern[i]['values'].filter(Boolean));*/
    //                                     //     }
    //                                     //     buildingAverage.forEach(function(building){
    //                                     //         totalBuildingAverage += building;
    //                                     //     })
    //                                     //     occData.maxBuildingOccupancy = _.max(buildingAverage);
    //                                     //     occData.maxBuildingOccupancyTime = occData.labels[_.indexOf(buildingAverage, occData.maxBuildingOccupancy, 0)];
    //                                     //     occData.minBuildingOccupancy = Math.min.apply(null, buildingAverage.filter(Boolean));
    //                                     //     occData.minBuildingOccupancyTime = occData.labels[_.indexOf(buildingAverage, occData.minBuildingOccupancy, 0)];
    //                                     //     occData.minBuildingOccupancy = occData.minBuildingOccupancyTime ? occData.minBuildingOccupancy : 0;
    //                                     //     occData.minBuildingOccupancyTime = occData.minBuildingOccupancyTime ? occData.minBuildingOccupancyTime : occData.labels[0];
    //                                     //     occData.maxBuildingOccupancyPercent = parseFloat(((occData.maxBuildingOccupancy/totalBuildingSeats)* 100).toFixed(1));
    //                                     //     occData.minBuildingOccupancyPercent = parseFloat(((occData.minBuildingOccupancy/totalBuildingSeats)* 100).toFixed(1));
    //                                     //     occData.totalBuildingSeats = totalBuildingSeats;
    //                                     //     occData.totalBuildingAverage = Math.floor(totalBuildingAverage / buildingAverage.length)
    //                                     //     //console.log(occData.minBuildingOccupancy)
    //                                     //     var temp = {};
    //                                     //     temp.name = "Building Average";
    //                                     //     temp.totalSeats = totalBuildingSeats;
    //                                     //     temp.values = buildingAverage;
    //                                     //     occData.occupancyPattern.push(temp);
    //                                     //     res.json(occData)
    //                                     // }
    //                                 })
    //                             })
    //                         })
    //                     })
    //                 }
    //                 else
    //                 {
    //                     res.status(403).json({err: "Unauthorized Request"});
    //                 }
    //             });
    //         }
    //     })
    // })
    .post('/mailReport', function(req, res, next) {
        var data = req.body;
        var email = data.email;
        var sday = data.sday;
        var eday = data.eday;
        var smonth = data.smonth;
        var emonth = data.emonth;
        var syear = data.syear;
        var eyear = data.eyear;
        var bldgId = data.bldgId;
        var url = '';
        if (bldgId == "58569f6c93864447df3c42e6") {
            url = `http://52.221.164.65/reports/?sday=${sday}&smonth=${smonth}&syear=${syear}&eday=${eday}&emonth=${emonth}&eyear=${eyear}`
        } else if (bldgId == "59b0126b138ae0871a99ecce") {
            url = `http://52.221.164.65/reports/index_pune.html?sday=${sday}&smonth=${smonth}&syear=${syear}&eday=${eday}&emonth=${emonth}&eyear=${eyear}`
        }
        var now = new Date();
        console.log(data)
        var filename = "/home/ubuntu/occupancy/reports/report-for-" + email + "-on-" + (now.getDate()) + '-' + (now.getMonth() + 1) + '-' + now.getFullYear() + '.pdf';
        var child = exec("phantomjs /home/ubuntu/occupancy/rasterize.js '" + url + "' " + filename + ' A4', function(error, stdout, stderr) {
            console.log(error, stdout, stderr)
            var mailOptions = {
                from: "Adappt info <info@arraystorm.com>",
                to: email,
                bcc: "govardhan@arraystorm.com, akshay.davasam@arraystorm.com, amith@arraystorm.com",
                subject: 'Adappt Occupancy Report',
                html: '<html>\
    <head>\
        <meta charset="utf-8">\
        <meta http-equiv="X-UA-Compatible" content="IE=edge">\
        <title></title>\
        <link rel="stylesheet" href="">\
    </head>\
    <body>\
        <header id="header" class="">\
        </header>\
        <content>\
            <div style="background:#f9f9f9;color:#373737;font-family:Helvetica,Arial,sans-serif;font-size:17px;line-height:24px;max-width:100%;width:100%!important;margin:0 auto;padding:0">\
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;line-height:24px;margin:0;padding:0;width:100%;font-size:17px;color:#373737;background:#f9f9f9">\
                    <tbody>\
                        <tr>\
                            <td valign="top" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse">\
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">\
                                    <tbody>\
                                        <tr>\
                                            <td valign="bottom" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse;padding:20px 16px 12px">\
                                                <div style="text-align:center">\
                                                    <a href="#" style="color:#439fe0;font-weight:bold;text-decoration:none;word-break:break-word" target="_blank" data-saferedirecturl="#">\
                                                    <img src="http://barclaysdemo.adapptonline.com/img/adappt.png" width="150" height="56" style="outline:none;text-decoration:none;border:none" class="CToWUd"></a>\
                                                </div>\
                                            </td>\
                                        </tr>\
                                    </tbody>\
                                </table>\
                            </td>\
                        </tr>\
                        <tr>\
                            <td valign="top" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse">\
                                <table cellpadding="32" cellspacing="0" border="0" align="center" style="border-collapse:collapse;background:white;border-radius:0.5rem;margin-bottom:1rem">\
                                    <tbody>\
                                        <tr>\
                                            <td width="650" valign="top" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse">\
                                                <div style="max-width:650px;margin:0 auto">\
                                                    <h2 style="color:#3a3b3c;line-height:30px;margin-bottom:12px;margin:0 auto 2rem;font-size:1.8rem;text-align:center">\
                                                        Adappt Occupancy Report\
                                                    </h2>\
                                                </div>\
                                                </td>\
                                            </tr>\
                                        </tbody>\
                                    </table>\
                                </td>\
                            </tr>\
                            <tr>\
                                <td style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse">\
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin-top:1rem;background:white;color:#989ea6">\
                                        <tbody>\
                                            <tr>\
                                                <td style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse;height:5px;background-image:url("#");background-repeat:repeat-x;background-size:auto 5px"></td>\
                                            </tr>\
                                            <tr>\
                                                <td valign="top" align="center" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse;padding:16px 8px 24px">\
                                                    <div style="max-width:600px;margin:0 auto">\
                                                        <p style="font-size:12px;line-height:20px;margin:0 0 16px;margin-top:16px">\
                                                            Made by <a href="www.adappt.com" style="color:#439fe0;font-weight:bold;text-decoration:none;word-break:break-word" target="_blank" data-saferedirecturl="www.adappt.com">Adappt Intelligence</a><br/>\
                                                            <a href="www.adappt.com" style="color:#439fe0;font-weight:bold;text-decoration:none;word-break:break-word;text-align: center;" target="_blank" data-saferedirecturl="www.adappt.com" >\
                        All Rights Reserved by &copy; Adappt </a>\
                                                        </p>\
                                                    </div>\
                                                </td>\
                                            </tr>\
                                        </tbody>\
                                    </table>\
                                </td>\
                            </tr>\
                        </tbody>\
                    </table>\
                </div>\
            </content>\
        </body>\
    </html>',
                attachments: [{
                    filename: path.basename(filename),
                    contentType: 'application/pdf',
                    path: filename
                }]
            };
            smtpTransport.sendMail(mailOptions, function(error, response) {
                if (error) {
                    console.log("Mail error")
                    console.log(error);
                } else {
                    console.log("Done");
                }
            });
        });
        res.send("Done")
    })
    .get('/buPattern/:buildingId', function(req, res, next) {
        var buildingId = req.params.buildingId;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var data = req.query;
        var occupancyData = [];
        var sectionDone = {};
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function(err, building) {
                            var dayStart = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', building.timezone).unix() * 1000;
                            var dayEnd = moment.tz(data.eyear + '-' + parseInt(data.emonth).pad(2) + '-' + parseInt(data.eday).pad(2) + ' 23:59:59', building.timezone).unix() * 1000;
                            var noOfDays = difference = moment.duration((dayEnd + 1000) - dayStart).asDays();
                            var format;
                            if (difference == 1)
                                format = '%H';
                            else {
                                format = '%d-%m-%Y';
                            }
                            var counter = 0;
                            var pending = building.floors.length;
                            //console.log(building)
                            var occData = {};
                            occData.occupancyPattern = [];
                            building.floors.forEach(function(floor) {
                                FloorModel.findById(floor._id).lean().populate({ path: 'sections', match: { isRoom: false }, select: " -isRoom -capacity" }).exec(function(err, sections) {
                                    if (sections.sections.length > 0) {
                                        getSectionData(sections.sections, sectionDone, dayStart, dayEnd, noOfDays, building.timezoneOffset, format, occData, function(sectionData) {
                                            if (++counter == pending) {
                                                var buildingAverage = _.fill(new Array(occData.labels.length), 0);
                                                var totalBuildingSeats = 0;
                                                var totalBuildingAverage = 0;
                                                //console.log(average, floorSum)
                                                for (var i = 0; i < occData.occupancyPattern.length; i++) {
                                                    for (var j = 0; j < buildingAverage.length; j++) {
                                                        buildingAverage[j] += occData.occupancyPattern[i]['values'][j];
                                                    }
                                                    totalBuildingSeats += occData.occupancyPattern[i]['totalSeats'];
                                                    /*occData.occupancyPattern[i]['maxValue'] = _.max(occData.occupancyPattern[i]['values'])
                                                    occData.occupancyPattern[i]['minValue'] = Math.min.apply(null, occData.occupancyPattern[i]['values'].filter(Boolean));*/
                                                }
                                                buildingAverage.forEach(function(building) {
                                                    totalBuildingAverage += building;
                                                })
                                                occData.maxBuildingOccupancy = _.max(buildingAverage);
                                                occData.maxBuildingOccupancyTime = occData.labels[_.indexOf(buildingAverage, occData.maxBuildingOccupancy, 0)];
                                                occData.minBuildingOccupancy = Math.min.apply(null, buildingAverage.filter(Boolean));
                                                occData.minBuildingOccupancyTime = occData.labels[_.indexOf(buildingAverage, occData.minBuildingOccupancy, 0)];
                                                occData.minBuildingOccupancy = occData.minBuildingOccupancyTime ? occData.minBuildingOccupancy : 0;
                                                occData.minBuildingOccupancyTime = occData.minBuildingOccupancyTime ? occData.minBuildingOccupancyTime : occData.labels[0];
                                                occData.maxBuildingOccupancyPercent = parseFloat(((occData.maxBuildingOccupancy / totalBuildingSeats) * 100).toFixed(1));
                                                occData.minBuildingOccupancyPercent = parseFloat(((occData.minBuildingOccupancy / totalBuildingSeats) * 100).toFixed(1));
                                                occData.totalBuildingSeats = totalBuildingSeats;
                                                occData.totalBuildingAverage = Math.floor(totalBuildingAverage / buildingAverage.length)
                                                    //console.log(occData.minBuildingOccupancy)
                                                var temp = {};
                                                temp.name = "Building Average";
                                                temp.totalSeats = totalBuildingSeats;
                                                temp.values = buildingAverage;
                                                occData.occupancyPattern.push(temp);
                                                res.json(occData)
                                            }
                                        })
                                    } else {
                                        if (++counter == pending) {
                                            res.json(occData)
                                        }
                                    }
                                });
                            })
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })

        function getSectionData(sections, sectionDone, dayStart, dayEnd, noOfDays, timezoneOffset, format, occData, callback) {
            var counter = 0;
            var pending = sections.length;
            sections.forEach(function(section) {
                if (!sectionDone[section.name]) {
                    sectionDone[section.name] = true;
                    getBlesForSection(section.name, function(bleIds) {
                        if (bleIds) {
                            getOccupancyPattern(bleIds, dayStart, dayEnd, noOfDays, timezoneOffset, format, function(occupancyPattern) {
                                var temp = {}
                                temp.name = section.name;
                                temp.totalSeats = bleIds.length;
                                temp.values = occupancyPattern.values;
                                occData.labels = occupancyPattern.labels;
                                occData.occupancyPattern.push(temp);
                                if (++counter == pending) {
                                    callback(occData)
                                }
                            })
                        } else {
                            if (++counter == pending) {
                                callback(occData)
                            }
                        }
                    })
                } else {
                    if (++counter == pending) {
                        callback(occData)
                    }
                }
            })
        }
    })
    .get('/utilData/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        var data = req.query;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                /*var dayStartIST = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', 'Asia/Kolkata').unix()*1000;
                var dayEndIST = moment.tz(data.eyear + '-' + (parseInt(data.emonth).pad(2)) + '-' + parseInt(data.eday).pad(2) + 'T23:59:59', 'Asia/Kolkata').unix()*1000;*/
                var dayStartIST = moment.tz(data.year + '-' + (parseInt(data.month).pad(2)) + '-' + parseInt(data.day).pad(2) + 'T00:00:00', 'Asia/Kolkata').unix() * 1000;
                var dayEndIST = moment.tz(data.year + '-' + (parseInt(data.month).pad(2)) + '-' + parseInt(data.day).pad(2) + 'T23:59:59', 'Asia/Kolkata').unix() * 1000;
                var dayStart = new Date(dayStartIST);
                var dayEnd = new Date(dayEndIST);
                BuildingModel.findOne({ floors: { $in: [floorId] } }, function(err, building) {
                    if (building) {
                        SeatToBle.find({ floorId: floorId }, 'seatId bleId', { sort: 'seatId' }).lean().populate({ path: 'seatId', select: 'name globalName' }).exec(function(err, seats) {
                            if (err)
                                res.status(400).json(err);
                            else if (seats) {
                                var bleIds = seats.map(function(seat) { return seat.bleId });
                                SensorDataModel.aggregate(
                                    [
                                        { $match: { $and: [{ 'sensorId': { $in: bleIds } }, { $and: [{ time: { $gte: dayStart } }, { time: { $lte: dayEnd } }] }, { occupancy: { $gt: 0 } }] } },
                                        {
                                            $project: {
                                                interval: { $dateToString: { format: "%H:%M", date: { $add: ["$time", building.timezoneOffset] } } },
                                                occupancy: 1,
                                                sensorId: 1,
                                            }
                                        },
                                        { $group: { _id: { sensorId: "$sensorId", interval: "$interval" }, total: { $sum: "$occupancy" } } },
                                        { $match: { total: { $gte: 8 } } },
                                        { $project: { interval: { $substr: ["$_id.interval", 0, 2] }, total: 1, sensorId: "$_id.sensorId", _id: 0 } },
                                        { $group: { _id: { sensorId: "$sensorId", interval: "$interval" }, count: { $sum: 1 } } },
                                        { $match: { count: { $gte: 2 } } },
                                        { $project: { interval: { $substr: ["$_id.interval", 0, 2] }, count: 1, sensorId: "$_id.sensorId", _id: 0 } },
                                        { $group: { _id: { sensorId: "$sensorId" }, hours: { $sum: 1 } } },
                                        { $project: { total: "$hours", sensorId: "$_id.sensorId", _id: 0 } },
                                    ],
                                    function(err, data) {
                                        var used = [];
                                        var names = [];
                                        //console.log(data);
                                        seats.forEach(function(seat) {
                                            names.push(seat.seatId.globalName);
                                            var obj = _.find(data, { "sensorId": seat.bleId })
                                            if (obj) {
                                                var tmp = (parseInt(obj.total));
                                                used.push(tmp);
                                            } else
                                                used.push(0);
                                        })
                                        res.json({ used: used, names: names });
                                        //res.json(data)
                                    });
                            } else
                                res.json({ "used": "[]", "names": "[]" });
                        });
                    } else
                        res.json({ "used": "[]", "names": "[]" });
                });
            }
        });
    })
    .get("/exportExcel", function(req, res, next) {
        var data = req.query;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var bldgId = data.bldgId;
        /*var hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];*/
        var hours = ["00:00", "00:10", "00:20", "00:30", "00:40", "00:50", "01:00", "01:10", "01:20", "01:30", "01:40", "01:50", "02:00", "02:10", "02:20", "02:30", "02:40", "02:50", "03:00", "03:10", "03:20", "03:30", "03:40", "03:50", "04:00", "04:10", "04:20", "04:30", "04:40", "04:50", "05:00", "05:10", "05:20", "05:30", "05:40", "05:50", "06:00", "06:10", "06:20", "06:30", "06:40", "06:50", "07:00", "07:10", "07:20", "07:30", "07:40", "07:50", "08:00", "08:10", "08:20", "08:30", "08:40", "08:50", "09:00", "09:10", "09:20", "09:30", "09:40", "09:50", "10:00", "10:10", "10:20", "10:30", "10:40", "10:50", "11:00", "11:10", "11:20", "11:30", "11:40", "11:50", "12:00", "12:10", "12:20", "12:30", "12:40", "12:50", "13:00", "13:10", "13:20", "13:30", "13:40", "13:50", "14:00", "14:10", "14:20", "14:30", "14:40", "14:50", "15:00", "15:10", "15:20", "15:30", "15:40", "15:50", "16:00", "16:10", "16:20", "16:30", "16:40", "16:50", "17:00", "17:10", "17:20", "17:30", "17:40", "17:50", "18:00", "18:10", "18:20", "18:30", "18:40", "18:50", "19:00", "19:10", "19:20", "19:30", "19:40", "19:50", "20:00", "20:10", "20:20", "20:30", "20:40", "20:50", "21:00", "21:10", "21:20", "21:30", "21:40", "21:50", "22:00", "22:10", "22:20", "22:30", "22:40", "22:50", "23:00", "23:10", "23:20", "23:30", "23:40", "23:50"]
        var fields = ["Country", "Region", "Location", "Resource Type", "floor", "Department", "seatName", "day", "00:00", "00:10", "00:20", "00:30", "00:40", "00:50", "01:00", "01:10", "01:20", "01:30", "01:40", "01:50", "02:00", "02:10", "02:20", "02:30", "02:40", "02:50", "03:00", "03:10", "03:20", "03:30", "03:40", "03:50", "04:00", "04:10", "04:20", "04:30", "04:40", "04:50", "05:00", "05:10", "05:20", "05:30", "05:40", "05:50", "06:00", "06:10", "06:20", "06:30", "06:40", "06:50", "07:00", "07:10", "07:20", "07:30", "07:40", "07:50", "08:00", "08:10", "08:20", "08:30", "08:40", "08:50", "09:00", "09:10", "09:20", "09:30", "09:40", "09:50", "10:00", "10:10", "10:20", "10:30", "10:40", "10:50", "11:00", "11:10", "11:20", "11:30", "11:40", "11:50", "12:00", "12:10", "12:20", "12:30", "12:40", "12:50", "13:00", "13:10", "13:20", "13:30", "13:40", "13:50", "14:00", "14:10", "14:20", "14:30", "14:40", "14:50", "15:00", "15:10", "15:20", "15:30", "15:40", "15:50", "16:00", "16:10", "16:20", "16:30", "16:40", "16:50", "17:00", "17:10", "17:20", "17:30", "17:40", "17:50", "18:00", "18:10", "18:20", "18:30", "18:40", "18:50", "19:00", "19:10", "19:20", "19:30", "19:40", "19:50", "20:00", "20:10", "20:20", "20:30", "20:40", "20:50", "21:00", "21:10", "21:20", "21:30", "21:40", "21:50", "22:00", "22:10", "22:20", "22:30", "22:40", "22:50", "23:00", "23:10", "23:20", "23:30", "23:40", "23:50"]
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                var dataset = [];
                var dayRangeStartIST = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', 'Asia/Kolkata').unix() * 1000;
                var dayRangeEndIST = moment.tz(data.eyear + '-' + (parseInt(data.emonth).pad(2)) + '-' + parseInt(data.eday).pad(2) + 'T23:59:59', 'Asia/Kolkata').unix() * 1000;
                var noOfDays = difference = moment.duration((dayRangeEndIST + 1000) - dayRangeStartIST).asDays();
                var days = [];
                for (var i = 0; i < noOfDays; i++) {
                    var dayCounter = i * 86400000;
                    var currentDay = new Date(dayRangeStartIST + dayCounter)
                    var dateStr = currentDay.getDate() + "-" + parseInt(currentDay.getMonth() + 1) + "-" + currentDay.getFullYear();
                    days.push(dateStr);
                }
                console.log(days);
                BuildingModel.findById(bldgId).lean().populate({ path: 'floors', select: '-sections' }).exec(function(err, building) {
                    var floorNames = building.floors.map(function(floor) { return floor.name });
                    console.log(floorNames)
                    excelAgg.find({ day: { $in: days }, floor: { $in: floorNames } }, '-_id -done', function(err, data) {
                        if (data) {
                            json2csv({ data: data, fields: fields }, function(err, report) {
                                if (!err) {
                                    res.attachment('Report.csv');
                                    res.send(report);
                                } else {
                                    res.status(400).json({ err: "Failed To generate report" });
                                }

                            });
                        } else {
                            res.status(400).json({ err: "No data for selected date range" });
                        }
                    })
                })
            }
        });
    })
    .post('/addUser', function(req, res, next) {
        var data = req.body;
        data.fname = data.fname.toLowerCase();
        data.lname = data.lname.toLowerCase();
        console.log(data);
        if (data) {
            console.log(data);
            user = new UserModel({
                password: bcrypt.hashSync(data.password),
                name: data.id,
                firstName: data.fname,
                lastName: data.lname,
                email: data.email,
                isAdmin: data.isAdmin
            })
            user.save(function(err, doc, num) {
                if (err)
                    res.json(err);
                else
                    res.status(200).json({ msg: "User Added" });
            })
        }
    })
    .post('/updateEmailPriority', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        UserModel.findByIdAndUpdate(data._id, { emailPriority: data.emailPriority }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Done" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/updateReportPriority', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        console.log(data);
                        UserModel.findByIdAndUpdate(data._id, { reportPriority: data.reportPriority }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Done" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/updateUserStatus', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        UserModel.findByIdAndUpdate(data._id, { isActive: data.isActive }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Updated" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/updateAdminData', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        UserModel.findByIdAndUpdate(data._id, { isAdmin: data.isAdmin }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Updated" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/updateLocation', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        UserModel.findByIdAndUpdate(data._id, { accessibleLocation: data.accessibleLocation }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Locations Updated" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/deleteUser', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        UserModel.deleteOne({ _id: data._id }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "User Deleted" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/resetPassword', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        UserModel.findByIdAndUpdate(data._id, { password: bcrypt.hashSync(data.password) }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "Password reset" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .post('/saveEdited', function(req, res, next) {
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

                        UserModel.findByIdAndUpdate(data.id, query, function(err, doc) {
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
    .post('/saveUserData', function(req, res, next) {
        var data = req.body;
        var cookies = req.cookies;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        UserModel.findByIdAndUpdate(data.id, { firstName: data.firstName, lastName: data.lastName, email: data.email }, function(err, doc) {
                            if (err)
                                res.status(400).json(err)
                            else {
                                res.status(200).json({ msg: "User Details Updated" });
                            }
                        })
                    } else
                        res.status(403).json({ err: "Unauthorized Request" });
                })
            }
        })
    })
    .get('/userData', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var dashboardData = {};
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        UserModel.aggregate([{
                            $project: {
                                accessibleLocation: {
                                    $ifNull: ["$accessibleLocation", []]
                                },
                                name: 1,
                                firstName: {
                                    $ifNull: ["$firstName", '']
                                },
                                lastName: {
                                    $ifNull: ["$lastName", '']
                                },
                                email: {
                                    $ifNull: ["$email", '']
                                },
                                isAdmin: {
                                    $ifNull: ["$isAdmin", false]
                                },
                                isActive: {
                                    $ifNull: ["$isActive", false]
                                },
                                emailPriority: {
                                    $cond: { if: { $gt: ["$emailPriority", 0] }, then: true, else: false }
                                },
                                reportPriority: {
                                    $cond: { if: { $gt: ["$reportPriority", 0] }, then: true, else: false }
                                },
                            }
                        }]).exec(function(err, userData) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(userData);
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })
    .get('/buildings', function(req, res, next) {
        var cookies = req.cookies;
        var token = cookies.auth_token;
        var dashboardData = {};
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        BuildingModel.find({ hasOccupancy: true }, function(err, buildings) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(buildings);
                            }
                        })
                    } else
                        res.status(403).json("Unauthorized Request");
                })
            }
        })
    })
    .get('/userProfile/:userId', function(req, res, next) {
        var cookies = req.cookies;
        var userId = req.params.userId;
        var token = cookies.auth_token;
        jwt.verify(token, global.secret, function(err, decoded) {
            if (err) {
                res.status(401).json(err);
            } else {
                validateRequest(decoded, function(status) {
                    if (status) {
                        UserModel.findById(userId, function(err, user) {
                            if (err)
                                res.status(400).json(err);
                            else {
                                res.status(200).json(user);
                            }
                        })
                    } else {
                        res.status(403).json({ err: "Unauthorized Request" });
                    }
                });
            }
        })
    })

module.exports = router;