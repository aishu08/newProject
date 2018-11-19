var router = global.express.Router();
var BuildingModel = require('../models/building');
var FloorModel = require('../models/floors');
var HostModel = require('../models/hosts');
var SensorDataModel = require('../models/sensorData');
// var SensorHealthLogModel = require('../models/sensorHealthLog');
var SectionModel = require('../models/sections');
var ZoneModel = require('../models/zones');
var BleModel = require('../models/ble');
var SeatModel = require('../models/seats');
var SeatToBle = require('../models/sensorToBle');
var RoomToBle = require('../models/roomToBle');
var HostLogs = require('../models/hostLogs');

var LightModel = require('../models/lights');
var LightToBle = require('../models/lightToBle');
var LightSensorModel = require('../models/lightSensors');
var lightSensorsToBle = require('../models/lightSensorToBle');
var SceneModel = require('../models/scenes');
var SceneToLight = require('../models/sceneToLight');
var ScheduleModel = require('../models/schedules')
var ScheduleToLight = require('../models/scheduleToLight');
var UserModel = require('../models/users');
var client;
var rquestp = require('request-promise')
var moment = require('moment-timezone');

var sortAlphaNum = function (a, b) {
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

Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}
var sortAlphaNumrev = function (a, b) {
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

exports.testcontroller = function (req, res, next) {
    res.status(200).json({
        msg: "Test Success"
    });
}


exports.floorLightUsage = function (req, res, next) {
    var buildingId = req.params.buildingId
    // console.log(buildingId)
    
    BuildingModel.findById(buildingId, function (err, building) {
        if(err){
            res.status(500).json({err:err})
        }else{
           if(building){
            //    res.status(200).json({msg:building})
            LightToBle.aggregate([
                { $match: { floorId: { $in: building.floors } } },
                { $lookup: { from: 'lights', localField: 'lightId', foreignField: '_id', as: 'lights' } }, { $unwind: "$lights" },
                { $project: { floorId: "$floorId", wattage: "$lights.wattage", intensity: "$intensity" } },
                { $group: { _id: '$floorId', total: { $sum: 1 }, totalWattage: { $sum:  { $multiply: [ "$wattage", 8 ] } }, intensity: { $sum: "$intensity" } } },
                { $lookup: { from: 'floors', localField: '_id', foreignField: '_id', as: 'floor' } },
                { $unwind: '$floor' },
                { $project: { name: "$floor.name", total: 1,totalWattage:1 } }
            ]).exec(function (err, lightCount) {
                if (err) {
                    res.status(500).json({ err: err })
                } else {
                    if(lightCount){
                        // res.status(200).json({msg:lightCount})
                        LightToBle.aggregate([
                            { $match: { floorId: { $in: building.floors }, lightIntensity: { $gt: 0 } } },
                            { $lookup: { from: 'lights', localField: 'lightId', foreignField: '_id', as: 'lights' } }, { $unwind: "$lights" },
                            { $project: { floorId: "$floorId", wattage: "$lights.wattage", intensity: "$intensity" } },
                            { $group: { _id: '$floorId', filled: { $sum: 1 }, wattage: { $sum:  { $multiply: [ "$wattage", 8 ] } }, intensity: { $sum: "$intensity" } } }
                        ]).exec(function (err, usedLights) {
// TODO: remove 8 and add tofl (time of full load)
// Change $gte:0 to $gt:0
                            if (err) {
                                res.status(500).json({ err: err })
                            } else {
                                // console.log(JSON.stringify(usedLights))
                                                                    
                                console.log(usedLights)
                                usedLights.forEach(function (li) {
                                    var temp = _.find(lightCount, { '_id': li._id })
                                    temp.filled = li.filled;
                                    console.log(li)
                                    console.log(temp)

                                    temp.percentwattage = ((li.wattage/temp.totalWattage)*100).toFixed(2)
                                    temp.floorCurrkWh = ((li.wattage*8)/1000).toFixed(2)
                                    temp.floortotalkWh = ((temp.totalWattage*8)/1000).toFixed(2)

                                    temp.percentFilled = ((temp.filled / temp.total) * 100).toFixed(2);
                                    temp.wattageSum = li.wattage
                                })

                                var arr = [];

                                for (var i = 0; i < lightCount.length; i++) {
                                    lightCount[i].name = lightCount[i].name.replace(/ /g, '')
                                    arr.push(lightCount[i].percentFilled);
                                }
                                arr = arr.map(function (value) { return parseFloat(value) })
                                var maxIndex = _.indexOf(arr, _.max(arr), 0);
                                var minIndex = _.indexOf(arr, _.min(arr), 0);

                                var maxPercent = lightCount[maxIndex];
                                var minPercent = lightCount[minIndex];
                                lightCount.sort(sortAlphaNum)

                                res.status(200).json({ floorOccupancy: lightCount, maxPercentData: maxPercent, minPercentData: minPercent })
                                // res.send("Done")
                            }
                        })
                    }else{
                        res.status(500).json({err:"No lights in floors"})
                    }
                }})
           } else {
            res.status(500).json({ err: "Building not found" })
        }
        }
    })
}
// TODO:DO the following changes
// Calculate full load, and current load
// Calculate current load percentge
exports.floorLightUsageOld = function (req, res, next) {
    var buildingId = req.params.buildingId
    BuildingModel.findById(buildingId, function (err, building) {
        if (err)
            res.status(500).json({ err: err })
        else {
            if (building) {
                LightToBle.aggregate([
                    { $match: { floorId: { $in: building.floors } } },
                    { $group: { '_id': '$floorId', total: { $sum: 1 } } },
                    { $lookup: { from: 'floors', localField: '_id', foreignField: '_id', as: 'floor' } },
                    { $unwind: '$floor' }, { $project: { name: "$floor.name", total: 1 } }
                ]).exec(function (err, lightCount) {
                    if (err) {
                        res.status(500).json({ err: err })
                    } else {
                        if (lightCount) {
                            LightToBle.aggregate([
                                { $match: { floorId: { $in: building.floors }, lightIntensity: { $gt: 0 } } },
                                { $lookup: { from: 'lights', localField: 'lightId', foreignField: '_id', as: 'lights' } }, { $unwind: "$lights" },
                                { $project: { floorId: "$floorId", wattage: "$lights.wattage", intensity: "$intensity" } },
                                { $group: { _id: '$floorId', filled: { $sum: 1 }, wattage: { $sum:  { $multiply: [ "$wattage", 8 ] } }, intensity: { $sum: "$intensity" } } }
                            ]).exec(function (err, usedLights) {
// TODO: remove 8 and add tofl (time of full load)
// Change $gte:0 to $gt:0
                                if (err) {
                                    res.status(500).json({ err: err })
                                } else {
                                    // console.log(JSON.stringify(usedLights))
                                                                        
                                    console.log(usedLights)
                                    usedLights.forEach(function (li) {
                                        var temp = _.find(lightCount, { '_id': li._id })
                                        temp.filled = li.filled;
                                        console.log('li')
                                        console.log(temp)
                                        temp.percentFilled = ((temp.filled / temp.total) * 100).toFixed(2);
                                        temp.wattageSum = li.wattage
                                    })

                                    var arr = [];

                                    for (var i = 0; i < lightCount.length; i++) {
                                        lightCount[i].name = lightCount[i].name.replace(/ /g, '')
                                        arr.push(lightCount[i].percentFilled);
                                    }
                                    console.log(lightCount)
                                    arr = arr.map(function (value) { return parseFloat(value) })
                                    var maxIndex = _.indexOf(arr, _.max(arr), 0);
                                    var minIndex = _.indexOf(arr, _.min(arr), 0);

                                    var maxPercent = lightCount[maxIndex];
                                    var minPercent = lightCount[minIndex];
                                    console.log(arr)
                                    console.log(minPercent)
                                    lightCount.sort(sortAlphaNum)

                                    res.status(200).json({ floorOccupancy: lightCount, maxPercentData: maxPercent, minPercentData: minPercent })
                                    // res.send("Done")
                                }
                            })
                        } else {
                            res.status(500).json({ err: "No lights in floor" })
                        }
                    }
                })
            }
            else {
                res.status(500).json({ err: "Building not found" })
            }
        }
    })
}

exports.lightUsagePattern = function (req, res, next) {
    var buildingId = req.params.buildingId
    var data = req.query;
    var occupancyData = [];
    var occData = {};
    occData.occupancyPattern = []
    BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function (err, building) {
        if (err) {
            res.status(500).json({ err: err })
        } else {
            if (building) {
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
                building.floors.forEach(function (floor) {
                    LightToBle.find({ floorId: floor._id }, "bleId -_id", function (err, bles) {
                        if (err) {
                            res.status(500).json({ err: err });
                        } else if (bles) {
                            var bleIds = bles.map(function (ble) { return ble.bleId });
                            // minIntensity => 0 if we need to get all the lights connected and are responding
                            // minIntensity=>1 if we need to get the lights which are only switched ON and are responding
                            var minIntensity = 1; 
                            getLightUsagePattern(bleIds, dayStart, dayEnd, noOfDays, building.timezoneOffset, format,function (occupancyPattern) {
                                if(occupancyPattern){
                                        var temp = {}
                                        temp.name = floor.name;
                                        temp.totalSeats = bleIds.length;
                                        temp.values = occupancyPattern.values;
                                        occData.labels = occupancyPattern.labels;
                                        occData.occupancyPattern.push(temp)
                                        // var tempMax = {}
                                        if (++counter == pending) {
                                            // res.status(200).json({msg:lightPattern})
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
                                            buildingAverage.forEach(function (building) {
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
                                            temp.name = "Building Actuals";
                                            temp.totalSeats = totalBuildingSeats;
                                            temp.values = buildingAverage;
                                            occData.occupancyPattern.push(temp);
                                            res.json(occData)
                                        }
                                }
                            })
                        }
                        else {
                            res.status(500).json({ err: "No Bles found" })
                        }
                    })
                })
            } else {
                res.status(500).json({ err: "Building not found" })
            }
        }
    })
}
exports.powerUsagePattern1 = function (req, res, next) {
    var buildingId = req.params.buildingId
    var data = req.query;
    var occupancyData = [];
    var occData = {};
    occData.occupancyPattern = []
    BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function (err, building) {
        if (err) {
            res.status(500).json({ err: err })
        } else {
            if (building) {
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
                building.floors.forEach(function (floor) {
                    LightToBle.find({ floorId: floor._id }, "bleId -_id", function (err, bles) {
                        if (err) {
                            res.status(500).json({ err: err });
                        } else if (bles) {
                            var bleIds = bles.map(function (ble) { return ble.bleId });
                            getTotalPowerBles(bleIds,function(totalPower){
                                res.json(totalPower)
                            })
                        }
                    })
                })
            }
        }
    })
}

exports.powerUsagePattern = function (req, res, next) {
    var buildingId = req.params.buildingId
    var data = req.query;
    var occupancyData = [];
    var occData = {};
    occData.occupancyPattern = []
    BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function (err, building) {
        if (err) {
            res.status(500).json({ err: err })
        } else {
            if (building) {
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
                building.floors.forEach(function (floor) {
                    LightToBle.find({ floorId: floor._id }, "bleId -_id", function (err, bles) {
                        if (err) {
                            res.status(500).json({ err: err });
                        } else if (bles) {
                            var bleIds = bles.map(function (ble) { return ble.bleId });
                            // minIntensity => 0 if we need to get all the lights connected and are responding
                            // minIntensity=>1 if we need to get the lights which are only switched ON and are responding
                            var minIntensity = 1; 
                            getPowerUsagePattern(bleIds, dayStart, dayEnd, noOfDays, building.timezoneOffset, format,function (occupancyPattern) {
                                if(occupancyPattern){
                                    getTotalPowerBles(bleIds,function(totalPower){
                                        totalBuildingSeats += totalPower
                                        var temp = {}
                                        temp.name = floor.name;
                                        temp.totalSeats = bleIds.length;
                                        temp.values = (occupancyPattern.values);
                                        occData.labels = occupancyPattern.labels;
                                        occData.occupancyPattern.push(temp)
                                        if (++counter == pending) {
                                            var buildingAverage = _.fill(new Array(occData.labels.length), 0);
                                            var totalBuildingSeats = 0;
                                            var totalBuildingAverage = 0;
                                                
                                                for (var i = 0; i < occData.occupancyPattern.length; i++) {
                                                    
                                                    for (var j = 0; j < buildingAverage.length; j++) {
                                                        buildingAverage[j] += occData.occupancyPattern[i]['values'][j];
                                                    }
                                            
                                                    // occData.occupancyPattern[i]['maxValue'] = _.max(occData.occupancyPattern[i]['values'])
                                                    // occData.occupancyPattern[i]['minValue'] = Math.min.apply(null, occData.occupancyPattern[i]['values'].filter(Boolean));
                                                }
                                                buildingAverage.forEach(function (building) {
                                                    totalBuildingAverage += building;
                                                })
                                                occData.maxBuildingOccupancy = _.max(buildingAverage);
                                                // console.log(totalBuildingAverage/buildingAverage)
                                                // console.log()
                                                occData.maxBuildingOccupancyTime = occData.labels[_.indexOf(buildingAverage, occData.maxBuildingOccupancy, 0)];
                                                occData.minBuildingOccupancy = Math.min.apply(null, buildingAverage.filter(Boolean));
                                                occData.minBuildingOccupancyTime = occData.labels[_.indexOf(buildingAverage, occData.minBuildingOccupancy, 0)];
                                                occData.minBuildingOccupancy = occData.minBuildingOccupancyTime ? occData.minBuildingOccupancy : 0;
                                                occData.minBuildingOccupancyTime = occData.minBuildingOccupancyTime ? occData.minBuildingOccupancyTime : occData.labels[0];
                                                occData.maxBuildingOccupancyPercent = parseFloat(((occData.maxBuildingOccupancy / totalBuildingSeats) * 100).toFixed(1));
                                                occData.minBuildingOccupancyPercent = parseFloat(((occData.minBuildingOccupancy / totalBuildingSeats) * 100).toFixed(1));
                                                occData.totalBuildingSeats = totalBuildingSeats;
                                                
                                                // TODO: logic to find the flowing average instead of fixed average for the month
                                                occData.totalBuildingAverage = Math.floor(totalBuildingAverage / buildingAverage.length)
                                                //console.log(occData.minBuildingOccupancy)
                                                var temp = {};
                                                temp.name = "Building Actuals";
                                                temp.totalSeats = totalBuildingSeats;
                                                temp.values = buildingAverage;
                                                occData.occupancyPattern.push(temp);
                                                res.json(occData)
                                            // })
                                        }
                                    })
                                }
                            })
                        }
                        else {
                            res.status(500).json({ err: "No Bles found" })
                        }
                    })
                })
            } else {
                res.status(500).json({ err: "Building not found" })
            }
        }
    })
}

