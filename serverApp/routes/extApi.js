process.env.TZ = 'Asia/Kolkata'
var router = global.express.Router();
var SiteModel = require('../models/site');
var BuildingModel = require('../models/building');
var SectionModel = require('../models/sections');
var FloorModel = require('../models/floors');
var BleModel = require('../models/ble');
var SeatModel = require('../models/seats');
var SensorDataModel = require('../models/sensorData');
var SeatToBle = require('../models/sensorToBle');
var RoomToBle = require('../models/roomToBle')
var fs = require('fs');
router
    .get("/getBuildingData", function(req, res, next) {

        function getBuildingData(bldgId, parentCallback) {
            BuildingModel.findOne({ _id: bldgId }).lean().populate({ path: 'floors', select: 'name' }).exec(function(err, bldg) {
                var tmpBldg = {};
                tmpBldg.bldgId = bldg._id;
                tmpBldg.buildingName = bldg.alias;

                var parentCounter = 0;
                var parentPending = bldg.floors.length;
                tmpBldg.floors = [];
                bldg.floors.forEach(function(floor) {
                    getFloorData(floor._id, function(floorData) {
                        floor.floorId = floor._id;
                        floor.floorName = floor.name;
                        floor.seats = floorData;
                        getRoomData(floor._id, function(roomData) {
                            floor.rooms = roomData;
                            delete floor._id;
                            delete floor.name;
                            tmpBldg.floors.push(floor);
                            //console.log(floor)
                            if (++parentCounter == parentPending) {
                                //bldgData.push(tmpBldg);
                                parentCallback(tmpBldg);
                            }
                        })
                    })
                })
            })
        }

        function getFloorData(floorId, callback) {
            SeatToBle.find({ floorId: floorId }, 'seatId floorId occupied temperature lastOccupied -_id').lean().populate([{ path: 'seatId', select: 'name globalName' }]).exec(function(err, floorData) {
                var counter = 0;
                var pending = floorData.length;
                if (pending == 0)
                    callback([])
                floorData.forEach(function(data) {
                    data.seatName = data.seatId.name;
                    data.webcoreName = data.seatId.globalName;
                    data.seatId = data.seatId._id;
                    if (data.lastOccupied)
                        data.lastOccupied = data.lastOccupied.getTime() / 1000 | 0;
                    if (++counter == pending) {
                        callback(floorData);
                    }
                })
            })
        }

        function getRoomData(floorId, callback) {
            RoomToBle.find({ floorId: floorId }, 'roomId peopleCount lastUpdated -_id').lean().populate([{ path: 'roomId', select: 'name webcoreName' }]).exec(function(er, roomData) {
                var counter = 0;
                var pending = roomData.length;
                if (pending == 0)
                    callback([])
                roomData.forEach(function(room) {
                    room.roomId.name = room.roomId.name.replace(/ /g, ".")
                    room.roomId.name = room.roomId.name.replace(/\//g, "")
                    room.roomName = room.roomId.name;
                    room.webcoreName = room.roomId.webcoreName;
                    room.roomId = room.roomId._id;
                    if (room.lastUpdated) {
                        room.lastOccupied = room.lastUpdated.getTime() / 1000 | 0;
                        delete room.lastUpdated;
                    }
                    if (++counter == pending)
                        callback(roomData);
                })
            })
        }
        BuildingModel.find({}, function(err, bldgs) {
            var counter = 0;
            var pending = bldgs.length;
            var bldgData = [];
            bldgs.forEach(function(bldg) {
                getBuildingData(bldg.id, function(data) {
                    bldgData.push(data)
                    if (++counter == pending)
                        res.json(bldgData)
                })
            })
            var text = "Poll from IP: " + req._remoteAddress.slice(7, req._remoteAddress.length) + " at " + Date() + "\n";
            fs.appendFileSync('buildingDataPollData.txt', text);
        })
    })
module.exports = router;