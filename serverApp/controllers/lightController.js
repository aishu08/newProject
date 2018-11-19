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
var requestp = require('request-promise')
var request = require('request');
var groupArray = require('group-array');
var hostIP = '192.168.1.27';
var io = require('socket.io').listen(3043);
io.on('connection', function (socket) {
    console.log('a user connected');
    //   socket.emit('news', { hello: 'world' });
    //   socket.on('my other event', function (data) {
    //     console.log(data);
    //   });
    client = socket;
});

// TODO: Change port to 3000 on prod
var port = 8980;
exports.testcontroller = function (req, res, next) {
    var i = testfunction(req, res, next);
    i += "in controller 1st function";
    res.status(200).json({
        msg: i
    });
};

exports.getAllLights = function (req, res, next) {
    var data = req.params;
    var floorId = data.floorId;
    LightToBle.find({
        floorId: floorId
    }, ['floorId', 'lightId', 'bleId', 'lightIntensity', 'hostId', 'status'])
    .populate({
        path: 'floorId',
        select: 'name'
    }).populate({
        path: 'lightId'
    }).populate({
        path: 'bleId'
    }).populate({
        path: 'hostId'
    }).
        then(function (data) {
            // res.json({data})
            var temp = {}
            var lightsArray = []
            var pending = data.length;
            var counter = 0;
            data.forEach(function (light) {
                console.log(light)
                // console.log(light)
                temp = {};
                temp.address = light.bleId.address;
                temp.id = light.bleId.id;
                temp.status = light.status == false ? 0 : 1;
                temp.name = light.lightId.name;
                temp.wattage = light.lightId.wattage;
                light.maxlevel = light.lightId.maxlevel;
                temp.minlevel = light.lightId.minlevel;
                temp.rotate = light.lightId.rotate;
                temp.class = light.lightId.class;
                temp.lightPosX = light.lightId.posX;
                temp.lightPosY = light.lightId.posY;
                temp.width = light.lightId.width;
                temp.height = light.lightId.height;
                temp.intensity = light.lightIntensity;
                if (light.hostId) {
                    console.log(light.hostId.name)
                    temp.hostName = light.hostId.name;
                }
                else
                    temp.hostName = ''
                lightsArray.push(temp);
                if (++counter == pending) {
                    res.status(200).json({ msg: lightsArray });
                };
            });
        });
}


exports.getAllSOS = function (req, res, next) {
    data = req.params;
    var floorId = data.floorId
    lightSensorsToBle.find({
        floorId: floorId
    }, ['floorId', 'lightId', 'bleId', 'occupancy', 'hostId']).populate({
        path: 'floorId',
        select: 'name'
    }).populate({
        path: 'lightSensorId'
    }).populate({
        path: 'bleId'
    }).populate({
        path: 'hostId'
    }).then(function (data) {
        if (data == '') {
            res.status(500).json({ err: "no data" })
        } else {
            var temp = {}
            var sensorArray = []
            var pending = data.length;
            var counter = 0;
            data.forEach(function (sensor) {
                temp = {};
                temp.address = sensor.bleId.address;
                temp.id = sensor.bleId.id;
                temp.name = sensor.lightSensorId.name;
                temp.lightPosX = sensor.lightSensorId.posX;
                temp.lightPosY = sensor.lightSensorId.posY;
                temp.hostName = sensor.hostId.name;
                temp.occupancy = sensor.occupancy;
                sensorArray.push(temp);
                if (++counter == pending) {
                    res.status(200).json({ msg: sensorArray });
                };
            });
        }
    });
}
exports.getLightIntensity = function (req, res, next) {

    var postData = {
        ble: '8032',
        intensity: 30
    }
    var options = {
        method: 'POST',
        uri: 'http://192.168.1.27:8980/setLightIntensity',
        formData: postData,
        json: true
    };
    requestp(options)
        .then(function (parsedBody) {
            res.status(200).json({ msg: parsedBody.msg })
        })
        .catch(function (err) {
            res.status(500).json({ err: err.message })
        });

}
exports.setIntensity = function (req, res, next) {
    var data = req.body
    // var lightBle = data.address;
    var intensity = data.intensity;
    // var hostName = data.hostName;
    var lightData = data.lightDetail;
    hostId = lightData.hostId
    if(hostId){
        HostModel.findOne({
            _id:hostId 
        }, ['ip'], function (err, host) {
            if (err) {
                res.status(500).json({
                    err: err
                })
            } else {
                if (!host) {
                    res.status(500).json({
                        err: "Host not found."
                    })
                } else {
                    ip = host.ip
                    var postData = {
                        // ble: "8080",
                        name: lightData.name,
                        intensity: intensity
                    };
                    var options = {
                        method: 'POST',
                        uri: "http://" + ip + ":" + port + "/setLightIntensity",
                        formData: postData,
                        json: true
                    };
                    requestp(options)
                        .then(function (parsedBody) {
                            console.log("in options")
                            //Update the intensity of light in lightBle Here
                            res.status(200).json({ msg: parsedBody.msg })
                        })
                        .catch(function (err) {
                            res.status(500).json({ err: err.message })
                        });
                }
            }
        })
    }else{
        res.status(500).json({err:"Device not mapped to any host"})
    }

}

exports.createZone = function (req, res, next) {
    var data = req.body
    var name = data.name
    var floorId = data.floorId
    var hostId = data.hostId;
    console.log(hostId)
    var maxzone = 1;
    ZoneModel.findOne({ name: name, floorId: floorId, hostId: hostId }, function (err, zone) {
        if (!err) {
            if (zone) {
                res.status(500).json({ err: "Zone already exists" })
            } else {
                var floorIdObj = mongoose.Types.ObjectId(floorId)

                ZoneModel.aggregate([{ $match: { floorId: floorIdObj } }, { $group: { _id: "$floorId", maxZoneNumber: { $max: "$zoneId" }, count: { $sum: 1 } } }], function (err, data) {
                    if (data.length > 0) {
                        maxzone = data[0].maxZoneNumber + 1;

                    }
                    if (maxzone > 99) {
                        if (data[0].count >= 97) {
                            res.status(500).json({ err: "Zone limit for the floor reached." })
                        } else {
                            var saving = false;
                            ZoneModel.find({ floorId: floorId }).sort('zoneId').exec(function (err, allZones) {
                                var prevZone = -1;
                                var missingZone;
                                var i = 0;
                                var createZone = false;
                                for (i = 0; i < allZones.length; i++) {
                                    // Condition to overcome zoneID 10 and 13 problem where ble won't respond if the zoneId is 10 or 13
                                    // Remove if the issue is fixed. 
                                    if (allZones[i].zoneId == 10 || allZones[i].zoneId == 13) {
                                        prevZone++;
                                        continue;
                                    } else {
                                        currZone = allZones[i].zoneId;
                                        prevZone++
                                        if ((currZone - prevZone) > 0) {
                                            missingZone = prevZone;
                                            prevZone++
                                            createZone = true;
                                            break;
                                        }
                                    }

                                    console.log(allZones[i].zoneId)
                                }
                                if (createZone) {
                                    var zoneData = new ZoneModel({
                                        name: name,
                                        floorId: floorId,
                                        hostId: hostId,
                                        zoneId: missingZone
                                    });
                                    console.log(zoneData)
                                    zoneData.save(function (err, doc, num) {
                                        if (!err) {
                                            res.status(200).json({ msg: "Zone created", id: doc._id });
                                            return;
                                        } else {
                                            res.status(500).json({ err: "Something went wrong. Please try again later", errD: err })
                                            return;
                                        }
                                    })
                                }
                                else {
                                    res.status(500).json({ err: "Clear all zones for the floor and create again." })
                                }
                                // return;
                            })

                        }
                    } else {
                        // Condition to overcome zoneID 10 and 13 problem where ble won't respond if the zoneId is 10 or 13
                        // Remove if the issue is fixed. 
                        if (maxzone == 10 || maxzone == 13) {
                            maxzone += 1;
                        }
                        var zoneData = new ZoneModel({
                            name: name,
                            floorId: floorId,
                            hostId:hostId,
                            zoneId: maxzone
                        })
                        zoneData.save(function (err, doc, num) {
                            if (!err) {
                                res.status(200).json({ msg: "Zone created", id: doc._id });
                            } else {
                                res.status(500).json({ err: "Something went wrong. Please try again later", errD: err })
                            }
                        })
                    }
                });
            }
        } else {
            res.status(500).json({ err: "Something went wrong. Please try again later" })
        }
    });
}

exports.getZones = function (req, res, next) {
    var floorId = req.params.floorId;
    var hostId = req.params.hostId;
    console.log(hostId)
    ZoneModel.find({
        floorId: floorId,
        hostId: mongoose.Types.ObjectId(hostId)
    }).populate({
        path: 'scenes'
    }).populate({
        path: 'schedules'
    }).then(function (zones) {
        if (zones) {
            res.status(200).json({
                msg: zones
            })
        } else {
            res.status(500).json({
                err: "No zones found in the zone"
            })
        }

    });
}
exports.getZonesFloor = function (req, res, next) {
    var floorId = req.params.floorId;
    ZoneModel.find({
        floorId: floorId
    }).populate({
        path: 'scenes'
    }).populate({
        path: 'schedules'
    }).then(function (zones) {
        if (zones) {
            res.status(200).json({
                msg: zones
            })
        } else {
            res.status(500).json({
                err: "No zones found in the zone"
            })
        }

    });
}

