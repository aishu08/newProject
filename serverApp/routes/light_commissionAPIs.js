var router = global.express.Router();

var BleModel = require('../models/ble');
var LightModel = require('../models/lights');
var LightToBleModel = require('../models/lightToBle');
var LightSensorToBleModel = require('../models/lightSensorToBle');
var LightSensorModel = require('../models/lightSensors');
var LightTypeModel = require('../models/lighttypes');
var LightShapesModel = require('../models/lightshapes');


var multer = require('multer');
var fs = require('fs');
var path = require('path');
var request = require("request");

var xlstojson = require('xls-to-json-lc');
var xlsxtojson = require('xlsx-to-json-lc');

// var mongoose = require('mongoose'),
// LightTypeModel = mongoose.model('LightTypeModel'),
// LightShapesModel = mongoose.model('LightShapesModel');


router.get('/getlightshapes', function(req, res, next) {

    LightShapesModel.find({ active: true }, { _id: 0 }, function(err, shapes) {
        if (err) {
            res.send(err);

        } else {

            res.send(shapes);
        }
    })
}).get('/getlighttypes', function(req, res, next) {

    LightTypeModel.find({}, function(err, shapes) {
        if (err) {
            res.send(err);

        } else {

            res.send(shapes);
        }
    })
}).post('/creatlighttype', function(req, res, next) {

    var lighttype = new LightTypeModel(req.body);
    lighttype.save(function(err, lighttype) {
        if (err) {
            console.log(err);
            if (err.code == 11000) {

                if (err.message.search("wattage") > 0) {
                    res.status(400).send("Combination of wattage and shape are repeating");
                } else {
                    res.status(400).send("Duplicates Not allowed");
                }
            } else {
                res.status(400).send(err.message);
            }
        } else {

            res.send("Done");

        }
    })

}).put('/updatelighttype', function(req, res, next) {
    LightTypeModel.findByIdAndUpdate(req.body.id, req.body, function(err, lighttype) {
        if (err) {
            if (err.code == 11000) {
                res.status(400).send("Duplicates Not allowed");
            } else {
                res.status(400).send(err.message);
            }
        } else {
            res.send("Done");
        }
    })
}).put('/removelighttype', function(req, res, next) {
    console.log(req.body);
    LightTypeModel.findByIdAndRemove(req.body.id, function(err, lighttype) {
        if (err) {
            res.send(err);
            console.log("Error ", err)
        } else {

            res.send("Done");

        }
    })
}).get('/getlights', function(req, res, next) {
    var data = req.query;
    var fid = mongoose.Types.ObjectId(data.floorId);
    LightModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $lookup: { from: "lighttobles", localField: "_id", foreignField: "lightId", as: "lighttobles" } },
            { $unwind: "$lighttobles" },
            { $lookup: { from: "bles", localField: "lighttobles.bleId", foreignField: "_id", as: "bles" } },
            { $unwind: "$bles" },
            { $project: { "_id": 1, "floorId": 1, "hostId": 1, "wattage": 1, "faderate": 1, "maxlevel": 1, "minlevel": 1, "name": 1, "class": 1, "height": 1, "width": 1, "posY": 1, "posX": 1, "rotate": 1, "bles.address": 1, "bles._id": 1, "lighttobles._id": 1 } }
        ],
        function(err, doc) {
            if (err) {
                console.log("Error: ", err);
                res.send(err);
            } else {
                res.send({ document: doc, msg: "Lights Not found" });
            }
        })
}).post('/creatlights/:floorId', function(req, res, next) {
    console.log(req.body);
    var count = 0;
    var lightcategorycount = req.body.lightcount.length;
    var lightcount = 0;
    var addresscount = 0;
    var fid = req.params.floorId;
    var buid = req.body.buid;
    var c = 0;

    insertlights(lightcount, addresscount, fid, buid, count);

    function insertlights(lightcount, addresscount, fid, buid, count) {
        LightModel.find({ floorId: mongoose.Types.ObjectId(fid) }, function(err, lights) {
            if (lights) {
                lightcount = lights.length;
                addresscount = lights.length;
            }

            var nos = req.body.lightcount[count].count;
            var cls = req.body.lightcount[count].lighttype;
            var posx = req.body.lightcount[count].posx;
            var width = req.body.lightcount[count].width;
            var height = req.body.lightcount[count].height;
            var wattage = req.body.lightcount[count].wattage;
            insertmultiplelights(lightcount, addresscount, fid, width, height, wattage, buid, nos, cls, c, posx, function(err, success) {
                if (err) {
                    res.send({ msg: "Somthing went wrong. Please try again", status: false });
                } else {
                    count = count + 1;
                    if (count === lightcategorycount) {
                        res.send({ msg: "light saved successfully", status: true });
                    } else {
                        insertlights(lightcount, addresscount, fid, buid, count);
                    }
                }
            });
        })
    }

}).put('/RemoveselectedLights', function(req, res, next) {

    var data = req.body.selectedlights;
    console.log(data);

    var count = 0;
    var flag = false;

    data.forEach(function(item) {

        count = count + 1;
        LightModel.remove({ "_id": mongoose.Types.ObjectId(item._id) }, function(err, light) {

            if (err) {
                console.log(err)
            } else {

                BleModel.remove({ "_id": mongoose.Types.ObjectId(item.bles._id) }, function(err, ble) {

                    if (err) {
                        console.log(err)
                    } else {

                        LightToBleModel.remove({ "_id": mongoose.Types.ObjectId(item.lighttobles._id) }, function(err, lightToBle) {

                            if (err && count === data.length) {
                                flag = true;
                                res.send(err)
                            } else if (flag === false && count === data.length) {
                                flag = true;
                                res.send("Lights Removed successfully");
                            }
                        })
                    }
                })
            }
        })
    });
}).put('/UpdateLight', function(req, res, next) {


    var data = req.body;
    console.log(data);

    var fid = mongoose.Types.ObjectId(data.floorId);
    var lid = mongoose.Types.ObjectId(data._id);
    var bleid = mongoose.Types.ObjectId(data.bles._id);

    LightModel.findOne({ "floorId": fid, "name": data.name, "_id": { "$ne": lid } }, function(err, light) {

        if (light) {
            res.send({ msg: 'light name already exists', status: false });
        } else {
            BleModel.findOne({ "floorId": fid, "address": data.bles.address, "_id": { "$ne": bleid } }, function(err, ble) {
                if (ble) {
                    console.log('Found Ble');
                    console.log(ble);
                    res.send({ msg: 'Address already exists', status: false });
                } else {
                    LightModel.findByIdAndUpdate(data._id, req.body, { new: true }, function(err, ulight) {

                        if (err) {
                            res.send(err);
                        } else {
                            BleModel.findByIdAndUpdate(data.bles._id, { $set: { address: data.bles.address,isLAD:true } }, { new: true }, function(err, uble) {
                                if (err) {
                                    res.send(err);
                                } else {


                                    res.send({ msg: 'Updated successfully', status: true });

                                }
                            })

                        }


                    })
                }
            })

        }
    })

}).put('/UpdateAllLightswithoutsensor', function(req, res, next) {

    var data = req.body.lights;
    console.log(data);

    CheckforDuplicates(data, LightModel, function(lightsrepeating) {

        if (lightsrepeating.length > 0) {
            var msg = "following lights are repeating against selected host  " + JSON.stringify(lightsrepeating);
            res.send({ msg: msg, lights: data });
        } else {
            CheckforaddressDuplicates(data, BleModel, function(addressrepeating) {
                if (addressrepeating.length > 0) {
                    var msg = "following address are repeating against selected floor  " + JSON.stringify(addressrepeating);
                    res.send({ msg: msg, seats: data });
                } else {
                    var count = 0;
                    var flag = false;

                    data.forEach(function(item) {

                        count = count + 1;

                        LightModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item._id) }, item, function(err, seat) {

                            if (err && count === data.length) {

                                res.send(err)
                            } else {

                                BleModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item.bles._id) }, { $set: { address: item.bles.address } }, { new: true }, function(err, ble) {

                                    if (err && count === data.length) {
                                        res.send(err)
                                    } else if (flag === false && count === data.length) {
                                        flag = true;
                                        res.send({ msg: "Lights Updated successfully", lights: [] });
                                    }

                                })
                            }
                        })

                    })
                }
            })
        }
    })

}).get('/getsensors', function(req, res, next) {

    var data = req.query;

    var fid = mongoose.Types.ObjectId(data.floorId);

    LightSensorModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $lookup: { from: "lightsensortobles", localField: "_id", foreignField: "lightSensorId", as: "lightsensortobles" } },
            { $unwind: "$lightsensortobles" },
            { $lookup: { from: "bles", localField: "lightsensortobles.bleId", foreignField: "_id", as: "bles" } },
            { $unwind: "$bles" },
            { $project: { "_id": 1, "floorId": 1, "hostId": 1, "name": 1,"isSOS":1,"isDLS":1, "posY": 1, "posX": 1, "bles.address": 1,"commissionStatus":"$bles.commissionStatus", "bles._id": 1, "lightsensortobles._id": 1, "lightsensortobles.lights": 1 } }
        ],
        function(err, doc) {



            if (err) {
                console.log("Error: ", err)
                res.send(err);
            } else {
                res.send({ sensorlist: doc, msg: "Sensors Not found" });
            }

        })
}).post('/creatsensors/:floorId', function(req, res, next) {
    console.log(req.body);
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
            var posx = req.body.sensorcount[count].posx;

            insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, c, posx, function(err, success) {
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
        })
    }

}).put('/checkLightSensorMapping', function(req, res, next) {

    var ids = req.body.lightsids;
    console.log(req.body);
    LightSensorToBleModel.findOne({ "lightSensorId": { "$ne": mongoose.Types.ObjectId(req.body.sensorid) }, "lights": { "$in": ids.map(function(item) { return mongoose.Types.ObjectId(item) }) } }, function(err, sensormapping) {
        if (sensormapping) {
            res.send({ status: true });
        } else {
            res.send({ status: false });
        }
    })
}).put('/MapSelectedLightswithSensor', function(req, res, next) {

    var data = req.body.lights;
    console.log(data);

    var count = 0;
    var flag = false;
    LightSensorToBleModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(req.body.sensortobleid) }, { "$set": { "lights": [] } }, { new: true }, function(err, response) {
        if (err) {
            res.send({ msg: "Something went wrong. Please try again", sensor: response });
        } else if (data.length > 0) {

            LightSensorToBleModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(req.body.sensortobleid) }, { $addToSet: { lights: { $each: data } } }, { new: true }, function(err, response) {
                if (err) {
                    console.log("Error ", err);
                    res.send({ msg: "Something went wrong. Please try again", sensor: response });
                } else {

                    res.send({ msg: "Updated successfully", sensor: response });
                }
            })

        } else {
            res.send({ msg: "Updated successfully", sensor: response });
        }
    })
}).put('/SaveSensorsPosition', function(req, res, next) {

    var data = req.body.sensors;
    console.log(data);

    var count = 0;
    var flag = false;
    data.forEach(function(item) {

        count = count + 1;

        LightSensorModel.findByIdAndUpdate(item._id, item, function(err, sensor) {
            if (err) {

                if (flag === false && count === data.length) {
                    res.send({ msg: "Updated successfully" });
                }
            } else if (flag === false && count === data.length) {
                flag = true;
                console.log('sending response');
                res.send({ msg: "Updated successfully" });
            }
        })

    })
}).put('/UpdateSensor', function(req, res, next) {

    var data = req.body;
    console.log(data);
    var data = req.body;
    console.log(data);

    var fid = mongoose.Types.ObjectId(data.floorId);
    var sid = mongoose.Types.ObjectId(data._id);
    var bleid = mongoose.Types.ObjectId(data.bles._id);

    LightSensorModel.findOne({ "floorId": fid, "name": data.name, "_id": { "$ne": sid } }, function(err, sensor) {

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


                            BleModel.findByIdAndUpdate(data.bles._id, { $set: { address: data.bles.address,isCOS:true } }, { new: true }, function(err, iuble) {
                                if (err) {
                                    res.send(err);
                                } else {

                                    res.send({ msg: 'Updated successfully', status: true });
                                }
                            })

                        }

                    })
                }
            })

        }
    })

}).put('/RemoveSensor', function(req, res, next) {

    var data = req.body;
    console.log(data);

    LightSensorModel.remove({ "_id": mongoose.Types.ObjectId(data._id) }, function(err, seat) {

        if (err) {
            res.send(err)
        } else {

            BleModel.remove({ "_id": mongoose.Types.ObjectId(data.bles._id) }, function(err, ble) {

                if (err) {
                    res.send(err)
                } else {

                    LightSensorToBleModel.remove({ "_id": mongoose.Types.ObjectId(data.lightsensortobles._id) }, function(err, seatToBle) {

                        if (err) {
                            res.send(err)
                        } else {
                            res.send("Sensor removed successfully");

                        }
                    })
                }


            })
        }
    })

}).post('/SubmitLightsToHost', function(req, res, next) {

    console.log(JSON.stringify(req.body));


    res.send("Done");


    /*  var options = {
         method: 'post',
         body: { topic: "testtopic", payload: req.body },
         json: true,
         headers: { "Content-Type": "application/json" },
         url: "https://hzetpthlv0.execute-api.ap-southeast-1.amazonaws.com/publishIot"
     }
 
     request(options, function (err, response, body) {
         if (err) {
             console.log("Error ", err);
             res.send(err);
         } else {
 
             console.log("response");
             console.log(body);
 
             res.send(body);
         }
 
 
     }) */
}).put('/checkMappingwithotheHost', function(req, res, next) {

    var ids = req.body.ids;
    // console.log(req.body);
    LightModel.findOne({
        "_id": { "$in": ids },
        "floorId":mongoose.Types.ObjectId(req.body.fid),
        "hostId": { $exists: true, "$ne": mongoose.Types.ObjectId(req.body.hid) }
    }, function(err, lhostmapping) {
        console.log("asd")
        console.log(lhostmapping)
        if (lhostmapping && shostmapping.hostId != null) {
            console.log('Point 1');
            res.send({ status: true });
        } else {
            LightSensorModel.findOne({
                "_id": { "$in": ids },
                "floorId":mongoose.Types.ObjectId(req.body.fid),
                "hostId": { $exists: true, "$ne": mongoose.Types.ObjectId(req.body.hid) }
            }, function(err, shostmapping) {
                console.log(shostmapping)
                if (shostmapping && shostmapping.hostId != null) {
                    console.log('Point 2');
                    res.send({ status: true });
                } else {
                    console.log('Point 3');
                    res.send({ status: false });
                }
            })
        }
    })
}).put('/MapSelectedLightsAndSensorsWithHost', function(req, res, next) {

    var lightslist = req.body.lights;
    var sensorslist = req.body.sensors;
    console.log(lightslist);

    LightModel.update({ hostId: mongoose.Types.ObjectId(req.body.hid) }, { $unset: { hostId: "" } }, { multi: true }, function(err, lights) {
        LightSensorModel.update({ hostId: mongoose.Types.ObjectId(req.body.hid) }, { $unset: { hostId: "" } }, { multi: true }, function(err, sensors) {


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

                                res.send({ msg: "Done" });
                            }

                        })
                    }
                })

        })

    })

})


