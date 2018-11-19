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
var dummy = require('../models/dummy');
var HostLogs = require('../models/hostLogs');
var SensorHealthLogModel = require('../models/sensorHealthLog');
var fs = require('fs');
var reA = /[^a-zA-Z]/g;
var reN = /[^0-9]/g;

var sortAlphaNum = function(a, b) {
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

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}

router.get('/occupancyPattern/:buildingId', function(req, res, next) {
    var buildingId = req.params.buildingId;
    var data = req.query;
    var occupancyData = [];
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
})
router.get('/healthPattern/:buildingId', function(req, res, next) {
        var buildingId = req.params.buildingId;
        var data = req.query;
        var occupancyData = [];
        var healthData = {};
        healthData.healthPattern = []
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
                    getHealthPattern(bleIds, dayStart, dayEnd, noOfDays, building.timezoneOffset, format, function(healthPattern) {
                        var temp = {}
                        temp.name = floor.name;
                        temp.totalSeats = bleIds.length;
                        temp.values = healthPattern.values;
                        healthData.labels = healthPattern.labels;
                        healthData.healthPattern.push(temp)
                        if (++counter == pending) {
                            var buildingAverage = _.fill(new Array(healthData.labels.length), 0);
                            var totalBuildingSeats = 0;
                            var totalBuildingAverage = 0;
                            //console.log(average, floorSum)
                            for (var i = 0; i < healthData.healthPattern.length; i++) {
                                for (var j = 0; j < buildingAverage.length; j++) {
                                    buildingAverage[j] += healthData.healthPattern[i]['values'][j];
                                }
                                totalBuildingSeats += healthData.healthPattern[i]['totalSeats'];
                                /*occData.occupancyPattern[i]['maxValue'] = _.max(occData.occupancyPattern[i]['values'])
                                occData.occupancyPattern[i]['minValue'] = Math.min.apply(null, occData.occupancyPattern[i]['values'].filter(Boolean));*/
                            }
                            buildingAverage.forEach(function(building) {
                                totalBuildingAverage += building;
                            })
                            healthData.maxBuildingOccupancy = _.max(buildingAverage);
                            healthData.maxBuildingOccupancyTime = healthData.labels[_.indexOf(buildingAverage, healthData.maxBuildingOccupancy, 0)];
                            healthData.minBuildingOccupancy = Math.min.apply(null, buildingAverage.filter(Boolean));
                            healthData.minBuildingOccupancyTime = healthData.labels[_.indexOf(buildingAverage, healthData.minBuildingOccupancy, 0)];
                            healthData.minBuildingOccupancy = healthData.minBuildingOccupancyTime ? healthData.minBuildingOccupancy : 0;
                            healthData.minBuildingOccupancyTime = healthData.minBuildingOccupancyTime ? healthData.minBuildingOccupancyTime : healthData.labels[0];
                            healthData.maxBuildingOccupancyPercent = parseFloat(((healthData.maxBuildingOccupancy / totalBuildingSeats) * 100).toFixed(1));
                            healthData.minBuildingOccupancyPercent = parseFloat(((healthData.minBuildingOccupancy / totalBuildingSeats) * 100).toFixed(1));
                            healthData.totalBuildingSeats = totalBuildingSeats;
                            healthData.totalBuildingAverage = Math.floor(totalBuildingAverage / buildingAverage.length)
                                //console.log(occData.minBuildingOccupancy)
                            var temp = {};
                            temp.name = "Building Average";
                            temp.totalSeats = totalBuildingSeats;
                            temp.values = buildingAverage;
                            healthData.healthPattern.push(temp);
                            res.json(healthData)
                        }
                    })
                })
            })
        })
    })
    .get('/utilData/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;
        console.log('here')
        var data = req.query;
        var hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        var dayStartIST = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', 'Asia/Kolkata').unix() * 1000;
        var dayEndIST = moment.tz(data.eyear + '-' + (parseInt(data.emonth).pad(2)) + '-' + parseInt(data.eday).pad(2) + 'T23:59:59', 'Asia/Kolkata').unix() * 1000;
        /*var dateStartIST = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', 'Asia/Kolkata').unix()*1000;
        var dateEndIST = moment.tz(data.eyear + '-' + (parseInt(data.emonth).pad(2)) + '-' + parseInt(data.eday).pad(2) + 'T00:00:00', 'Asia/Kolkata').unix()*1000;*/
        var dayStart = new Date(dayStartIST);
        var dayEnd = new Date(dayEndIST);
        var start = moment(dayStartIST)
        var end = moment(dayEndIST + 1000)
        var numdays = end.diff(start, "days")
        console.log(numdays)
        var weekDays;
        if (numdays == 1) {
            weekDays = numdays;
        } else {
            var numWeekends = CalculateWeekendDays(dayStart, dayEnd)
            weekDays = numdays - numWeekends;
        }

        var dayStart = new Date(dayStartIST);
        var dayEnd = new Date(dayEndIST);

        /*console.log(weekDays)
        console.log(numdays)
        console.log(numWeekends)*/
        SeatToBle.find({ floorId: floorId }, 'seatId bleId', { sort: 'seatId' }).lean().populate({ path: 'seatId', select: 'name globalName' }).exec(function(err, seats) {
            if (err)
                res.status(400).json(err);
            else if (seats) {
                var bleIds = seats.map(function(seat) { return seat.bleId });
                SensorDataModel.aggregate(
                    [
                        { "$match": { $and: [{ 'sensorId': { $in: bleIds } }, { $and: [{ time: { $gte: dayStart } }, { time: { $lte: dayEnd } }] }, { occupancy: { $gt: 0 } }] } },
                        { "$sort": { "sensorId": 1 } },
                        { "$group": { "_id": "$sensorId", total: { $sum: "$occupancy" } } }
                    ],
                    function(err, data) {
                        var used = [];
                        var names = [];
                        //console.log(data);
                        seats.forEach(function(seat) {
                            names.push(seat.seatId.globalName);
                            var obj = _.find(data, { "_id": seat.bleId })
                            if (obj) {
                                // console.log(numWeekends)
                                //    console.log(obj.total/(240*weekDays))
                                var tmp = (parseInt(obj.total) / (240 * weekDays)).toFixed(2);

                                used.push(parseFloat(tmp));
                            } else
                                used.push(0);
                        })
                        res.json({ used: used, names: names });
                    });
            } else
                res.json({ "used": "[]", "names": "[]" });
        });
    })
    .get('/roomUtil/:buildingId', function(req, res, next) {
        //var floorId = req.params.floorId;
        var buildingId = req.params.buildingId;
        var data = req.query;
        var hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

        var dayStartIST = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', 'Asia/Kolkata').unix();
        var dayEndIST = moment.tz(data.eyear + '-' + (parseInt(data.emonth).pad(2)) + '-' + parseInt(data.eday).pad(2) + 'T23:59:59', 'Asia/Kolkata').unix();
        var floorData = [];
        BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function(err, building) {
            var parentCounter = 0;
            var parentPending = building.floors.length;
            building.floors.forEach(function(floor) {
                RoomToBle.find({ floorId: floor._id }, 'bleId roomId', { sort: 'roomId' }).lean().populate({ path: 'roomId', select: 'name', match: { name: /^(?!Flap).*$/ } }).exec(function(err, rooms) {
                    if (err)
                        res.status(400).json(err);
                    else if (rooms) {
                        var bles = rooms.map(function(room) { return { id: room.bleId } });
                        meetingRoomUsage(bles, dayStartIST, dayEndIST, building.timezoneOffset, function(roomData) {
                            var names = [];
                            var used = [];
                            var temp = {};
                            //console.log(rooms)
                            rooms.forEach(function(room) {
                                if (room.roomId) {
                                    names.push(room.roomId.name);
                                    used.push(roomData[room.bleId] ? (roomData[room.bleId] % 12) : 0);
                                }

                            })
                            temp['name'] = floor.name;
                            temp['roomData'] = { 'rooms': names, 'used': used };
                            floorData.push(temp);
                            if (++parentCounter == parentPending) {
                                floorData.sort(sortAlphaNum);
                                res.json(floorData);
                            }
                        })
                    } else
                        res.json({ "used": "[]", "names": "[]" });
                });
            })
        });
    })
    .get('/getTempData', function(req, res, next) {
        var data = req.query;
        var floors = ['Level 1', 'Level 7', 'Level 8', 'Level 9', 'Level 10']
        var tempData = [];
        var hour = 99;
        var today = new Date();
        if (data.eday == data.sday && data.emonth == data.smonth && data.eyear == data.syear) {
            if (data.eday == today.getDate() && data.emonth == today.getMonth() && data.eyear == today.getFullYear()) {
                hour = today.getHours();
            }
        }
        dummy.find({}, function(err, docs) {
            floors.forEach(function(floor) {
                var temp = {};
                temp.name = floor;
                temp[floor] = [];
                var i = 0;
                docs.forEach(function(doc) {
                    if (doc.name == floor) {
                        if (i >= hour)
                            temp[floor].push(0);
                        else
                            temp[floor].push(Math.floor(Math.random() * (23 - 20 + 1) + 20));
                        i++;
                    }
                })
                tempData.push(temp);
            })
            res.json(tempData);
        })
    })
    .get('/avgFloorsTemp', function(req, res, next) {
        var seatData = {};
        dummy.aggregate([{ $group: { _id: "$name", average: { $avg: '$temperature' } } }]).exec(function(err, doc) {
            if (err)
                console.log(err);
            else {
                var data = doc.map(function(result) { return { name: result._id, average: parseFloat(result.average.toFixed(1)) } });
                data.sort(sortAlphaNum);
                res.json(data);
            }
        })
    })
    .get('/buComparisonPlot/:buildingId', function(req, res, next) {
        var buildingId = req.params.buildingId;
        var floorNames = [];
        var emptySeats = [];
        var filledSeats = [];
        var data = req.query;
        console.log(data)
        BuildingModel.findById(buildingId).lean().populate({ path: 'floors', select: " name " }).exec(function(err, bldg) {
            if (bldg) {
                var floors = bldg.floors;
                console.log(floors)
                var dayRangeStartIST = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', 'Asia/Kolkata').unix() * 1000;
                var dayRangeEndIST = moment.tz(data.eyear + '-' + (parseInt(data.emonth).pad(2)) + '-' + parseInt(data.eday).pad(2) + 'T23:59:59', 'Asia/Kolkata').unix() * 1000;
                var noOfDays = Math.round(Math.abs((dayRangeStartIST - dayRangeEndIST) / (86399000)));
                var daysCounter = 0;
                var dayStartIST = 0;
                var dayEndIST = 0;
                var averageData = [];
                var averageFilled = Array.apply(null, Array(floors.length)).map(Number.prototype.valueOf, 0);
                //console.log(averageFilled)
                var averageEmpty = Array.apply(null, Array(floors.length)).map(Number.prototype.valueOf, 0);
                while (dayRangeStartIST < dayRangeEndIST) {
                    // console.log("Start Day", dayRangeStartIST)
                    // console.log("End Day", dayRangeEndIST) 
                    dayStartIST = dayRangeStartIST;
                    dayEndIST = dayRangeStartIST + 86399000;
                    generateFloorPlots(floors, dayStartIST, dayEndIST, function(floorData, dayStartIST) {
                        if (floorData.length) {
                            floorData.sort(sortAlphaNum);
                            //console.log(floorData);
                            var tempSum = 0;
                            //console.log(averageFilled, averageEmpty)
                            if (averageData.length == 0)
                                averageData = floorData;
                            else {
                                for (var i = 0; i < floorData.length; i++) {
                                    for (var j = 0; j < floorData[i].sections.length; j++) {
                                        for (var k = 0; k < floorData[i].sections[j].filled.length; k++)
                                            averageData[i].sections[j].filled[k] += floorData[i].sections[j].filled[k];
                                    }
                                }
                            }

                            if (++daysCounter == noOfDays) {
                                console.log('done');
                                dayRangeStartIST += 1000;
                                for (var i = 0; i < floorData.length; i++) {
                                    for (var j = 0; j < floorData[i].sections.length; j++) {
                                        for (var k = 0; k < floorData[i].sections[j].filled.length; k++) {
                                            averageData[i].sections[j].filled[k] = Math.round(averageData[i].sections[j].filled[k] / noOfDays);
                                            averageData[i].sections[j].empty[k] = averageData[i].sections[j].total - averageData[i].sections[j].filled[k];
                                        }
                                    }
                                    //floorNames[i] = floorData[i].name;
                                }
                                for (var i = 0; i < floorData.length; i++) {
                                    for (var j = 0; j < floorData[i].sections.length; j++) {
                                        for (var k = 0; k < floorData[i].sections[j].filled.length; k++)
                                            averageData[i].sections[j].percentFilled[k] = parseFloat(averageFilled[i] / (averageFilled[i] + averageEmpty[i]).toFixed(2));
                                    }
                                }
                                res.json({ sectionData: averageData });
                            }
                        } else {
                            res.json({ sectionData: {} });
                        }
                    })
                    dayRangeStartIST = dayRangeStartIST + 86399000;
                    if (noOfDays > 1)
                        dayRangeStartIST += 1000;
                }
            } else {
                res.json({ sectionData: {} });
            }
        })

        function generateFloorPlots(floors, dayStartIST, dayEndIST, callback) {
            var counter = 0;
            var pending = floors.length;
            var dayStart = new Date(dayStartIST);
            var dayEnd = new Date(dayEndIST);
            var floorData = [];
            floors.forEach(function(floor) {
                FloorModel.findById(floor._id).lean().populate({ path: 'sections', match: { isRoom: false }, select: " -isRoom -capacity -seats " }).exec(function(err, sections) {
                    var keys = {};
                    var sectionNames = [];
                    //console.log('Before Loop')
                    sections.sections.forEach(function(section) {
                        if (!(section.name in keys)) {
                            keys[section.name] = 1;
                            sectionNames.push(section.name);
                        }
                    });
                    //console.log('afterloop');
                    getBuValues(floor._id, sectionNames, dayStart, dayEnd, function(buData) {
                        //console.log(sectionNames);
                        buData.sort(sortAlphaNum);
                        var parentTemp = {}
                        parentTemp.name = floor.name;
                        SeatModel.count({ floorId: floor._id }, function(err, seatCount) {
                            var temp = {};
                            temp.seatCount = seatCount;
                            temp.names = [];
                            temp.total = [];
                            temp.filled = [];
                            temp.empty = [];
                            temp.percentFilled = [];
                            buData.forEach(function(bu) {
                                temp.names.push(bu.name);
                                temp.total.push(bu.total);
                                temp.filled.push(bu.filled);
                                temp.empty.push(bu.total - bu.filled);
                                temp.percentFilled.push(((bu.filled / bu.total) * 100).toFixed(2));
                            });
                            parentTemp.sections = temp;
                            floorData.push(parentTemp);
                            if (++counter == pending) {
                                //res.json(floorData);
                                //console.log(floorData);
                                callback(floorData);
                            }
                        });
                    });
                });
            })
        }

        function getBuValues(floorId, sectionNames, dayStart, dayEnd, callback) {
            var seats = [];
            var sectionData = [];
            var counter = 0;
            var pending = sectionNames.length;
            sectionNames.forEach(function(sectionName) {

                FloorModel.findById(floorId).lean().populate({ path: 'sections', match: { name: sectionName }, select: " -isRoom -capacity" }).exec(function(err, sections) {
                    seats = [];
                    sections.sections.forEach(function(section) {
                        section.seats.map(function(seat) { seats.push(seat) });
                    })
                    SeatToBle.find({ seatId: { $in: seats } }, function(err, bles) {
                        var bleIds = bles.map(function(ble) { return ble.bleId })
                        if (bleIds.length > 0) {
                            SensorDataModel.aggregate(
                                [
                                    { $match: { $and: [{ sensorId: { $in: bleIds } }, { $and: [{ time: { $gte: dayStart } }, { time: { $lte: dayEnd } }] }, { occupancy: { $gt: 0 } }] } },
                                    { $group: { _id: "$sensorId", total: { $sum: "$occupancy" } } },
                                    { $match: { total: { $gte: 40 } } }
                                ],
                                function(err, result) {
                                    var temp = {};
                                    temp.name = sectionName;
                                    temp.filled = result.length;
                                    temp.total = bleIds.length;
                                    sectionData.push(temp);
                                    if (++counter == pending)
                                        callback(sectionData);
                                }
                            )
                        }
                    })
                });
            })
        }
    })