exports.addLightToZone = function (req, res, next) {
    var data = req.body
    var zoneId = data.zoneId
    var lightData = data.lights
    // var hostId = data.hostId;
    var hostId = '';
    var lightBles = []
    ZoneModel.findById({ _id: zoneId }, function (err, zone) {
        if (err) {
            res.status(500).json({ err: err });
        }
        else {
            if (!zone) {
                res.status(500).json({ err: "Zone not found" });
            } else {
                var counter = 0;
                var pending = lightData.length;
                console.log(lightData)
                console.log(lightData.length)
                var lightbleArray = []
                var lightBles = []
                lightData.forEach(function (light) {
                    LightModel.findOne({ _id: light._id }).exec(function (err, ble) {
                        if(err){
                            res.status(500).json({err:"something went wrong finding address"})
                        }else{
                            lightBles.push(ble.id)
                            lightbleArray= _.uniq(lightBles)
                            var hostIp;
                            if (++counter == pending) {
                                ZoneModel.findByIdAndUpdate(zone.id, {
                                    lights: lightbleArray
                                    }, function (err, doc) {
                                        if (!err) {
                                            res.status(200).json({ msg: "Lights added successfully." })
                                        } else {
                                            console.log(err)
                                            res.status(500).json({ err: "something went wrong." })
                                        }
                                })
                            }
                        }
                    })
                })
            }

        }
    })
}

function getAllLightBles(lightId,callback){
    bles = [];
    LightToBle.find({lightId:lightId},function(err,data){
        count = 0;
        data.forEach(function(ble){
            bles.push((ble.bleId));
            if(++count == data.length){
                callback(err,bles);
            }
        })
    })
}

exports.deleteZone = function (req, res, next) {
    var data = req.body
    var zoneId = data.zoneId
    var bles = []
    // get all lights
    // send all lights with group number and remove
    // delete from db if success else dont delete
    ZoneModel.findById({ _id: zoneId }, ['name', 'lights', 'zoneId'])
        .populate({ path: 'lights', select: 'zoneId address', populate: { path: 'hostId', select: 'ip' } })
        .then(function (zones) {
            var zoneLights = zones.lights
            var zoneNumber = zones.zoneId
            var pending = zoneLights.length
            var counter = 0;
            if (zoneLights.length > 0) {
                zoneLights.forEach(function (zl) {
                    var temp = {}
                    console.log(zl)
                    temp.hostIp = zl.hostId.ip
                    temp.address = zl.address
                    temp.groupNumber = zoneNumber
                    bles.push(temp)
                    if (++counter == pending) {
                        var hostGroups = _.groupBy(bles, 'hostIp')
                        hostGroupsPending = _.size(hostGroups)
                        hostGroupsCounter = 0
                        lightZoneCounter = 0
                        console.log(hostGroups)
                        // res.status(200).json({msg:hostGroups})
                        _.forEach(hostGroups, function (hl) {
                            hostIp = hl[0].hostIp;
                            var postData = {
                                data: JSON.stringify(hl)
                            };
                            // TODO put this in a seperate callback function
                            var options = {
                                method: 'POST',
                                uri: "http://" + hostIp + ":" + port + "/removeHostLightsGroupAddress",
                                formData: postData,
                                json: true
                            };
                            // requestp(options).then(function (parsedBody) {
                            // console.log(parsedBody)
                            lightZoneCounter++
                            if (++hostGroupsCounter == hostGroupsPending) {
                                if (lightZoneCounter == hostGroupsPending) {
                                    // TODO: Remove zone Lights to DB
                                    // res.status(200).json({msg:parsedBody})
                                    ZoneModel.remove({
                                        _id: zoneId
                                    }, function (err, removed) {
                                        if (!err) {
                                            res.status(200).json({ msg: "Zone removed successfully" })
                                        } else {
                                            console.log(err)
                                            res.status(500).json({ err: "Something went wrong. Please try again later" })
                                        }
                                    })
                                } else {
                                    // TODO revert all the zone Groupings of all zones
                                    res.status(200).json({ msg: "something is wrong" })
                                }
                            }
                            // })
                            // .catch(function (err) {
                            //     // TODO: remove all other hosts Group
                            //     // error handling needs to checked
                            //     console.log(err)
                            //         res.status(500).json({ err: err.message })
                            //         return
                            // });
                        })
                    }
                })
            } else {
                console.log(zoneId)
                ZoneModel.remove({
                    _id: zoneId
                }, function (err, removed) {
                    if (!err) {
                        res.status(200).json({ msg: "Zone removed successfully" })
                    } else {
                        res.status(500).json({ err: err })
                    }
                })
            }
        })
        .catch(function (err) {
            res.status(500).json({ err: err.message })
        })
}

exports.toggleLights = function (req, res, next) {
    var data = req.body
    var lights = data.lights
    var intensity = data.intensity
    var zone = data.id
    var groupNumber
    var noOfLights;
    console.log(zone)
    var bles = []
    ZoneModel.findById({ _id: zone }, ['name', 'lights', 'zoneId'])
        .populate({ path: 'lights', select: 'zoneId address', populate: { path: 'hostId', select: 'ip' } })
        .then(function (zones) {
            // Send all lights zone IP and intensity to host
            var zoneLights = zones.lights
            var zoneNumber = zones.zoneId
            var pending = zoneLights.length
            var counter = 0;
            if (zoneLights.length > 0) {
                zoneLights.forEach(function (zl) {
                    var temp = {}
                    console.log(zl)
                    temp.hostIp = zl.hostId.ip
                    temp.address = zl.address
                    temp.intensity = intensity
                    temp.groupNumber = zoneNumber
                    bles.push(temp)
                    if (++counter == pending) {
                        var hostGroups = _.groupBy(bles, 'hostIp')
                        hostGroupsPending = _.size(hostGroups)
                        hostGroupsCounter = 0
                        lightZoneCounter = 0
                        _.forEach(hostGroups, function (hl) {
                            hostIp = hl[0].hostIp;
                            var postData = {
                                data: JSON.stringify(hl)
                            };
                            // TODO put this in a seperate callback function
                            var options = {
                                method: 'POST',
                                uri: "http://" + hostIp + ":" + port + "/toggleGroupLights",
                                formData: postData,
                                json: true
                            };
                            requestp(options).then(function (parsedBody) {
                                // console.log(parsedBody)
                                lightZoneCounter++
                                if (++hostGroupsCounter == hostGroupsPending) {
                                    if (lightZoneCounter == hostGroupsPending) {

                                        // TODO Update intensity of lights in DB
                                        res.status(200).json({ msg: "Intensity set successfully", response: parsedBody })
                                    } else {
                                        // TODO revert all the zone Groupings of all zones
                                        res.status(200).json({ msg: "something is wrong" })
                                    }
                                }
                            })
                                .catch(function (err) {
                                    // TODO: remove all other hosts Group
                                    // error handling needs to checked
                                    console.log(err)
                                    res.status(500).json({ err: err.message })
                                    return
                                });
                        })
                    }
                })
            } else {
                console.log(zoneId)
                res.satus(200).json({ msg: "No lights to control" })
            }
            // res.status(200).json({msg:zones})
        })
        .catch(function (err) {
            console.log(err.message)
            res.status(500).json({ err: err.message })
            return
        });
}

exports.addScene = function (req, res, next) {
    var data = req.body;
    var zoneId = data.zoneId;
    var floorId = data.floorId;
    var name = data.name;
    var sceneids = [];
    var maxScene = 1;
    ZoneModel.findOne({ _id: zoneId }, function (err, zone) {
        if (!err) {
            if (zone) {
                sceneIds = zone.scenes;
                SceneModel.find({ zoneId: zone.id }, function (err, scenes) {
                    if (err) {
                        res.status(500).json({ msg: "Something went wrong" });
                    } else {
                        found = _.find(scenes, { name: name });
                        if (found) {
                            res.status(500).json({ err: "Scene with same name already exists" });
                        } else {
                            maxSceneNumber = _.maxBy(scenes, 'sceneNumber');
                            if (!maxSceneNumber) {
                                maxSceneNumber = 0;
                            } else {
                                maxSceneNumber = maxSceneNumber.sceneNumber
                                console.log(maxSceneNumber)
                            }
                            if (maxSceneNumber == 5) {
                                if (scenes.length == 5) {
                                    res.status(500).json({ err: "Maximum number of scenes reached for the zone" });
                                } else {
                                    // res.status(500).json({msg:"create scenes by applying some logic"});
                                    SceneModel.find({ zoneId: zoneId }).sort('sceneNumber').exec(function (err, allScenes) {
                                        if (!err) {
                                            var prevScene = -1;
                                            var missingScene;
                                            var createScene = false;
                                            for (i = 0; i < allScenes.length; i++) {
                                                currScene = allScenes[i].sceneNumber;
                                                prevScene++
                                                if ((currScene - prevScene) > 0) {
                                                    missingScene = prevScene;
                                                    missingScene++
                                                    createScene = true;
                                                    break;
                                                }
                                            }
                                            if (createScene) {
                                                var sceneData = new SceneModel({
                                                    name: name,
                                                    zoneId: zoneId,
                                                    floorId: floorId,
                                                    sceneNumber: missingScene
                                                });
                                                sceneData.save(function (err, doc) {
                                                    if (!err) {
                                                        sceneIds.push(doc._id);
                                                        ZoneModel.findByIdAndUpdate(zone.id, {
                                                            scenes: sceneIds
                                                        }, function (err, z) {
                                                            if (!err) {
                                                                res.status(200).json({ msg: "scene created successfully", id: doc._id,scene:doc });
                                                            } else {
                                                                res.status(500).json({ errmsg: err, err: "Something went wrong. Please try again later" });
                                                                SceneModel.remove({ _id: doc._id }, function (err, removed) {
                                                                    res.status(500).json({ msg: "Scene not added. Please try again." });
                                                                });
                                                            }
                                                        });
                                                    } else {
                                                        res.status(500).json({ errmsg1: err, err: "something went wrong. Please try again later" });
                                                    }
                                                });
                                            }
                                            else {
                                                res.status(500).json({ err: "Clear all zones for the floor and create again." })
                                            }
                                        }
                                        else {
                                            res.status(500).json({ err: err.message })
                                        }
                                    })
                                }
                            } else {
                                var currSceneNumber = maxSceneNumber + 1
                                var sceneData = new SceneModel({
                                    name: name,
                                    zoneId: zoneId,
                                    floorId: floorId,
                                    sceneNumber: currSceneNumber
                                });
                                sceneData.save(function (err, doc) {
                                    if (!err) {
                                        sceneIds.push(doc._id);
                                        ZoneModel.findByIdAndUpdate(zone.id, {
                                            scenes: sceneIds
                                        }, function (err, z) {
                                            if (!err) {
                                                res.status(200).json({ msg: "scene created successfully", id: doc._id });
                                            } else {
                                                res.status(500).json({ errmsg: err, err: "Something went wrong. Please try again later" });
                                                SceneModel.remove({ _id: doc._id }, function (err, removed) {
                                                    console.log('not added');
                                                    res.status(500).json({ msg: "Scene not added. Please try again." });
                                                });
                                            }
                                        });
                                    } else {
                                        res.status(500).json({ errmsg1: err, err: "something went wrong. Please try again later" });
                                    }
                                });
                            }
                        }
                    }
                });
            } else {
                res.status(500).json({ err: "Zone does not exist." });
            }
        } else {
            res.status(500).json({ err: "Something went wrong. Please try again later" });
        }
    });
};