//checkMappingwithotheHost
module.exports = router;


function insertmultiplelights(lightcount, addresscount, fid, width, height, wattage, buid, nos, cls, count, posx, callback) {

    LightModel.findOne({ name: "light" + lightcount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
        if (err) {
            callback(err, "Failed");
        } else if (obj) {
            lightcount = lightcount + 1;
            insertmultiplelights(lightcount, addresscount, fid, width, height, wattage, buid, nos, cls, count, posx, callback);
        } else {
            BleModel.findOne({ address: addresscount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
                if (err) {
                    callback(err, "Failed");
                } else if (obj) {
                    addresscount = addresscount + 1;
                    insertmultiplelights(lightcount, addresscount, fid, width, height, wattage, buid, nos, cls, count, posx, callback);
                } else {


                    var lightmodel = new LightModel({ name: "light" + lightcount, floorId: fid, height: height, width: width, wattage: wattage, class: cls, posX: posx });

                    lightmodel.save(function(err, light) {

                        if (err) {
                            callback(err, "Failed");
                        } else {
                            console.log('light saved successfully');
                            var blemodel = new BleModel({ address: addresscount, floorId: fid });

                            blemodel.save(function(err, ble) {

                                if (err) {
                                    callback(err, "Failed");
                                } else {
                                    var lighttoble = new LightToBleModel({ floorId: fid, lightId: light._id, bleId: ble._id });

                                    lighttoble.save(function(err, lightToBle) {

                                        if (err) {
                                            callback(err, "Failed");
                                        } else {

                                            count = count + 1;

                                            if (nos === count) {
                                                callback(null, "Success");

                                            } else {
                                                lightcount = lightcount + 1;
                                                addresscount = addresscount + 1;
                                                insertmultiplelights(lightcount, addresscount, fid, width, height, wattage, buid, nos, cls, count, posx, callback);
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
    })
}


function insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, count, posx, callback) {

    LightSensorModel.findOne({ name: "lightsensor" + sensorcount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
        if (err) {
            callback(err, "Failed");
        } else if (obj) {
            sensorcount = sensorcount + 1;
            insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, count, posx, callback);
        } else {
            BleModel.findOne({ address: addresscount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
                if (err) {
                    callback(err, "Failed");
                } else if (obj) {
                    addresscount = addresscount + 1;
                    insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, count, posx, callback);
                } else {


                    var lightsensormodel = new LightSensorModel({ name: "lightsensor" + sensorcount, floorId: fid, posX: posx });

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
                                                insertmultiplesensors(sensorcount, addresscount, fid, buid, nos, count, posx, callback);
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
    })
}


function CheckforDuplicates(data, model, callback) {

    var count = 0;
    var duplicates = [];

    data.forEach(function(item) {

        // var hid = mongoose.Types.ObjectId(item.hostId);
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
                // console.log(" Length ",data.length + " count ",count);
                callback(duplicates);

            }
        })


    });

}

function CheckforaddressDuplicates(data, model, callback) {

    var count = 0;
    var duplicates = [];

    data.forEach(function(item) {

        // var hid = mongoose.Types.ObjectId(item.hostId);
        var fid = mongoose.Types.ObjectId(item.floorId);
        var id = mongoose.Types.ObjectId(item.bles._id);
        var query = {};
        if (item.floorId) {
            query = { "floorId": fid, "address": item.bles.address, "_id": { "$ne": id } }
        }

        model.findOne(query, function(err, doc) {

            count = count + 1;

            if (doc) {
                duplicates.push(doc.name);
                if (data.length === count) {
                    callback(duplicates);
                }
            } else if (data.length === count) {
                // console.log(" Length ",data.length + " count ",count);
                callback(duplicates);

            }
        })


    });

}