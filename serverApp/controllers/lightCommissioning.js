var router = global.express.Router();

var BleModel = require('../models/ble');
var LightModel = require('../models/lights');
var LightToBleModel = require('../models/lightToBle');
var LightSensorToBleModel = require('../models/lightSensorToBle');
var LightSensorModel = require('../models/lightSensors');
var LightTypeModel = require('../models/lighttypes');
var LightShapesModel = require('../models/lightshapes');
var TouchPanelModel = require('../models/touchPanels');
var TouchPanelToBleModel = require('../models/touchPanelToBle');

var ZoneModel = require('../models/zones');
var SceneModel = require('../models/scenes');
var SceneToLight = require('../models/sceneToLight');
var ScheduleModel = require('../models/schedules')
var ScheduleToLight = require('../models/scheduleToLight');

var multer = require('multer');
var fs = require('fs');
var path = require('path');
var HostModel = require('../models/hosts');

var xlstojson = require('xls-to-json-lc');
var xlsxtojson = require('xlsx-to-json-lc');
var requestp = require('request-promise');
var request = require('request');
var port = 8980;
exports.testcommissioning = function(req, res, next) {
    res.status(200).json({ msg: "test" });
};

exports.createLights = function(req, res, next) {
    var count = 0;
    var lightcategorycount = req.body.lightcount.length;
    var lightcount = 0;
    var fid = req.params.floorId;
    var buid = req.body.buid;
    var c = 0;
    var a = 0;
    data = req.body;
    insertlights(lightcount, fid, buid, count);

    function insertlights(lightcount, fid, buid, count) {
        LightModel.find({ floorId: mongoose.Types.ObjectId(fid) }, function(err, lights) {
            if (lights) {
                lightcount = lights.length;
                addresscount = lights.length;
            }
            var nos = data.lightcount[count].count;
            var cls = data.lightcount[count].lighttype;
            var posx = data.lightcount[count].posx;
            var width = data.lightcount[count].width;
            var height = data.lightcount[count].height;
            var wattage = data.lightcount[count].wattage;

            insertmultiplelights(lightcount, fid, width, height, wattage, buid, nos, cls, 0, posx, function(err, success) {
                if (err) {
                    res.send({ msg: "Somthing went wrong. Please try again", status: false });
                } else {
                    count = count + 1;
                    c = c + 1;
                    if (c === lightcategorycount) {
                        res.send({ msg: "light saved successfully", status: true });
                    } else {

                        insertlights(lightcount, fid, buid, c);
                    }
                }
            });
        });
    }
};

function insertmultiplelights(lightcount, fid, width, height, wattage, buid, nos, cls, count, posx, callback) {
    LightModel.findOne({ name: "light" + lightcount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
        if (err) {
            callback(err, "Failed");
        } else if (obj) {
            // console.log("called")
            insertmultiplelights(lightcount, fid, width, height, wattage, buid, nos, cls, count, posx, callback);
        } else {

            var lightmodel = new LightModel({ name: "light" + lightcount, floorId: fid, height: height, width: width, wattage: wattage, class: cls, posX: posx });

            lightmodel.save(function(err, light) {
                if (err) {
                    callback(err, "Failed");
                } else {
                    count = count + 1;
                    if (nos === count) {
                        callback(null, "Success");
                    } else {
                        // count = count + 1;
                        insertmultiplelights(lightcount, fid, width, height, wattage, buid, nos, cls, count, posx, callback);
                    }
                }
            });
        }
    });
}


exports.createSensorsWBles = function(req, res, next) {
    // res.send(req.body)
    var count = 0;
    var lightcategorycount = req.body.sensorsToAdd.length;
    var lightcount = 0;
    var fid = req.params.floorId;
    var buid = req.body.buid;
    var c = 0;
    data = req.body;
    insertsensors(lightcount, fid, buid, count);

    function insertsensors(lightcount, fid, buid, count) {
        LightSensorModel.find({ floorId: mongoose.Types.ObjectId(fid) }, function(err, lights) {
            if (lights) {
                lightcount = lights.length;
                addresscount = lights.length;
            }
            console.log(data.sensorsToAdd)
            var nos = data.sensorsToAdd[count].count;
            var posx = data.sensorsToAdd[count].posx;
            var width = data.sensorsToAdd[count].width;
            var height = data.sensorsToAdd[count].height;
            var type = data.sensorsToAdd[count].type;
            scount = 0;
            insertmultipleSensors(lightcount, fid, width, height, buid, nos, scount, posx, type, function(err, success) {
                if (err) {
                    res.send({ msg: "Somthing went wrong. Please try again", status: false });
                } else {
                    count = count + 1;
                    if (count === lightcategorycount) {
                        res.send({ msg: "light saved successfully", status: true });
                    } else {
                        insertsensors(lightcount, fid, buid, count);
                    }
                }
            });
        });
    }
};

function insertmultipleSensors(lightcount, fid, width, height, buid, nos, count, posx, type, callback) {
    LightSensorModel.findOne({ name: "lightSensor" + lightcount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
        if (err) {
            callback(err, "Failed");
        } else if (obj) {
            lightcount = lightcount + 1;
            insertmultipleSensors(lightcount, fid, width, height, buid, nos, count, posx, type, callback);
        } else {
            var sos = type == 'sos' ? true : false;
            var dls = type == 'dls' ? true : false;

            var lightSensorModel = new LightSensorModel({ name: "lightSensor" + lightcount, floorId: fid, height: height, width: width, posX: posx, isDLS: dls, isSOS: sos });
            lightSensorModel.save(function(err, light) {
                if (err) {
                    callback(err, "Failed");
                } else {
                    count = count + 1;
                    if (nos === count) {
                        callback(null, "Success");
                    } else {
                        lightcount = lightcount + 1;
                        insertmultipleSensors(lightcount, fid, width, height, buid, nos, count, posx, type, callback);
                    }
                }
            })
        }
    })
}

exports.createTPWBles = function(req, res, next) {
    // res.send(req.body)
    var count = 0;
    var lightcategorycount = req.body.sensorsToAdd.length;
    var lightcount = 0;
    var fid = req.params.floorId;
    var buid = req.body.buid;
    var c = 0;
    data = req.body;
    insertsensors(lightcount, fid, buid, count);

    function insertsensors(lightcount, fid, buid, count) {
        TouchPanelModel.find({ floorId: mongoose.Types.ObjectId(fid) }, function(err, lights) {
            if (lights) {
                lightcount = lights.length;
                addresscount = lights.length;
            }
            console.log(data.sensorsToAdd)
            var nos = data.sensorsToAdd[count].count;
            var posx = data.sensorsToAdd[count].posx;
            var width = data.sensorsToAdd[count].width;
            var height = data.sensorsToAdd[count].height;
            scount = 0;
            insertmultipleTPs(lightcount, fid, width, height, buid, nos, scount, posx, function(err, success) {
                if (err) {
                    res.send({ msg: "Somthing went wrong. Please try again", status: false });
                } else {
                    count = count + 1;
                    if (count === lightcategorycount) {
                        res.send({ msg: "light saved successfully", status: true });
                    } else {
                        insertsensors(lightcount, fid, buid, count);
                    }
                }
            });
        });
    }
};


function insertmultipleTPs(lightcount, fid, width, height, buid, nos, count, posx, callback) {

    TouchPanelModel.findOne({ name: "lightSensor" + lightcount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
        if (err) {
            callback(err, "Failed");
        } else if (obj) {
            lightcount = lightcount + 1;
            insertmultipleTPs(lightcount, fid, width, height, buid, nos, count, posx, callback);
        } else {

            var touchPanelModel = new TouchPanelModel({ name: "TouchPanel" + lightcount, floorId: fid, height: height, width: width });
            touchPanelModel.save(function(err, light) {
                if (err) {
                    callback(err, "Failed");
                } else {
                    count = count + 1;
                    if (nos === count) {
                        callback(null, "Success");
                    } else {
                        lightcount = lightcount + 1;
                        insertmultipleTPs(lightcount, fid, width, height, buid, nos, count, posx, callback);
                    }
                }
            })
        }
    })
}



exports.createDevices = function(req, res, next) {
    var data = req.body;
    var fid = req.params.floorId;
    var lights = data.lightcount;
    var tunLights = data.tunLightCount;
    console.log("tunlights", tunLights)
    var sensors = data.sensorcount;
    var touchpanels = data.touchpanelcount;
    var buid = req.body.buid;
    var lightstoadd = false,
        sensorstoadd = false,
        tpstoadd = false;
    var ltName = "Light";
    var tunLtName = "tunableLight"
    if (lights.length > 0) {
        lightstoadd = true;
        console.log("lights to be added");
    }



    if (sensors.length > 0) {
        sensorstoadd = true;
        console.log("sensors to be added");
    }
    if (touchpanels.length > 0) {
        tpstoadd = true;
        console.log("touch panels to be added");
    }
    addLights(lights, fid, buid, 0, ltName, function(err, lightsAdded) {
        if (err) {
            res.status(500).json({ err: "Error adding lights, Please try again" });
        } else {
            console.log("calling add sensors");
            addLights(tunLights, fid, buid, 0, tunLtName, function(err, tunableLightsAdded) {
                if (err) {
                    res.status(500).json({ err: "Error adding lights, Please try again" });
                } else {
                    console.log("calling add sensors");
                    addSensors(sensors, fid, buid, 0, function(err, sensorsAdded) {
                        if (err) {
                            res.status(500).json({ err: "Error adding sensors, please try again" });
                        } else {
                            console.log("calling add touch panels");
                            addTouchPanels(touchpanels, fid, buid, 0, function(err, touchPanelsAdded) {
                                if (err) {
                                    res.status(500).json({ err: "Error adding touchpanles, please try again" });
                                } else {
                                    res.status(200).json({ msg: "All devices added successfully" });
                                }
                            })


                        }
                    })
                }
            })


        }
    })
}








function addLights(lightcategories, floorId, buid, c, lightName, callback) {
    console.log(lightName)
    var count = 0;
    var lightcategorycount = lightcategories.length;
    var currentLightCount = 0;
    if (lightcategorycount > 0) {
        LightModel.find({ floorId: mongoose.Types.ObjectId(floorId) }, function(err, lightspresent) {
            if (err) {
                callback(true, "Error")
            } else {
                if (lightspresent) {
                    currentLightCount = lightspresent.length;
                }
                var nos = lightcategories[c].count;
                var cls = lightcategories[c].lighttype;
                var posx = lightcategories[c].posx;
                var width = lightcategories[c].width;
                var height = lightcategories[c].height;
                var wattage = lightcategories[c].wattage;
                var isTunable = lightcategories[c].isTunable;
                console.log("calling add lights")
                addLightType(currentLightCount, floorId, buid, nos, cls, posx, width, height, wattage, isTunable, 0, lightName, function(err, data) {
                    if (err) {
                        console.log(err)
                        callback(true, false);
                    } else {
                        c += 1;
                        if (c == lightcategorycount) {
                            console.log("inserted");
                            callback(false, true)
                        } else {
                            addLights(lightcategories, floorId, buid, c, lightName, callback)
                        }
                    }
                });
            }
        });
    } else {
        callback(false, true);
    }
}

function addLightType(currentLightCount, floorId, buid, nos, cls, posx, width, height, wattage, isTunable, insertedCount, lightname, callback) {
    // var insertedCount = 0;
    var lightvalue = lightname.toString() + currentLightCount
    LightModel.findOne({ name: lightvalue, floorId: mongoose.Types.ObjectId(floorId) }, function(err, obj) {
        if (err) {
            callback(true, "Failed")
        } else {
            if (obj) {
                addLightType(currentLightCount + 1, floorId, buid, nos, cls, posx, width, height, wattage, isTunable, insertedCount, callback);
            } else {

                var lightmodel = new LightModel({ name: lightvalue, floorId: floorId, height: height, width: width, wattage: wattage, isTunable: isTunable, class: cls, posX: posx });
                console.log(lightmodel)
                lightmodel.save(function(err, light) {
                    if (err) {
                        callback(err, "Failed");
                    } else {
                        insertedCount = insertedCount + 1;
                        if (insertedCount == nos) {
                            callback(null, "Success");
                        } else {
                            addLightType(currentLightCount + 1, floorId, buid, nos, cls, posx, width, height, wattage, isTunable, insertedCount, lightname, callback);
                        }
                    }
                });
            }
        }
    })
}

