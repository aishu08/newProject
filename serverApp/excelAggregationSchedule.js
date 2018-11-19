process.env.TZ = 'Asia/Kolkata';
const cron = require('cron');
var mongoose = global.mongoose = require('mongoose');
require('mongoose-double')(mongoose);
const moment = require('moment-timezone');
const BuildingModel = require('./models/building');
const SectionModel = require('./models/sections');
const FloorModel = require('./models/floors');
const BleModel = require('./models/ble');
const SeatModel = require('./models/seats');
const SensorDataModel = require('./models/sensorData');
const SeatToBle = require('./models/sensorToBle');
const ExcelAggregationModel = require('./models/excelAggregation')

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://root:adapptroot@localhost/occupancy?authSource=admin', { useMongoClient: true }, function(err) {
    if (err)
        console.log("Failed to establish a connection to Mongo DB");
    else {
        console.log("Connection established to Mongo DB");
    }
});
Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}
var getBuName = function(sectionName) {
    switch (sectionName) {
        case "sec-it":
            return "IT";
        case "sec-ftd":
            return "FTD";
        case "sec-gpu":
            return "GPU&OCM";
        case "sec-grs":
            return "GRS";
        case "sec-mo":
            return "Middle Office";
        case "sec-sb":
            return "Sky Branch";
        case "sec-dst":
            return "Deal Support";
        case "sec-lo":
            return "Lending Operation";
        case "sec-fm":
            return "FM/CRES";
        case "sec-gpp":
            return "GPP";
        case "sec-bp":
            return "Blue Prism";
        case "sec-grt":
            return "GFTS&GRT";
        case "sec-ar":
            return "Africa Retail";
        case "sec-ts":
            return "Trade Services";
        default:
            return "No BU assigned";
    }
}
var documentTemplate = { "Country": "India", "Resource Type": "Desk", "seatName": "", "day": "", "00:00": 0, "00:10": 0, "00:20": 0, "00:30": 0, "00:40": 0, "00:50": 0, "01:00": 0, "01:10": 0, "01:20": 0, "01:30": 0, "01:40": 0, "01:50": 0, "02:00": 0, "02:10": 0, "02:20": 0, "02:30": 0, "02:40": 0, "02:50": 0, "03:00": 0, "03:10": 0, "03:20": 0, "03:30": 0, "03:40": 0, "03:50": 0, "04:00": 0, "04:10": 0, "04:20": 0, "04:30": 0, "04:40": 0, "04:50": 0, "05:00": 0, "05:10": 0, "05:20": 0, "05:30": 0, "05:40": 0, "05:50": 0, "06:00": 0, "06:10": 0, "06:20": 0, "06:30": 0, "06:40": 0, "06:50": 0, "07:00": 0, "07:10": 0, "07:20": 0, "07:30": 0, "07:40": 0, "07:50": 0, "08:00": 0, "08:10": 0, "08:20": 0, "08:30": 0, "08:40": 0, "08:50": 0, "09:00": 0, "09:10": 0, "09:20": 0, "09:30": 0, "09:40": 0, "09:50": 0, "10:00": 0, "10:10": 0, "10:20": 0, "10:30": 0, "10:40": 0, "10:50": 0, "11:00": 0, "11:10": 0, "11:20": 0, "11:30": 0, "11:40": 0, "11:50": 0, "12:00": 0, "12:10": 0, "12:20": 0, "12:30": 0, "12:40": 0, "12:50": 0, "13:00": 0, "13:10": 0, "13:20": 0, "13:30": 0, "13:40": 0, "13:50": 0, "14:00": 0, "14:10": 0, "14:20": 0, "14:30": 0, "14:40": 0, "14:50": 0, "15:00": 0, "15:10": 0, "15:20": 0, "15:30": 0, "15:40": 0, "15:50": 0, "16:00": 0, "16:10": 0, "16:20": 0, "16:30": 0, "16:40": 0, "16:50": 0, "17:00": 0, "17:10": 0, "17:20": 0, "17:30": 0, "17:40": 0, "17:50": 0, "18:00": 0, "18:10": 0, "18:20": 0, "18:30": 0, "18:40": 0, "18:50": 0, "19:00": 0, "19:10": 0, "19:20": 0, "19:30": 0, "19:40": 0, "19:50": 0, "20:00": 0, "20:10": 0, "20:20": 0, "20:30": 0, "20:40": 0, "20:50": 0, "21:00": 0, "21:10": 0, "21:20": 0, "21:30": 0, "21:40": 0, "21:50": 0, "22:00": 0, "22:10": 0, "22:20": 0, "22:30": 0, "22:40": 0, "22:50": 0, "23:00": 0, "23:10": 0, "23:20": 0, "23:30": 0, "23:40": 0, "23:50": 0 };