function meetingRoomUsage(bles, dayStart, dayEnd, timezoneOffset, callback) {
    var counter = 0;
    var pending = bles.length;
    var roomData = {};
    //console.log(dayStart, dayEnd);
    var bleIds = bles.map(function(ble) { return ble.id })
    SensorDataModel.aggregate([{ $match: { sensorId: { $in: bleIds }, time: { $gte: new Date(dayStart * 1000), $lte: new Date(dayEnd * 1000) }, density: { $gt: 0 } } },
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

function getHealthPattern(bleIds, dayStart, dayEnd, noOfDays, timezoneOffset, format, callback) {
    var hours = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
    var stringHours = ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];

    SensorHealthLogModel.aggregate([
        { $match: { sensorId: { $in: bleIds }, $or: [{ status: true }], time: { $gte: new Date(dayStart), $lte: new Date(dayEnd) } } },
        {
            $project: {
                interval: { $dateToString: { format: format, date: { $add: ["$time", timezoneOffset] } } },
                status: "$status",
                sensorId: "$sensorId"
            }
        },
        { $group: { _id: { interval: "$interval", sensorId: "$sensorId" }, count: { $sum: 1 } } },
        { $match: { count: { $gte: 3 } } },
        { $project: { interval: "$_id.interval", sensorId: "$sensorId" } },
        { $group: { _id: "$interval", count: { $sum: 1 } } },
        { $project: { _id: 0, interval: "$_id", count: "$count" } },
        { $sort: { interval: 1 } }
    ], function(err, result) {
        var healthPattern = {};
        healthPattern.labels = [];
        healthPattern.values = [];
        if (noOfDays == 1) {
            for (var i = 0; i < hours.length; i++) {
                var temp = _.find(result, { 'interval': hours[i] })
                if (temp) {
                    healthPattern.values.push(temp.count);
                } else {
                    healthPattern.values.push(0);
                }
                healthPattern.labels.push(stringHours[i]);
            }
            callback(healthPattern)
        } else {
            var difference = noOfDays;
            var date = moment(dayStart)
            while (difference) {
                var now = date.format("DD-MM-YYYY");
                var temp = _.find(result, { 'interval': now });
                if (temp) {
                    healthPattern.values.push(temp.count);
                } else {
                    healthPattern.values.push(0);
                }
                healthPattern.labels.push(now);
                date.add(1, 'days');
                difference--
            }
            callback(healthPattern);
        }
        //callback(result)
    })
}

function CalculateWeekendDays(fromDate, toDate) {
    var weekendDayCount = 0;
    console.log(fromDate)
    console.log(toDate)
    if (fromDate != toDate) {
        while (fromDate < toDate) {
            if (fromDate.getDay() === 0 || fromDate.getDay() == 6) {
                ++weekendDayCount;
            }
            fromDate.setDate(fromDate.getDate() + 1);
        }
    }
    return weekendDayCount;
}
module.exports = router;