exports.deleteScene = function (req, res, next) {
    var data = req.body
    var sceneId = data.sceneId
    var zoneId;
    SceneToLight.remove({ sceneId: sceneId })
        .then(function (result) {
            if(result){
                ZoneModel.update({
                    _id: zoneId
                }, {
                        $pullAll: {
                            scenes: [sceneId]
                        }
                    }, function (err, update) {
                        console.log("removed scene from zone")
                        if (!err) {
                            SceneModel.remove({
                                _id: sceneId
                            }, function (err, rem) {
                                if (!err) {
                                    res.status(200).json({ msg: "Scene removed successfully" })
                                }
                                else {
                                    res.status(200).json({ msg: "Scene removed successfully from zone." })
                                }
                            })
                        }
                        else {
                            res.status(500).json({ msg: "Scene could not be removed." })
                        }
                    })
            }
            else {
                ZoneModel.update({
                    _id: zoneId
                }, {
                        $pullAll: {
                            scenes: [sceneId]
                        }
                    }, function (err, update) {
                        console.log("removed scene from zone")
                        if (!err) {
                            SceneModel.remove({
                                _id: sceneId
                            }, function (err, rem) {
                                if (!err) {
                                    res.status(200).json({ msg: "Scene removed successfully" })
                                }
                                else {
                                    res.status(200).json({ msg: "Scene removed successfully from zone." })
                                }
                            })
                        }
                        else {
                            res.status(500).json({ msg: "Scene could not be removed." })
                        }
                    })
            }
        }).catch(function (err) {
            res.status(500).json({ err: err.message })
            return
        });
}

exports.applyScene = function (req, res, next) {
    var data = req.params
    var sceneId = data.sceneId
    SceneToLight.find({ sceneId: sceneId }).populate({ path: 'lightBle', populate: { path: 'hostId' } }).populate({ path: 'sceneId', populate: { path: 'zoneId' } })
        .then(function (lights) {
            if (lights.length > 0) {
                // res.status(200).json({msg:lights})
                var lightBles = []
                var pending = lights.length
                var counter = 0
                lights.forEach(function (light) {
                    var temp = {}
                    temp.address = light.lightBle.address
                    temp.hostIp = light.lightBle.hostId.ip
                    temp.intensity = light.lightIntensity
                    temp.sceneNumber = light.sceneId.sceneNumber
                    temp.zoneId = light.sceneId.zoneId.zoneId
                    lightBles.push(temp)
                    if (++counter == pending) {
                        var hostGroups = _.groupBy(lightBles, 'hostIp')
                        hostGroupsPending = _.size(hostGroups)
                        hostGroupsCounter = 0
                        lightSceneCounter = 0
                        _.forEach(hostGroups, function (hl) {
                            hostIp = hl[0].hostIp;
                            var postData = {
                                data: JSON.stringify(hl)
                            };
                            console.log(postData)
                            // TODO put this in a seperate callback function
                            var options = {
                                method: 'POST',
                                uri: "http://" + hostIp + ":" + port + "/applySceneNumber",
                                formData: postData,
                                json: true
                            };
                            requestp(options).then(function (parsedBody) {
                                // console.log(parsedBody)
                                lightSceneCounter++
                                if (++hostGroupsCounter == hostGroupsPending) {

                                    if (lightSceneCounter == hostGroupsPending) {
                                        res.status(200).json({ msg: "Scene applied successfully" })
                                    } else {
                                        res.status(500).json({ err: "Scene could not be applied successfully. Please try again" })

                                    }
                                }
                            })
                                .catch(function (err) {
                                    // TODO: remove all other hosts Group
                                    // error handling needs to checked
                                    console.log(err)
                                    res.status(500).json({ err: err.message })
                                    return
                                });
                        })
                    }
                })
            } else {
                res.status(500).json({ msg: "No lights in the scene" })
            }
        }).catch(function (err) {
            res.status(500).json({ err: err.message })
            return
        });
}



exports.addLightsToScene = function (req, res, next) {
    var data = req.body
    var sceneId = data.sceneId
    var lightsData = data.lights
    // console.log(data.lights)
    // var lightsData = JSON.parse(data.lights);
    var sceneNumber = 0
    var checkCondition = false
    if (lightsData == null) {
        res.status(500).json({ err: "No changes in scene detected" })
        return
    }
    SceneModel.findOne({ _id: sceneId }).populate({ path: 'zoneId', select: 'zoneId' }).then(function (scene) {
        if (scene) {
            zoneNumber = scene.zoneId.zoneId
            sceneNumber = scene.sceneNumber
            SceneToLight.find({ sceneId: sceneId }).populate({ path: 'lights', populate: { path: 'hostId' } }).then(function (lights) {
                if (lights.length > 0) {
                    // res.json(lights)
                    var c = lights.length;
                    // console.log(lights);
                    
                    var pe = 0
                    var lightsD = []
                    lights.forEach(function (li) {
                        var temp1 = {}
                        temp1.lightId = li.lightId.toString()
                        temp1.lightIntensity = li.lightIntensity
                        lightsD.push(temp1)
                        if (++pe == c) {
                            if (lightsData.length) {
                                addlightsToscene(lightsData, sceneId, zoneNumber, sceneNumber);
                            }
                            else {
                                removeLights = removeAllLightsScene(lights, sceneId, zoneNumber, sceneNumber, function (removeLights) {
                                    if (removeLights) {
                                        res.status(200).json({ msg: "Lights removed from scene" })
                                    } else {
                                        res.status(500).json({ err: "something went wrong. Please try again later" })
                                    }
                                })
                            }
                        }
                    })

                } else {
                    console.log(lightsData)
                    addlightsToscene(lightsData, sceneId, zoneNumber, sceneNumber);

                }
            })
                .catch(function (err) {
                    res.status(500).json({ err: err.message })
                    return
                });
        }
        else {
            res.status(500).json({ err: "scene not found" })
        }
    }).catch(function (err) {
        res.status(500).json({ err: err.message })
        return
    });


    function addlightsToscene(lightsData, sceneId, zoneNumber, sceneNumber) {
        if (lightsData.length) {
            console.log(lightsData)
            var pending = lightsData.length
            var counter = 0;
            var bles = []
            var lightBles = []
            var sceneLights = []
            SceneToLight.remove({ sceneId: sceneId }, function (err, removed) {
                lightsData.forEach(function (light) {
                    LightModel.findOne({ _id: light.lightId }).exec(function (err, ble) {
                        var temp = {}
                        var tempScenes = {}
                        // tempScenes.hostId = ble.hostId._id
                        tempScenes.lightIntensity = light.lightIntensity
                        tempScenes.sceneId = sceneId
                        tempScenes.lightId = ble._id
                        sceneLights.push(tempScenes)
                        // temp.hostIp = ble.hostId.ip
                        temp.address = light.address
                        temp.intensity = light.lightIntensity
                        temp.groupNumber = zoneNumber
                        temp.sceneNumber = sceneNumber
                        bles.push(temp)
                        lightBles.push(ble.id)
                        var hostIp;
                        if (++counter == pending) {
                            var hostGroups = _.groupBy(bles, 'hostIp')
                            hostGroupsPending = _.size(hostGroups)
                            hostGroupsCounter = 0
                            lightSceneCounter = 0
                            SceneToLight.insertMany(sceneLights).then(function (docs) {
                                console.log(docs)
                                res.status(200).json({ msg: "Lights mapped to scene successfully" })
                            })
                            .catch(function (err) {
                                console.log(err.message)
                                res.status(500).json({ err: json })
                            });
                        }
    
                    })
                })
            })
        } else {
            res.status(500).json({ msg: "No lights added" })
        }
    }
    


}