function addSensors(sensorcategories, floorId, buid, c, callback) {
    var count = 0;
    var sensorcategorycount = sensorcategories.length;
    var currentSensorCount = 0;
    if (sensorcategorycount > 0) {
        LightSensorModel.find({ floorId: mongoose.Types.ObjectId(floorId) }, function(err, sensorspresent) {
            if (err) {
                callback(true, "Error")
            } else {
                if (sensorspresent) {
                    currentSensorCount = sensorspresent.length;
                }
                var nos = sensorcategories[c].count;
                var posx = sensorcategories[c].posx;
                var width = sensorcategories[c].width;
                var height = sensorcategories[c].height;
                var type = sensorcategories[c].type;
                var timeout = sensorcategories[c].timeout;
                addSensorType(currentSensorCount, floorId, buid, nos, posx, width, height, type, timeout, 0, function(err, data) {
                    if (err) {
                        callback(true, false);
                    } else {
                        c += 1;
                        if (c == sensorcategorycount) {
                            console.log("inserted");
                            callback(false, true)
                        } else {
                            addSensors(sensorcategories, floorId, buid, c, callback)
                        }
                    }
                });
            }
        });
    } else {
        callback(false, true);
    }
}

function addSensorType(currentSensorCount, floorId, buid, nos, posx, width, height, type, timeout, insertedCount, callback) {
    // var insertedCount = 0;
    LightSensorModel.findOne({ name: "LightSensor" + currentSensorCount, floorId: mongoose.Types.ObjectId(floorId) }, function(err, obj) {
        if (err) {
            callback(true, "Failed")
        } else {
            if (obj) {
                addSensorType(currentSensorCount + 1, floorId, buid, nos, posx, width, height, type, timeout, insertedCount, callback);
            } else {
                var sos = type == 'sos' ? true : false;
                var dls = type == 'dls' ? true : false;
                var lightsensormodel = new LightSensorModel({ name: "LightSensor" + currentSensorCount, floorId: floorId, height: height, width: width, isSOS: sos, isDLS: dls, posX: posx, timeout: timeout });
                lightsensormodel.save(function(err, sensor) {
                    if (err) {
                        callback(err, "Failed");
                    } else {
                        insertedCount = insertedCount + 1;
                        if (insertedCount == nos) {
                            callback(null, "Success");
                        } else {
                            addSensorType(currentSensorCount + 1, floorId, buid, nos, posx, width, height, type, timeout, insertedCount, callback);
                        }
                    }
                });
            }
        }
    })
}

function addTouchPanels(touchpanelcategories, floorId, buid, c, callback) {
    var count = 0;
    var tpcategorycount = touchpanelcategories.length;
    var currentTPCount = 0;
    if (tpcategorycount > 0) {
        TouchPanelModel.find({ floorId: mongoose.Types.ObjectId(floorId) }, function(err, tpspresent) {
            if (err) {
                callback(true, "Error")
            } else {
                if (tpspresent) {
                    currentTPCount = tpspresent.length;
                }
                var nos = touchpanelcategories[c].count;
                var posx = touchpanelcategories[c].posx;
                var width = touchpanelcategories[c].width;
                var height = touchpanelcategories[c].height;
                addTouchPanelType(currentTPCount, floorId, buid, nos, posx, width, height, 0, function(err, data) {
                    if (err) {
                        callback(true, false);
                    } else {
                        c += 1;
                        if (c == tpcategorycount) {
                            callback(false, true)
                        } else {
                            addTouchPanels(touchpanelcategories, floorId, buid, c, callback)
                        }
                    }
                });
            }
        });
    } else {
        callback(false, true);
    }
}

function addTouchPanelType(currentTPCount, floorId, buid, nos, posx, width, height, insertedCount, callback) {
    TouchPanelModel.findOne({ name: "TouchPanel" + currentTPCount, floorId: mongoose.Types.ObjectId(floorId) }, function(err, obj) {
        if (err) {
            callback(true, "Failed")
        } else {
            if (obj) {
                addTouchPanelType(currentTPCount + 1, floorId, buid, nos, posx, width, height, insertedCount, callback);
            } else {
                var touchPanelModel = new TouchPanelModel({ name: "TouchPanel" + currentTPCount, floorId: floorId, height: height, width: width, posX: posx });
                touchPanelModel.save(function(err, light) {
                    if (err) {
                        callback(err, "Failed");
                    } else {
                        insertedCount = insertedCount + 1;
                        if (insertedCount == nos) {
                            callback(null, "Success");
                        } else {
                            addTouchPanelType(currentTPCount + 1, floorId, buid, nos, posx, width, height, insertedCount, callback);
                        }
                    }
                });
            }
        }
    })
}

exports.mapBle = function(req, res, next) {
    var data = req.body;
    console.log("wholedata", data)
    var fid = req.params.foorId;
    var device = data.device;
    var ble = data.ble;
    console.log("bleee", ble)
    if (data.type == 1) {
        lightBle = new LightToBleModel({ floorId: fid, lightId: device._id, bleId: ble._id }).save(function(err, data) {
            if (!err) {
                BleModel.findByIdAndUpdate(mongoose.Types.ObjectId(ble._id), { mapped: true }, function(err, bleU) {
                    if (!err) {
                        console.log("saved successfully");
                    } else {
                        console.log(err);
                    }
                })
            } else {
                console.log(err);
            }
        })
    } else if (data.type == 2) {
        LightSensorToBleModel.remove({ bleId: ble._id }, function(err, success) {
            if (success) {
                lightSensorBle = new LightSensorToBleModel({ floorId: fid, lightSensorId: device._id, bleId: ble._id }).save(function(err, data) {
                    if (!err) {
                        BleModel.findByIdAndUpdate(mongoose.Types.ObjectId(ble._id), { mapped: true }, function(err, bleU) {
                            if (!err) {
                                console.log("saved successfully");
                            } else {
                                console.log(err);
                            }
                        })
                    } else {
                        console.log(err);
                    }
                })
            }
        })
    } else if (data.type == 3) {
        TouchPanelToBleModel.remove({ bleId: ble._id }, function(err, success) {
            if (success) {
                tpBle = new TouchPanelToBleModel({ floorId: fid, touchPanelId: device._id, bleId: ble._id }).save(function(err, data) {
                    if (!err) {
                        BleModel.findByIdAndUpdate(mongoose.Types.ObjectId(ble._id), { mapped: true }, function(err, bleU) {
                            if (!err) {
                                console.log("saved successfully");
                            } else {
                                console.log(err);
                            }
                        })
                    } else {
                        console.log(err);
                    }
                })
            }
        })
    }
    res.json({ data })
}


exports.getLights = function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    LightModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $project: { "_id": 1, "floorId": 1, "wattage": 1, "faderate": 1, "maxlevel": 1, "minlevel": 1, "name": 1, "class": 1, "height": 1, "width": 1, "isTunable": 1, "posY": 1, "posX": 1, "rotate": 1, "hostId": 1 } }

        ],
        function(err, doc) {
            if (err) {
                res.send(err);
            } else {
                res.send({ document: doc, msg: "Lights Not found" });
            }
        }
    );
};

exports.getLightsBle = function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    LightModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $project: { "_id": 1, "floorId": 1, "wattage": 1, "faderate": 1, "maxlevel": 1, "minlevel": 1, "name": 1, "class": 1, "height": 1, "width": 1, "isTunable": 1, "posY": 1, "posX": 1, "rotate": 1, 'hostId': 1 } },
            { $lookup: { from: "lighttobles", localField: "_id", foreignField: "lightId", as: "lighttobles" } },
            { $lookup: { from: "bles", localField: "lighttobles.bleId", foreignField: "_id", as: "bles" } },
            { $addFields: { bleAddress: "$bles.address", bleName: "$bles.name", bleIds: "$bles._id" } },
            { $project: { "_id": 1, "floorId": 1, "wattage": 1, "faderate": 1, "maxlevel": 1, "minlevel": 1, "name": 1, "class": 1, "height": 1, "width": 1, "isTunable": 1, "posY": 1, "posX": 1, "rotate": 1, 'hostId': 1, "bleAddress": 1, "bleName": 1, "bleIds": 1 } }
        ],
        function(err, doc) {
            if (err) {
                res.send(err);
            } else {
                console.log("doc")
                res.send({ document: doc, msg: "Lights found" });
            }
        }
    );
}

exports.getTunLightsBle = function(req, res, next) {
    var data = req.query;
    console.log("datatatat", data)

    var fid = mongoose.Types.ObjectId(data.floorId);
    LightModel.aggregate(
        [{ $match: { "floorId": fid, "isTunable": true } },
            { $project: { "_id": 1, "floorId": 1, "wattage": 1, "faderate": 1, "maxlevel": 1, "minlevel": 1, "name": 1, "class": 1, "height": 1, "width": 1, "posY": 1, "posX": 1, "isTunable": 1, "rotate": 1, 'hostId': 1 } },
            { $lookup: { from: "lighttobles", localField: "_id", foreignField: "lightId", as: "lighttobles" } },
            { $lookup: { from: "bles", localField: "lighttobles.bleId", foreignField: "_id", as: "bles" } },
            {
                $addFields: { ble: "$bles", bleAddress: "$bles.address", bleName: "$bles.name", bleIds: "$bles._id" }
            },
            { $project: { "_id": 1, "floorId": 1, "wattage": 1, "faderate": 1, "maxlevel": 1, "minlevel": 1, "name": 1, "class": 1, "height": 1, "width": 1, "posY": 1, "posX": 1, "isTunable": 1, "rotate": 1, 'hostId': 1, "bleAddress": 1, "bleName": 1, "bleIds": 1, "coolable": 1, "warmable": 1, "ble": 1 } }
        ],
        function(err, docs) {
            if (err) {
                res.send(err);
            } else {
                console.log("aerwerew", docs)
                console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhh")
                    // console
                    // docs.bleAddress.forEach(function(address) {
                    //     if (docs.coolable == true) {
                    //         coolBleAddress = address
                    //         docs.push(coolBleAddress)
                    //     } else if (doc.warmable == true) {
                    //         warmBleAddress = address
                    //         docs.push(warmBleAddress)
                    //     }
                    // })

                res.send({ document: docs, msg: "tunable Lights found" });
            }
        }
    );

}

exports.geTunAddress = function(req, res, next) {
    var data = req.query;
    console.log("dataaaaaa", data)

    var lightid = mongoose.Types.ObjectId(data.ltid);
    LightModel.aggregate(
        [{ $match: { "_id": lightid, "isTunable": true } },
            { $project: { "_id": 1, "floorId": 1, "wattage": 1, "faderate": 1, "maxlevel": 1, "minlevel": 1, "name": 1, "class": 1, "height": 1, "width": 1, "posY": 1, "posX": 1, "isTunable": 1, "rotate": 1, 'hostId': 1 } },
            { $lookup: { from: "lighttobles", localField: "_id", foreignField: "lightId", as: "lighttobles" } },
            { $lookup: { from: "bles", localField: "lighttobles.bleId", foreignField: "_id", as: "bles" } },
            { $addFields: { ble: "$bles" } },
            { $project: { "_id": 1, "floorId": 1, "wattage": 1, "faderate": 1, "maxlevel": 1, "minlevel": 1, "name": 1, "class": 1, "height": 1, "width": 1, "posY": 1, "posX": 1, "isTunable": 1, "rotate": 1, 'hostId': 1, 'ble': 1 } }
        ],
        function(err, docs) {
            if (err) {
                res.send(err);
            } else {
                console.log("valuuuuee", docs)
                docs.forEach(function(add) {
                    console.log("onestep")
                    add.ble.forEach(function(ppl) {
                        console.log("twostep")
                        if (ppl.coolble == true) {


                            coolBleAddress = ppl.address

                            docs.push({ coolBleAdd: coolBleAddress })
                            console.log("docccss", docs)



                        } else if (ppl.warmble == true) {
                            warmBleAddress = ppl.address
                            docs.push({ warmBleAdd: warmBleAddress })
                        }

                    })
                })

                // docs.bleAddress.forEach(function(address) {
                //     if (docs.coolable == true) {
                //         coolBleAddress = address
                //         docs.push(coolBleAddress)
                //     } else if (doc.warmable == true) {
                //         warmBleAddress = address
                //         docs.push(warmBleAddress)
                //     }
                // })
                console.log("docccss", docs)
                res.send({ document: docs, msg: "tunable Lights found" });
            }
        }
    );

}

