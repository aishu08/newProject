var router = global.express.Router();
var SiteModel = require('../models/site');
var BuildingModel = require('../models/building');
var SectionModel = require('../models/sections');
var FloorModel = require('../models/floors');
var BleModel = require('../models/ble');
var SeatModel = require('../models/seats');
var SensorDataModel = require('../models/sensorData');
var SeatToBle = require('../models/sensorToBle');
var RoomToBle = require('../models/roomToBle');
var UserModel = require('../models/users')
var bcrypt = global.bcrypt;
/*var xlsx = require('node-xlsx');*/
var fs = require('fs');
//var time = require('time');

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
router.post('/addSite', function(req, res, next) {
        var data = req.body;
        var site = new SiteModel({
            name: data.name,
            location: data.location
        });
        site.save(function(err, doc, num) {
            if (err)
                res.send(err)
            else
                res.send('Done')
        });
    })
    .post('/addBuilding', function(req, res, next) {
        var data = req.body;
        var bldg = new BuildingModel({
            name: data.name
        });
        bldg.save(function(err, doc, num) {
            if (err)
                res.send(err)
            else {
                SiteModel.findByIdAndUpdate(data.siteId, { $push: { buildings: doc._id } }, function(err, doc) {
                    if (err)
                        res.send(err)
                    else
                        res.send('Done');
                })
            }
        });
    })
    .post("/addFloor", function(req, res, next) {
        var data = req.body;
        var floor = new FloorModel({
            name: data.name,
            layout: data.layout
        })
        floor.save(function(err, doc, num) {
            if (err)
                res.send(err)
            else {
                BuildingModel.findByIdAndUpdate(data.bldgId, { $push: { floors: doc._id } }, function(err, doc) {
                    if (err)
                        res.send(err)
                    else
                        res.send("done")
                })
            }
        })
    })
    .post("/addSection", function(req, res, next) {
        var data = req.body;
        var section = new SectionModel({
            name: data.name,
            posX: data.posX,
            posY: data.posY,
            height: data.height,
            width: data.width,
            isRoom: data.isRoom ? true : false,
            class: data.class
        })
        section.save(function(err, doc, num) {
            if (err)
                res.send(err)
            else {
                FloorModel.findByIdAndUpdate(data.floorId, { $push: { sections: doc._id } }, function(err, doc) {
                    if (err)
                        res.send(err)
                    else
                        res.send("done")
                })
            }
        })
    })
    .post('/addSeatToSection', function(req, res, next) {
        var data = req.body;
        var seats = data.seats.split(',');
        var counter = 0;
        var pending = seats.length;
        seats.forEach(function(seat) {
            SeatModel.findOne({ name: seat.replace(/ /g, '') }, function(err, seatData) {
                if (seatData) {
                    SectionModel.findByIdAndUpdate(data.sectionId, { $push: { seats: seatData._id } }, function(err, doc) {
                        if (++counter == pending) {
                            res.send("Done");
                        }
                    })
                } else {
                    counter++;
                }
            })
        })
    })

.post("/addSeat", function(req, res, next) {
        var data = req.body;
        var i = 1;

        function addSeats(count, callback) {
            for (var i = 1; i <= count; i++) {
                var seat = new SeatModel({
                    floorId: data.floorId,
                    name: "Seat " + i,
                    posX: 0.0,
                    posY: 0.0,
                    rotate: 0.0
                });
                seat.save(function(err, doc, num) {
                    if (err) {
                        console.log(err);
                        next();
                    } else {
                        if (i == count) {
                            console.log(i);
                            callback()
                        }
                    }
                })
            }
        }
        addSeats(data.seatCount, function() {
            res.send("Done");
        })
    })
    .post("/addBle", function(req, res, next) {
        var data = req.body;
        var ble = new BleModel({
            floorId: data.floorId,
            address: data.address,
            isHost: ("isHost" in data),
            hostId: data.hostId,
            hasOccupancy: ("hasOccupancy" in data),
            hasTemperature: ("hasTemperature" in data),
            hasDensity: ("hasDensity" in data)
        });
        ble.save(function(err, doc, num) {
            if (err) {
                res.send(err);
            } else
                res.send("Done");
        })
    })