function removeAllLightsScene(Scenelights, sceneId, zoneNumber, sceneNumber, callback) {
    // console.log("in removeAllLightsScene")
    console.log(Scenelights)

    SceneToLight.find({ sceneId: sceneId }).populate({ path: 'lightId', populate: { path: 'hostId' } }).populate({ path: 'sceneId', populate: { path: 'zoneId' } })
        .then(function (lights) {
            var lightBles = []
            var pending = lights.length
            var counter = 0
            lights.forEach(function (light) {
                zoneId = light.sceneId.zoneId._id
                var temp = {}
                temp.address = light.lightId
                temp.sceneNumber = light.sceneId.sceneNumber
                temp.zoneId = light.sceneId.zoneId.zoneId
                lightBles.push(temp)
                if (++counter == pending) {
                    var hostGroups = _.groupBy(lightBles, 'hostIp')
                    hostGroupsPending = _.size(hostGroups)
                    hostGroupsCounter = 0
                    lightSceneCounter = 0
                    _.forEach(hostGroups, function (hl) {
                        hostIp = hl[0].hostIp;
                        var postData = {
                            data: JSON.stringify(hl)
                        };
                        console.log(postData)
                        lightSceneCounter++
                        if (++hostGroupsCounter == hostGroupsPending) {

                            if (lightSceneCounter == hostGroupsPending) {
                                SceneToLight.remove({ sceneId: sceneId }, function (err, removed) {
                                    if (!err) {
                                        console.log('return true')
                                        callback(true)
                                    } else {
                                        console.log(err)
                                        callback(false)
                                    }
                                })
                            } else {
                                console.log('here')
                                callback(false)

                            }
                        }
                        // })
                        // .catch(function (err) {
                        //     console.log(err)
                        //     callback(false)
                        // });
                    })
                }
            })

        })
        .catch(function (err) {
            console.log(err)
            res.status(500).json({ err: err.message })
            return
        });
}
exports.addLightsToSceneOld = function (req, res, next) {
    var data = req.body
    var sceneId = data.sceneId
    var lightsData = data.lights
    var pending = lightsData.length
    var counter = 0
    SceneToLight.remove({
        sceneId: sceneId
    }, function (err, removed) {
        if (err) {
            res.status(500).json({
                err: err
            })
        }
        lightsData.forEach(function (light) {
            SceneToLight.findOneAndUpdate({
                sceneId: sceneId,
                lightBle: light.lightId
            }, {
                    sceneId: sceneId,
                    lightBle: light.lightId,
                    lightIntensity: light.lightIntensity
                }, {
                    upsert: true,
                    new: true
                }, function (err, doc) {
                    if (!err) {
                        console.log("lights pushed")
                        if (++counter == pending) {
                            res.status(200).json({
                                msg: "Pushed lights and created scene"
                            })
                        }
                    } else {
                        res.status(500).json({
                            err: err
                        })
                    }
                })
        })
    })
}

exports.addSceneOld = function (req, res, next) {
    var data = req.body
    var zoneId = data.zoneId
    var floorId = data.floorId
    var name = data.name
    ZoneModel.findOne({
        _id: zoneId
    }, function (err, zone) {
        if (!err) {
            if (zone) {
                sceneIds = zone.scenes

                SceneModel.findOne({
                    name: name,
                    zoneId: zoneId
                }, function (err, scene) {
                    if (!err) {
                        // console.log(scene)
                        if (scene) {
                            res.status(500).json({ err: "scene with same name already exists in the same zone" })
                        } else {
                            var sceneData = new SceneModel({
                                name: name,
                                zoneId: zoneId,
                                floorId: floorId
                            })
                            sceneData.save(function (err, doc, num) {
                                if (!err) {
                                    sceneIds.push(doc._id)
                                    ZoneModel.findByIdAndUpdate(zone.id, {
                                        scenes: sceneIds
                                    }, function (err, z) {
                                        if (!err) {
                                            res.status(200).json({
                                                msg: "scene created successfully",
                                                id: doc._id
                                            })
                                        } else {
                                            res.status(500).json({
                                                err: "Something went wrong. Please try again later"
                                            })
                                            SceneModel.remove({
                                                _id: doc._id
                                            }, function (err, removed) {
                                                console.log('not added')
                                                res.status(500).json({ msg: "Scene not added. Please try again." })
                                            })
                                        }
                                    })

                                } else {
                                    res.status(500).json({ err: "something went wrong. Please try again later" })
                                }
                            })
                        }
                    }
                })
            }
        }
    })
}

exports.createScene = function (req, res, next) {
    var data = req.body
    var sceneName = data.sceneName
    var zoneId = data.zoneId
    var lightsData = JSON.parse(data.lights)
    var floorId = data.floorId
    FloorModel.findOne({
        name: floorid
    }, function (err, floor) {
        if (!err) {
            if (floor) {
                ZoneModel.findOne({ name: zoneId, floorId: floor.id }, function (err, zone) {
                    if (!err) {
                        if (zone) {
                            zoneid = zone.id
                            sceneIds = zone.scenes
                            SceneModel.findOneAndUpdate({ name: sceneName, zoneId: zone.id, floorId: floor.id }, { name: sceneName, zoneId: zone.id, floorId: floor.id },
                                { upsert: true, new: true }, function (err, scene) {
                                    //Push scenes to zones
                                    if (sceneIds.indexOf(scene.id) >= 0) {
                                        res.status(500).json({ msg: "scene with the same name already exists" })
                                    } else {
                                        sceneIds.push(scene.id)
                                        ZoneModel.findByIdAndUpdate(zone.id, { scenes: sceneIds }, function (err, doc) {
                                            if (!err) {
                                                // console.log(lightsData)
                                                pending = lightsData.length
                                                counter = 0
                                                var lightBles = []
                                                lightsData.forEach(function (light) {
                                                    BleModel.findOne({
                                                        address: light.ble
                                                    }, function (err, ble) {
                                                        lightBles.push(ble.id)
                                                        SceneToLight.findOneAndUpdate({
                                                            sceneId: scene.id,
                                                            lightBle: ble.id
                                                        }, {
                                                                sceneId: scene.id,
                                                                lightBle: ble.id,
                                                                lightIntensity: light.intensity
                                                            }, {
                                                                upsert: true,
                                                                new: true
                                                            }, function (err, doc) {
                                                                if (!err) {
                                                                    console.log("lights pushed")
                                                                    if (++counter == pending) {
                                                                        res.status(200).json({
                                                                            msg: "Pushed lights and created scene"
                                                                        })
                                                                    }

                                                                } else {
                                                                    res.status(500).json({
                                                                        msg: "something went wrong."
                                                                    })
                                                                }
                                                            })
                                                    })
                                                })
                                            } else {
                                                console.log("something went wrong. Please try again")
                                                res.status(200).json({
                                                    msg: "zone found with id: " + zone.id
                                                })
                                            }
                                        })
                                    }
                                })
                        } else {
                            res.status(500).json({
                                msg: "Zone not found"
                            })
                        }
                    } else {
                        console.log(err)
                        res.status(500).json({
                            err: "something went wrong. Please try again later"
                        })
                    }
                })
            } else {
                res.status(500).json({
                    err: "Floor not found"
                })
            }
        } else {
            res.status(500).json({
                msg: "something went wrong.Please try again later"
            })
        }
    })
}

exports.getallLightsZoneFloor = function (req, res, next) {
    var data = req.params
    var floorId = data.floorId
    var zoneId = data.zoneId
    console.log(floorId)
    console.log(zoneId)
    ZoneModel.find({ floorId: floorId, _id: zoneId }, ['name', 'floorId', 'scenes', 'lights']).populate({ path: 'floorId', select: 'name' })
        .populate({ path: 'scenes', select: 'name' }).populate({ path: 'schedules', select: 'name' }).populate({ path: 'lights', select: 'address' })
        .then(function (zones) {
            if (zones) {
                var zoneCounter = 0
                var zonePending = zones.length
                var zoneData = []
                var temp = {}
                zones.forEach(function (zone) {
                    temp.name = zone.name
                    temp.scenes = {}
                    //Push scenes light data here to zonedata 
                    zoneData.push(temp)
                    if (++zoneCounter == zonePending) {
                        res.status(200).json({
                            msg: zone
                        })
                    }
                })

            } else {
                res.status(500).json({
                    err: "no zone"
                })
            }
        }) .catch(function (err) {
            console.log(err)
            res.status(500).json({ err: err.message })
        });
}

exports.getLightsScene = function (req, res, next) {
    var data = req.body
    var sceneId = data.sceneId
    SceneToLight.find({
        sceneId: sceneId
    }).
    then(function (lights) {
        console.log(lights)
        if (lights.length > 0) {
            var temp = {}
            var lightData = []
            var pending = lights.length
            var counter = 0
            lights.forEach(function (light) {

                // console.log(light)
                temp = {}
                // temp.address = light.lightBle.address
                temp.lightId = light.lightId
                temp.lightIntensity = light.lightIntensity
                lightData.push(temp)
                if (++counter == pending) {
                    res.status(200).json({
                        msg: lightData
                    })
                }
            })
        } else {
            res.status(500).json({
                err: "no lights found"
            })
        }
    })
}