exports.getlightsWithBle = function(req, res, next) {
    var data = req.query;

    var fid = mongoose.Types.ObjectId(data.floorId)
        // res.json({msg:fid})
    LightModel.aggregate(
        [{ $lookup: { from: "lighttobles", localField: "_id", foreignField: "lightId", as: "lighttobles" } },
            { $unwind: "$lighttobles" },
            { $lookup: { from: "bles", localField: "lighttobles.bleId", foreignField: "_id", as: "bles" } },
            { $unwind: "$bles" },
        ],
        function(err, doc) {



            if (err) {
                console.log("Error: ", err)
                res.send(err);
            } else {
                res.send({ sensorlist: doc, msg: "Sensors Not found" });
            }

        })
}

exports.getLightsHost = function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    var hid = mongoose.Types.ObjectId(data.hostId);
    LightModel.aggregate(
        [{ $match: { "floorId": fid, "hostId": hid } },
            // { $lookup: { from: "lightsensortobles", localField: "_id", foreignField: "lights", as: "sensors" } },
            // {$unwind:"$sensors"},
            { $project: { "_id": 1, "floorId": 1, "hostId": 1, "wattage": 1, "faderate": 1, "maxlevel": 1, "minlevel": 1, "name": 1, "class": 1, "height": 1, "width": 1, "posY": 1, "posX": 1, "rotate": 1, "sensorId": '$sensors._id' } }
        ],
        function(err, doc) {
            if (err) {
                console.log("Error: ", err)
                res.send(err);
            } else {
                res.send({ document: doc, msg: "Lights Not found" });
            }
        })
}

exports.getSensorsBle = function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    LightSensorModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $project: { "_id": 1, "floorId": 1, isDLS: 1, isSOS: 1, posY: 1, posX: 1, 'hostId': 1 } },
            { $lookup: { from: "lightsensortobles", localField: "_id", foreignField: "lightSensorId", as: "sensortobles" } },
            { $lookup: { from: "bles", localField: "sensortobles.bleId", foreignField: "_id", as: "bles" } },
            { $addFields: { bleAddress: "$bles.address", bleName: "$bles.name", bleIds: "$bles._id" } },
            { $project: { "_id": 1, "floorId": 1, "name": 1, "width": 1, "height": 1, "posX": 1, "posY": 1, 'hostId': 1, "bleAddress": 1, "isSOS": 1, "isDLS": 1, "bleName": 1, "bleIds": 1 } }
        ],
        function(err, doc) {
            if (err) {
                res.send(err);
            } else {
                res.send({ data: doc })
            }
        }
    )
}

exports.getTouchPanelBle = function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    TouchPanelModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $project: { "_id": 1, "floorId": 1, name: 1, posX: 1, posY: 1, 'hostId': 1 } },
            { $lookup: { from: "touchpaneltobles", localField: "_id", foreignField: "touchPanelId", as: "tptobles" } },
            { $lookup: { from: "bles", localField: "tptobles.bleId", foreignField: "_id", as: "bles" } },
            { $addFields: { bleAddress: "$bles.address", bleName: "$bles.name", bleIds: "$bles._id", "commissionStatus": "$bles.commissionStatus" } },
            { $project: { "_id": 1, "floorId": 1, "name": 1, "width": 1, "height": 1, "posX": 1, "posY": 1, 'hostId': 1, "bleAddress": 1, "bleName": 1, "bleIds": 1, "commissionStatus": 1 } }
        ],
        function(err, doc) {
            if (err) {
                res.send(err);
            } else {
                res.send({ data: doc })
            }
        }
    )
}
exports.getTouchPanelBles = function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    TouchPanelModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $project: { "_id": 1, "floorId": 1, name: 1, posX: 1, posY: 1, 'hostId': 1 } },
            { $lookup: { from: "touchpaneltobles", localField: "_id", foreignField: "touchPanelId", as: "tptobles" } },
            { $lookup: { from: "bles", localField: "tptobles.bleId", foreignField: "_id", as: "bles" } },
            // {$addFields:{bleAddress:"$bles.address",bleName:"$bles.name",bleIds:"$bles._id"}},
            { $unwind: "$bles" },
            { $project: { "_id": 1, "floorId": 1, "name": 1, "width": 1, "height": 1, "posX": 1, "posY": 1, 'hostId': 1, "bleAddress": "$bles.address", "bleName": "$bles.name", "bleIds": "$bles._id", "commissionStatus": "$bles.commissionStatus" } }
        ],
        function(err, doc) {
            if (err) {
                res.send(err);
            } else {
                res.send({ data: doc })
            }
        }
    )
}
exports.UpdateLight = function(req, res, next) {
    var data = req.body;
    var fid = mongoose.Types.ObjectId(data.floorId);
    var lid = mongoose.Types.ObjectId(data._id);
    LightModel.findOne({ "floorId": fid, "name": data.name, "_id": { "$ne": lid } }, function(err, light) {
        if (light) {
            res.send({ msg: 'light name already exists', status: false });
        } else {
            LightModel.findByIdAndUpdate(data._id, req.body, { new: true }, function(err, ulight) {
                if (err) {
                    res.send(err);
                } else {
                    res.send({ msg: 'Updated successfully', status: true });
                }
            })
        }
    })
};

exports.removeSelectedLights = function(req, res, next) {

    var data = req.body.selectedlights;
    var count = 0;
    var flag = false;

    data.forEach(function(item) {
        LightModel.remove({ "_id": mongoose.Types.ObjectId(item._id) }, function(err, light) {
            if (err) {
                console.log(err)
            } else {
                if (++count === data.length) {
                    flag = true;
                    res.send("Lights Removed successfully");
                }
            }
        });
    });
};

exports.removeSelectedSensors = function(req, res, next) {

    var data = req.body.selectedlights;
    var count = 0;
    var flag = false;

    data.forEach(function(item) {
        LightSensorModel.remove({ "_id": mongoose.Types.ObjectId(item._id) }, function(err, light) {
            if (err) {
                console.log(err)
            } else {
                if (++count === data.length) {
                    flag = true;
                    res.send("Sensors Removed successfully");
                }
            }
        });
    });
};
exports.removeSelectedTPs = function(req, res, next) {

    var data = req.body.selectedlights;
    var count = 0;
    var flag = false;

    data.forEach(function(item) {
        TouchPanelModel.remove({ "_id": mongoose.Types.ObjectId(item._id) }, function(err, light) {
            if (err) {
                console.log(err)
            } else {
                if (++count === data.length) {
                    flag = true;
                    res.send("Touch Panels Removed successfully");
                }
            }
        });
    });
};
exports.updateAllLightswithoutsensor = function(req, res, next) {
    var data = req.body.lights;
    CheckforDuplicates(data, LightModel, function(lightsrepeating) {

        if (lightsrepeating.length > 0) {
            var msg = "following lights are repeating against selected floor  " + JSON.stringify(lightsrepeating);
            res.send({ msg: msg, lights: data });
        } else {
            var count = 0;
            var flag = false;
            data.forEach(function(item) {
                // count = count + 1;
                LightModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item._id) }, item, function(err, seat) {

                    if (err) {

                        res.send(err);
                    } else if (flag === false && ++count === data.length) {
                        flag = true;
                        res.send({ msg: "Lights Updated successfully", lights: [] });
                    }
                });
            });
        }
    });
};

exports.updateAllDevicesWBle = function(req, res, next) {
    var data = req.body;
    var lights = data.lights;
    var sensors = data.sensors;
    var touchpanels = data.touchpanels;
    var lighsCount = lights.length;
    var sensorCount = sensors.length;
    var touchpanelscount = touchpanels.length;
    if (lighsCount > 0) {
        updateAllLights(lights, function(lightResponse) {
            if (sensorCount > 0) {
                if (lightResponse) {
                    console.log("lights updated")
                    updateAllSensors(sensors, function(sensorResponse) {
                        if (sensorResponse) {
                            console.log("sensors updated")
                            if (touchpanelscount > 0) {
                                console.log(touchpanels)
                                updateAllTouchPanels(touchpanels, function(tpResponse) {
                                    if (tpResponse) {

                                        res.send({ msg: "All devices updated successfully" });
                                    } else {
                                        res.status(500).json({ err: "Sensors and lights updated successfully. Touch panles failed." });
                                    }
                                });
                            } else {
                                res.status(200).json({ msg: "No touchpanels to update." });
                            }
                        } else {
                            res.status(500).json({ err: "lights updated successfully. sensors failed." });
                        }
                    });
                } else {
                    res.status(500).json({ err: "Update device failed." });
                }
            } else {
                res.status(200).json({ msg: "No sensors to update." });
            }
        });
    } else {
        res.status(500).json({ err: "No data to update." });
    }
};

function CheckforDuplicates(data, model, callback) {
    var count = 0;
    var duplicates = [];
    data.forEach(function(item) {
        var fid = mongoose.Types.ObjectId(item.floorId);
        var id = mongoose.Types.ObjectId(item._id);
        var query = {};
        if (item.floorId) {
            query = { "floorId": fid, "name": item.name, "_id": { "$ne": id } }
        }
        model.findOne(query, function(err, doc) {
            count = count + 1;
            if (doc) {
                duplicates.push(doc.name);
                if (data.length === count) {
                    callback(duplicates);
                }
            } else if (data.length === count) {
                callback(duplicates);
            }
        });
    });
}

function updateAllLights(data, callback) {
    CheckforDuplicates(data, LightModel, function(lightsrepeating) {
        if (lightsrepeating.length > 0) {
            console.log("lights are repeating");
            callback(false);
        } else {
            var count = 0;
            var flag = false;
            data.forEach(function(item) {
                // count = count + 1;
                LightModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item._id) }, item, function(err, light) {

                    if (err) {
                        console.log(err);
                        callback(false);
                    } else if (flag === false && ++count === data.length) {
                        flag = true;
                        callback(true);
                    }
                });
            });
        }
    });
}

function updateAllSensors(data, callback) {
    CheckforDuplicates(data, LightSensorModel, function(sensorsrepeating) {
        if (sensorsrepeating.length > 0) {
            callback(false);
        } else {
            var count = 0;
            var flag = false;
            data.forEach(function(item) {
                // count = count + 1;
                LightSensorModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item._id) }, item, function(err, sensor) {

                    if (err) {
                        console.log(err)
                        callback(false);
                    } else if (flag === false && ++count === data.length) {
                        flag = true;
                        callback(true);
                    }
                });
            });
        }
    });
}