.post('/seatBleMapping', function(req, res, next) {
        var data = req.body;
        SeatToBle.find({ floorId: data.floorId }, 'seatId bleId -_id').populate([{ path: 'seatId', select: "name -_id" }, { path: 'bleId', select: "address -_id" }]).exec(function(err, doc) {
            var seatBle = doc.map(function(seat) { return seat.seatId.name + ', ' + (seat.bleId ? seat.bleId.address : 'Null') })
            res.json(seatBle);
        });
    })
    /*.post("/addSensorData", function(req, res, next){
        var values =JSON.parse(req.body.payload);
        function addData(callback){
            var counter = 0;
            var pending = values.length;
            values.forEach(function(value){
                FloorModel.findOne({name: value.floorName}, function(err, floor){
                    if(floor)
                    {
                        BleModel.findOne({floorId: floor.id, address: value.sensorAddr.toUpperCase()}, {_id: 1}, function(err, ble){
                            if(ble)
                            {
                                var sensorData = new SensorDataModel({
                                    sensorId: ble.id,
                                    occupancy: value.occupancy,
                                    temperature: value.temperature,
                                    density: value.density,
                                    time: new Date(parseInt(value.time)* 1000)
                                })
                                sensorData.save(function(err, doc, num){
                                    if(!err)
                                    {
                                        SeatToBle.findOneAndUpdate({bleId: ble.id},{occupied: value.occupancy, temperature: (value.temperature ? value.temperature : null),lastOccupied: new Date(parseInt(value.time)* 1000)}, function(err, doc){
                                            if(err){
                                                console.log(err)
                                                //res.send(err)
                                            }
                                            else{
                                                console.log("Updated");
                                                //res.send("Done")
                                            }
                                        });

                                        if(++counter == pending){
                                            callback(true);
                                        }
                                    }
                                    else{
                                        console.log(err);
                                        next()
                                    }
                                })
                            }
                            else
                                counter++;
                        })
                    }
                    else
                        counter++;
                    
                });
            });
        }
        addData(function(status){
            res.send("Done");
        })
    })*/
    .post("/seatToBle", function(req, res, next) {
        var data = req.body;
        SeatModel.findOne({ floorId: data.floorId, name: data.seatName }, function(err, seat) {
            if (seat) {
                BleModel.findOne({ floorId: data.floorId, address: data.address }, function(err, ble) {
                    if (ble) {
                        SeatToBle.findOneAndUpdate({ floorId: data.floorId, seatId: seat.id, bleId: ble.id }, { occupied: 0, temperature: null, lastOccupied: null }, { upsert: true }, function(err, doc) {
                            if (err) {
                                console.log(err)
                                res.send(err)
                            } else {
                                console.log(doc);
                                res.send("Done")
                            }
                        });
                    } else
                        res.send("No BLE found");
                })
            } else
                res.send("No seat found");
        })

    })
    /*.get("/getBuildingData", function(req, res, next){

        function getBuildingData(parentCallback){
            var bldgData = [];
            BuildingModel.findOne({}).lean().populate({path: 'floors', select: 'name'}).exec(function(err, bldg){
                var tmpBldg = {};
                tmpBldg.bldgId = bldg._id;
                tmpBldg.buildingName = bldg.name;

                var parentCounter = 0;
                var parentPending = bldg.floors.length;
                tmpBldg.floors = [];
                bldg.floors.forEach(function(floor){
                    getFloorData(floor._id, function(floorData){
                        floor.floorId = floor._id;
                        floor.floorName = floor.name;
                        floor.seats = floorData;
                        floor.rooms = [];
                        delete floor._id;
                        delete floor.name;
                        tmpBldg.floors.push(floor);
                        //console.log(floor)
                        console.log(parentCounter)
                        if(++parentCounter == parentPending)
                        {
                            bldgData.push(tmpBldg);
                            parentCallback(bldgData);
                        }

                    })
                })
            })
        }
        function getFloorData(floorId, callback){
            SeatToBle.find({floorId: floorId}, 'seatId floorId occupied temperature lastOccupied -_id').lean().populate([{path:'seatId', select: 'name'}]).exec(function(err, floorData){
                var counter = 0;
                var pending = floorData.length;
                if(pending == 0)
                    callback([])
                floorData.forEach(function(data){
                    data.seatName = data.seatId.name;
                    data.seatId = data.seatId._id;
                    if(++counter == pending){
                        console.log("calling callback");
                        callback(floorData);
                    }
                })
            })
        }
        getBuildingData(function(data){
            res.json(data)
        })
    })*/
    .post('/addUser', function(req, res, next) {
        var data = req.body;
        if (data) {
            user = new UserModel({
                name: data.name,
                password: bcrypt.hashSync(data.password)
            })
            user.save(function(err, doc, num) {
                if (err)
                    res.json(err);
                else
                    res.send("Done");
            })
        }
    })
    .get('/tempdata/:floorId', function(req, res, next) {
        var floorId = req.params.floorId;

        BleModel.find({ floorId: floorId, hasTemperature: true }, '_id', function(err, bles) {
            var bleIds = bles.map(function(ble) { return ble.id });
            SeatToBle.find({ bleId: { $in: bleIds } }, 'seatId', function(err, seats) {
                var seatIds = seats.map(function(seat) { return seat.seatId });

                SeatModel.find({ _id: { $in: seatIds } }, function(err, seatData) {
                    res.json(seatData)
                })
            })
        })
    })
    .post('/importExcel', function(req, res, next) {
        var data = req.body;
        if (data) {
            var sheet = xlsx.parse(data.sheetName);
            var rows = sheet[0].data;
            var floorId = rows[0][0];
            var hostId = rows[0][1];
            var counter = 0;
            var pending = rows.length
            SeatModel.remove({ floorId: floorId }, function(err) {
                if (err)
                    res.send("Failed to remove all seats");
                else {
                    BleModel.remove({ floorId: floorId, isHost: false }, function(err) {
                        if (err)
                            res.send("Failed to remove Bles")
                        else {
                            rows.forEach(function(row, i) {
                                if (i >= 2) {
                                    //console.log(parseInt(row[3]), parseInt(row[4]))
                                    var seat = new SeatModel({
                                        floorId: floorId,
                                        name: row[0],
                                        rotate: 0,
                                        posY: row[3],
                                        posX: row[4]
                                    });
                                    //console.log(seat)
                                    seat.save(function(err, seatDoc, num) {
                                        if (row.length >= 2) {
                                            if (row[1]) {
                                                var newBle = new BleModel({
                                                    floorId: floorId,
                                                    address: row[1],
                                                    isHost: false,
                                                    hostId: hostId,
                                                    hasOccupancy: true,
                                                    hasTemperature: (row[2] == "T" ? true : false)
                                                });
                                                newBle.save(function(err, bleDoc, num) {
                                                    if (err) {
                                                        console.log(err)
                                                    } else {
                                                        console.log("New Ble added");
                                                    }
                                                })
                                            }
                                            if (++counter == pending)
                                                res.send("Done");
                                        } else
                                            console.log(row)
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })
    .post('/updateRefs', function(req, res, next) {
        var data = req.body;
        if (data) {
            var sheet = xlsx.parse(data.sheetName);
            var rows = sheet[0].data;
            var floorId = rows[0][0];
            var hostId = rows[0][1];
            var counter = 0;
            var pending = rows.length;
            SeatToBle.remove({ floorId: floorId }, function(err) {
                if (err)
                    res.send("Failed to remove all seats");
                else {
                    rows.forEach(function(row, i) {
                        if (i >= 2) {
                            //console.log("Inside For", row[0], row[1])
                            SeatModel.findOne({ floorId: floorId, name: row[0] }, function(err, seat) {
                                if (seat) {
                                    BleModel.findOne({ floorId: floorId, address: row[1] }, function(err, ble) {
                                        if (ble) {
                                            //console.log("Before Inserting:", row[0], row[1])
                                            SeatToBle.findOneAndUpdate({ floorId: floorId, seatId: seat.id, bleId: ble.id }, { occupied: 0, temperature: null, lastOccupied: null }, { upsert: true }, function(err, doc) {
                                                if (err) {
                                                    console.log(err)
                                                        //res.send(err)
                                                } else {
                                                    //console.log(doc);
                                                    //res.send("Done")
                                                }
                                            });
                                        } else
                                            console.log(row[1], " Ble not found");
                                    })
                                } else {
                                    console.log(row[0], "Seat not found");
                                }
                            })
                        }
                        if (++counter == pending)
                            res.send("Done");
                    })
                }
            })
        }
    })
    .post('/notWorkingSeats', function(req, res, next) {
        var data = req.body;
        if (data) {
            var floorId = data.floorId;
            SeatToBle.find({ floorId: floorId, lastOccupied: { $lte: new Date(2017, 1, 1, 0, 0, 0) } }, 'seatId -_id', function(err, seats) {
                var seatIds = seats.map(function(seat) { return seat.seatId });
                SeatModel.find({ _id: { $in: seatIds } }, 'name -_id', function(err, seatData) {
                    var seatNames = seatData.map(function(seat) { return seat.name });
                    res.json(seatNames)
                })
            })
        }
    })
    .post('/getSensorData', function(req, res, next) {
        // var data = req.body;
        // var dayStartIST = new time.Date(data.year, data.month, data.day, 0, 0, 0, 'Asia/Kolkata').getTime();
        // var dayEndIST = new time.Date(data.year, data.month, data.day, 23, 59, 59, 'Asia/Kolkata').getTime();
        // var dayStart = new Date(dayStartIST);
        // var dayEnd = new Date(dayEndIST);
        // BleModel.find({floorId: data.floorId, hasOccupancy: true}, '_id', function(err, bles){
        //     if(err)
        //         console.log(err)
        //     else
        //     {
        //        var bleIds = bles.map(function(ble){return ble._id});
        //        res.json(bleIds);
        //         /*SensorDataModel.find({time : {$gte: dayStart}, time: {$lte: dayEnd}, sensorId: {$in: bleIds}}, function(err, data){
        //             if(data)
        //                 res.send(data);
        //         }) */
        //     }

        // })
    })
    .post('/updateSeats', function(req, res, next) {
        var data = req.body;
        var seats = data.seats.split(',');
        var counter = 0;
        var pending = seats.length;
        seats.forEach(function(seat) {
            SeatModel.findOne({ name: seat.replace(/ /g, '') }, function(err, seatData) {
                if (seatData) {
                    SeatToBle.update({ seatId: seatData._id }, { occupied: true, lastOccupied: new Date() }, function(err, update) {
                        if (++counter == pending) {
                            res.send("Done");
                        }
                    })
                } else {
                    counter++;
                }
            })
        })
    })
    .post('/releaseSeats', function(req, res, next) {
        var data = req.body;
        var seats = data.seats.split(',');
        var counter = 0;
        var pending = seats.length;
        seats.forEach(function(seat) {
            SeatModel.findOne({ name: seat.replace(/ /g, '') }, function(err, seatData) {
                if (seatData) {
                    SeatToBle.update({ seatId: seatData._id }, { occupied: false }, function(err, update) {
                        if (++counter == pending) {
                            res.send("Done");
                        }
                    })
                } else {
                    counter++;
                }
            })
        })
    })
    .post('/seatStatus', function(req, res, next) {
        var data = req.body;
        var seats = data.seats.split(',');
        var counter = 0;
        var pending = seats.length;
        seats.forEach(function(seat) {
            SeatModel.findOne({ name: seat.replace(/ /g, '') }, function(err, seatData) {
                if (seatData) {
                    SeatToBle.findOne({ seatId: seatData._id }, function(err, seatBle) {
                        if (seatBle) {
                            console.log(seatBle.bleId);
                            BleModel.findOneAndUpdate({ _id: seatBle.bleId }, { status: data.status }, function(err, update) {
                                if (err)
                                    console.log(err, "Error");
                                else
                                    console.log(update, "Success");
                                if (++counter == pending) {
                                    res.send("Done");
                                }
                            })
                        } else {
                            counter++;
                        }

                    })
                } else {
                    counter++;
                }
            })
        })
    })
    .post('/updateRooms', function(req, res, next) {
        var data = req.body;
        var updateObj;
        SectionModel.findOne({ name: data.room }, function(err, roomData) {
            if (roomData) {
                if (data.count == 0) {
                    updateObj = { peopleCount: 0, lastUpdated: new Date() };
                } else {
                    updateObj = { peopleCount: data.count };
                }
                RoomToBle.update({ roomId: roomData._id }, updateObj, function(err, update) {
                    res.send("Done");
                })
            } else {
                res.send("Room not found");
            }
        })
    })

.post('/getSeats', function(req, res, next) {
        var data = req.body;
        SeatModel.find({ floorId: data.floorId }, 'name -_id', { sort: 'name' }, function(err, result) {
            result.sort(sortAlphaNum);
            var seats = result.map(function(seat) { return seat.name });
            res.json(seats);
        })
    })
    .post('/getSensorIdForSeats', function(req, res, next) {
        var data = req.body;
        var seats = data.seats.split(',');
        var counter = 0;
        var pending = seats.length;
        var bleIds = [];
        if (!(seats.length > 0))
            res.send("No seats specified")
        seats.forEach(function(seat) {
            SeatModel.findOne({ name: seat.replace(/ /g, '') }, function(err, seatData) {
                if (seatData) {
                    SeatToBle.findOne({ seatId: seatData._id }, function(err, seatBle) {
                        if (seatBle) {
                            bleIds.push(seatBle.bleId);
                            if (++counter == pending) {
                                res.send(bleIds);
                            }
                        } else
                            counter++;
                    })
                } else {
                    counter++;
                    console.log('Seat ' + seat.name + " Not found")
                }
            })
        });
    })
module.exports = router;