exports.zoneLightUsagePattern = function(req,res,next){
    var buildingId = req.params.buildingId
    var data = req.query;
    var occupancyData = [];
    var occData = {};
    occData.occupancyPattern = []
    BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function (err, building) {
        if (err) {
            res.status(500).json({ err: err })
        } else {
            if (building) {
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
                building.floors.forEach(function (floor) {
                    ZoneModel.find({floorId:floor._id},function(err,zones){
                        zoneCounter = 0
                        zonePending = zones.length;
                        zones.forEach(function(zone){
                            bleIds = zone.lights
                            getLightUsagePattern(bleIds, dayStart, dayEnd, noOfDays, building.timezoneOffset, format,function (occupancyPattern) {
                                // console.log(occupancyPattern)
                                console.log(occData)
                                var temp = {}
                                temp.name = zone.name;
                                temp.totalSeats = bleIds.length;
                                temp.values = occupancyPattern.values;
                                occData.labels = occupancyPattern.labels;
                                occData.occupancyPattern.push(temp)
                                console.log(counter)
                                if(++zoneCounter==zonePending){
                                    // res.json({occData})
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
                                            buildingAverage.forEach(function (building) {
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
                                            temp.name = "Building Actuals";
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
                res.status(500).json({ err: "Building not found" })
            }
        }
    })
}
exports.zonePowerUsagePattern = function (req, res, next) {
    var buildingId = req.params.buildingId
    var data = req.query;
    var occupancyData = [];
    var occData = {};
    occData.occupancyPattern = []
    BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function (err, building) {
        if (err) {
            res.status(500).json({ err: err })
        } else {
            if (building) {
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
                building.floors.forEach(function (floor) {
                    ZoneModel.find({floorId:floor._id},function(err,zones){
                        zoneCounter = 0
                        zonePending = zones.length;
                        var totalBuildingSeats = 0;
                        zones.forEach(function(zone){
                            bleIds = zone.lights
                            
                            getPowerUsagePattern(bleIds, dayStart, dayEnd, noOfDays, building.timezoneOffset, format,function (occupancyPattern) {
                                getTotalPowerBles(bleIds,function(totalPower){
                                    totalBuildingSeats += totalPower
                                // console.log(occupancyPattern)
                                console.log(occData)
                                var temp = {}
                                temp.name = zone.name;
                                temp.totalSeats = bleIds.length;
                                temp.values = occupancyPattern.values;
                                occData.labels = occupancyPattern.labels;
                                occData.occupancyPattern.push(temp)
                                console.log(counter)
                                if(++zoneCounter==zonePending){
                                    // res.json({occData})
                                    var buildingAverage = _.fill(new Array(occData.labels.length), 0);
                                            // var totalBuildingSeats = 0;
                                            var totalBuildingAverage = 0;
                                            //console.log(average, floorSum)
                                            for (var i = 0; i < occData.occupancyPattern.length; i++) {
                                                for (var j = 0; j < buildingAverage.length; j++) {
                                                    buildingAverage[j] += occData.occupancyPattern[i]['values'][j];
                                                }
                                                // totalBuildingSeats += occData.occupancyPattern[i]['totalSeats'];
                                                /*occData.occupancyPattern[i]['maxValue'] = _.max(occData.occupancyPattern[i]['values'])
                                                occData.occupancyPattern[i]['minValue'] = Math.min.apply(null, occData.occupancyPattern[i]['values'].filter(Boolean));*/
                                            }
                                            buildingAverage.forEach(function (building) {
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
                                            temp.name = "Building Actuals";
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
            } else {
                res.status(500).json({ err: "Building not found" })
            }
        }
    })
}
exports.buildingFloorPercentUsage = function (req, res, next) {
    var buildingId = req.params.buildingId
    var data = req.query;
    var occupancyData = [];
    var occData = {};
    occData.occupancyPattern = []
    BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function (err, building) {
        if (err) {
            res.status(500).json({ err: err })
        } else {
            if (building) {
                var dayStart = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', building.timezone).unix() * 1000;
                var dayEnd = moment.tz(data.eyear + '-' + parseInt(data.emonth).pad(2) + '-' + parseInt(data.eday).pad(2) + ' 23:59:59', building.timezone).unix() * 1000;
                var noOfDays = difference = moment.duration((dayEnd + 1000) - dayStart).asDays();
                var format;
                format = '%d-%m-%Y';
                var counter = 0;
                var pending = building.floors.length;
                building.floors.forEach(function (floor) {
                    LightToBle.find({ floorId: floor._id }, "bleId -_id", function (err, bles) {
                        if (err) {
                            res.status(500).json({ err: err });
                        } else if (bles) {
                            var bleIds = bles.map(function (ble) { return ble.bleId });
                            getLightUsagePatternDay(bleIds, dayStart, dayEnd, noOfDays, building.timezoneOffset, format, function (lightPattern) {
                                console.log(lightPattern);
                                var temp = {};
                                temp.name = floor.name;
                                temp.totalSeats = bleIds.length;
                                temp.values = lightPattern.values;
                                occData.labels = lightPattern.labels;
                                occData.occupancyPattern.push(temp);

                                //Check for group by interval removal and working of floorwise data 
                                // res.status(200).json({ msg: occData });
                                if (++counter == pending) {
                                    // res.status(200).json({msg:lightPattern})
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
                                    buildingAverage.forEach(function (building) {
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
                                    occData.occupancyPattern.forEach(function(occ){
                                        var dp = 0;
                                        occ.values.forEach(function (li) {
                                            dayPercent = (li/totalBuildingSeats)*100 
                                            console.log(dayPercent)
                                        });
                                    })
                                    
                                    var temp = {};
                                    temp.name = "Building Average";
                                    temp.totalSeats = totalBuildingSeats;
                                    temp.values = buildingAverage;
                                    occData.occupancyPattern.push(temp);
                                    res.json(occData)
                                }
                            });
                        }
                    });
                });
            } else
                res.status(500).json({ err: "Building not found" });
        }
    });
}

function getTotalPowerBles(bleIds,callback){
    LightToBle.aggregate([
        {$match:{bleId:{$in:bleIds}}},
        {$lookup:{from:'lights',localField:'lightId',foreignField:'_id',as:'lights'}},{$unwind:'$lights'},
        {$group:{_id:'totalSum',sum:{$sum:{$multiply:['$lights.wattage',8]}}}}

    ],function(err,result){
        if(!err){
            var sumWatt = 0;
            result.forEach(function(watt){
                sumWatt += (Math.round(((watt.sum)/1000)*100)/100)
            })
            callback(sumWatt)
        }else{
            callback(false)
        }
    })
}

function getPowerUsagePattern(bleIds, dayStart, dayEnd, noOfDays, timezoneOffset,format, callback){
    var hours = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
    var stringHours = ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];
    SensorDataModel.aggregate([
        { $match: { sensorId: { $in: bleIds }, $or: [{ intensity: { $gt:0  } },], time: { $gte: new Date(dayStart), $lte: new Date(dayEnd) } } },
        {
            $project: {
                interval: { $dateToString: { format: format, date: { $add: ["$time", timezoneOffset] } } },
                intensity: "$intensity",
                sensorId: "$sensorId"
            }
        },
        { $group: { _id: { interval: "$interval", sensorId: "$sensorId" }, count: { $sum: "$intensity" } } },
        { $match: { count: { $gte: 0 } } },
        { $project: { interval: "$_id.interval", sensorId: "$_id.sensorId"}},
        {$lookup:{from:'lighttobles',localField:'sensorId',foreignField:'bleId',as:'lightbles'}},{$unwind:"$lightbles"},
        {$project:{interval:"$interval",sensorId:"$sensorId",lightId:"$lightbles.lightId"}},
        { $lookup: { from: 'lights', localField: 'lightId', foreignField: '_id', as: 'lights' } }, { $unwind: "$lights" }, 
        // Add light On hours column and light intensity
        { $project: { interval: "$_id.interval", sensorId: "$_id.sensorId",_id:"$_id.sensorId",wattage:"$lights.wattage"}},
        { $group: { _id: "$interval", count: { $sum: { $multiply: [ "$wattage", 8 ] }  } } },
        { $project: { _id: 0, interval: "$_id", count: "$count" } },
        { $sort: { interval: 1 } }
    ], function (err, result) {
        if(err){
            callback(false)
        }
        // callback(result)
        var powerPattern = {};
        powerPattern.labels = [];
        powerPattern.values = [];
        if (noOfDays == 1) {
            for (var i = 0; i < hours.length; i++) {
                var temp = _.find(result, { 'interval': hours[i] })
                if (temp) {
                    powerPattern.values.push(Math.round((temp.count/1000)*100)/100);
                } else {
                    powerPattern.values.push(0);
                }
                powerPattern.labels.push(stringHours[i]);
            }
            callback(powerPattern)
        } else {
            // console.log('here')
            var difference = noOfDays;
            var date = moment(dayStart)
            console.log(date)
            while (difference) {
                var now = date.format("DD-MM-YYYY");
                var temp = _.find(result, { 'interval': now });
                if (temp) {

                    powerPattern.values.push(Math.round((temp.count/1000)*100)/100);
                } else {
                    powerPattern.values.push(0);
                }
                powerPattern.labels.push(now);
                date.add(1, 'days');
                difference--
            }
            callback(powerPattern);
        }
    })
}
function getLightUsagePattern(bleIds, dayStart, dayEnd, noOfDays, timezoneOffset,format, callback) {
    var hours = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
    var stringHours = ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];
    // TODO Ask if status condition needs to be put or removed
    // If needs to be retained, put status:true in the next match condition
    SensorDataModel.aggregate([
        { $match: { sensorId: { $in: bleIds }, $or: [{ intensity: { $gt:0  } },], time: { $gte: new Date(dayStart), $lte: new Date(dayEnd) } } },
        {
            $project: {
                interval: { $dateToString: { format: format, date: { $add: ["$time", timezoneOffset] } } },
                intensity: "$intensity",
                sensorId: "$sensorId"
            }
        },
        { $group: { _id: { interval: "$interval", sensorId: "$sensorId" }, count: { $sum: "$intensity" } } },
        { $match: { count: { $gte: 0 } } },
        { $project: { interval: "$_id.interval", sensorId: "$sensorId" } },
        { $group: { _id: "$interval", count: { $sum: 1 } } },
        { $project: { _id: 0, interval: "$_id", count: "$count" } },
        { $sort: { interval: 1 } }
    ], function (err, result) {
        if(err){
            callback(false)
        }
        var lightPattern = {};
        lightPattern.labels = [];
        lightPattern.values = [];
        if (noOfDays == 1) {
            for (var i = 0; i < hours.length; i++) {
                var temp = _.find(result, { 'interval': hours[i] })
                if (temp) {
                    lightPattern.values.push(temp.count);
                } else {
                    lightPattern.values.push(0);
                }
                lightPattern.labels.push(stringHours[i]);
            }
            callback(lightPattern)
        } else {
            var difference = noOfDays;
            var date = moment(dayStart)
            while (difference) {
                var now = date.format("DD-MM-YYYY");
                var temp = _.find(result, { 'interval': now });
                if (temp) {
                    lightPattern.values.push(temp.count);
                } else {
                    lightPattern.values.push(0);
                }
                lightPattern.labels.push(now);
                date.add(1, 'days');
                difference--
            }
            callback(lightPattern);
        }
    })
}

function getLightUsagePatternDay(bleIds, dayStart, dayEnd, noOfDays, timezoneOffset, format, callback) {
    var hours = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
    var stringHours = ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];

    SensorDataModel.aggregate([
        { $match: { sensorId: { $in: bleIds }, $or: [{ intensity: { $gte: 0 } },], time: { $gte: new Date(dayStart), $lte: new Date(dayEnd) } } },
        {
            $project: {
                interval: { $dateToString: { format: format, date: { $add: ["$time", timezoneOffset] } } },
                intensity: "$intensity",
                sensorId: "$sensorId"
            }
        },
        { $group: { _id: { interval: "$interval", sensorId: "$sensorId" }, count: { $sum: "$intensity" } } },
        { $match: { count: { $gte: 0 } } },
        { $project: { interval: "$_id.interval", sensorId: "$sensorId" } },
        { $group: { _id: "$interval", count: { $sum: 1 } } },
        { $project: { _id: 0, interval: "$_id", count: "$count" } },
        { $sort: { interval: 1 } }
    ], function (err, result) {
        var lightPattern = {};
        lightPattern.labels = [];
        lightPattern.values = [];
        // CHECK
        // if (noOfDays == 1) {
        //     for (var i = 0; i < hours.length; i++) {
        //         var temp = _.find(result, { 'interval': hours[i] })
        //         if (temp) {
        //             lightPattern.values.push(temp.count);
        //         } else {
        //             lightPattern.values.push(0);
        //         }
        //         lightPattern.labels.push(stringHours[i]);
        //     }
        //     callback(lightPattern)
        // } else {
        var difference = noOfDays;
        var date = moment(dayStart)
        while (difference) {
            var now = date.format("DD-MM-YYYY");
            var temp = _.find(result, { 'interval': now });
            console.log(temp)
            if (temp) {
                lightPattern.values.push(temp.count);
            } else {
                lightPattern.values.push(0);
            }
            lightPattern.labels.push(now);
            date.add(1, 'days');
            difference--
        }
        callback(lightPattern);
        // }
    })
}

exports.floorLightPercent = function(req,res,next){
    var buildingId = req.params.buildingId
    var data = req.query;
    var occupancyData = [];
    var occData = {};
    occData.occupancyPattern = []
    BuildingModel.findById(buildingId).lean().populate({ path: "floors", select: 'name _id' }).exec(function (err, building) {
        if (err) {
            res.status(500).json({ err: err })
        } else {
            if (building) {
                var dayStart = moment.tz(data.syear + '-' + (parseInt(data.smonth).pad(2)) + '-' + parseInt(data.sday).pad(2) + 'T00:00:00', building.timezone).unix() * 1000;
                var dayEnd = moment.tz(data.eyear + '-' + parseInt(data.emonth).pad(2) + '-' + parseInt(data.eday).pad(2) + ' 23:59:59', building.timezone).unix() * 1000;
                var noOfDays = difference = moment.duration((dayEnd + 1000) - dayStart).asDays();
                var format;
                format = '%d-%m-%Y';
                var counter = 0;
                var pending = building.floors.length;
                building.floors.forEach(function (floor) {
                    LightToBle.find({ floorId: floor._id }, "bleId -_id", function (err, bles) {
                        if (err) {
                            res.status(500).json({ err: err });
                        } else if (bles) {
                            var bleIds = bles.map(function (ble) { return ble.bleId });
                            getLightUsageDateRange(bleIds, dayStart, dayEnd, noOfDays, building.timezoneOffset, format, function (lightPattern) {
                                floorLights = bleIds.length
                                var temp = {}
                                console.log(lightPattern)
                                temp.name = floor.name;
                                temp.totalLightsPercent =  (lightPattern/floorLights)*100
                                occData.occupancyPattern.push(temp)
                                if(++counter == pending){
                                    res.status(200).json({msg:lightPattern,allLights:floorLights,data:occData});
                                }
                            });
                        }
                    })
                });
            
            };
        }
    });
}

function getLightUsageDateRange(bleIds,dayStart,dayEnd,noOfDays,timezoneOffset,format,callback){
    var hours = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
    var stringHours = ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];
    SensorDataModel.aggregate([
        {$match:{sensorId:{$in:bleIds},intensity:{$gte:0},time:{$gte: new Date(dayStart), $lte: new Date(dayEnd)}}},
        { $group: { _id: "$sensorId"} },
        {$group:{_id:"null",count:{$sum:1}}}
    ],function(err,result){
        console.log(result)
        if(result[0]){
        console.log(result)
        callback(result[0].count)
        }else{
            callback(0)
        }
        
    })
}