function updateAllTouchPanels(data, callback) {
    CheckforDuplicates(data, TouchPanelModel, function(tprepeating) {
        if (tprepeating.length > 0) {
            callback(false);
        } else {
            var count = 0;
            var flag = false;
            data.forEach(function(item) {
                // count = count + 1;
                TouchPanelModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item._id) }, item, function(err, tp) {

                    if (err) {
                        callback(false);
                    } else if (flag === false && ++count === data.length) {
                        flag = true;
                        callback(true);
                    }
                });
            });
        }
    });
}
exports.UpdateLightBle = function(req, res, next) {
    var data = req.body;
    var count = 0;
    var light = data.light;
    var lads = data.light.address;
    var ladCount = lads.length;
    var lid = mongoose.Types.ObjectId(light._id);
    var fid = mongoose.Types.ObjectId(light.floorId);

    LightToBleModel.remove({ floorId: fid, lightId: lid }, function(err, removed) {
        if (!err) {
            lads.forEach(function(lad) {
                if (lad.address) {
                    BleModel.findOne({ address: lad.address }, function(err, ble) {
                        if (!err) {
                            if (ble) {
                                // BLE present, insert to only lighttoble

                                createLighttoBle(fid, lid, ble._id, function(err, ltb) {
                                    if (err) {
                                        count++;
                                        res.status(500).json({ err: "could not create light to ble linkage" });
                                    } else {
                                        if (++count === ladCount) {
                                            res.send({ msg: "all lads sent", status: true });
                                        }
                                    }
                                });

                            } else {
                                // BLE not present, insert in ble model, lighttoble model
                                createble(lad.address, true, fid, function(err, bleCretaed) {
                                    if (err) {
                                        count++;
                                        res.status(500).json({ err: "could not create ble", errDetails: err });

                                    } else {
                                        createLighttoBle(fid, lid, bleCretaed._id, function(err, ltb) {
                                            if (err) {
                                                count++;
                                                res.status(500).json({ err: "could not create light to ble linkage" });
                                            } else {
                                                if (++count === ladCount) {
                                                    res.send({ msg: "all lads sent", status: true });
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        } else {
                            if (++count === ladCount) {
                                res.send({ err: err });
                            }
                        }
                    });
                } else if (++count === ladCount) {
                    res.send({ msg: "all lads sent", status: true });
                }
            });
        } else {
            res.send({ msg: "something went wrong. Please try again later" })
        }
    });
};

exports.UpdateDeviceAddress = function(req, res, next) {
    var data = req.body;
    var fid = mongoose.Types.ObjectId(req.params.floorId)
    var deviceDetail = data.device;
    var deviceType = data.deviceType;
    var addresses = deviceDetail.bleAddress;
    var bleIds = deviceDetail.bleIds;

    if (deviceType == 1) {
        console.log("edit Light address");
        updateLightAddress(deviceDetail, addresses, fid, function(err, result) {
            if (result) {
                res.status(200).json({ msg: "successfully removed", status: true });
            } else {
                res.status(500).json({ msg: "something went wrong", status: fase });
            }
        });
    } else if (deviceType == 2) {
        console.log("edit sensor address");
        updateSensorAddress(deviceDetail, addresses, fid, function(err, result) {
            if (result) {
                res.status(200).json({ msg: "successfully removed", status: true });
            } else {
                res.status(500).json({ msg: "something went wrong", status: fase });
            }
        });
    } else if (deviceType == 3) {
        console.log("edit touch panel address");
        updateTouchPanelAddress(deviceDetail, addresses, fid, function(err, result) {
            if (result) {
                res.status(200).json({ msg: "successfully removed", status: true });
            } else {
                res.status(500).json({ msg: "something went wrong", status: fase });
            }
        });
    }
}

function updateLightAddress(light, addresses, fid, callback) {
    var count = 0;
    var pending = addresses.length;
    LightToBleModel.find({ lightId: light._id }, function(err, data) {
        pending = data.length;
        count = 0;
        data.forEach(function(lb) {
            console.log(lb)
            BleModel.findOne({ floorId: fid, _id: lb.bleId }, function(err, ble) {
                if (err) {
                    callback(true, false)
                } else {
                    console.log("bleeeeeeee", ble)
                    if (_.includes(addresses, ble.address)) {
                        // console.log("exists");
                        console.log("address", addresses)
                        if (++count == pending) {
                            callback(false, true)
                        }
                    } else {
                        LightToBleModel.remove({ bleId: ble._id, lightId: light._id }, function(err, removed) {
                            console.log("removed", removed)
                            if (err) {
                                console.log("something went wrong when removing")
                                callback(true, false)
                            } else {
                                console.log("removed successfully");
                                LightToBleModel.find({ bleId: ble._id }, function(err, ltb) {
                                    console.log("ltttb", ltb)
                                    if (err) {
                                        callback(true, false);
                                    } else {
                                        console.log("printing ltb");
                                        console.log(ltb);
                                        if (ltb.length == 0) {
                                            BleModel.findByIdAndUpdate(ble._id, { $set: { mapped: false } }, function(err, updated) {
                                                console.log("updated", updated);
                                                if (err) {
                                                    callback(true, false);
                                                } else {
                                                    if (++count == pending) {
                                                        callback(false, true)
                                                    }
                                                }
                                            })
                                        } else {
                                            if (++count == pending) {
                                                callback(false, true)
                                            }
                                        }
                                    }
                                })
                            }
                        })
                    }
                }
            });
        });
    });
}

function updateSensorAddress(sensor, addresses, fid, callback) {
    console.log("called")
    console.log(sensor)
    var count = 0;
    var pending = addresses.length;
    LightSensorToBleModel.find({ lightSensorId: sensor._id }, function(err, data) {
        if (err) {
            callback(true, false)
        } else {
            if (data.length) {
                pending = data.length;
                count = 0;
                data.forEach(function(lb) {
                    BleModel.findOne({ floorId: fid, _id: lb.bleId }, function(err, ble) {
                        if (err) {
                            callback(true, false)
                        } else {
                            if (_.includes(addresses, ble.address)) {
                                // console.log("exists");
                                if (++count == pending) {
                                    callback(false, true)
                                }
                            } else {
                                LightSensorToBleModel.remove({ bleId: ble._id, lightSensorId: sensor._id }, function(err, removed) {
                                    if (err) {
                                        console.log("something went wrong when removing")
                                        callback(true, false)
                                    } else {
                                        console.log("removed successfully");
                                        LightSensorToBleModel.find({ bleId: ble._id }, function(err, ltb) {
                                            if (err) {
                                                callback(true, false);
                                            } else {
                                                console.log("printing ltb");
                                                console.log(ltb);
                                                if (ltb.length == 0) {
                                                    BleModel.findByIdAndUpdate(ble._id, { $set: { mapped: false } }, function(err, updated) {
                                                        console.log("updated");
                                                        if (err) {
                                                            callback(true, false);
                                                        } else {
                                                            if (++count == pending) {
                                                                callback(false, true)
                                                            }
                                                        }
                                                    })
                                                } else {
                                                    if (++count == pending) {
                                                        callback(false, true)
                                                    }
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        }
                    });
                });
            } else {
                callback(true, false);
            }
        }
    });
}

function updateTouchPanelAddress(touchpanel, addresses, fid, callback) {
    var count = 0;
    var pending = addresses.length;
    TouchPanelToBleModel.find({ touchPanelId: touchpanel._id }, function(err, data) {
        pending = data.length;
        count = 0;
        data.forEach(function(lb) {
            BleModel.findOne({ floorId: fid, _id: lb.bleId }, function(err, ble) {
                if (err) {
                    callback(true, false)
                } else {
                    if (_.includes(addresses, ble.address)) {
                        // console.log("exists");
                        if (++count == pending) {
                            callback(false, true)
                        }
                    } else {
                        TouchPanelToBleModel.remove({ bleId: ble._id, touchPanelId: touchpanel._id }, function(err, removed) {
                            if (err) {
                                console.log("something went wrong when removing")
                                callback(true, false)
                            } else {
                                console.log("removed successfully");
                                TouchPanelToBleModel.find({ bleId: ble._id }, function(err, ltb) {
                                    if (err) {
                                        callback(true, false);
                                    } else {
                                        console.log("printing ltb");
                                        console.log(ltb);
                                        if (ltb.length == 0) {
                                            BleModel.findByIdAndUpdate(ble._id, { $set: { mapped: false } }, function(err, updated) {
                                                console.log("updated");
                                                if (err) {
                                                    callback(true, false);
                                                } else {
                                                    if (++count == pending) {
                                                        callback(false, true)
                                                    }
                                                }
                                            })
                                        } else {
                                            if (++count == pending) {
                                                callback(false, true)
                                            }
                                        }
                                    }
                                })
                            }
                        })
                    }
                }
            });
        });
    });
}

exports.getsensorsWBles = function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    LightSensorModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $project: { "_id": 1, "floorId": 1, "hostId": 1, "name": 1, "isSOS": 1, "isDLS": 1, "posY": 1, "posX": 1 } }
        ],
        function(err, doc) {
            if (err) {
                res.send(err);
            } else {
                res.send({ sensorlist: doc, msg: "Sensors Not found" });
            }
        });
};

exports.getTouchPanelsWBles = function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    TouchPanelModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $project: { "_id": 1, "floorId": 1, "hostId": 1, "name": 1, "posY": 1, "posX": 1, "bles.address": 1, "bles._id": 1, "touchPaneltobles._id": 1, "touchPaneltobles.lights": 1, "touchPaneltobles.sensors": 1 } }
        ],
        function(err, doc) {
            if (err) {
                res.send(err);
            } else {
                res.send({ tplist: doc, msg: "Touch Panels found" });
            }

        });
};

exports.creatsensors = function(req, res, next) {
    var count = 0;
    var sensorcategorycount = req.body.sensorcount.length;
    var sensorcount = 0;
    var addresscount = 0;
    var fid = req.params.floorId;
    var buid = req.body.buid;
    var c = 0;
    insertlightsensors(sensorcount, addresscount, fid, buid, count);

    function insertlightsensors(sensorcount, addresscount, fid, buid, count) {
        LightSensorModel.find({ floorId: mongoose.Types.ObjectId(fid) }, function(err, lights) {
            if (lights) {
                sensorcount = lights.length;
                addresscount = lights.length;
            }
            var nos = req.body.sensorcount[count].count;
            var type = req.body.sensorType;
            var posx = req.body.sensorcount[count].posx;
            insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, type, c, posx, function(err, success) {
                if (err) {
                    res.send({ msg: "Somthing went wrong. Please try again", status: false });
                } else {
                    count = count + 1;
                    if (count === sensorcategorycount) {
                        res.send({ msg: "Sensors saved successfully", status: true });
                    } else {
                        insertlightsensors(sensorcount, addresscount, fid, buid, count);
                    }
                }
            });
        });
    }
};

exports.updatesensor = function(req, res, next) {
    var data = req.body;
    var fid = mongoose.Types.ObjectId(data.floorId);
    var sid = mongoose.Types.ObjectId(data._id);
    var bleid = mongoose.Types.ObjectId(data.bles._id);
    LightSensorModel.findOne({ "floorId": fid, "name": data.name, isDLS: data.isDLS, isSOS: data.isSOS, "_id": { "$ne": sid } }, function(err, sensor) {
        if (sensor) {
            res.send({ msg: 'Sensor name already exists', status: false });
        } else {
            BleModel.findOne({ "floorId": fid, "address": data.bles.address, "_id": { "$ne": bleid } }, function(err, ble) {
                if (ble) {
                    res.send({ msg: 'Address already exists', status: false });
                } else {
                    LightSensorModel.findByIdAndUpdate(data._id, req.body, { new: true }, function(err, usensor) {
                        if (err) {
                            res.send(err);
                        } else {
                            BleModel.findByIdAndUpdate(data.bles._id, { $set: { address: data.bles.address, isCOS: true } }, { new: true }, function(err, iuble) {
                                if (err) {
                                    res.send(err);
                                } else {
                                    res.send({ msg: 'Updated successfully', status: true });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

exports.createTouchPanels = function(req, res, next) {
    var count = 0;
    var panelcategorycount = req.body.panelcount.length;
    var panelcount = 0;
    var addresscount = 0;
    var fid = req.params.floorId;
    var buid = req.body.buid;
    var c = 0;
    inserttouchpanels(panelcount, addresscount, fid, buid, count);

    function inserttouchpanels(panelcount, addresscount, fid, buid, count) {
        TouchPanelModel.find({ floorId: mongoose.Types.ObjectId(fid) }, function(err, panels) {
            if (panels) {
                panelcount = panels.length;
                addresscount = panels.length;
            }
            var nos = req.body.panelcount[count].count;
            var type = req.body.sensorType;
            var posx = req.body.panelcount[count].posx;
            insertmultipletouchpanels(panelcount, addresscount, fid, buid, nos, type, c, posx, function(err, success) {
                if (err) {
                    res.send({ msg: "Somthing went wrong. Please try again", status: false });
                } else {
                    count++;
                    if (count === panelcategorycount) {
                        res.send({ msg: "Sensors saved successfully", status: true });
                    } else {
                        inserttouchpanels(panelcount, addresscount, fid, buid, count);
                    }
                }
            });
        });
    }
};

exports.savetouchPanelPosition = function(req, res, next) {
    var data = req.body.sensors;
    var count = 0;
    var flag = false;
    data.forEach(function(item) {
        count = count + 1;
        TouchPanelModel.findByIdAndUpdate(item._id, item, function(err, sensor) {
            if (err) {
                if (flag === false && count === data.length) {
                    res.send({ msg: "Updated successfully" });
                }
            } else if (flag === false && count === data.length) {
                flag = true;
                res.send({ msg: "Updated successfully" });
            }
        });
    });
};

exports.getTouchPanels = function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    TouchPanelModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $lookup: { from: "touchpaneltobles", localField: "_id", foreignField: "touchPanelId", as: "touchPaneltobles" } },
            { $unwind: "$touchPaneltobles" },
            { $lookup: { from: "bles", localField: "touchPaneltobles.bleId", foreignField: "_id", as: "bles" } },
            { $unwind: "$bles" },
            { $project: { "_id": 1, "floorId": 1, "hostId": 1, "name": 1, "posY": 1, "posX": 1, "bles.address": 1, "bles._id": 1, "touchPaneltobles._id": 1, "touchPaneltobles.lights": 1, "touchPaneltobles.sensors": 1 } }
        ],
        function(err, doc) {
            if (err) {
                res.send(err);
            } else {
                res.send({ tplist: doc, msg: "Touch Panels found" });
            }
        });
};

exports.updateTouchPanel = function(req, res, next) {
    var data = req.body;
    var fid = mongoose.Types.ObjectId(data.floorId);
    var sid = mongoose.Types.ObjectId(data._id);
    var bleid = mongoose.Types.ObjectId(data.bles._id);
    TouchPanelModel.findOne({ "floorId": fid, "name": data.name, "_id": { "$ne": sid } }, function(err, tp) {
        if (tp) {
            res.send({ msg: 'Touch Panel name already exists', status: false });
        } else {
            BleModel.findOne({ "floorId": fid, "address": data.bles.address, "_id": { "$ne": bleid } }, function(err, ble) {
                if (ble) {
                    res.send({ msg: 'Address already exists', status: false });
                } else {
                    TouchPanelModel.findByIdAndUpdate(data._id, req.body, { new: true }, function(err, utp) {
                        if (err) {
                            res.send(err);
                        } else {
                            BleModel.findByIdAndUpdate(data.bles._id, { $set: { address: data.bles.address, isTP: true } }, { new: true }, function(err, iuble) {
                                if (err) {
                                    res.send(err);
                                } else {
                                    res.send({ msg: 'Updated successfully', status: true });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

exports.removeTouchPanel = function(req, res, next) {
    var data = req.body;
    TouchPanelModel.remove({ "_id": mongoose.Types.ObjectId(data._id) }, function(err, seat) {
        if (err) {
            res.send(err);
        } else {
            BleModel.remove({ "_id": mongoose.Types.ObjectId(data.bles._id) }, function(err, ble) {
                if (err) {
                    res.send(err);
                } else {
                    TouchPanelToBleModel.remove({ "_id": mongoose.Types.ObjectId(data.touchPaneltobles._id) }, function(err, seatToBle) {
                        if (err) {
                            res.send(err)
                        } else {
                            res.send("Touch Panel removed successfully");

                        }
                    });
                }
            });
        }
    });
};

exports.checkLightTouchpanelMapping = function(req, res, next) {
    var ids = req.body.lightsids;
    TouchPanelToBleModel.findOne({ "touchPanelId": { "$ne": mongoose.Types.ObjectId(req.body.touchPanelId) }, "lights": { "$in": ids.map(function(item) { return mongoose.Types.ObjectId(item) }) } }, function(err, sensormapping) {
        if (sensormapping) {
            res.send({ status: true });
        } else {
            res.send({ status: false });
        }
    })
};

exports.MapSelectedLightswithTP = function(req, res, next) {
    var data = req.body.lights;
    var count = 0;
    var flag = false;
    TouchPanelToBleModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(req.body.touchpanelid) }, { "$set": { "lights": [] } }, { new: true }, function(err, response) {
        if (err) {
            res.send({ msg: "Something went wrong. Please try again", sensor: response });
        } else if (data.length > 0) {
            TouchPanelToBleModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(req.body.touchpanelid) }, { $addToSet: { lights: { $each: data } } }, { new: true }, function(err, response) {
                if (err) {
                    res.send({ msg: "Something went wrong. Please try again", sensor: response });
                } else {

                    res.send({ msg: "Updated successfully", sensor: response });
                }
            });
        } else {
            res.send({ msg: "Updated successfully", sensor: response });
        }
    });
};

exports.getAllBles = function(req, res, next) {
    var fid = req.params.floorId;
    var lightBles = [];
    var dlsBles = [];
    var sosBles = [];
    var tpBles = [];
    BleModel.find({ floorId: mongoose.Types.ObjectId(fid) }, function(err, data) {
        data.forEach(function(ble) {
            if (ble.isLAD == true) {
                lightBles.push(ble)
            } else if (ble.isTP == true) {
                tpBles.push(ble)
            } else if (ble.isCOS == true) {
                sosBles.push(ble);
            } else if (ble.isDLS == true) {
                dlsBles.push(ble)
            }
        })
        res.json({ bles: data, lightBles: lightBles, TPBles: tpBles, SOSBles: sosBles, DLSBles: dlsBles });
    })
}

exports.getModBusValues = function(req, res, next) {
    var data = req.body
    console.log(data)
    console.log("here in read")
    res.json({ occupancy: true, temperature: "25.67", address: "0x0001" })
}

exports.postModBusValues = async function(req, res, next) {
    var data = req.body
    console.log(data)
    var ble = data.ble
    var value = data.value
    ip = await (getHostIpBle(ble));
    intensity = value
    data = {
        sensorble: ble,
        intensity: intensity
    }
    sendModbusCommandHost(ip, data)
    res.json({ occupancy: true, temperature: "25.67", address: "0x0001" })
}


async function getHostIpBle(ble) {
    console.log(ble)
    var bleDetails = await BleModel.findOne({ address: ble }).populate({ path: 'hostId', select: 'ip' });
    console.log(bleDetails.hostId.ip)
    return bleDetails.hostId.ip;
}
async function sendModbusCommandHost(ip, data) {
    var options = {
        method: 'POST',
        uri: "http://" + ip + ":" + port + "/setsensorIntensity",
        json: true,
        formData: data
    };
    let response = await requestp(options)
    if (response.error) {
        // console.log("error")
        console.log(response.error)
        return response
    } else {
        console.log("success response")
        return response
    }
}

async function commissionLight(light) {
    // Single Ble per light handled.
    // TODO: need to handle multiple ble per light
    var lightBle = await LightToBleModel.findOne({ lightId: mongoose.Types.ObjectId(light._id) }).populate({ path: 'bleId', select: 'address' })
    if (lightBle) {
        var host = await HostModel.findOne({ _id: mongoose.Types.ObjectId(light.hostId) });
        var hostIp = host.ip
            // console.log(hostIp)
        if (hostIp) {
            console.log("in sending command if")
            return await hostCommissionDevice(lightBle.bleId.address, hostIp, 'light')

        } else {
            return false
        }
    } else {
        return false;
    }
}

exports.MapDevciesWithHost = function(req, res, next) {
    var lightslist = req.body.lights;
    var sensorslist = req.body.sensors;
    var touchpanellist = req.body.touchpanels;
    lightIds = lightslist.map(function(item) { return item._id });
    sensorIds = sensorslist.map(function(item) { return item._id });
    tpIds = touchpanellist.map(function(item) { return item._id });
    hostId = req.body.hid;
    LightModel.update({ hostId: mongoose.Types.ObjectId(req.body.hid) }, { $unset: { hostId: "" } }, { multi: true }, function(err, lights) {
        LightSensorModel.update({ hostId: mongoose.Types.ObjectId(req.body.hid) }, { $unset: { hostId: "" } }, { multi: true }, function(err, sensors) {
            TouchPanelModel.update({ hostId: mongoose.Types.ObjectId(req.body.hid) }, { $unset: { hostId: "" } }, { multi: true }, function(err, sensors) {
                LightModel.update({ "_id": { "$in": lightslist.map(function(item) { return item._id }) } }, { $set: { hostId: req.body.hid } }, { multi: true },
                    function(err, light) {
                        if (err) {
                            console.log(err);
                            res.send(err)
                        } else {
                            LightSensorModel.update({ "_id": { "$in": sensorslist.map(function(item) { return item._id }) } }, { $set: { hostId: req.body.hid } }, { multi: true }, function(err, ble) {
                                if (err) {
                                    res.send(err)
                                } else {
                                    TouchPanelModel.update({ "_id": { "$in": touchpanellist.map(function(item) { return item._id }) } }, { $set: { hostId: req.body.hid } }, { multi: true }, function(err, tp) {
                                        if (err) {
                                            res.send(err)
                                        } else {
                                            console.log(tpIds)
                                            updateBlesHostId(lightIds, sensorIds, tpIds, req.body.hid, function(err, success) {})

                                        }
                                        res.send({ msg: "Done" });
                                    });
                                }
                            });
                        }
                    });
            })
        });

    });
};

function updateBlesHostId(lightslist, sensorslist, touchpanellist, hostId, callback) {
    console.log(touchpanellist)
    bleIds = [];
    counter = 0;
    LightToBleModel.find({ lightId: { $in: lightslist } }, { _id: 0, bleId: 1 }, function(err, lightbles) {
        // console.log(bles)
        lightbleIds = lightbles.map(function(item) { return item.bleId });
        // console.log(lightbleIds)
        bleIds = bleIds.concat(lightbleIds);
        LightSensorToBleModel.find({ lightSensorId: { $in: sensorslist } }, { _id: 0, bleId: 1 }, function(err, lightSensorbles) {
            lightSensorBleIds = lightSensorbles.map(function(item) { return item.bleId });
            bleIds = bleIds.concat(lightSensorBleIds);
            TouchPanelToBleModel.find({ touchPanelId: { $in: touchpanellist } }, { _id: 0, bleId: 1 }, function(err, touchpanelBles) {
                console.log(touchpanelBles)
                touchPanelBleIds = touchpanelBles.map(function(item) { return item.bleId })
                bleIds = bleIds.concat(touchPanelBleIds);
                // console.log("printing bles")
                // console.log(bleIds)

                bleIds.forEach(function(ble) {
                    BleModel.update({ _id: ble }, { $set: { hostId: mongoose.Types.ObjectId(hostId) } }).then(function(err) {
                        if (++counter == bleIds.length) {
                            callback(false, true);
                        }
                    })
                })
            })
        })
    })

}

exports.publishHostDevices = async function(req, res, next) {
    var hostId = req.body.cloudConfig.host.id;
    var hostData = {};
    hostData.lights = [];
    hostData.tunables = [];
    hostData.bles = [];
    hostData.bleTunLights = [];
    hostData.sensors = [];
    hostData.touchpanels = [];
    const exec = require('child_process').exec;
    let cmd = "hostname -I";
    exec(cmd, function(error, stdout, stderr) {
        localIps = stdout.replace(/(\r\n\t|\n|\r\t)/gm, '').split(" ");
        localIps = localIps.filter(Boolean);
        localIp = localIps[0]
    })
    var floorId = req.body.cloudConfig.host.floorId;
    HostModel.findOne({ _id: mongoose.Types.ObjectId(hostId) }, function(err, hosts) {
        hostInfo = {}
        hostInfo.name = hosts.name;
        hostInfo.ip = hosts.ip;

        getAllBlesHost(floorId, hostId, function(allBles) {
            getAllLightsHost(floorId, hostId, function(allLights, allTunLigts) {
                getAllLightsHostBle(hostId, function(BleLights, BleTunLights) {
                    getAllSesnorsHost(hostId, function(sensors) {
                        getAllTouchPanelHost(hostId, function(touchpanels) {
                            getAllZonesHost(hostId, function(zones) {
                                hostData.bles = allBles;
                                hostData.lights = allLights;
                                hostData.tunables = allTunLigts;
                                hostData.bleLights = BleLights;
                                hostData.bleTunLights = BleTunLights;
                                hostData.host = hostInfo;
                                hostData.touchpanels = touchpanels;
                                hostData.sensors = sensors;
                                hostData.zoneData = zones;
                                hostData.serverIp = localIp;
                                try {
                                    // JSON.parse(postD);
                                    postD = (hostData)
                                    console.log("postd", postD)
                                } catch (e) {
                                    console.log("not JSON");
                                }
                                var options = {
                                    method: 'POST',
                                    uri: "http://" + hostInfo.ip + ":" + port + "/pullhostdata",
                                    body: {
                                        data: postD
                                    },
                                    json: true
                                };
                                requestp(options)
                                    .then(function(parsedBody) {
                                        console.log("okkkk", parsedBody)
                                        res.status(200).json({ msg: parsedBody.msg })
                                    })
                                    .catch(function(err) {
                                        console.log(err)
                                        res.status(500).json({ err: err.message })
                                    });
                            });
                        });
                    });
                });
            });
        })
    });
}

exports.hostAutoCommssioning = async function(req, res, next) {
    var host = req.body.host
    var resp = await hostCommissionDevices(host);
    for (data of resp) {
        if (data.status == true) {
            var commissionStatus = true
        } else {
            console.log("commission failed")
            var commissionStatus = false
        }
        var update = await BleModel.update({ address: data.ble, hostId: mongoose.Types.ObjectId(host.id) }, { commissionStatus: commissionStatus })
            // console.log(update)
    }
    res.status(200).json({ msg: "Success" })
}

async function hostCommissionDevices(host) {
    ip = host.ip
    var options = {
        method: 'GET',
        uri: "http://" + ip + ":" + port + "/startAutoCommissioning",
        json: true
    };
    let response = await requestp(options)
    if (response.error) {
        // console.log("error")
        // console.log(response.error)
        return response
    } else {
        // console.log("success response")
        return response
    }
}

exports.deviceCommission = async function(req, res, next) {
    data = req.body;
    deviceType = parseInt(data.type);
    device = data.device;
    commissionRespons = ''
    if (deviceType == 1) {
        var commissionResponse = await commissionLight(device)
    } else if (deviceType == 2) {
        var commissionResponse = await commissionLightSensor(device)
    } else if (deviceType == 3) {
        var commissionResponse = await commissionTouchPanel(device)
    }
    if (commissionResponse) {
        if (commissionResponse.status == 200) {
            res.status(200).json({ msg: commissionResponse.msg })
        } else {
            console.log("commissionResponse")
            console.log(commissionResponse)
            res.status(500).json({ err: commissionResponse.msg })
        }
    } else {
        res.status(500).json({ err: "Something went wrong" })
    }

}
async function commissionLight(light) {
    // Single Ble per light handled.
    // TODO: need to handle multiple ble per light
    var lightBle = await LightToBleModel.findOne({ lightId: mongoose.Types.ObjectId(light._id) }).populate({ path: 'bleId', select: 'address' })
    if (lightBle) {
        var host = await HostModel.findOne({ _id: mongoose.Types.ObjectId(light.hostId) });
        var hostIp = host.ip
            // console.log(hostIp)
        if (hostIp) {
            console.log("in sending command if")
            return await hostCommissionDevice(lightBle.bleId.address, hostIp, 'light')

        } else {
            return false
        }
    } else {
        return false;
    }
}
async function commissionLightSensor(device) {
    var sensor = await LightSensorToBleModel.findOne({ lightSensorId: mongoose.Types.ObjectId(device._id) }).populate({ path: 'lightSensorId', select: 'isSOS isDLS' }).populate({ path: 'bleId', select: 'address' })
    var host = await HostModel.findOne({ _id: mongoose.Types.ObjectId(device.hostId) });
    var hostIp = host.ip
    var address = sensor.bleId.address

    if (sensor) {
        if (sensor.lightSensorId.iSOS) {
            return await hostCommissionDevice(address, hostIp, 'SOS')
        } else if (sensor.lightSensorId.isDLS) {
            return await hostCommissionDevice(address, hostIp, 'DLS')
        }
    } else {
        return false
    }

}
async function hostCommissionDevice(address, ip, deviceName) {
    ip = ip
    postData = {}
    postData.address = address
    console.log(postData)
    var options = {
        method: 'POST',
        uri: "http://" + ip + ":" + port + "/commission" + deviceName,
        body: postData,
        json: true
    };
    try {
        var response = await requestp(options)
        if (response.error) {
            return ({ msg: response, status: 200 })
        } else {
            return ({ msg: response, status: 200 })
        }
    } catch (err) {
        return ({ msg: err.error.err, status: 500 })
    }
}


async function getHostIp(hostId) {
    // Get host ip from host model, and then return
    console.log("prinitng hostId" + hostId)
    await HostModel.findOne({ _id: mongoose.Types.ObjectId(hostId) }, function(err, doc) {
        if (!err) {
            console.log(doc.ip)
            return doc.ip
        } else {
            return false
        }
    })
}

async function getSensorType(sensorId) {
    console.log(sensorId)
    await LightSensorModel.findOne({ _id: mongoose.Types.ObjectId(sensorId) }, function(err, doc) {
        if (!err) {
            if (doc.isSOS == true) {
                return "SOS"
            } else if (doc.isDLS == true) {
                console.log("here")
                return "DLS"
            } else {
                return false
            }
        } else {
            return false
        }
    })
}

exports.sendCommandToDevice = async function(req, res, next) {

    let response;
    postData = {}
    console.log("response12344", req.body)
    postData.ble = req.body.address;
    postData.type = 1;
    postData.cmd = req.body.command;

    ip = req.body.hostIp;
    deviceType = parseInt(req.body.deviceType);
    switch (deviceType) {
        case 1:
            sendCommandToLight();
            break;
        case 2:
            sendCommandToOccSensor();
            break;
        case 3:
            sendCommandToDayLightSensor();
            break;
        case 4:
            sendCommandToTouchPanel();
            break;
    }

    async function sendCommandToLight() {
        try {
            response = await sendLightCommand(1, postData, ip)
            res.status(200).json({ response })
        } catch (err) {
            // console.log()
            res.status(500).json({ err: err.message })
        }
    }
    async function sendCommandToOccSensor() {
        try {
            console.log("in function")
            response = await sendOccupancySensorCommand(1, postData, ip)
            console.log(response)
            res.status(200).json({ response })
        } catch (err) {
            // console.log()
            res.status(500).json({ err: err.message })
        }
    }
    async function sendCommandToDayLightSensor() {
        try {
            response = await sendDayLightCommand(1, postData, ip)
            res.status(200).json({ response })
        } catch (err) {
            // console.log()
            res.status(500).json({ err: err.message })
        }
    }
    async function sendCommandToTouchPanel() {
        try {
            response = await sendTouchPanelCommand(1, postData, ip)
            res.status(200).json({ response })
        } catch (err) {
            // console.log()
            res.status(500).json({ err: err.message })
        }
    }
}

async function sendLightCommand(deviceId, postData, ip) {
    var options = {
        method: 'POST',
        uri: "http://" + ip + ":" + port + "/getCommandFromServer",
        body: {
            data: postData
        },
        json: true
    };
    try {
        var response = await requestp(options)

        if (response) {
            console.log("error")
            console.log("res12312323", response)
            return response
        }
    } catch (err) {
        console.log(err)
        return err
            // res.status(500).json({ err: err.message })
    }
}

async function sendOccupancySensorCommand(deviceId, postData, ip) {
    return "success,occ sensor command sent"
}

async function sendDayLightCommand(deviceId, postData, ip) {
    return "success, daylight sensor command sent"
}

async function sendTouchPanelCommand(deviceId, postData, ip) {
    return "success, touchpanel command sent"
}

exports.getHostDevices = function(req, res, next) {
    var hostId = req.body.cloudConfig.host.id;
    var hostData = {};
    hostData.lights = [];
    hostData.bles = [];
    hostData.tunableLights = [];
    hostData.sensors = [];
    hostData.bleTunLights = [];
    hostData.touchpanels = [];
    var localIp;
    var floorId = req.body.cloudConfig.host.floorId;
    const exec = require('child_process').exec;
    let cmd = "hostname -I";
    exec(cmd, function(error, stdout, stderr) {
        localIps = stdout.replace(/(\r\n\t|\n|\r\t)/gm, '').split(" ");
        localIps = localIps.filter(Boolean);
        localIp = localIps[0]
    })
    HostModel.findOne({ _id: mongoose.Types.ObjectId(hostId) }, function(err, hosts) {
        hostInfo = {}
        hostInfo.name = hosts.name;
        hostInfo.ip = hosts.ip;

        getAllBlesHost(floorId, hostId, function(allBles) {
            getAllLightsHost(floorId, hostId, function(allLights, allTunLigts) {
                getAllLightsHostBle(hostId, function(BleLights, BleTunLights) {
                    getAllSesnorsHost(hostId, function(sensors) {
                        getAllTouchPanelHost(hostId, function(touchpanels) {
                            getAllZonesHost(hostId, function(zones) {
                                hostData.bles = allBles;
                                hostData.lights = allLights;
                                hostData.tunableLights = allTunLigts;
                                hostData.bleLights = BleLights;
                                hostData.bleTunLights = BleTunLights;
                                hostData.host = hostInfo;
                                hostData.touchpanels = touchpanels;
                                hostData.sensors = sensors;
                                hostData.zoneData = zones;
                                hostData.serverIp = localIp;
                                res.send(hostData);
                            });
                        });
                    });
                });
            });
        })
    });
};

function getAllBlesHost(floorId, hostId, callback) {
    BleModel.find({ floorId: mongoose.Types.ObjectId(floorId), hostId: mongoose.Types.ObjectId(hostId), mapped: true }, { _id: 0, floorId: 0, hostId: 0, id: 0 }, function(err, bles) {
        if (!err) {
            if (bles) {
                callback(bles)
            } else {
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}

function getAllZonesHost(hostId, callback) {
    var hostData = [];
    var incrementer = 0;
    ZoneModel.find({ hostId: mongoose.Types.ObjectId(hostId) }, function(err, zones) {
        if (zones.length > 0) {
            zones.forEach(function(zone) {
                var zoneData = {};
                zoneData.lights = [];
                zoneData.scenes = [];
                zoneData.schedules = [];
                var zoneId = zone._id;
                var zoneNum = zone.zoneId;
                zoneData.name = zone.name
                if (zone.lights.length > 0) {
                    getZoneLights(zoneId, zone.lights, function(lights) {
                        zoneData.lights = lights;
                        getZoneScenes(zoneId, zone.scenes, function(scenes) {
                            getZoneSchedules(zoneId, zone.schedules, function(schedules) {
                                zoneData.scenes = scenes;
                                zoneData.schedules = schedules;
                                zoneData.zoneNumber = zoneNum;
                                hostData.push(zoneData)

                                if (++incrementer == zones.length) {
                                    callback(hostData);
                                }
                            })
                        })
                    })
                } else {
                    hostData.push(zoneData);
                    if (++incrementer == zones.length) {
                        callback(zoneData);
                    }
                }

            })
        } else {
            callback([])
        }
    })
};

function getZoneLights(zoneId, lights, callback) {
    var lightsData = [];
    if (lights.length > 0) {
        LightModel.aggregate([{ $match: { "_id": { "$in": lights } } },
            { $project: { "name": 1, "_id": 0 } }
        ], function(err, doc) {
            if (err) {
                console.log(err)
                callback(false)
            } else {
                // console.log(doc)
                callback(doc);
            }
        });
    };
};

function getZoneScenes(zoneId, scenes, callback) {
    if (scenes.length > 0) {
        counter = 0;
        SceneModel.aggregate([{ $match: { "_id": { "$in": scenes } } },
            { $lookup: { from: "scenetolights", localField: "_id", foreignField: "sceneId", as: "scenetolights" } },
            { $project: { "name": 1, "sceneNumber": 1, "scenetolights.lightIntensity": 1, "scenetolights.lightId": 1 } },
            { $lookup: { from: "lights", localField: "scenetolights.lightId", foreignField: "_id", as: "lights" } },
            { $project: { "name": 1, "sceneNumber": 1, "lights.name": 1, "scenetolights.lightIntensity": 1, "scenetolights.lightId": 1, "lights._id": 1 } },
        ], function(err, doc) {
            if (doc) {
                if (doc.length > 0) {
                    console.log(doc)
                    doc.forEach(function(scene) {
                        scene.scenetolights.forEach(function(scenetolight) {
                            scene.lights.forEach(function(light) {
                                if (scenetolight.lightId.equals(light._id)) {
                                    light.lightIntensity = scenetolight.lightIntensity
                                    delete light._id
                                }
                            })
                        })
                        delete scene.scenetolights
                        delete scene._id
                    })
                    callback(doc)
                } else {
                    callback([])
                }
            } else {
                callback([]);
            }
        });
    } else {
        callback([]);
    }

}

function getZoneSchedules(zoneId, schedules, callback) {
    if (schedules.length > 0) {
        counter = 0;
        ScheduleModel.aggregate([{ $match: { "_id": { "$in": schedules } } },
            { $lookup: { from: "scheduletolights", localField: "_id", foreignField: "scheduleId", as: "scheduletolights" } },
            { $project: { "name": 1, "scheduletolights.lightIntensity": 1, "scheduletolights.lightId": 1, "days": 1, "startTime": 1, "endTime": 1 } },
            { $lookup: { from: "lights", localField: "scheduletolights.lightId", foreignField: "_id", as: "lights" } },
            { $project: { "name": 1, "lights.name": 1, "lights._id": 1, "scheduletolights.lightIntensity": 1, "scheduletolights.lightId": 1, "days": 1, "startTime": 1, "endTime": 1 } },
        ], function(err, doc) {
            if (doc) {
                doc.forEach(function(schedule) {
                    console.log(schedule)
                    schedule.scheduletolights.forEach(function(scheduletolight) {
                        schedule.lights.forEach(function(light) {
                            console.log(scheduletolight);
                            console.log(light)
                            if (scheduletolight.lightId.equals(light._id)) {
                                light.lightIntensity = scheduletolight.lightIntensity;
                                delete light._id
                            }
                        })
                    })
                    delete schedule.scheduletolights
                    delete schedule._id
                })
                callback(doc)
            } else {
                callback([])
            }
        });
    } else {
        callback([])
    }
}

function getAllZonesHost1(hostId, callback) {
    zoneData = []
    ZoneModel.aggregate(
        [{ $match: { "hostId": mongoose.Types.ObjectId(hostId) } },
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
            // { $lookup: { from: "hosts", localField: "Scenelights.hostId", foreignField: "_id", as: "Hosts" } },
            // { $unwind: "$Hosts" },
            { $project: { "name": 1, "zoneId": 1, "lights": 1, "scenes.name": 1, "scenetolights.lightIntensity": 1, "Scenelights.name": 1, "bles.address": 1 } }
        ],
        function(err, doc) {
            // console.log(doc)


            if (err) {
                res.status(500).send('Something went wrong. Please try again');
            } else if (doc.length > 0) {

                var lightdetails = { zones: [], scenes: [] };

                createlightdetailsObj(doc, lightdetails, function(detailedObjects) {

                    // console.log(JSON.stringify(detailedObjects));

                    callback(detailedObjects);
                    // console.log("done")

                });
            } else {
                ZoneModel.aggregate(
                    [{ $match: { "hostId": hostId } },
                        { $lookup: { from: "scenes", localField: "_id", foreignField: "zoneId", as: "scenes" } }

                    ],
                    function(err, doc) {
                        var lightdetails = { zones: [], scenes: [] };

                        createlightdetailsObj(doc, lightdetails, function(detailedObjects) {
                            callback(detailedObjects);
                            console.log("done")

                        });
                    })
            }

        })



};




function createlightdetailsObj(array, lightdetails, callback) {

    var count = 0;
    if (array.length > 0) {
        getZonelights();

        function getZonelights() {
            BleModel.aggregate([{ $match: { "_id": { "$in": array[count].lights } } },
                { $lookup: { from: "lighttobles", localField: "_id", foreignField: "bleId", as: "lighttobles" } },
                { $unwind: "$lighttobles" },
                { $lookup: { from: "lights", localField: "lighttobles.lightId", foreignField: "_id", as: "lights" } },
                { $unwind: "$lights" },
                { $project: { "address": 1, "lights.name": 1 } }
            ], function(err, doc) {

                var zoneobj = {};

                zoneobj.name = array[count].name;
                zoneobj.zoneId = array[count].zoneId;
                zoneobj.lights = [];
                if (array[count].scenes.name) {
                    var sceneobj = {};
                    sceneobj.name = array[count].scenes.name;
                    sceneobj.zoneName = zoneobj.name;
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
                checkforzonename(lightdetails.zones, array[count].name, function(zone, index) {
                    count = count + 1;
                    if (zone) {

                        for (var i = 0; i < doc.length; i++) {
                            var obj = {};
                            obj.name = doc[i].lights.name;
                            obj.address = doc[i].address;

                            lightdetails.zones[index].lights.push(obj);
                        }

                        lightdetails.zones[index].lights = removeDuplicates(lightdetails.zones[index].lights);
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
    } else {
        callback({});
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
    console.log("in removeduplicates" + arr)
    var elements = arr.reduce(function(previous, current) {

        var object = previous.filter(object => object.name === current.name);
        if (object.length == 0) {
            previous.push(current);
        }
        return previous;
    }, []);


    return elements;
}



function getAllLightsHost(floorId, hostId, callback) {
    LightModel.find({ floorId: mongoose.Types.ObjectId(floorId), hostId: mongoose.Types.ObjectId(hostId) }, { 'name': 1, 'wattage': 1, 'tofl': 1, 'faderate': 1, 'maxlevel': 1, 'minlevel': 1, 'rotate': 1, 'class': 1, 'height': 1, 'width': 1, 'isTunable': 1, 'posX': 1, 'posY': 1, hostId: 1, _id: 0 }).populate({ path: 'hostId', select: 'name' }).exec(function(err, lights) {
        if (!err) {


            var lightData = []
            var tunLightData = []
            if (lights) {
                // var lightData = [];
                lights.forEach(function(light) {
                    if (light.isTunable == false) {
                        li = {}
                        li.name = light.name;
                        li.host = light.hostId.name;
                        li.tofl = light.tofl;
                        li.wattage = light.wattage;
                        li.faderate = light.faderate;
                        li.maxlevel = light.maxlevel;
                        li.minlevel = light.minlevel;
                        li.posx = light.posX;
                        li.posy = light.posY;
                        li.height = light.height;
                        li.width = light.width;
                        li.rotate = light.rotate;
                        li.class = light.class;
                        lightData.push(li)
                    } else if (light.isTunable == true) {

                        var tunLi = {}
                        tunLi.name = light.name;
                        tunLi.host = light.hostId.name;
                        tunLi.tofl = light.tofl;
                        tunLi.wattage = light.wattage;
                        tunLi.faderate = light.faderate;
                        tunLi.maxlevel = light.maxlevel;
                        tunLi.minlevel = light.minlevel;
                        tunLi.posx = light.posX;
                        tunLi.posy = light.posY;
                        tunLi.height = light.height;
                        tunLi.width = light.width;
                        tunLi.rotate = light.rotate;
                        tunLi.class = light.class;
                        tunLightData.push(tunLi)

                    }


                });
                console.log("tunlight", tunLightData)
                callback(lightData, tunLightData)
            } else {
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}

function getAllLightsHostBle(hostId, callback) {
    LightModel.aggregate([
        { $match: { hostId: mongoose.Types.ObjectId(hostId) } },
        { $lookup: { from: "lighttobles", localField: "_id", foreignField: "lightId", as: "lighttobles" } }, { $unwind: "$lighttobles" },
        { $lookup: { from: "bles", localField: "lighttobles.bleId", foreignField: "_id", as: "bles" } }, { $unwind: "$bles" },
        { $project: { address: "$bles.address", "class": 1, "faderate": 1, "height": 1, "width": 1, "posX": 1, "posY": 1, "isTunable": 1, "name": 1 } },
        { $group: { _id: "$_id", addresses: { $push: "$address" }, name: { $first: "$name" }, class: { $first: "$class" }, posX: { $first: "posX" }, posY: { $first: "posY" }, width: { $first: "$width" }, isTunable: { $first: "$isTunable" }, height: { $first: "$height" }, faderate: { $first: "$faderate" } } },
        { $project: { _id: 0 } }
    ], function(err, lights) {
        // var lightData = [];
        var lightData = [];
        var tunLightData = [];
        lights.forEach(function(light) {
            if (light.isTunable == false) {
                li = {}
                li.address = light.addresses;
                console.log(li.address)
                li.name = light.name;
                li.class = light.class;
                li.posx = light.posX;
                li.posy = light.posY;
                li.height = light.height;
                li.width = light.width;
                li.faderate = light.faderate;

                lightData.push(li)
            } else if (light.isTunable == true) {
                var tunLi = {}
                tunLi.address = light.addresses;
                tunLi.name = light.name;
                tunLi.class = light.class;
                tunLi.posx = light.posX;
                tunLi.posy = light.posY;
                tunLi.height = light.height;
                tunLi.width = light.width;
                tunLi.faderate = light.faderate;


                tunLightData.push(tunLi)

            }


        });
        // console.log("lighttttts", lights)
        if (err) {
            console.log(err)
            callback([])
        } else {
            callback(lightData, tunLightData);
        }
    })

}

function getAllSesnorsHost(hostId, callback) {
    LightSensorModel.aggregate([
        { $match: { hostId: mongoose.Types.ObjectId(hostId) } },
        { $lookup: { from: "lightsensortobles", localField: "_id", foreignField: "lightSensorId", as: "lighttosensorbles" } }, { $unwind: "$lighttosensorbles" },
        { $lookup: { from: "bles", localField: "lighttosensorbles.bleId", foreignField: "_id", as: "bles" } }, { $unwind: "$bles" },
        { $project: { address: "$bles.address", "class": 1, "height": 1, "width": 1, "posX": 1, "posY": 1, "name": 1, "isDLS": 1, "isSOS": 1, "timeout": 1, "lights": "$lighttosensorbles.lights" } },
        { $lookup: { from: "lights", localField: "lights", foreignField: "_id", as: "light" } },
        { $project: { "address": 1, "class": 1, "faderate": 1, "height": 1, "width": 1, "posX": 1, "posY": 1, "name": 1, "isDLS": 1, "isSOS": 1, "timeout": 1, "lights": "$light.name", "_id": 0 } }
    ], function(err, sensors) {
        if (err) {
            console.log(err);
            callback([]);
        } else {
            callback(sensors);
        }
    });
}

function getAllTouchPanelHost(hostId, callback) {
    TouchPanelModel.aggregate([
        { $match: { hostId: mongoose.Types.ObjectId(hostId) } },
        { $lookup: { from: "touchpaneltobles", localField: "_id", foreignField: "touchPanelId", as: "touchpaneltobles" } }, { $unwind: "$touchpaneltobles" },
        { $lookup: { from: "bles", localField: "touchpaneltobles.bleId", foreignField: "_id", as: "bles" } }, { $unwind: "$bles" },
        { $project: { address: "$bles.address", "class": 1, "height": 1, "width": 1, "posX": 1, "posY": 1, "name": 1, "lights": "$touchpaneltobles.lights" } },
        { $lookup: { from: "lights", localField: "lights", foreignField: "_id", as: "light" } },
        { $project: { "address": 1, "class": 1, "height": 1, "width": 1, "posX": 1, "posY": 1, "name": 1, "lights": "$light.name", "_id": 0 } }
    ], function(err, touchpanels) {
        if (err) {
            console.log(err);
            callback([]);
        } else {
            if (touchpanels.length > 0) {
                callback(touchpanels);
            } else {
                callback([])
            }
        }
    });
}

exports.createHost = function(req, res, next) {
    var data = req.body;
    var bid = mongoose.Types.ObjectId(data.buildingId);
    var fid = mongoose.Types.ObjectId(data.floorId);
    var ip = data.ip;
    HostModel.findOne({ buildingId: bid, floorId: fid, name: data.name }, function(err, host) {
        if (host) {
            res.send("Host already exists for selected Floor and Bulding");
        } else {
            HostModel.findOne({ buildingId: bid, ip: ip }, function(err, h) {
                if (h) {
                    res.send("Host is already associated with a IP in the building.");
                } else {
                    var hostmodel = new HostModel(data);
                    hostmodel.save(function(err, doc) {
                        if (err)
                            res.send(err);
                        else {

                            res.send("Done");


                        }
                    });
                }
            })
        }
    });
}


exports.updateHost = function(req, res, next) {
    var data = req.body;
    var bid = mongoose.Types.ObjectId(data.buildingId);
    var fid = mongoose.Types.ObjectId(data.floorId);
    var hid = mongoose.Types.ObjectId(data.id);
    var ip = data.ip;
    if (data.ip) {
        ip = data.ip
    } else {
        ip = null;
        data.ip = '';
    }
    console.log("a")
    HostModel.findOne({ buildingId: bid, floorId: fid, name: data.name, "_id": { "$ne": hid } }, function(err, host) {
        if (host) {
            res.send("Host already exists for selected Floor and Bulding");
        } else {
            if (ip) {
                HostModel.findOne({ buildingId: bid, ip: ip, "_id": { "$ne": hid } }, function(err, h) {
                    if (h) {
                        res.send("Host is already associated with a IP in the building.");
                    } else {
                        HostModel.findByIdAndUpdate(data.id, data, { new: true }, function(err, uhost) {
                            if (err)
                                res.send(err);
                            else {

                                res.send({ host: uhost, msg: "Done" });

                            }
                        });
                    }
                })
            } else {
                HostModel.findByIdAndUpdate(data.id, data, { new: true }, function(err, uhost) {
                    if (err)
                        res.send(err);
                    else {

                        res.send({ host: uhost, msg: "Done" });

                    }
                });
            }

        }
    });
}

exports.uploadaddress = function(req, res, next) {
    var exceltojson;
    var filepath;
    var storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'public/uploads')
        },
        filename: function(req, file, cb) {
            var datetimestamp = Date.now();
            filepath = file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });
    var upload = multer({
        storage: storage,
        fileFilter: function(req, file, callback) {
            if (['xls', 'xlsx', 'xlsm'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {

                return callback(new Error('Wrong extension type'));
            }
            if (file.originalname.split('.')[file.originalname.split('.').length - 1] === 'xlsx' || file.originalname.split('.')[file.originalname.split('.').length - 1] === 'xlsm') {
                exceltojson = xlsxtojson;
            } else {
                exceltojson = xlstojson;
            }
            callback(null, true);
        }
    }).any();

    upload(req, res, function(err) {
        if (err) {
            res.send(err);
        } else {

            try {
                exceltojson({
                    input: 'public/uploads/' + filepath,
                    output: null, //since we don't need output.json
                    lowerCaseHeaders: true,
                    header: {
                        rows: 1
                    },
                    sheet: "Bles"
                }, function(err, result) {
                    if (err) {
                        return res.send(new Error('Corupted excel file'));
                    } else {
                        console.log(result)
                            // TODO: Check for duplicates in name and address and throw error if any 
                        validateaddress(result, req.params.floorId, function(err, response) {
                            if (err) {
                                res.send({ msg: "Duplicates not allowed", status: false, err: err });
                            } else {
                                var count = 0;
                                var fid = req.params.floorId;
                                var size = req.body.data.size;
                                var buid = req.body.data.buid;
                                var count = 0;
                                result.forEach(function(item) {
                                    var host = false,
                                        lad = false,
                                        sos = false,
                                        dls = false,
                                        pcs = false,
                                        temp = false,
                                        occ = false,
                                        density = false,
                                        tp = false,
                                        name = '',
                                        address = item.address;
                                    if (item.lad) { lad = item.lad; }
                                    if (item.sos) { sos = item.sos; }
                                    if (item.dls) { dls = item.dls; }
                                    if (item.pcs) { pcs = item.pcs; }
                                    if (item.touchpanel) { tp = item.touchpanel; }
                                    if (item.temperature) { temp = item.temperature; }
                                    if (item.occupancy) { occ = item.occupancy; }
                                    // if(item.density){density = item.density;}
                                    if (item.host) { host = item.host; }
                                    var bleModel = new BleModel({ address: item.address, floorId: fid, isDLS: dls, isLAD: lad, isCOS: sos, hasDensity: pcs, hasTemperature: temp, hasOccupancy: occ, isTP: tp, isHost: host, name: item.id });
                                    bleModel.save(function(err, ble) {
                                        if (result.length === ++count) {
                                            res.send({ msg: "BLE`s saved successfully", status: true });
                                        }
                                    })

                                });
                            }
                        });

                    }
                });
            } catch (e) {
                console.log(e);
                res.send(new Error('Corupted excel file'));
            }
        }
    });
};

exports.uploadDevices = function(req, res, next) {
    var exceltojson;
    var filepath;
    var storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'public/uploads')
        },
        filename: function(req, file, cb) {
            var datetimestamp = Date.now();
            filepath = file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });
    var upload = multer({
        storage: storage,
        fileFilter: function(req, file, callback) {
            if (['xls', 'xlsx', 'xlsm'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {

                return callback(new Error('Wrong extension type'));
            }
            if (file.originalname.split('.')[file.originalname.split('.').length - 1] === 'xlsx' || file.originalname.split('.')[file.originalname.split('.').length - 1] === 'xlsm') {
                exceltojson = xlsxtojson;
            } else {
                exceltojson = xlstojson;
            }
            callback(null, true);
        }
    }).any();

    upload(req, res, function(err) {
        if (err) {
            res.send(err);
        } else {

            try {
                exceltojson({
                    input: 'public/uploads/' + filepath,
                    output: null, //since we don't need output.json
                    lowerCaseHeaders: true,
                    header: {
                        rows: 1
                    },
                    sheet: "Bles"
                }, function(err, result) {
                    if (err) {
                        return res.send(new Error('Corupted excel file'));
                    } else {
                        console.log(result)
                        res.status(200).json({ msg: "Success" })
                            // TODO: Check for duplicates in name and address and throw error if any 
                            // validateaddress(result, req.params.floorId, function(err, response) {
                            //     if (err) {
                            //         res.send({ msg: "Duplicates not allowed", status: false, err: err });
                            //     } else {
                            //         var count = 0;
                            //         var fid = req.params.floorId;
                            //         var size = req.body.data.size;
                            //         var buid = req.body.data.buid;
                            //         var count = 0;
                            //         result.forEach(function(item) {
                            //             var host = false,lad = false,sos = false,dls = false,pcs = false,temp=false,occ=false,density = false,tp = false,name = '',address = item.address;
                            //             if(item.lad){lad = item.lad;}
                            //             if(item.sos){sos = item.sos;}
                            //             if(item.dls){dls = item.dls;}
                            //             if(item.pcs){pcs = item.pcs;}
                            //             if(item.touchpanel){tp = item.touchpanel;}
                            //             if(item.temperature){temp = item.temperature;}
                            //             if(item.occupancy){occ = item.occupancy;}
                            //             // if(item.density){density = item.density;}
                            //             if(item.host){host = item.host;}
                            //             var bleModel = new BleModel({address:item.address,floorId:fid,isDLS:dls,isLAD:lad,isCOS:sos,hasDensity:pcs,hasTemperature:temp,hasOccupancy:occ,isTP:tp,isHost:host,name:item.id});
                            //             bleModel.save(function(err,ble){
                            //                 if (result.length === ++count) {
                            //                     res.send({ msg: "BLE`s saved successfully", status: true });
                            //                 }
                            //             })

                        //         });
                        //         // console.log("here");
                        //         // res.send({msg:"done"})
                        //     }
                        // });

                    }
                });
            } catch (e) {
                console.log(e);
                res.send(new Error('Corupted excel file'));
            }
        }
    });
}


function validateaddress(addresses, fid, callback) {
    // Check for address validation floorwise and name vaidation for the uploaded data
    // Check for duplicates in file
    let seen = new Set();
    var dup = false;
    // Below code checks duplicates across all the devices at once.
    // Check if needs to be validated device wise.
    console.log(addresses)
    var hasDuplicates = addresses.some(function(currentObject) {
        return seen.size === seen.add(currentObject.id).size;
    });
    if (hasDuplicates) {
        callback(true, false)
    } else {
        //  check for duplicates against db
        // Can be done in db query using find for an array. Theorise and implement accordingly.
        BleModel.find({ floorId: mongoose.Types.ObjectId(fid) }, function(err, bles) {
            if (bles.length > 0) {
                for (var a = 0; a < addresses.length; a++) {
                    for (var b = 0; b < bles.length; b++) {
                        if (addresses[a].id == bles[b].name || addresses[a].address == bles[b].address) {
                            dup = true;
                            break;
                        }
                    }
                }
                if (dup == true) {
                    callback(true, false)
                } else {
                    callback(false, true);
                }
            } else {
                callback(false, true);
            }
        })
    }
}

function insertmultipletouchpanels(panelcount, addresscount, fid, buid, nos, type, count, posx, callback) {
    TouchPanelModel.findOne({ name: "touchpanel" + panelcount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
        if (err) {
            callback(err, "Failed");
        } else if (obj) {
            panelcount = panelcount + 1;
            insertmultipletouchpanels(panelcount, addresscount, fid, buid, nos, type, count, posx, callback);
        } else {
            BleModel.findOne({ address: addresscount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
                if (err) {
                    callback(err, "Failed");
                } else if (obj) {
                    addresscount = addresscount + 1;
                    insertmultipletouchpanels(panelcount, addresscount, fid, buid, nos, type, count, posx, callback);
                } else {
                    var touchPanelModel = new TouchPanelModel({ name: "touchPanel" + panelcount, floorId: fid, posX: posx });
                    touchPanelModel.save(function(err, tp) {
                        if (err) {
                            callback(err, "Failed");
                        } else {
                            console.log('light saved successfully');
                            var blemodel = new BleModel({ address: addresscount, floorId: fid, isTP: true });
                            blemodel.save(function(err, ble) {
                                if (err) {
                                    callback(err, "Failed");
                                } else {
                                    var touchPanelToBle = new TouchPanelToBleModel({ floorId: fid, touchPanelId: tp._id, bleId: ble._id });
                                    touchPanelToBle.save(function(err, touchpanelToBle) {
                                        if (err) {
                                            callback(err, "Failed");
                                        } else {
                                            count = count + 1;
                                            if (nos === count) {
                                                callback(null, "Success");

                                            } else {
                                                panelcount = panelcount + 1;
                                                addresscount = addresscount + 1;
                                                insertmultipletouchpanels(panelcount, addresscount, fid, buid, nos, type, count, posx, callback);
                                            }

                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

function insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, type, count, posx, callback) {
    isSOS = false;
    isDLS = false;
    LightSensorModel.findOne({ name: "lightsensor" + sensorcount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
        if (err) {
            callback(err, "Failed");
        } else if (obj) {
            sensorcount = sensorcount + 1;
            insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, type, count, posx, callback);
        } else {
            BleModel.findOne({ address: addresscount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
                if (err) {
                    callback(err, "Failed");
                } else if (obj) {
                    addresscount = addresscount + 1;
                    insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, type, count, posx, callback);
                } else {
                    if (type == "sos") {
                        isSOS = true;
                    } else {
                        isDLS = true;
                    }
                    var lightsensormodel = new LightSensorModel({ name: "lightsensor" + sensorcount, floorId: fid, posX: posx, isSOS: isSOS, isDLS: isDLS });
                    lightsensormodel.save(function(err, sensor) {
                        if (err) {
                            callback(err, "Failed");
                        } else {
                            console.log('light saved successfully');
                            var blemodel = new BleModel({ address: addresscount, floorId: fid });
                            blemodel.save(function(err, ble) {
                                if (err) {
                                    callback(err, "Failed");
                                } else {
                                    var lightsensortoble = new LightSensorToBleModel({ floorId: fid, lightSensorId: sensor._id, bleId: ble._id });
                                    lightsensortoble.save(function(err, lightsensorToBle) {
                                        if (err) {
                                            callback(err, "Failed");
                                        } else {
                                            count = count + 1;
                                            if (nos === count) {
                                                callback(null, "Success");
                                            } else {
                                                sensorcount = sensorcount + 1;
                                                addresscount = addresscount + 1;
                                                insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, type, count, posx, callback);
                                            }

                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}


function createLighttoBle(fid, lid, bleId, callback) {
    LightToBleModel.findOne({ floorId: fid, lightId: lid, bleId: bleId }, function(err, lighttoble) {
        if (err) {
            console.log("something went wrong")
        } else {
            if (lighttoble) {
                callback(null, lighttoble)
            } else {
                var lighttoble = new LightToBleModel({ floorId: fid, lightId: lid, bleId: bleId });
                lighttoble.save(function(err, ltb) {
                    if (!err) {
                        console.log("everything saved");
                        callback(null, ltb)
                    } else {
                        // console.log("saving light to ble failed")
                        callback(err, failed)
                    }
                })
            }
        }
    })
}

function createble(address, isLAD, fid, callback) {
    var blemodel = new BleModel({ address: address, isLAD: isLAD, floorId: fid });
    blemodel.save(function(err, ble) {
        if (err) {
            callback(err, "failed");
        } else {
            callback(null, ble)
        }
    })
}