var updateExcelAggregation = cron.job("00 01 00 * * *", function() {

    BuildingModel.find({}, function(err, buildings) {
        buildings.forEach(function(building) {
            var now = moment().tz(building.timezone);
            now.subtract(1, 'Days');
            var startDate = moment.tz(now.format("YYYY-MM-DD") + 'T00:00:00', building.timezone).unix() * 1000;
            var endDate = moment.tz(now.format("YYYY-MM-DD") + 'T23:59:59', building.timezone).unix() * 1000;
            //console.log(startDate, endDate)
            var dayStr = now.format("D-MM-YYYY");
            SeatModel.aggregate([{ $match: { floorId: { $in: building.floors } } },
                { $lookup: { from: 'sections', localField: '_id', foreignField: 'seats', as: 'sectionData' } }, { $unwind: { path: '$sectionData', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: "floors", localField: "floorId", foreignField: "_id", as: "floor" } }, { $unwind: "$floor" },
                { $project: { name: 1, globalName: 1, sectionName: "$sectionData.name", sectionClass: "$sectionData.class", floorName: "$floor.name" } }
            ], function(err, seats) {
                ExcelAggregationModel.find({ day: dayStr, Location: building.alias, done: true }, function(err, aggSeats) {
                    console.log(seats.length, aggSeats.length)
                    if (aggSeats.length != seats.length) {
                        console.log("Adding data for ", building.name);
                        ExcelAggregationModel.remove({ day: dayStr, Location: building.alias }, function(err, result) {
                            seats.forEach(function(seat) {
                                documentTemplate.seatName = seat.name;
                                documentTemplate.day = dayStr;
                                documentTemplate.floor = seat.floorName;
                                documentTemplate.Department = getBuName(seat.sectionClass);
                                documentTemplate.Location = building.alias;
                                var doc = new ExcelAggregationModel(documentTemplate);
                                doc.save();
                            })
                            SensorDataModel.aggregate([
                                { $match: { time: { $gte: new Date(startDate), $lte: new Date(endDate) }, occupancy: { $gt: 0 } } },
                                {
                                    $project: {
                                        occupancy: 1,
                                        sensorId: 1,
                                        time: 1,
                                        day: { $dateToString: { format: '%d-%m-%Y', date: { $add: ["$time", building.timezoneOffset] } } },
                                        hour: { $hour: { $add: ["$time", building.timezoneOffset] } },
                                        minute: { $subtract: [{ $minute: { $add: ["$time", building.timezoneOffset] } }, { $mod: [{ $minute: { $add: ["$time", building.timezoneOffset] } }, 10] }] }
                                    }
                                },
                                { $lookup: { from: "sensortobles", localField: "sensorId", foreignField: "bleId", as: "seatBle" } }, { $unwind: "$seatBle" },
                                { $project: { occupancy: 1, time: 1, day: 1, hour: 1, minute: 1, bleId: "$seatBle.bleId", seatId: "$seatBle.seatId", floorId: "$seatBle.floorId" } },
                                { $lookup: { from: "seats", localField: "seatId", foreignField: "_id", as: "seat" } }, { $unwind: "$seat" },
                                { $project: { occupancy: 1, time: 1, day: 1, hour: 1, minute: 1, seatName: "$seat.name" } }
                            ], function(err, aggregateDatas) {
                                if (aggregateDatas) {
                                    updateAggregateData(aggregateDatas, dayStr, building);
                                } else {
                                    console.log("No data present for the time range ", new Date(startDate).toString(), new Date(endDate).toString())
                                }
                            })
                        })
                    } else {
                        console.log("Data already present for ", dayStr)
                    }
                })
            })
        })
    })
})
updateExcelAggregation.start();
var updateAggregateData = function(aggregateDatas, dayStr, building) {
    var bulk = ExcelAggregationModel.collection.initializeUnorderedBulkOp();
    var counter = 0;
    var pending = aggregateDatas.length;
    console.log("Retrieved data... Inserting!")
    aggregateDatas.forEach(function(aggData) {
        var updateObj = {};
        updateObj[aggData.hour.pad(2) + ":" + aggData.minute.pad(2)] = aggData.occupancy >= 3 ? 1 : 0;
        //console.log(updateObj);
        bulk.find({ seatName: aggData.seatName, day: dayStr }).update({ $set: updateObj })
        if (++counter == pending) {
            console.log("Updated data for ", building.alias)
            bulk.find({ day: dayStr }).update({ $set: { done: true } }, { multi: true });
            bulk.execute(function(err, result) {
                console.log(result)
            });
        }
    })
}