exports.toggleAllFloorLights = function (req, res, next) {
    var data = req.body
    var floorId = data.floorId
    var intensity = data.intensity
    // Get all lights of the floor and set it to intensity
    res.status(200).json({ msg: "Implement the function" })
}


exports.toggleLightsOld = function (req, res, next) {
    var data = req.body
    var lights = data.lights
    var intensity = data.intensity
    var pending = data.lights.length
    var counter = 0
    var addresses = []
    var temp = {}
    lights.forEach(function (li) {
        temp = {}
        address = li.address
        bleId = li.id
        temp.ble = address
        addresses.push(temp)

        if (++counter == pending) {

            var postData = {
                addresses: addresses,
                intensity: intensity
            };
            request({
                url: "http://" + hostIP + ":" + port + "/setLightIntensityLights",
                method: 'POST',
                form: {
                    data: JSON.stringify(postData)
                }
            }, function (err, result, body) {
                if (result.statusCode == 200) {
                    //update intensity of light here in audit table
                } else {
                    // res.status(500).json({err:JSON.parse(body).err})
                }
            })
            res.status(200).json({
                msg: addresses
            })
        }
    })

}

exports.toggleCustomLights = function (req, res, next) {
    var data = req.body
    var lights = data.lights
    var intensity = data.intensity
    var pending = lights.length
    var counter = 0
    var addresses = []
    var temp = {}
    lights.forEach(function (li) {
        lightId = li
        // console.log(li)
        BleModel.findById({
            _id: li
        }, function (err, ligh) {
            if (err) {
                res.status(500).json({
                    err: "something went wrong"
                })
            } else {
                temp.ble = ligh.address
                addresses.push(temp)
                if (++counter == pending) {
                    var postData = {
                        addresses: addresses,
                        intensity: intensity
                    };
                    request({
                        url: "http://" + hostIP + ":" + port + "/setLightIntensityLights",
                        method: 'POST',
                        form: {
                            data: JSON.stringify(postData)
                        }
                    }, function (err, result, body) {
                        if (result.statusCode == 200) {
                            //update intensity of light here in audit table
                        } else {
                            // res.status(500).json({err:JSON.parse(body).err})
                        }
                    })
                    res.status(200).json({
                        msg: data
                    })
                }
            }

        })
    })
}
function checkForDuplicateSchedule(startSeconds, endSeconds, days, lightsData, isUpdate, callback) {
    console.log("checking for duplicate")
    var lights = []
    var schedules = []
    lightsData.forEach(function (li) {
        lights.push(li.lightId)
    })
    console.log(lights)
    if (!isUpdate) {
        // no scheduleId to exclude

    } else {
        // thereis a schedule Id to exclude
    }
    // develop to check individual lights. Think through the cases and decide on tradeoff
    ScheduleToLight.find({ lightBle: { $in: lights } }, function (err, scheds) {
        console.log(scheds)
        if (scheds.length) {
            scheds.forEach(function (sch) {
                schedules.push(sch._id)
            })
            console.log(schedules)
            ScheduleModel.find({
                $and: [
                    // {_id:{$in:schedules}},
                    { days: { $in: days } },
                    { $or: [{ sartTime: { $gte: startSeconds, $lte: endSeconds } }, { endTime: { $gte: startSeconds, $lte: endSeconds } }, { $and: [{ startTime: { $lte: startSeconds } }, { endTime: { $gte: endSeconds } }] }] }]
            }, function (err, dupsched) {
                console.log(dupsched)
                callback(true)
            })
            console.log('check for schedules in the same time and days')

        } else {
            console.log("no lights have schedules already. return true")
            callback(true)
        }
    })
}

exports.createSchedule = function (req, res, next) {
    var data = req.body
    // console.log(data)
    var scheduleName = data.schedule.name
    var zoneId = data.zoneId
    var stime = data.schedule.sTime
    var etime = data.schedule.eTime
    var days = data.schedule.days
    var lightsData = data.schedule.lights
    console.log(lightsData)
    // console.log("printing lights data")
    // console.log(lightsData)
    var d = new Date()
    var date = d.getDate()
    var month = d.getMonth() + 1
    var year = d.getFullYear()

    // converting start time and endtime into seconds
    var midnight = new Date(month + '/' + date + '/' + year + ' 00:00:00')
    var startDate = new Date(month + '/' + date + '/' + year + ' ' + stime + ':00')
    var endDate = new Date(month + '/' + date + '/' + year + ' ' + etime + ':00')
    var startSeconds = (startDate - midnight) / 1000
    var endSeconds = (endDate - midnight) / 1000
    var isUpdate
    if (data.update) {
        isUpdate = true
    }
    if (!lightsData) {
        // TODO Ask if case needs to be handled
        // Case in question: if no lights are edited but time and days are changed etc.,
        res.status(500).json({ err: "no lights edited" })
        return
    }
    if (!lightsData.length) {
        console.log('a')
        res.status(500).json({ err: "Please add some lights to update schedule" })
        return
    }
    //Condition for checking schedule exists for light to be put
    ZoneModel.findById({
        _id: zoneId
    }, function (err, zone) {
        if (!err) {
            if (zone) {
                zoneid = zone.id
                scheduleIds = zone.schedules

                checkForDuplicateSchedule(startSeconds, endSeconds, days, lightsData, isUpdate, function (noDuplicate) {
                    console.log(noDuplicate)
                    if (noDuplicate) {
                        ScheduleModel.findOneAndUpdate({
                            name: scheduleName,
                            zoneId: zone.id
                        }, {
                                name: scheduleName,
                                zoneId: zone.id,
                                floorId: zone.floorId,
                                days: days,
                                startTime: startSeconds,
                                endTime: endSeconds
                            }, {
                                upsert: true,
                                new: true
                            }, function (err, schedule) {
                                //Push schedule to zones
                                // console.log(schedule)
                                if (err) {
                                    res.status(500).json({
                                        err: err
                                    })
                                }
                                if (scheduleIds.indexOf(schedule._id) >= 0) {
                                    if (!isUpdate) {
                                        res.status(500).json({
                                            err: "schedule with the same name already exists"
                                        })
                                        //check if there is a schedule between the time given for the zone, if yes check if its for the same lights if yes, return error
                                    } else {

                                        scheduleIds.push(schedule.id)
                                        ZoneModel.findById(zone.id, function (err, doc) {
                                            if (!err) {
                                                pending = lightsData.length
                                                counter = 0
                                                var lightBles = []
                                                lightsData.forEach(function (light) {
                                                    if (!light.lightIntensity) {
                                                        light.lightIntensity = 0
                                                    }
                                                    LightModel.findById({ _id: light.lightId }, function (err, ble) {
                                                        if (!err) {
                                                            console.log(ble)
                                                            lightBles.push(ble._id)
                                                            // if(++counter == pending){
                                                            ScheduleToLight.remove({
                                                                scheduleId: schedule.id
                                                            }, function (err, removed) {
                                                                if (!err) {
                                                                    
                                                                        ScheduleToLight.findOneAndUpdate({
                                                                            scheduleId: schedule.id,
                                                                            lightId: ble._id
                                                                        }, {
                                                                                scheduleId: schedule.id,
                                                                                lightId: ble._id,
                                                                                lightIntensity: light.lightIntensity
                                                                            }, {
                                                                                upsert: true,
                                                                                new: true
                                                                            }, function (err, doc) {
                                                                                if (!err) {
                                                                                    console.log("lights pushed")
                                                                                    if (++counter == pending) {
                                                                                    res.status(200).json({
                                                                                        msg: "Pushed lights and created schedule successfully"
                                                                                    })
                                                                                }
                                                                                } else {
                                                                                    res.status(500).json({ err: err })
                                                                                }
                                                                            })
                                                                 
                                                                } else {
                                                                    res.status(500).json({ err: err.message })
                                                                }
                                                            })
                                                        } else {
                                                            res.status(500).json({ err: err })
                                                        }

                                                    })
                                                })
                                            } else {
                                                console.log("Something went wrong. Please try again")
                                                res.status(200).json({ err: err })
                                            }
                                        })
                                    }

                                } else {
                                    scheduleIds.push(schedule.id)
                                    ZoneModel.findByIdAndUpdate(zone.id, {
                                        schedules: scheduleIds
                                    }, function (err, doc) {
                                        if (!err) {
                                            pending = lightsData.length
                                            counter = 0
                                            var lightBles = []

                                            lightsData.forEach(function (light) {
                                                LightModel.findById({
                                                    _id: light.lightId
                                                }, function (err, ble) {
                                                    lightBles.push(ble._id)
                                                    // if(++counter == pending){
                                                    ScheduleToLight.findOneAndUpdate({
                                                        scheduleId: schedule.id,
                                                        lightId: ble._id
                                                    }, {
                                                            scheduleId: schedule.id,
                                                            lightId: ble._id,
                                                            lightIntensity: light.dimLevel
                                                        }, {
                                                            upsert: true,
                                                            new: true
                                                        }, function (err, doc) {
                                                            if (!err) {
                                                                console.log("lights pushed")
                                                                if (++counter == pending) {
                                                                    res.status(200).json({ msg: "Pushed lights and created schedule successfully" })
                                                                }

                                                            } else {
                                                                res.status(500).json({ err: err })
                                                            }
                                                        })

                                                })
                                            })
                                        } else {
                                            console.log("Something went wrong. Please try again")
                                            res.status(200).json({ err: err })
                                        }
                                    })
                                }
                            })
                    } else {
                        res.status(500).json({ err: "Some of the lights have schedule at the same time. Please remove them and try again." })
                    }
                })
            } else {
                res.status(500).json({ err: "Zone not found. Please try again later." })
            }
        } else {
            res.status(500).json({ err: err })
        }
    })
}

