var router = global.express.Router();
var BuildingModel = require('../models/building');
var FloorModel = require('../models/floors');
var HostModel = require('../models/hosts');
var SensorDataModel = require('../models/sensorData');
var SensorHealthLogModel = require('../models/sensorHealthLog');
var SectionModel = require('../models/sections');
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

var fs = require('fs');
router.post("/addSensorData", function(req, res, next) {
        var values = JSON.parse(req.body.payload);
        //console.log(values);
         // var values = req.body
         console.log(values)
        if (values.seatConfig) {
            var buildingName = values.buildingName;
            var hostName = values.hostName;
            var seatConfig = values.seatConfig;
            var floorConfig = values.floorConfig;
            var roomConfig = values.roomConfig;
        } else if (values.sensorData) {
            var buildingName = values.bldg;
            var hostName = values.host;
            var floorName = values.floor;
            var sensorData = values.sensorData;
        } else if (values.lightConfig) {
            var buildingName = values.buildingName;
            var hostName = values.hostName;
            var hostIp = values.hostIP
            var floorConfig = values.floorConfig;
            var lightConfig = values.lightConfig
            var lightSensorConfig = values.lightSensorConfig
            console.log(lightSensorConfig)
            var sceneConfig = {}
            // console.log(sceneConfig)
        } else {
            var bookingData = values.bookingData;
        }

        function addSensorData(callback) {
            var counter = 0;
            var pending = sensorData.length;
            console.log(floorName, hostName)
                //fs.writeFileSync(hostName + ".json", JSON.stringify(sensorData, null, 4))
            BuildingModel.findOne({ name: buildingName }, function(err, bldg) {
                if (bldg) {
                    FloorModel.findOne({ name: floorName }, function(err, floor) {
                        if (floor) {
                            HostModel.findOne({ name: hostName, floorId: floor.id, buildingId: bldg.id }, function(err, host) {
                                if (host) {
                                    var hostLog = new HostLogs({
                                        hostId: host.id,
                                        lastUpdated: new Date()
                                    })
                                    hostLog.save(function(err, doc, num) {
                                        if (!err)
                                            console.log("Host log updated")
                                        else
                                            console.log(err)
                                    })
                                    sensorData.forEach(function(value) {
                                        // if (buildingName == 'Barclays Pune') {
                                        //     value.s = 1;
                                        // }
                                        BleModel.findOne({ floorId: floor.id, address: value.a.toUpperCase() }, { _id: 1 }, function(err, ble) {
                                            if (ble) {
                                                if (value.s) {
                                                    var healthLog = new SensorHealthLogModel({
                                                        sensorId: ble.id,
                                                        status: value.s,
                                                        time: new Date()
                                                    })
                                                    healthLog.save(function(err, doc, num) {
                                                        //console.log('Sensor Health Log')
                                                    })
                                                }
                                                var currentDate = new Date().getTime();
                                                if (value.s == 0 && value.d == 'null') {
                                                    SeatToBle.findOneAndUpdate({ bleId: ble._id, lastStatusUpdate: { $lt: new Date(currentDate - 1800000) } }, { $set: { status: false, occupied: false, lastDataPacket: (value.p ? value.p : '[]') } }, function(err, doc) {
                                                        if (!err) {
                                                            if (++counter == pending)
                                                                callback(floor.id)
                                                        }
                                                    })
                                                } else if (value.s == 0 && value.d != 'null') {
                                                    RoomToBle.findOneAndUpdate({ bleId: ble._id }, { $set: { status: false, peopleCount: 0, lastDataPacket: (value.p ? value.p : '[]') } }, function(err, doc) {
                                                        if (!err) {
                                                            if (++counter == pending)
                                                                callback(floor.id)
                                                        }
                                                    })
                                                } else {
                                                    if (value.d == 'null') {
                                                        var updateOptions = {}
                                                        var temp = Math.floor(Math.random() * (25 - 22 + 1) + 22);
                                                        var temperature = (parseFloat(value.t) == 0 ? 0 : (parseFloat(value.t) < 19 ? 19 : (parseFloat(value.t) > 25 ? temp : value.t)));

                                                        if (value.o > 0) {
                                                            var sensorData = new SensorDataModel({
                                                                sensorId: ble.id,
                                                                occupancy: value.o,
                                                                temperature: temperature,
                                                                time: new Date(parseInt(value.ti) * 1000),
                                                                dataPacket: (value.p ? value.p : '[]')
                                                            });
                                                            sensorData.save(function(err, doc, num) {
                                                                if (!err) {
                                                                    //console.log("Inserted Occupancy Sensor Data")
                                                                } else {
                                                                    //console.log("Duplicate entry for:", value.a, value.t, value.ti);
                                                                    console.log(err);
                                                                }
                                                            })
                                                            updateOptions.occupied = value.o >= 3;
                                                            updateOptions.temperature = temperature;
                                                            updateOptions.status = true;
                                                            updateOptions.lastOccupied = new Date(parseInt(value.ti) * 1000);
                                                            updateOptions.lastStatusUpdate = new Date(parseInt(value.ti) * 1000);
                                                            updateOptions.lastDataPacket = (value.p ? value.p : '[]')
                                                        } else {
                                                            updateOptions.occupied = false;
                                                            updateOptions.temperature = temperature;
                                                            updateOptions.status = true;
                                                            updateOptions.lastStatusUpdate = new Date(parseInt(value.ti) * 1000);
                                                            updateOptions.lastDataPacket = (value.p ? value.p : '[]')
                                                        }
                                                        SeatToBle.findOneAndUpdate({ bleId: ble.id }, updateOptions, function(err, doc) {
                                                            if (err) {
                                                                console.log(err)
                                                                    //res.send(err)
                                                            }
                                                        });
                                                        if (++counter == pending) {
                                                            //console.log("Added data for floor ", floorName)
                                                            callback(floor.id);
                                                        }
                                                    } else if (value.d != 'null') {
                                                        RoomToBle.findOne({ bleId: ble.id }).populate({ path: 'roomId' }).exec(function(err, room) {
                                                            if (room) {
                                                                if (value.d > 0) {
                                                                    var sensorData = new SensorDataModel({
                                                                        sensorId: ble.id,
                                                                        density: room.roomId.capacity % value.d,
                                                                        time: new Date(parseInt(value.ti) * 1000),
                                                                        dataPacket: (value.p ? value.p : '[]')
                                                                    });
                                                                    sensorData.save(function(err, doc, num) {
                                                                        if (!err) {
                                                                            //console.log("Inserted Density Sensor Data")
                                                                        } else {
                                                                            //console.log("Duplicate entry for:", value.a, value.t, value.ti);
                                                                            console.log(err);
                                                                        }
                                                                    })
                                                                    RoomToBle.findOneAndUpdate({ bleId: ble.id }, { peopleCount: room.roomId.capacity % value.d, lastUpdated: new Date(parseInt(value.ti) * 1000), status: true, lastDataPacket: (value.p ? value.p : '[]') }, function(err, doc) {
                                                                        if (err) {
                                                                            console.log(err)
                                                                                //res.send(err)
                                                                        }
                                                                    })
                                                                } else {
                                                                    RoomToBle.findOneAndUpdate({ bleId: ble.id }, { peopleCount: value.d, lastUpdated: new Date(parseInt(value.ti) * 1000), status: true, lastDataPacket: (value.p ? value.p : '[]') }, function(err, doc) {
                                                                        if (err) {
                                                                            console.log(err)
                                                                                //res.send(err)
                                                                        }
                                                                    })
                                                                }
                                                                if (++counter == pending) {
                                                                    //console.log("Added data for floor ", floorName)
                                                                    callback(floor.id);
                                                                }
                                                            } else {
                                                                if (++counter == pending) {
                                                                    //console.log("Added data for floor ", floorName)
                                                                    callback(floor.id);
                                                                }
                                                            }
                                                        })
                                                    }
                                                }
                                            } else {
                                                //console.log("Ble not found with address: ", value.a)
                                                if (++counter == pending)
                                                    callback(floor.id)
                                            }
                                        })
                                    });
                                } else {
                                    callback(false);
                                }
                            });
                        } else {
                            callback(false)
                        }
                    });
                } else {
                    callback(false)
                }
            })
        }

        function addBookingData(callback) {
            FloorModel.findOne({ name: floorName }, function(err, floor) {
                if (floor) {
                    BleModel.findOne({ floorId: floor.id, address: bookingData.sid.toUpperCase() }, { _id: 1 }, function(err, ble) {
                        if (ble) {
                            Employees.findOne({ cardId: bookingData.eid }, { _id: 1 }, function(err, emp) {
                                if (emp) {
                                    if (bookingData.ib) {
                                        var bookingEntry = new BookingDetails({
                                            employeeId: emp.id,
                                            seatId: ble.id,
                                            inTime: new Date(parseInt(bookingData.it) * 1000),
                                            outTime: new Date(parseInt(bookingData.ot) * 1000),
                                            duration: 28800
                                        })
                                        bookingEntry.save(function(err, doc, num) {
                                            if (!err) {
                                                SeatToBle.findOneAndUpdate({ nfcId: ble.id }, { bookingId: doc.id }, function(err, seatBle) {
                                                    if (!err) {
                                                        console.log("Booked seat")
                                                    } else {
                                                        console.log(err)
                                                    }
                                                    callback(floor.id)
                                                })
                                            }
                                        })
                                    } else {
                                        SeatToBle.findOne({ nfcId: ble.id }, function(err, bookedSeat) {
                                            if (bookedSeat) {
                                                SeatToBle.findOneAndUpdate({ nfcId: ble.id }, { $set: { bookingId: null } }, function(err, doc) {
                                                    if (!err) {
                                                        BookingDetails.findByIdAndUpdate(doc.bookingId, { outTime: bookingData.ot, duration: bookingData.d }, function(err, resp) {
                                                            if (!err) {
                                                                console.log("Cancelled Seat")
                                                            } else {
                                                                console.log(err)
                                                            }
                                                            callback(floor.id)
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                } else {
                                    callback(floor.id)
                                }
                            })
                        } else
                            callback(floor.id)
                    })
                } else
                    callback(floor.id)
            })
        }

        function addHostConfig(callback) {
            var fileName = buildingName.toUpperCase() + "-" + floorConfig.name.toUpperCase() + "-" + hostName.toUpperCase() + "-config.json"
            fs.writeFileSync(fileName, JSON.stringify(values, null, 4));
            BuildingModel.findOneAndUpdate({ name: buildingName }, { name: buildingName, timezone: "Asia/Kolkata", timezoneOffset: 19800000 }, { upsert: true, new: true }, function(err, bldg) {
                    //console.log(bldg);
                    FloorModel.findOneAndUpdate({ name: floorConfig.name }, { name: floorConfig.name, layout: floorConfig.layout }, { upsert: true, new: true }, function(err, floor) {
                        //console.log(floor);
                        BuildingModel.findByIdAndUpdate(bldg._id, { $addToSet: { floors: floor._id } }, function(err, bldgUpdate) {
                            HostModel.findOneAndUpdate({ buildingId: bldg._id, floorId: floor._id, name: hostName }, { buildingId: bldg._id, floorId: floor._id, name: hostName }, { upsert: true, new: true }, function(err, host) {


                                //Update seat config
                                SeatToBle.remove({ hostId: host._id }, function(err) {
                                    if (!err) {
                                        var seatIds = [];
                                        var bleIds = [];
                                        var counter = 0;
                                        var pending = seatConfig.length;
                                        seatConfig.forEach(function(seat) {
                                            SeatModel.findOneAndUpdate({ name: seat.name, floorId: floor._id, hostId: host._id }, { floorId: floor._id, hostId: host._id, name: seat.name, width: seat.width, height: seat.height, posX: seat.posx, posY: seat.posy, class: seat.class }, { upsert: true, new: true }, function(err, newSeat) {
                                                if (newSeat) {
                                                    seatIds.push(newSeat._id);
                                                    BleModel.findOneAndUpdate({ floorId: floor._id, address: seat.ble.toUpperCase(), hostId: host._id }, { floorId: floor._id, hostId: host._id, address: seat.ble.toUpperCase(), isHost: false, hasOccupancy: true }, { upsert: true, new: true }, function(err, ble) {
                                                        if (ble) {
                                                            bleIds.push(ble._id)
                                                                //console.log(bleIds)
                                                            SeatToBle.findOneAndUpdate({ floorId: floor._id, seatId: newSeat._id, bleId: ble._id, hostId: host._id }, { floorId: floor._id, seatId: newSeat._id, bleId: ble._id, hostId: host._id, occupied: false, status: false }, { upsert: true, new: true }, function(err, seatble) {
                                                                if (++counter == pending) {
                                                                    SeatModel.remove({ _id: { $nin: seatIds }, hostId: host._id }, function(err) {
                                                                        console.log("Extra seats removed!")
                                                                    })
                                                                    BleModel.remove({ _id: { $nin: bleIds }, hostId: host._id, isHost: false, hasOccupancy: true }, function(err) {
                                                                        console.log("Extra bles removed!")
                                                                    })
                                                                }
                                                            })
                                                        } else {
                                                            console.log("No new ble ")
                                                        }
                                                    })
                                                } else {
                                                    console.log("No new seat")
                                                }
                                            })
                                        })
                                    }
                                })

                                //Update room config
                                RoomToBle.remove({ hostId: host._id }, function(err) {
                                    if (!err) {
                                        var roomIds = [];
                                        var bleIds = [];
                                        var counter = 0;
                                        var pending = roomConfig.length;
                                        roomConfig.forEach(function(room) {
                                            //console.log(room)
                                            SectionModel.findOneAndUpdate({ name: room.name, hostId: host._id }, { name: room.name, hostId: host._id, width: room.width, height: room.height, posX: room.posx, posY: room.posy, rotate: room.rotate, isRoom: true }, { upsert: true, new: true }, function(err, newRoom) {
                                                if (newRoom) {
                                                    roomIds.push(newRoom._id);
                                                    FloorModel.findByIdAndUpdate(floor._id, { $addToSet: { sections: newRoom._id } }, function(err, floorUpdate) {
                                                        BleModel.findOneAndUpdate({ floorId: floor._id, address: room.ble.toUpperCase(), hostId: host._id }, { floorId: floor._id, hostId: host._id, address: room.ble.toUpperCase(), isHost: false, hasDensity: true }, { upsert: true, new: true }, function(err, ble) {
                                                            if (ble) {
                                                                bleIds.push(ble._id)
                                                                RoomToBle.findOneAndUpdate({ floorId: floor._id, roomId: newRoom._id, bleId: ble._id, hostId: host._id }, { floorId: floor._id, roomId: newRoom._id, bleId: ble._id, hostId: host._id, peopleCount: 0, status: false }, { upsert: true, new: true }, function(err, roomBle) {
                                                                    if (++counter == pending) {
                                                                        SectionModel.remove({ _id: { $nin: roomIds }, hostId: host._id }, function(err) {
                                                                            console.log("Extra rooms removed!")
                                                                        })
                                                                        BleModel.remove({ _id: { $nin: bleIds }, hostId: host._id, isHost: false, hasDensity: true }, function(err) {
                                                                            console.log("Extra bles removed!")
                                                                        })
                                                                    }
                                                                })
                                                            } else {
                                                                console.log("No new ble ")
                                                            }
                                                        })
                                                    })
                                                } else {
                                                    console.log("No new room")
                                                }
                                            })
                                        })
                                    }
                                })
                                res.send("Done")
                            })
                        })
                    })
                })
                //callback(true)
        }
               function addLightHostConfig(callback) {
            var fileName = buildingName.toUpperCase() + "-" + floorConfig.name.toUpperCase() + "-" + hostName.toUpperCase() + "-lightconfig.json"
            fs.writeFileSync(fileName, JSON.stringify(values, null, 4));
            BuildingModel.findOneAndUpdate({ name: buildingName }, { name: buildingName, timezone: "Asia/Kolkata", timezoneOffset: 19800000 }, { upsert: true, new: true }, function (err, bldg) {
                FloorModel.findOneAndUpdate({ name: floorConfig.name }, { name: floorConfig.name, layout: floorConfig.layout }, { upsert: true, new: true }, function (err, floor) {
                    BuildingModel.findByIdAndUpdate(bldg._id, { $addToSet: { floors: floor._id } }, function (err, bldgUpdate) {
                        HostModel.findOneAndUpdate({ buildingId: bldg._id, floorId: floor._id, name: hostName }, { buildingId: bldg._id, floorId: floor._id, name: hostName, ip: hostIp }, { upsert: true, new: true }, function (err, host) {
                            LightToBle.remove({ hostId: host._id }, function (err) {
                                if (!err) {
                                    var lightIds = [];
                                    var bleIds = [];
                                    var counter = 0;
                                    var pending = lightConfig.length;
                                    lightConfig.forEach(function (light) {
                                        // console.log(light)
                                        LightModel.findOneAndUpdate({ name: light.name, floorId: floor._id, hostId: host._id }, { floorId: floor._id, hostId: host._id, name: light.name, width: light.width, height: light.height, posX: light.posx, posY: light.posy, class: light.class, rotate: light.rotate, minlevel: light.minlevel, maxlevel: light.maxlevel, faderate: light.faderate, wattage: light.wattage }, { upsert: true, new: true }, function (err, newLight) {
                                            if (newLight) {
                                                lightIds.push(newLight._id);
                                                BleModel.findOneAndUpdate({ floorId: floor._id, address: light.ble.toUpperCase(), hostId: host._id }, { floorId: floor._id, hostId: host._id, address: light.ble.toUpperCase(), isHost: false, isLAD: true }, { upsert: true, new: true }, function (err, ble) {
                                                    if (ble) {
                                                        bleIds.push(ble._id)
                                                        LightToBle.findOneAndUpdate({ floorId: floor._id, lightId: newLight._id, bleId: ble._id, hostId: host._id }, { floorId: floor._id, lightId: newLight._id, bleId: ble._id, hostId: host._id, status: false }, { upsert: true, new: true }, function (err, lightble) {
    
                                                        })
                                                    }
                                                    else {
                                                        console.log("No new ble ")
                                                    }
                                                })
                                            }
                                            else {
                                                console.log("No new light")
                                            }
                                        })
                                        if (++counter == pending) {
                                            LightModel.remove({ _id: { $nin: lightIds }, hostId: host._id }, function (err) {
                                                console.log("Extra lights removed!")
                                            })
                                            BleModel.remove({ _id: { $nin: bleIds }, hostId: host._id, isHost: false, isLAD: true }, function (err) {
                                                console.log("Extra bles removed!")
                                            })
                                        }
                                    })
                                }
                            })
    
                            lightSensorsToBle.remove({ hostId: host._id }, function (err) {
                                if (!err) {
                                    var sensorLightIds = [];
                                    var bleIds = [];
                                    var lightIds = [];
                                    var counter = 0;
                                    var pending = lightSensorConfig.length
                                    lightSensorConfig.forEach(function (liSensor) {
                                        LightSensorModel.findOneAndUpdate({ name: liSensor.name, floorId: floor._id, hostId: host._id }, { floorId: floor._id, hostId: host._id, name: liSensor.name, width: liSensor.width, height: liSensor.height, posX: liSensor.posx, posY: liSensor.posy, class: liSensor.class, rotate: liSensor.rotate, timeout: liSensor.timeout }, { upsert: true, new: true }, function (err, newLightsensor) {
                                            if (newLightsensor) {
                                                sensorLightIds.push(newLightsensor._id)
                                                var sensorLights = liSensor.lightBles
                                                if (liSensor.lightBles.length > 0) {
                                                    var pendingsensorLights = sensorLights.length
                                                    var sensorLightsCounter = 0;
                                                    var LightIdsensors = []
                                                    sensorLights.forEach(function (lightBle) {
                                                        BleModel.findOne({ address: lightBle.address, hostId: host._id, isLAD: true }, function (err, lightBleData) {
                                                            LightIdsensors.push(lightBleData._id)
                                                            // if(++sensorLightsCounter == pendingsensorLights){
                                                            BleModel.findOneAndUpdate({ floorId: floor._id, address: liSensor.ble.toUpperCase(), hostId: host._id }, { floorId: floor._id, hostId: host._id, address: liSensor.ble.toUpperCase(), isHost: false, isLAD: false, isCOS: true }, { upsert: true, new: true }, function (err, ble) {
                                                                if (ble) {
                                                                    bleIds.push(ble._id)
                                                                    lightSensorsToBle.findOneAndUpdate({ floorId: floor._id, lightSensorId: newLightsensor._id, bleId: ble._id, hostId: host._id }, { floorId: floor._id, lightBles: LightIdsensors, bleId: ble._id, hostId: host._id, status: false }, { upsert: true, new: true }, function (err, lightsensorble) {
                                                                        if (++counter == pending) {
                                                                            LightSensorModel.remove({ _id: { $nin: sensorLightIds }, hostId: host._id }, function (err) {
                                                                                console.log("Extra light sensors removed!")
                                                                            })
                                                                            BleModel.remove({ _id: { $nin: bleIds }, hostId: host._id, isHost: false, isCOS: true }, function (err) {
                                                                                console.log("Extra bles removed!")
                                                                            })
                                                                        }
                                                                    })
                                                                } else {
                                                                    console.log("No new ble")
                                                                }
                                                            })
                                                            // }
                                                        })
                                                    })
                                                } else {
                                                    console.log('no light bles')
                                                    BleModel.findOneAndUpdate({ floorId: floor._id, address: liSensor.ble.toUpperCase(), hostId: host._id }, { floorId: floor._id, hostId: host._id, address: liSensor.ble.toUpperCase(), isHost: false, isLAD: false, isCOS: true }, { upsert: true, new: true }, function (err, ble) {
                                                        if (ble) {
                                                            bleIds.push(ble._id)
                                                            lightSensorsToBle.findOneAndUpdate({ floorId: floor._id, lightSensorId: newLightsensor._id, bleId: ble._id, hostId: host._id }, { floorId: floor._id,  bleId: ble._id, hostId: host._id, status: false }, { upsert: true, new: true }, function (err, lightsensorble) {
                                                                if (++counter == pending) {
                                                                    LightSensorModel.remove({ _id: { $nin: sensorLightIds }, hostId: host._id }, function (err) {
                                                                        console.log("Extra light sensors removed!")
                                                                    })
                                                                    BleModel.remove({ _id: { $nin: bleIds }, hostId: host._id, isHost: false, isCOS: true }, function (err) {
                                                                        console.log("Extra bles removed!")
                                                                    })
                                                                }
                                                            })
                                                        } else {
                                                            console.log("No new ble")
                                                        }
                                                    })
                                                }
                                            } else {
                                                console.log("no new Light Snesor")
                                            }
                                        })
                                    })
                                }
                            })
    
                            // SceneToLight.remove({hostId:host._id},function(err){
                            //     if(!err){
                            //         var sceneIds = []
                            //         var lightIds = []
                            //         var sceneToLight =[]
                            //         var counter = 0
                            //         var pending = sceneConfig.length
                            //         sceneConfig.forEach(function(scene){
                            //             SceneModel.findOneAndUpdate({name:scene.name,floorId:floor._id,hostId:host._id},{floorId:floor._id,hostId:host._id,name:scene.name}, {upsert: true, new: true},function(err,newScene){
                            //             if(newScene){
                            //             sceneIds.push(newScene._id)
                            //             // Get Ids in ble model and push to an array
                            //             var sceneLightIds = []
                            //             var sceneLightCounter = 0
                            //             var sceneLightBles = scene.lightBles
                            //             i = 0
                            //             var sceneLightpending = sceneLightBles.length
                            //             sceneLightBles.forEach(function(lightBle){
                            //                 BleModel.findOne({address:lightBle.address.toUpperCase(),hostId:host._id},function(err,lightBleData){
                            //                     sceneLightIds.push(lightBleData.id)
                            //                     //If needed save in SceneModel the light Ids
                            //                     SceneToLight.findOneAndUpdate({sceneId:newScene._id,lightBle:lightBleData._id,hostId:host._id},{sceneId:newScene._id,lightId:lightBleData.id,lightIntensity:lightBle.intensity},{upsert:true,new:true},function(err,newSceneLight){
                            //                         sceneToLight.push(newSceneLight._id)
                            //                     })
                            //                     if(++sceneLightCounter == sceneLightpending){
                            //                         //Push Scene Ids here
                            //                         if(++counter == pending){
                            //                             SceneToLight.remove({_id:{$nin:sceneToLight},hostId:host._id},function(err){
                            //                                 console.log("extra scene light mappings removed")
                            //                             })
                            //                             SceneModel.remove({_id:{$nin:sceneIds},hostId:host._id},function(err){
                            //                                 console.log("Extra Scenes removed")
                            //                             })
                            //                         }
                            //                     } 
                            //                 })
                            //             })
                            //             } else{
                            //             console.log("no new scenes")
                            //             }
                            //             })
                            //         })
                            //     }
                            // })
                            res.send("Done")
                        })
                    })
                })
            })
            //callback(true)
        }
        if (sensorData) {
            addSensorData(function(floorId) {
                if (floorId) {
                    console.log("Updated sensor Data")
                }
                res.send("done");
            })
        } else if (bookingData) {
            addBookingData(function(floorId) {
                if (floorId) {
                    console.log("Updated Booking data")
                }
                res.send("done");
            })
        } else if (seatConfig) {
            addHostConfig(function(status) {
                if (status) {
                    console.log("Successfully Updated!")
                    res.send("Done");
                } else {
                    console.log("Failed to update")
                    res.send("Failed")
                }
            })
        } else if (lightConfig) {
            addLightHostConfig(function (status) {
                console.log(status)
                if (status) {
                    console.log("Successfully Updated Light Data!")
                    res.send("Done");
                }
                else {
                    console.log("Failed to update light data")
                    res.send("Failed")
                }
            })
        }else {
            res.send("No Valid Data")
        }
    })
module.exports = router;