exports.checkLightInSchedule = function (req, res, next) {
    var data = req.body
    var scheduleName = data.schedule.name
    var zoneId = data.zoneId
    var stime = data.schedule.sTime
    var etime = data.schedule.eTime
    var days = data.schedule.days
    // console.log(days)
    var lightsData = data.schedule.lights
    var d = new Date()
    var date = d.getDate()
    var month = d.getMonth() + 1
    var year = d.getFullYear()
    // console.log(data)
    // convert start time and endtime into numbers and save save
    var midnight = new Date(month + '/' + date + '/' + year + ' 00:00:00')
    var startDate = new Date(month + '/' + date + '/' + year + ' ' + stime + ':00')
    var endDate = new Date(month + '/' + date + '/' + year + ' ' + etime + ':00')
    var startSeconds = (startDate - midnight) / 1000
    var endSeconds = (endDate - midnight) / 1000
    // for all the lights in the request, loop through, with lightId for scheduletolight model
    // console.log(startSeconds)
    // console.log(endSeconds)
    pending = lightsData.length
    counter = 0
    var lightBles = []
    lightsData.forEach(function (light) {
        var schedExists = 0
        ScheduleToLight.find({
            lightBle: light.lightId
        })
            // .populate({
            //     path: "scheduleId",
            //     match: {
            //         // days: {
            //         //     $in: days
            //         // },
            //         $or: [{
            //             startTime: {
            //                 $gte: startSeconds,
            //                 $lte: endSeconds
            //             }
            //         }, {
            //             endTime: {
            //                 $gte: startSeconds,
            //                 $lte: endSeconds
            //             }
            //         }]
            //     }
            // })
            .populate({
                path: "scheduleId",
                match: {
                    days: {
                        $elemMatch: {
                            $in: days
                        }
                    }
                }
            })
            .then(function (lightsSchedules) {
                // console.log(lightsSchedules)

                lightsSchedules.forEach(function (li) {
                    // console.log(li.scheduleId)
                    if (li.scheduleId) {
                        schedExists++
                    }
                })
                if (++counter == pending) {
                    res.status(200).json({
                        msg: schedExists
                    })
                }
            }, function (err) {
                res.status(500).json({
                    err: err
                })
            })
    })

}

exports.getLightsSchedule = function (req, res, next) {
    var data = req.body
    var scheduleId = data.scheduleId
    ScheduleToLight.find({
        scheduleId: scheduleId
    }).then(function (lights) {
        if (lights.length > 0) {
            var temp = {}
            var lightData = []
            var pending = lights.length
            var counter = 0
            lights.forEach(function (light) {

                console.log(light)
                temp = {}
                temp.lightId = light.lightId
                temp.lightIntensity = light.lightIntensity
                lightData.push(temp)
                if (++counter == pending) {
                    res.status(200).json({
                        msg: lightData
                    })
                }
            })
        } else {
            res.status(500).json({
                err: "no lights found"
            })
        }
    })
}

exports.deleteSchedule = function (req, res, next) {
    var data = req.body
    var schedueleId = data.schedueleId
    var zoneId = data.zoneId
    ZoneModel.update({
        _id: zoneId
    }, {
            $pullAll: {
                schedules: [schedueleId]
            }
        }, function (err, update) {
            if (!err) {
                ScheduleModel.remove({
                    _id: schedueleId
                }, function (err, rem) {
                    if (!err) {
                        ScheduleToLight.remove({
                            schedueleId: schedueleId
                        }, function (err, removed) {
                            if (!err) {
                                res.status(200).json({
                                    msg: "Successfully removed scene"
                                })
                            } else {
                                res.status(500).json({
                                    msg: "Scene removed. Something went wrong while removing lights"
                                })
                            }
                        })
                    } else {
                        res.status(200).json({
                            msg: "Scene removed from zone. Something went wrong"
                        })
                    }
                })
            } else {
                res.status(500).json({
                    msg: "Something went wrong. Please try again later"
                })
            }
        })
}

exports.applySchedules = function (req, res, next) {
    // console.log(|'here')
    data = req.body
    schedules = JSON.parse(data.schedules)
    // console.log(schedules[])
    schedules.forEach(function (sch) {
        // console.log(sch)
        ScheduleToLight.find({
            scheduleId: sch.scheduleId
        }).populate({
            path: 'lightBle',
            select: 'address',
            populate: {
                path: 'hostId'
            }
        }).then(function (lights) {
            if (lights.length > 0) {
                var temp = {}
                var lightData = []
                var pending = lights.length
                var counter = 0
                lights.forEach(function (light) {
                    // console.log(light)
                    temp = {}
                    hostIp = light.lightBle.hostId.ip
                    // console.log(hostIp)
                    temp.address = light.lightBle.address
                    temp.lightId = light.lightBle.id
                    temp.lightIntensity = light.lightIntensity
                    lightData.push(temp)

                    var postData = {
                        ble: temp.address,
                        intensity: temp.lightIntensity
                    };
                    request.post({
                        uri: "http://" + hostIp + ":" + port + "/setLightIntensity",
                        headers: {
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        body: require('querystring').stringify(postData)
                    }, function (err, result, body) {
                        // console.log(body);
                        // console.log(result.statusCode);
                        if (result.statusCode == 200) {
                            // res.status(200).json({msg:JSON.parse(body).msg})
                            //update intensity of light here in audit table
                        } else {
                            // res.status(500).json({err:JSON.parse(body).err})
                        }
                    })

                    if (++counter == pending) {
                        res.status(200).json({
                            msg: lightData
                        })
                    }
                })
            } else {
                res.status(500).json({
                    err: "no lights found"
                })
            }
        })
    })
    // res.status(200).json({
    //     msg: req.body
    // })
}
exports.lighMappingInsert = function (req, res, next) {
    var cloudConfig = req.body.cloudConfig
    var hostName = cloudConfig.hostName
    var floorConfig = cloudConfig.floorConfig
    var buildingName = cloudConfig.buildingName
    var lightConfig = cloudConfig.lightConfig
    var lightSensorConfig = cloudConfig.lightSensorConfig
    var licCounter = 0
    var licPending = lightConfig.length
    var liscCounter = 0
    var liscPending = lightSensorConfig.length
    lightConfig.forEach(function (lic) {
        console.log(lic.ble)
        // licCounter++;

    })
    lightSensorConfig.forEach(function (lis) {
        console.log(lis.ble)
        lis.lights.forEach(function (li) {
            console.log(li.light)
        })
    })
    res.json(cloudConfig)
}
exports.applySchedule = function (req, res, next) {
    var data = req.body
    var scheduleId = data.scheduleId

    ScheduleToLight.find({
        scheduleId: scheduleId
    }).populate({
        path: 'lightBle',
        select: 'address',
        populate: {
            path: 'hostId'
        }
    }).then(function (lights) {
        if (lights.length > 0) {
            var temp = {}
            var lightData = []
            var pending = lights.length
            var counter = 0
            lights.forEach(function (light) {
                // console.log(light)
                temp = {}
                hostIp = light.lightBle.hostId.ip
                // console.log(hostIp)
                temp.address = light.lightBle.address
                temp.lightId = light.lightBle.id
                temp.lightIntensity = light.lightIntensity
                lightData.push(temp)

                var postData = {
                    ble: temp.address,
                    intensity: temp.lightIntensity
                };
                request.post({
                    uri: "http://" + hostIp + ":" + port + "/setLightIntensity",
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: require('querystring').stringify(postData)
                }, function (err, result, body) {
                    // console.log(body);
                    console.log(result.statusCode);
                    if (result.statusCode == 200) {
                        // res.status(200).json({msg:JSON.parse(body).msg})
                        //update intensity of light here in audit table
                    } else {
                        // res.status(500).json({err:JSON.parse(body).err})
                    }
                })

                if (++counter == pending) {
                    res.status(200).json({
                        msg: lightData
                    })
                }
            })
        } else {
            res.status(500).json({
                err: "no lights found"
            })
        }
    })
}

exports.buildingData = function (req, res, next) {
    var buildingData = [];
    BuildingModel.find({ hasLMS: true }, function (err, buildings) {
        if (err)
            res.status(400).json(err);
        else {
            var counter = 0;
            var pending = buildings.length
            var floorPercent = [];
            var buildData = {}
            buildData.totalSavings = 0;
            buildData.totalAllLight = 0
            buildData.totalWorkingLights = 0
            buildData.totalWattage = 0
            buildData.buildings = []
            buildingData = buildData
            // buildingData.buildings = {}
            buildings.forEach(function (building) {
                getLightFloorData(building.floors, function (err, floorData) {
                    if (!err) {
                        
                        var temp = floorData
                        temp.bldgId = building._id;
                        temp.bldgName = building.name;
                        temp.latitude = building.latitude;
                        temp.longitude = building.longitude;
                        temp.timezone = building.timezone;
                        buildingData.buildings.push(temp);
                        buildData.totalSavings += floorData.savings
                        buildData.totalAllLight += floorData.totalLights
                        buildData.totalWorkingLights += floorData.workingLights
                        buildData.totalWattage += floorData.totalWattage
                        if (++counter == pending) {
                            // buildingData.push(buildData)
                            buildingData['buildings'] = _.orderBy(buildingData['buildings'], ['bldgName'],['asc']);
                            res.status(200).json({ buildingData: buildingData })
                        }
                        // })
                    } else {
                        res.status(500).json({ err: err })
                    }
                })
            })
        }
    })
}

function getLightFloorData(floors, callback) {
    var perUnitCost = 5
    var lightData = {}
    lightData.workingLights = 0;
    lightData.notWorkingLights = 0;
    lightData.totalLights = 0;

    bleIds = []
    var d = new Date()
    var year = d.getFullYear()
    var month = d.getMonth();
    var date = new Date(year, month, 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    LightToBle.find({ floorId: { $in: floors } }, { bleId: 1, _id: 0 }, function (err, bles) {
        bleIds = bles.map(function (ble) { return ble.bleId });
        LightToBle.aggregate([{ $match: { floorId: { $in: floors } } }, { $group: { _id: '$status', count: { $sum: 1 } } }], function (err, lightCount) {
            if (!err) {
                lightCount.forEach(function (li) {
                    li._id == true ? lightData.workingLights = li.count : lightData.notWorkingLights = li.count;
                })
                lightData.totalLights = lightData.workingLights + lightData.notWorkingLights;
                LightModel.aggregate([{ $match: { floorId: { $in: floors } } }, { $group: { _id: "none", wattage: { $sum: { $multiply: ['$wattage'] } } } }], function (err, lightsWattage) {
                    if(lightsWattage.length == 0){
                        lightData.totalWattage = 0    
                    }else{
                        lightData.totalWattage = lightsWattage[0].wattage
                    }
                    // Energy

                    lightData.totalEnergy = (Math.round(((lightData.totalWattage * 8) / 1000) * 100) / 100)
                    lightData.expectedCost = Math.round(lightData.totalEnergy * perUnitCost * d.getDate() * 100) / 100
                    // Used Energy -> for the day
                    var condition = { time: { '$gte': date, '$lte': lastDay } };
                    SensorDataModel.aggregate([{ $match: { sensorId: { $in: bleIds }, time: { '$gte': date, '$lte': lastDay }, status: 1 } },
                    { $group: { _id: { sensorId: '$sensorId', intensity: '$intensity' }, count: { $sum: 1 } } },
                    { $lookup: { from: 'lighttobles', localField: '_id.sensorId', foreignField: 'bleId', as: 'sensorBles' } }, { $unwind: '$sensorBles' },
                    { $project: { bleId: '$_id.sensorId', count: '$count', intensity: '$_id.intensity', lightId: '$sensorBles.lightId', _id: 0 } },
                    { $lookup: { from: 'lights', localField: 'lightId', foreignField: '_id', as: 'lights' } }, { $unwind: '$lights' },
                    { $project: { bleId: '$bleId', lightId: '$lightId', intensity: '$intensity', wattage: '$lights.wattage', count: '$count' } }
                    ], function (err, lights) {
                        var totalUsedEnergy = 0
                        lights.forEach(function (li) {
                            totalUsedEnergy += ((((li.count * 6) / 60) * li.wattage) / 1000)
                        })
                        lightData.totalUsedEnergy = (Math.round(totalUsedEnergy * 100) / 100)
                        lightData.predictedCost = lightData.totalUsedEnergy * perUnitCost * d.getDate()
                        lightData.savings = Math.round(lightData.expectedCost - lightData.predictedCost)
                        callback(null, lightData)
                    })
                })
            }
            else {
                callback(err, null)
            }
        })
    })
}

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}
exports.getSmartOccupancyValue = function (req, res, next) {
    var data = req.params
    address = data.address

    var postData = {
        address: address
    };
    var hostIp = '192.168.1.27'
    request.post({
        uri: "http://" + hostIp + ":" + port + "/getSmartOccupancy",
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        body: require('querystring').stringify(postData)
    }, function (err, result, body) {
        // console.log(body);
        // console.log(result.statusCode);
        if (result.statusCode == 200) {
            res.status(200).json({
                msg: JSON.parse(body)
            })
            //update occupancy of sensor here in audit table
            // res.status(200).json({msg:result})
        } else {
            res.status(500).json({
                err: JSON.parse(body).err
            })
        }
    })

}
exports.test_rp = function (req, res, next) {
    rp('http://www.google.com')
        .then(function (htmlString) {
            res.status(200).json({ msg: htmlString })
        })
        .catch(function (err) {
            res.status(200).json({ err: err })
        });
}


exports.getBuildings = function (req, res, next) {
    var buildingId = req.params.buildingId;
    BuildingModel.find({}).exec(function (err, buildings) {
        if (err)
            res.status(400).json(err);
        else if (buildings) {
            res.status(200).json(buildings);
        }
        else
            res.json({ "err": "No floor data" });
    })
}
function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

exports.insertLightSensorData = function (req, res, next) {
    // res.status(200).json({msg:req.body})
    var data = req.body
    data = JSON.parse(JSON.stringify(data))
    
    var sensorData = data.sensorData
    var hostName = data.host
    var buildingName = data.bldg
    var floorName = data.floor
    addLightsensorData(async function (floorid) {
        if (floorid) {
            // floorLights = getAllLightsFloor(floorid)
            // read CSV here and update
            // sleep(2000);
           res.status(200).json({ msg: "sensor data inserted successfully" })
        } else {
            res.status(500).json({ err: "sensor data could not be inserted" })
        }
    })
    function addLightsensorData(callback) {
        var counter = 0;
        var pending = sensorData.length;
        BuildingModel.findOne({
            name: buildingName
        }, function (err, bldg) {
            if (bldg) {
                FloorModel.findOne({
                    name: floorName
                }, function (err, floor) {
                    if (floor) {
                        HostModel.findOne({
                            name: hostName,
                            floorId: floor.id,
                            buildingId: bldg.id
                        }, function (err, host) {
                            if (host) {
                                // console.log(host)
                                sensorData.forEach(function (value) {
                                    console.log(floor.id)
                                    console.log(value)
                                BleModel.findOne({
                                        floorId: floor.id,
                                        address: value.a
                                    }, function (err, ble) {
                                        console.log(ble)
                                        if (ble) {
                                            if (ble.isLAD == true) {
                                                var updateOptions = {}
                                                var currentDate = new Date().getTime();
                                                //updateOptions.occupied = value.o >= 3;
                                                var temperature = (parseFloat(value.t) == 0 ? 0 : (parseFloat(value.t) < 19 ? 19 : (parseFloat(value.t) > 28 ? 28 : value.t)));
                                                var sensorData = new SensorDataModel({
                                                    sensorId: ble.id,
                                                    occupancy: value.o,
                                                    temperature: temperature,
                                                    time: new Date(parseInt(value.ti) * 1000),
                                                    intensity: value.li,
                                                    status: value.s,
                                                    dataPacket: (value.p ? value.p : '[]')
                                                });
                                                sensorData.save(function (err, doc, num) {
                                                    if (!err) {
                                                        console.log(doc)
                                                        // console.log("Inserted Sensor Data")
                                                    } else {
                                                        //console.log("Duplicate entry for:", value.a, value.t, value.ti);
                                                        console.log(err);
                                                    }
                                                })
                                                updateOptions.temperature = temperature;
                                                var status = (value.s == 1 ? true : false);
                                                updateOptions.status = status;
                                                // updateOptions.lastOccupied = new Date(parseInt(value.ti)* 1000);
                                                updateOptions.lastStatusUpdate = new Date(parseInt(value.ti) * 1000);
                                                updateOptions.lightIntensity = value.li
                                                updateOptions.lastDataPacket = (value.p ? value.p : '[]')
                                                console.log(value)
                                                LightToBle.findOneAndUpdate({
                                                    bleId: ble.id
                                                }, updateOptions, function (err, doc) {
                                                    if (err) {
                                                        console.log(err)
                                                        //res.send(err)
                                                    } else {
                                                        console.log('updated light ble')
                                                    }
                                                });
                                                if (++counter == pending) {
                                                    console.log("Added data for floor ", floorName)
                                                    callback(floor.id);
                                                }
                                            } else if (ble.isCOS == true) {
                                                var updateOptions = {}
                                                var currentDate = new Date().getTime();
                                                //updateOptions.occupied = value.o >= 3;
                                                var temperature = (parseFloat(value.t) == 0 ? 0 : (parseFloat(value.t) < 19 ? 19 : (parseFloat(value.t) > 28 ? 28 : value.t)));
                                                var sensorData = new SensorDataModel({
                                                    sensorId: ble.id,
                                                    occupancy: value.o,
                                                    temperature: temperature,
                                                    time: new Date(parseInt(value.ti) * 1000),
                                                    intensity: value.li,
                                                    status: value.s,
                                                    dataPacket: (value.p ? value.p : '[]')
                                                });
                                                sensorData.save(function (err, doc, num) {
                                                    if (!err) {
                                                        if (++counter == pending) {
                                                            console.log("Added data for floor ", floorName)
                                                            callback(floor.id);
                                                        }
                                                    } else {
                                                        console.log("Duplicate entry for:", value.a, value.t, value.ti);
                                                        // console.log(err);
                                                        if (++counter == pending) {
                                                            console.log("Added data for floor ", floorName)
                                                            callback(floor.id);
                                                        }
                                                    }
                                                })
                                                updateOptions.temperature = temperature;
                                                var status = (value.s == 1 ? true : false);
                                                updateOptions.status = status;
                                                // updateOptions.lastOccupied = new Date(parseInt(value.ti)* 1000);
                                                updateOptions.lastStatusUpdate = new Date(parseInt(value.ti) * 1000);
                                                updateOptions.lightIntensity = value.li
                                                updateOptions.lastDataPacket = (value.p ? value.p : '[]'),
                                                    updateOptions.occupancy = value.o,
                                                    lightSensorsToBle.findOneAndUpdate({
                                                        bleId: ble.id
                                                    }, updateOptions, function (err, doc) {
                                                        if (err) {
                                                            console.log(err)
                                                            if (++counter == pending) {
                                                                console.log("Added data for floor ", floorName)
                                                                callback(floor.id);
                                                            }
                                                        } else {
                                                            console.log('updated light ble')

                                                            if (++counter == pending) {
                                                                console.log("Added data for floor ", floorName)
                                                                callback(floor.id);
                                                            }
                                                        }
                                                    });
                                                if (++counter == pending) {
                                                    console.log("Added data for floor ", floorName)
                                                    callback(floor.id);
                                                }
                                            }
                                        } else {
                                            console.log(value + ' not found')
                                        }
                                    })

                                })
                            } else {
                                callback(false)
                            }
                        })

                    } else {
                        callback(false)
                    }
                })

            } else {
                callback(false)
            }

        })
    }

}

function getAllLightsFloor(floorId) {
    var floorId = floorId;
    LightToBle.find({
        floorId: floorId
    }, ['floorId', 'lightId', 'bleId', 'lightIntensity', 'hostId']).populate({
        path: 'floorId',
        select: 'name'
    }).populate({
        path: 'lightId'
    }).populate({
        path: 'bleId'
    }).populate({
        path: 'hostId'
    }).
        then(function (data) {

            var temp = {}
            var lightsArray = []
            var pending = data.length;
            var counter = 0;
            data.forEach(function (light) {
                temp = {};
                temp.address = light.bleId.address;
                temp.id = light.bleId.id;
                temp.name = light.lightId.name;
                temp.wattage = light.lightId.wattage;
                light.maxlevel = light.lightId.maxlevel;
                temp.minlevel = light.lightId.minlevel;
                temp.rotate = light.lightId.rotate;
                temp.class = light.lightId.class;
                temp.lightPosX = light.lightId.posX;
                temp.lightPosY = light.lightId.posY;
                temp.width = light.lightId.width;
                temp.height = light.lightId.height;
                temp.intensity = light.lightIntensity;
                temp.hostName = light.hostId.name;
                lightsArray.push(temp);
                if (++counter == pending) {
                    io.emit('sensorData', { msg: lightsArray });
                    // client.emit('sensorData',{msg:lightsArray});
                    //    console.log("socketdata")
                    //    console.log(lightsArray[0])
                    return lightsArray
                };
            });
        });
}


exports.SubmitToHost = function (req, res, next) {
    var floorId = req.body.floorId;

    var fid = mongoose.Types.ObjectId(floorId);
  
    ZoneModel.aggregate(
        [{ $match: { "floorId": fid } },
        { $lookup: { from: "scenes", localField: "_id", foreignField: "zoneId", as: "scenes" } },
        { $unwind: "$scenes" },
        { $lookup: { from: "scenetolights", localField: "scenes._id", foreignField: "sceneId", as: "scenetolights" } },
        { $unwind: "$scenetolights" },
        { $lookup: { from: "bles", localField: "scenetolights.lightBle", foreignField: "_id", as: "bles" } },
        { $unwind: "$bles" },
        { $lookup: { from: "lighttobles", localField: "bles._id", foreignField: "bleId", as: "lighttobles" } },
        { $unwind: "$lighttobles" },
        { $lookup: { from: "lights", localField: "lighttobles.lightId", foreignField: "_id", as: "Scenelights" } },
        { $unwind: "$Scenelights" },
        { $lookup: { from: "hosts", localField: "Scenelights.hostId", foreignField: "_id", as: "Hosts" } },
        { $unwind: "$Hosts" },
        { $project: { "name": 1, "zoneId": 1, "Hosts.name": 1, "lights": 1, "scenes.name": 1, "scenetolights.lightIntensity": 1, "Scenelights.name": 1, "bles.address": 1 } }
        ], function (err, doc) {

           

            if (err) {
                res.status(500).send('Something went wrong. Please try again');
            } else if (doc.length > 0) {

                var lightdetails = { zones: [], scenes: [] };

                createlightdetailsObj(doc, lightdetails, function (detailedObjects) {

                    console.log(JSON.stringify(detailedObjects));

                    res.send('Done');

                });
            } else {
                ZoneModel.aggregate(
                    [{ $match: { "floorId": fid } },
                    { $lookup: { from: "scenes", localField: "_id", foreignField: "zoneId", as: "scenes" } }

                    ], function (err, doc) {
                        var lightdetails = { zones: [], scenes: [] };

                        createlightdetailsObj(doc, lightdetails, function (detailedObjects) {

                            console.log(JSON.stringify(detailedObjects));

                            res.send('Done');

                        });
                    })
            }

        })

  
}


function createlightdetailsObj(array, lightdetails, callback) {

    var count = 0;
  
    getZonelights();

    function getZonelights() {
        BleModel.aggregate([{ $match: { "_id": { "$in": array[count].lights } } },
        { $lookup: { from: "lighttobles", localField: "_id", foreignField: "bleId", as: "lighttobles" } },
        { $unwind: "$lighttobles" },
        { $lookup: { from: "lights", localField: "lighttobles.lightId", foreignField: "_id", as: "lights" } },
        { $unwind: "$lights" },
        { $lookup: { from: "hosts", localField: "lights.hostId", foreignField: "_id", as: "hosts" } },
        { $unwind: "$hosts" },
        { $project: { "address": 1, "lights.name": 1, "hosts.name": 1 } }
        ], function (err, doc) {
           
            var zoneobj = {};

            zoneobj.name = array[count].name;
            zoneobj.zoneId = array[count].zoneId;
            zoneobj.hostname = ((array[count].Hosts) ? array[count].Hosts.name : null);
            zoneobj.lights = [];
            if (array[count].scenes.name) {
                var sceneobj = {};
                sceneobj.name = array[count].scenes.name;
                sceneobj.hostname = array[count].Hosts.name;
                var scenelightobj = { name: array[count].Scenelights.name, address: array[count].bles.address, lightIntensity: array[count].scenetolights.lightIntensity }
                sceneobj.lights = []

                var sceneavailability = checkscene(lightdetails.scenes, array[count].scenes.name);

                if (sceneavailability.status) {
                
                    lightdetails.scenes[sceneavailability.index].lights.push(scenelightobj)
                } else {
                    sceneobj.lights.push(scenelightobj);
                    lightdetails.scenes.push(sceneobj);
                }
            }
            checkforzonename(lightdetails.zones, array[count].name, function (zone, index) {
                count = count + 1;
                if (zone) {

                    for (var i = 0; i < doc.length; i++) {
                        var obj = {};
                        obj.name = doc[i].lights.name;
                        obj.address = doc[i].address;

                        lightdetails.zones[index].lights.push(obj);
                    }
                   
                    lightdetails.zones[index].lights = removeDuplicates(lightdetails.zones[index].light);
                    if (count === array.length) {
                        callback(lightdetails);
                    } else {
                        getZonelights();
                    }

                } else {
                    for (var i = 0; i < doc.length; i++) {
                        var obj = {};
                        obj.name = doc[i].lights.name;
                        obj.address = doc[i].address;
                        zoneobj.lights.push(obj);
                      
                    }
                    var hostname = ((doc.length > 0) ? doc[0].hosts.name : null);
                    zoneobj.hostname = ((zoneobj.hostname) ? zoneobj.hostname : hostname);
                    lightdetails.zones.push(zoneobj);
                 
                    if (count === array.length) {
                        callback(lightdetails);
                    } else {
                        getZonelights();
                    }
                }
            })

        })
    }

}

function checkforzonename(zones, name, callback) {
    var status = false;
    var index;
    for (var i = 0; i < zones.length; i++) {
        if (zones[i].name === name) {
            status = true;
            index = i;
            break;
        }
    }
    callback(status, index);
}

function checkscene(scenes, name) {

    var result = { status: false, index: 0 };

    for (var i = 0; i < scenes.length; i++) {
        if (scenes[i].name === name) {
            result.status = true;
            result.index = i;
            break;
        }
    }
    return result;
}

function removeDuplicates(arr) {
   
    var elements = arr.reduce(function (previous, current) {

        var object = previous.filter(object => object.name === current.name);
        if (object.length == 0) {
            previous.push(current);
        }
        return previous;
    }, []);

   
    return elements;
}

exports.addUser = function(req, res, next) {
    var data = req.body;
    data.fname = data.fname.toLowerCase();
    data.lname = data.lname.toLowerCase();
    if (data) {
        console.log(data);
        user = new UserModel({
            password: bcrypt.hashSync(data.password),
            name: data.id.toLowerCase(),
            firstName: data.fname,
            lastName: data.lname,
            email: data.email,
            isAdmin: data.isAdmin,
            isSuperAdmin:data.isSuperAdmin
        })
        user.save(function(err, doc, num) {
            if (err)
                res.json(err);
            else
                res.status(200).json({ msg: "User Added" });
        })
    }
}