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
var UserModel = require('../models/users');
var HostModel = require('../models/hosts');
var SeatTypeModel = require('../models/seattypes');
var ShapesModel = require('../models/shapes');
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var request = require("request");
var xlstojson = require('xls-to-json-lc');
var xlsxtojson = require('xlsx-to-json-lc');

// var mongoose = require('mongoose'),
//     SeatSettingModel = mongoose.model('SeatSettingModel'),
//     SeatTypeModel = mongoose.model('SeatTypeModel'),
//     ShapesModel = mongoose.model('ShapesModel');

router.post('/createBuilding', function(req, res, next) {
    var data = req.body;
    data.hasLMS = true;
    var bldg = new BuildingModel(data);
    bldg.save(function(err, doc, num) {
        if (err) {
            console.log("Error  " + err);
            res.send(err);
        } else {
            console.log(doc);
            floors = [];
            for (var i = 0; i < data.nof; i++) {
                var floorobj = {},
                    floornumber = i + 1;
                floorobj.name = "Floor" + floornumber;
                floorobj.buildingId = doc._id;
                floors.push(floorobj);
            }
            FloorModel.create(floors, function(err, result) {
                if (err) {
                    res.send({ msg: "Error occured in creating floors", bulding: doc });

                } else {
                    console.log(JSON.stringify(result));

                    var flooids = result.map(function(item) { return item.id });

                    BuildingModel.findByIdAndUpdate(doc.id, { $push: { floors: { $each: flooids } } }, { new: true }, function(err, bulding) {
                        if (err)
                            res.send(err)
                        else
                            res.send({ msg: "Bulding created successfully", bulding: doc });
                    })
                }
            })
        }
    });

}).put('/updateBuilding', function(req, res, next) {
    var data = req.body;

    BuildingModel.findByIdAndUpdate(data.id, data, function(err, doc) {
        if (err) {
            res.send(err)
        } else {
            if (data.nof > data.floors.length) {
                var count = data.floors.length + 1;

                insertmultiplefloors(count);

                function insertmultiplefloors(count) {

                    FloorModel.findOne({ name: "Floor" + count, buildingId: mongoose.Types.ObjectId(doc.id) }, function(err, obj) {
                        if (err) {
                            res.send("Failed Update");
                        } else if (obj) {
                            count = count + 1;
                            insertmultiplefloors(count);
                        } else {
                            var floor = new FloorModel({ name: "Floor" + count, buildingId: doc.id });
                            floor.save(function(err, newfloor) {
                                if (err) {
                                    res.send("Failed Update")
                                } else {
                                    BuildingModel.findByIdAndUpdate(doc.id, { $push: { floors: newfloor.id } }, { new: true }, function(err, building) {
                                        if (err) {
                                            res.send("Failed Update")
                                        } else if (data.nof === building.floors.length) {
                                            res.send("Done")
                                        } else {
                                            insertmultiplefloors(count);
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            } else {
                res.send('Done');
            }
        }
    })

}).get('/getBuildingbyId', function(req, res, next) {


    BuildingModel.findOne({ "_id": mongoose.Types.ObjectId(req.query.id) }, function(err, doc) {
        if (err)
            res.send(err)
        else
            res.send(doc);
    })

}).post('/createFloor/:fname/:bname', function(req, res, next) {

    var storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'public/img')
        },
        filename: function(req, file, cb) {
            //console.log(req);
            cb(null, req.params.bname + '-' + req.params.fname + '-' + file.originalname);
        }
    });
    var upload = multer({
        storage: storage
    }).any();

    upload(req, res, function(err) {
        if (err) {
            console.log("Error ", err);
            return res.end('Error');
        } else {
            //console.log(req.body);
            req.body.floor_details.layout = req.params.bname + '-' + req.params.fname + '-' + req.body.floor_details.layout
            console.log(req.body);
            var floor = new FloorModel(req.body.floor_details);
            floor.save(function(err, doc, num) {
                if (err) {
                    console.log('Error  ', err);
                    res.send(err)

                } else {
                    console.log(JSON.stringify(req.body.floor_details.hosts));
                    if (req.body.floor_details.hosts && req.body.floor_details.hosts.length > 0) {
                        for (var i = 0; i < req.body.floor_details.hosts.length; i++) {
                            delete req.body.floor_details.hosts[i]['$$hashKey']
                            delete req.body.floor_details.hosts[i]['$hashKey']
                            delete req.body.floor_details.hosts[i].certificates['$hashKey']
                            req.body.floor_details.hosts[i].buildingId = req.body.floor_details.bid;
                            req.body.floor_details.hosts[i].floorId = doc._id;
                        }
                        console.log('after remove')
                        console.log(JSON.stringify(req.body.floor_details.hosts))
                        HostModel.create(req.body.floor_details.hosts, function(err, hostdoc, num) {

                            if (err) {
                                console.log('Error')
                                console.log(err);
                                res.send(err);
                            } else {
                                BuildingModel.findByIdAndUpdate(req.body.floor_details.bid, { $push: { floors: doc._id } }, { new: true }, function(err, bulding) {
                                    if (err)
                                        res.send(err)
                                    else
                                        res.send({ msg: 'Done', bulding: bulding });
                                })
                            }

                        })

                    } else {
                        BuildingModel.findByIdAndUpdate(req.body.floor_details.bid, { $push: { floors: doc._id } }, { new: true }, function(err, bulding) {
                            if (err)
                                res.send(err)
                            else
                                res.send({ msg: 'Done', bulding: bulding });
                        })
                    }
                }
            });
        }
    });
}).get('/getfloors', function(req, res, next) {
    console.log(JSON.stringify(req.query));
    var obj_ids;
    if (Array.isArray(req.query.fids)) {
        obj_ids = req.query.fids.map(function(item) { return mongoose.Types.ObjectId(item) });
        console.log("arrayvalue", obj_ids)
    } else {
        obj_ids = [mongoose.Types.ObjectId(req.query.fids)];
    }


    FloorModel.aggregate(
        [{ $match: { '_id': { $in: obj_ids } } },
            { $lookup: { from: "hosts", localField: "_id", foreignField: "floorId", as: "hosts" } }
        ],
        function(err, floors) {

            if (err)
                res.send(err)
            else {
                res.send(floors);
            }
        });
}).post('/updateFloor/:fname/:bname/:floorid', function(req, res, next) {

    FloorModel.findOne({ '_id': mongoose.Types.ObjectId(req.params.floorid) }, function(err, floordetails) {
        if (floordetails) {



            var imgfilename = undefined;
            var count = 0;
            var storage = multer.diskStorage({
                destination: function(req, file, cb) {
                    cb(null, 'public/img')
                },
                filename: function(req, file, cb) {
                    console.log('file');
                    console.log(file);
                    if (file && file.originalname) {

                        fs.stat('./public/img/' + floordetails.layout, function(err, stats) {

                            console.log('stats   ', stats); //here we got all information of file in stats variable

                            if (err) {
                                console.log('upload')
                                console.error(err);
                            } else if (stats) {
                                fs.unlink('./public/img/' + floordetails.layout, function(err, result) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log('file deleted successfully');
                                        console.log(result)
                                    }
                                });
                            }
                        });

                        imgfilename = req.params.bname + '-' + req.params.fname + '-' + file.originalname;
                    }
                    cb(null, req.params.bname + '-' + req.params.fname + '-' + file.originalname);
                }
            });
            var upload = multer({
                storage: storage
            }).any();

            upload(req, res, function(err) {
                if (err) {
                    console.log("Error ", err);
                    return res.end('Error');
                } else {

                    var layout = ((req.body.floor_details.layout) ? req.body.floor_details.layout.replace(floordetails.name, req.params.fname) : "");
                    console.log(imgfilename)
                    if (imgfilename) {
                        layout = imgfilename;
                    }

                    fs.stat('./public/img/' + floordetails.layout, function(err, stats) {

                        console.log('stats   ', stats); //here we got all information of file in stats variable

                        if (err) {
                            console.log('rename');
                            console.error(err);
                        } else if (stats && floordetails.layout != req.params.fname) {
                            fs.rename('./public/img/' + floordetails.layout, './public/img/' + layout, function(err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('file Renamed successfully');
                                    console.log(result)
                                }
                            });
                        }
                    });

                    var floorupdateobj = req.body.floor_details;
                    req.body.floor_details.layout = layout;
                    delete floorupdateobj['$hashKey'];
                    //delete floorupdateobj['hosts'];

                    console.log(req.body.floor_details);


                    FloorModel.findByIdAndUpdate(req.body.floor_details._id, req.body.floor_details, function(err, doc, num) {
                        if (err) {
                            console.log('Error  ', err);
                            res.send(err)

                        } else {

                            res.send({ msg: 'Done' });

                            /* var hoststoupdate = [];
                            var hoststoremove = [];
                            var hoststoinsert = [];
                            console.log(JSON.stringify(req.body.floor_details.hosts));
                            if (req.body.floor_details.hosts && req.body.floor_details.hosts.length > 0) {
                                for (var i = 0; i < req.body.floor_details.hosts.length; i++) {
                                    delete req.body.floor_details.hosts[i]['$$hashKey']
                                    delete req.body.floor_details.hosts[i]['$hashKey']
                                    delete req.body.floor_details.hosts[i].certificates['$hashKey'];
                                    if (!req.body.floor_details.hosts[i]._id) {
 
                                        req.body.floor_details.hosts[i].buildingId = req.body.floor_details.bid;
                                        req.body.floor_details.hosts[i].floorId = doc._id;
 
                                        hoststoinsert.push(req.body.floor_details.hosts[i]);
 
                                    } else if (req.body.floor_details.hosts[i].delete) {
 
                                        hoststoremove.push(req.body.floor_details.hosts[i])
                                    } else {
 
                                        hoststoupdate.push(req.body.floor_details.hosts[i])
                                    }
 
                                }
                            }
                            if (hoststoremove.length > 0 || hoststoupdate.length > 0) {
                                UpdateHosts(hoststoremove, hoststoupdate, function (err, ufloor) {
                                    if (err) {
                                        res.send({ msg: 'Failed' });
                                    } else if (hoststoinsert.length > 0) {
                                        HostModel.create(hoststoinsert, function (err, newhosts) {
                                            if (err) {
                                                res.send({ msg: 'Failed' });
                                            } else {
                                                res.send({ msg: 'Done' });
                                            }
                                        })
                                    } else {
                                        res.send({ msg: 'Done' });
                                    }
                                })
                            } else {
                                if (hoststoinsert.length > 0) {
                                    HostModel.create(hoststoinsert, function (err, newhosts) {
                                        if (err) {
                                            res.send({ msg: 'Failed' });
                                        } else {
                                            res.send({ msg: 'Done' });
                                        }
                                    })
                                } else {
                                    res.send({ msg: 'Done' });
                                }
                            } */

                        }
                    });
                }
            });
        } else {
            res.send('Failed')
        }
    })

}).put('/removefloor', function(req, res, next) {

    console.log(JSON.stringify(req.body));

    FloorModel.remove({ '_id': mongoose.Types.ObjectId(req.body._id) }, function(err, rfloor) {

        if (err) {
            console.log("Error1  ", err);
            res.send('Failed to Remove');
        } else {

            var hostids = req.body.hosts.map(function(item) { if (item._id) { return mongoose.Types.ObjectId(item._id) } })

            HostModel.remove({ '_id': { '$in': hostids } }, function(err) {

                if (err) {
                    console.log("Error2  ", err);
                    res.send(err);
                } else {
                    BuildingModel.findByIdAndUpdate(req.body.buildingId, { $pull: { floors: mongoose.Types.ObjectId(req.body._id) } }, function(err) {
                        if (err) {
                            console.log("Error3  ", err);
                            res.send(err);
                        } else {
                            SeatModel.remove({ floorId: mongoose.Types.ObjectId(req.body._id), hostId: { "$in": hostids } }, function(err) {
                                if (err) {
                                    console.log("Error4  ", err);
                                    res.send(err)
                                } else {
                                    SeatToBle.remove({ floorId: mongoose.Types.ObjectId(req.body._id), hostId: { "$in": hostids } }, function(err) {
                                        if (err) {
                                            console.log("Error5  ", err);
                                            res.send(err)
                                        } else {
                                            SectionModel.remove({ hostId: { "$in": hostids } }, function(err) {
                                                if (err) {
                                                    console.log("Error6  ", err);
                                                    res.send(err);
                                                } else {
                                                    RoomToBle.remove({ floorId: mongoose.Types.ObjectId(req.body._id), hostId: { "$in": hostids } }, function(err) {
                                                        if (err) {
                                                            console.log("Error7  ", err);
                                                            res.send(err);
                                                        } else {
                                                            BleModel.remove({ floorId: mongoose.Types.ObjectId(req.body._id), hostId: { "$in": hostids } }, function(err) {
                                                                if (err) {
                                                                    console.log("Error8  ", err);
                                                                    res.send(err);
                                                                } else {
                                                                    res.send('Done');
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
                    });
                }
            });
        }

    });
    // res.send('Done');

}).get('/getbuildings', function(req, res, next) {

    BuildingModel.find(req.query, function(err, buildings) {

        if (err)
            res.send(err);
        else {
            res.send(buildings);
        }
    });
}).get('/getcertificates', function(req, res, next) {

    console.log(req.query);

    /*  FloorModel.findOne({ '_id': mongoose.Types.ObjectId(req.query.fid) }, function (err, floor) {
 
         if (err)
             res.send(err)
         else {
             console.log(floor); */
    var dirPath = "Certificates"; //directory path
    var fileType1 = '.ppk'; //file extension
    var fileType2 = '.pem'; //file extension
    var fileType3 = '.crt'; //file extension
    var fileType4 = '.key'; //file extension
    var files = [];
    var response = [];
    fs.readdir(dirPath, function(err, list) {
        if (err) throw err;
        for (var i = 0; i < list.length; i++) {
            if (path.extname(list[i]) === fileType1 || path.extname(list[i]) === fileType2 ||
                path.extname(list[i]) === fileType3 || path.extname(list[i]) === fileType4) {

                if (list[i].search("-" + req.query.bname + "-" + req.query.fname + "-") > 0) {

                    files.push(list[i]);
                }

            }
        }
        files = files.sort();
        var obj = {};
        console.log(files);
        var count = 0;
        for (var j = 0; j < files.length; j++) {

            if (files[j].search("certificate") > 0) {

                count = count + 1;
                obj.crt = files[j];

            } else if (files[j].search("private") > 0) {

                count = count + 1;
                obj.ppk = files[j];

            } else if (files[j].search("public") > 0) {
                count = count + 1;

                obj.pem = files[j];

            }

            if (count === 3) {
                count = 0;
                response.push(obj);
                obj = {};
            }

        }
        //console.log(JSON.stringify(response));
        res.send(response);
    });

    /*  }
 }); */
}).post('/createHost', function(req, res, next) {
    var data = req.body;
    var bid = mongoose.Types.ObjectId(data.buildingId);
    var fid = mongoose.Types.ObjectId(data.floorId);
    HostModel.findOne({ buildingId: bid, floorId: fid, name: data.name }, function(err, host) {
        if (host) {

            res.send("Host already exists for selected Floor and Bulding");
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
    });
}).get('/gethosts', function(req, res, next) {
    var data = req.query;

    var bid = mongoose.Types.ObjectId(data.buildingId);
    var fid = mongoose.Types.ObjectId(data.floorId);


    HostModel.find({ buildingId: bid, floorId: fid }, function(err, hosts) {
        if (err)
            res.send(err);
        else
            console.log(JSON.stringify(hosts));
        res.send(hosts);
    });

}).post('/updateHost', function(req, res, next) {
    var data = req.body;
    console.log(data);
    var bid = mongoose.Types.ObjectId(data.buildingId);
    var fid = mongoose.Types.ObjectId(data.floorId);
    var hid = mongoose.Types.ObjectId(data.id);
    HostModel.findOne({ buildingId: bid, floorId: fid, name: data.name, "_id": { "$ne": hid } }, function(err, host) {
        if (host) {

            res.send("Host already exists for selected Floor and Bulding");
        } else {

            HostModel.findByIdAndUpdate(data.id, data, { new: true }, function(err, uhost) {
                if (err)
                    res.send(err);
                else {

                    res.send({ host: uhost, msg: "Done" });

                }
            });
        }
    });
}).put('/MapHostswithSeats', function(req, res, next) {

    var data = req.body.seats;
    console.log(req.body.hid);

    var count = 0;
    var flag = false;
    SeatModel.update({ hostId: mongoose.Types.ObjectId(req.body.hid) }, { $unset: { hostId: "" } }, { multi: true }, function(err, seats) {
        BleModel.update({ hostId: mongoose.Types.ObjectId(req.body.hid) }, { $unset: { hostId: "" } }, { multi: true }, function(err, bles) {
            data.forEach(function(item) {

                count = count + 1;

                SeatModel.findByIdAndUpdate(item._id, { $set: { hostId: req.body.hid } },
                    function(err, seat) {
                        console.log(seat);
                        if (err && count === data.length) {

                            res.send(err);
                        } else {

                            BleModel.findByIdAndUpdate(item.bles._id, { $set: { hostId: req.body.hid } }, function(err, ble) {

                                if (err && count === data.length) {
                                    res.send(err);
                                } else if (flag === false && count === data.length) {
                                    flag = true;
                                    res.send({ msg: "Seats saved successfully", seats: [] });
                                }

                            });
                        }
                    });

            });

            if (data.length === 0) {
                res.send({ msg: "Seats saved successfully", seats: [] });
            }
        });
    });

}).post('/saveseat', function(req, res, next) {

    var data = req.body;
    console.log(data);

    SeatModel.findOne({ hostId: data.hostId, floorId: data.floorId, name: data.name }, function(err, hosts) {
        if (err) {
            res.send(err);
        } else if (hosts) {

            res.send({ msg: "Seat already exists for selected exists and floor", status: false });
        } else {

            var seatmodel = new SeatModel(data);

            seatmodel.save(function(err, seat) {

                if (err) {
                    res.send(err);
                } else {
                    console.log('seat saved successfully');
                    var blemodel = new BleModel(data);

                    blemodel.save(function(err, ble) {

                        if (err) {
                            res.send(err)
                        } else {

                            console.log(seat);
                            console.log(ble);
                            var seattoble = new SeatToBle({ floorId: data.floorId, seatId: seat._id, bleId: ble._id, hostId: data.hostId });

                            seattoble.save(function(err, seatToBle) {

                                if (err) {
                                    res.send(err)
                                } else {
                                    SectionModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(data.buid) }, { $addToSet: { seats: seat._id } }, function(err, section) {
                                        if (err) {
                                            console.log('Section Error  ', err);
                                        }
                                        res.send({ msg: "Seat saved successfully", status: true });
                                    })


                                }
                            })
                        }


                    })
                }
            })

        }
    })

}).get('/getseats', function(req, res, next) {

    var data = req.query;
    // { $limit: 100000 },
    //  var hid = mongoose.Types.ObjectId(data.hostId);
    var fid = mongoose.Types.ObjectId(data.floorId);

    SeatModel.aggregate(
        [{ $match: { "floorId": fid } },
            { $lookup: { from: "sensortobles", localField: "_id", foreignField: "seatId", as: "sensortobles" } },
            { $unwind: "$sensortobles" },
            { $lookup: { from: "bles", localField: "sensortobles.bleId", foreignField: "_id", as: "bles" } },
            { $unwind: "$bles" },
            { $project: { "_id": 1, "floorId": 1, "hostId": 1, "name": 1, "class": 1, "height": 1, "width": 1, "posY": 1, "posX": 1, "rotate": 1, "bles.address": 1, "bles._id": 1, "sensortobles._id": 1 } }

        ],
        function(err, doc) {



            if (err) {
                console.log("Error: ", err)
                res.send(err);
            } else {
                //console.log("Data: ", doc)
                res.send({ document: doc, msg: "Seats Not found" });
            }

        })

}).put('/UpdateSeat', function(req, res, next) {


    var data = req.body;
    console.log(data);

    var fid = mongoose.Types.ObjectId(data.floorId);
    var sid = mongoose.Types.ObjectId(data._id);
    var bleid = mongoose.Types.ObjectId(data.bles._id);

    SeatModel.findOne({ "floorId": fid, "name": data.name, "_id": { "$ne": sid } }, function(err, seat) {

        if (seat) {
            console.log('Found Seat');
            console.log(seat);
            res.send({ msg: 'Seat name already exists', status: false });
        } else {

            BleModel.findOne({ "floorId": fid, "address": data.bles.address, "_id": { "$ne": bleid } }, function(err, ble) {

                if (ble) {
                    console.log('Found Ble');
                    console.log(ble);
                    res.send({ msg: 'Address already exists', status: false });
                } else {
                    SeatModel.findByIdAndUpdate(data._id, req.body, { new: true }, function(err, useat) {

                        if (err) {
                            res.send(err);
                        } else {


                            BleModel.findByIdAndUpdate(data.bles._id, { $set: { address: data.bles.address } }, { new: true }, function(err, iuble) {
                                if (err) {
                                    res.send(err);
                                } else {

                                    SectionModel.findOneAndUpdate({ "seats": { $in: [mongoose.Types.ObjectId(useat._id)] } }, { $pull: { "seats": mongoose.Types.ObjectId(useat._id) } }, function(err) {
                                        if (err) {
                                            console.log('Section Update err   ', err);
                                            res.send(err);
                                        } else {
                                            SectionModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(data.buid) }, { $addToSet: { seats: useat._id } }, function(err, section) {
                                                if (err) {
                                                    console.log('Section Error  ', err);
                                                }
                                                res.send({ msg: 'Updated successfully', status: true });
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
    })

}).put('/RemoveSeat', function(req, res, next) {

    var data = req.body;
    console.log(data);

    SeatModel.remove({ "_id": mongoose.Types.ObjectId(data._id) }, function(err, seat) {

        if (err) {
            res.send(err)
        } else {

            BleModel.remove({ "_id": mongoose.Types.ObjectId(data.bles._id) }, function(err, ble) {

                if (err) {
                    res.send(err)
                } else {

                    SeatToBle.remove({ "_id": mongoose.Types.ObjectId(data.sensortobles._id) }, function(err, seatToBle) {

                        if (err) {
                            res.send(err)
                        } else {
                            res.send("Seat removed successfully");

                        }
                    })
                }


            })
        }
    })

}).put('/RemoveselectedSeats', function(req, res, next) {

    var data = req.body.selectedseats;
    console.log(data);

    var count = 0;
    var flag = false;

    data.forEach(function(item) {

        count = count + 1;
        SeatModel.remove({ "_id": mongoose.Types.ObjectId(item._id) }, function(err, seat) {

            if (err) {
                console.log(err)
            } else {

                BleModel.remove({ "_id": mongoose.Types.ObjectId(item.bles._id) }, function(err, ble) {

                    if (err) {
                        console.log(err)
                    } else {

                        SeatToBle.remove({ "_id": mongoose.Types.ObjectId(item.sensortobles._id) }, function(err, seatToBle) {

                            if (err && count === data.length) {
                                flag = true;
                                res.send(err)
                            } else if (flag === false && count === data.length) {
                                flag = true;
                                res.send("Seats Removed successfully");
                            }
                        })
                    }
                })
            }
        })
    })
}).put('/UpdateAllSeatswithoutBU', function(req, res, next) {

    var data = req.body.seats;
    console.log(data);

    CheckforDuplicates(data, SeatModel, function(seatsrepeating) {

        if (seatsrepeating.length > 0) {
            var msg = "following seats are repeating against selected host  " + JSON.stringify(seatsrepeating);
            res.send({ msg: msg, seats: data });
        } else {
            CheckforaddressDuplicates(data, BleModel, function(addressrepeating) {
                if (addressrepeating.length > 0) {
                    var msg = "following address are repeating against selected host  " + JSON.stringify(addressrepeating);
                    res.send({ msg: msg, seats: data });
                } else {
                    var count = 0;
                    var flag = false;

                    data.forEach(function(item) {

                        count = count + 1;

                        SeatModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item._id) }, item, function(err, seat) {

                            if (err && count === data.length) {

                                res.send(err)
                            } else {

                                BleModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item.bles._id) }, { $set: { address: item.bles.address } }, { new: true }, function(err, ble) {

                                    if (err && count === data.length) {
                                        res.send(err)
                                    } else if (flag === false && count === data.length) {
                                        flag = true;
                                        res.send({ msg: "Seats saved successfully", seats: [] });
                                    }

                                })
                            }
                        })

                    })
                }
            })
        }
    })

}).put('/UpdateAllSeats', function(req, res, next) {

    var data = req.body.seats;
    console.log(data);

    var count = 0;
    var flag = false;
    SectionModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(req.body.buid) }, { "$set": { "seats": [] } }, { new: true }, function(err, room) {
        if (err) {
            console.log('Section Error  ', err);
        } else if (data.length > 0) {
            data.forEach(function(item) {

                count = count + 1;
                SectionModel.findOneAndUpdate({ "seats": { $in: [mongoose.Types.ObjectId(item._id)] } }, { $pull: { "seats": mongoose.Types.ObjectId(item._id) } }, function(err) {
                    if (err) {
                        console.log('Section Error  ', err);
                    } else {
                        SectionModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(req.body.buid) }, { $addToSet: { seats: item._id } }, { new: true }, function(err, section) {
                            if (err) {
                                console.log('Section Error  ', err);
                            } else if (flag === false && count === data.length) {
                                flag = true;
                                console.log('sending response');
                                res.send({ msg: "Seats saved successfully", section: section });
                            }
                        })
                    }

                })
            })
        } else {
            res.send({ msg: "Seats saved successfully", section: room });
        }
    })
}).post('/SubmitToHost', function(req, res, next) {

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
}).post('/saveroom', function(req, res, next) {

    var data = req.body;
    console.log(data);

    SectionModel.findOne({ hostId: data.hostId, name: data.name, isRoom: data.isRoom }, function(err, room) {
        if (err) {
            res.send(err)
        } else if (room) {

            res.send({ msg: "Room already exists for selected exists and host", status: false });
        } else {

            var sectionmodel = new SectionModel(data);

            sectionmodel.save(function(err, room) {

                if (err) {
                    res.send(err)
                } else {
                    console.log('seat saved successfully');
                    var blemodel = new BleModel(data);

                    blemodel.save(function(err, ble) {

                        if (err) {
                            res.send(err)
                        } else {


                            var roomtoble = new RoomToBle({ floorId: data.floorId, roomId: room._id, bleId: ble._id, hostId: data.hostId });

                            roomtoble.save(function(err, roomToble) {

                                if (err) {
                                    res.send(err)
                                } else {
                                    res.send({ msg: "Room saved successfully", status: true });

                                }
                            })
                        }


                    })
                }
            })

        }
    })

}).get('/getrooms', function(req, res, next) {

    var data = req.query;

    var hid = mongoose.Types.ObjectId(data.hostId);
    var fid = mongoose.Types.ObjectId(data.floorId);

    SectionModel.aggregate([{ $match: { "hostId": hid, isRoom: true } },
        { $lookup: { from: "roomtobles", localField: "_id", foreignField: "roomId", as: "roomtobles" } },
        { $unwind: "$roomtobles" },
        { $lookup: { from: "bles", localField: "roomtobles.bleId", foreignField: "_id", as: "bles" } },
        { $unwind: "$bles" },
        {
            $project: {
                "_id": 1,
                "roomtobles.floorId": 1,
                "hostId": 1,
                "name": 1,
                "capacity": 1,
                "class": 1,
                "height": 1,
                "width": 1,
                "posY": 1,
                "posX": 1,
                "rotate": 1,
                "bles.address": 1,
                "bles._id": 1,
                "roomtobles._id": 1
            }
        }

    ], function(err, doc) {

        if (err) {
            console.log("Error: ", err)
            res.send(err);
        } else {
            console.log("Data: ", doc)
            res.send({ document: doc, msg: "Rooms Not found" });
        }

    })

}).put('/UpdateRoom', function(req, res, next) {


    var data = req.body;
    console.log('Update Room');
    console.log(data);

    //res.send('Updated successfully');   
    var hid = mongoose.Types.ObjectId(data.hostId);
    var rid = mongoose.Types.ObjectId(data._id);

    SectionModel.findOne({ "hostId": hid, "name": data.name, "_id": { "$ne": rid } }, function(err, room) {

        if (room) {
            console.log('Found Seat');
            console.log(seat);
            res.send({ msg: 'Room name already exists', status: false });
        } else {


            SectionModel.findByIdAndUpdate(data._id, data, { new: true }, function(err, uroom) {

                if (err) {
                    res.send(err);
                } else {


                    BleModel.findByIdAndUpdate(data.bles._id, { $set: { address: data.bles.address } }, { new: true }, function(err, iuble) {
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

}).put('/RemoveRoom', function(req, res, next) {

    var data = req.body;
    console.log(data);


    SectionModel.remove({ "_id": mongoose.Types.ObjectId(data._id) }, function(err, seat) {

        if (err) {
            res.send(err)
        } else {

            BleModel.remove({ "_id": mongoose.Types.ObjectId(data.bles._id) }, function(err, ble) {

                if (err) {
                    res.send(err)
                } else {

                    RoomToBle.remove({ "_id": mongoose.Types.ObjectId(data.roomtobles._id) }, function(err, seatToBle) {

                        if (err) {
                            res.send(err)
                        } else {
                            res.send("Room removed successfully");

                        }
                    })
                }


            })
        }
    })

}).put('/UpdateAllRooms', function(req, res, next) {

    var data = req.body.rooms;
    console.log(data);


    CheckforDuplicates(data, SectionModel, function(roomsrepeating) {

        if (roomsrepeating.length > 0) {
            var msg = "following seats are repeating against selected host  " + JSON.stringify(roomsrepeating);
            res.send({ msg: msg, rooms: data });
        } else {

            var count = 0;
            var flag = false;

            data.forEach(function(item) {

                count = count + 1;

                SectionModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item._id) }, item, function(err, seat) {

                    if (err && count === data.length) {

                        res.send(err)
                    } else {

                        BleModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(item.bles._id) }, { $set: { address: item.bles.address } }, { new: true }, function(err, ble) {
                            console.log("count ", count + "  length ", data.length);
                            if (err && count === data.length) {
                                res.send(err)
                            } else if (flag === false && count === data.length) {
                                flag = true;
                                console.log('sending response');
                                res.send({ msg: "Rooms saved successfully", rooms: [] });
                            }

                        })
                    }
                })

            })

        }
    })

}).post('/mailFloordetails', function(req, res, next) {

    var nodemailer = require('nodemailer');
    var smtpTransport = require("nodemailer-smtp-transport");
    var tableify = require('html-tableify');
    console.log(req.body);

    var floor = req.body.floor;
    var host = req.body.host;
    var building = req.body.building;

    var obj = { building: building, fname: floor.name, layout: floor.layout, hname: host.name };

    var arraytosend = [];
    arraytosend.push(obj);

    var html = '<!DOCTYPE html><html><head><style>'
    html += 'table {border-collapse: collapse;width: 100%;}';
    html += 'th, td { padding: 8px;text-align: left; border-bottom: 1px solid #ddd;}</style></head>';
    html += '<body>';

    html += tableify(arraytosend, {
        headers: [{
            name: 'building',
            align: 'center',
            title: 'Building'
        }, {
            name: 'fname',
            align: 'center',
            title: 'Floor Name'
        }, {
            name: 'layout',
            align: 'center',
            title: 'Layout'
        }, {
            name: 'hname',
            align: 'center',
            title: 'Host Name'
        }]
    });
    var attachments = [];
    if (host.certificates.crt) {
        html += '<br> <p> Please find the attachment for certificate files</p>  </body>';
        attachments = [{
                filename: 'Certificate',
                path: './Certificates/' + host.certificates.crt // stream this file
            },
            {
                filename: 'Private_Key',
                path: './Certificates/' + host.certificates.ppk // stream this file
            },
            {
                filename: 'Root_CA',
                path: './Certificates/root-CA.crt' // stream this file
            }
        ]
    } else {
        html += '<br> <p> There are no certificates mapped to perticular host</p>  </body>';
    }
    html += '<footer> <br><br>';

    html += '<h3>Regards,<br>Darshan</h3></footer></html>';

    console.log(html);


    var smtpTransport = nodemailer.createTransport(smtpTransport({
        host: "smtp.gmail.com",
        secureConnection: false,
        port: 587,
        auth: {
            user: "darshan91119@gmail.com",
            pass: "7259835869"
        }
    }));
    // console.log(smtpTransport);
    // setup email data with unicode symbols
    var mailOptions = {
        from: '"Floor Details " <darshan91119@gmail.com>', // sender address
        to: 'darshan.bp@adappt.com', // list of receivers
        subject: 'Floor Configuration Details', // Subject line   
        html: html, // html body
        attachments: attachments
    };

    // send mail with defined transport object
    smtpTransport.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send('Mail sending failed. Please try again')
        } else {
            res.send('Mail sent successfully');
        }
        console.log('Message sent: %s', JSON.stringify(info));
        // Preview only available when sending through an Ethereal account
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });

}).get('/getBUs', function(req, res, next) {
    FloorModel.findOne({ "_id": mongoose.Types.ObjectId(req.query.floorId) }, function(err, floor) {
        if (err || !floor) {
            res.send(err);
        } else {
            SectionModel.find({ "_id": { "$in": floor.sections } }, function(err, bulist) {
                if (err) {
                    res.send(err);
                } else {
                    res.send({ floor: floor, bulist: bulist });
                }
            })
        }
    })
}).post('/addBu/:floorId', function(req, res, next) {

    var data = req.body;
    data.floorId = req.params.floorId;
    data.isRoom = false;
    var section = new SectionModel(data)
    SectionModel.findOne({ "floorId": mongoose.Types.ObjectId(req.params.floorId), name: data.name, isRoom: false }, function(err, bu) {
        if (err) {
            res.status(400).send("Failed to add BU");
        } else if (bu) {
            res.status(400).json("BU already exists");
        } else {
            section.save(function(err, doc, num) {
                if (err)
                    res.status(400).json("Failed to add BU");
                else {
                    FloorModel.findByIdAndUpdate(data.floorId, { $push: { sections: doc._id } }, function(err, doc) {
                        if (err)
                            res.status(400).json("Failed to add BU");
                        else
                            res.status(200).json("Added new BU")
                    })
                }
            })
        }
    })

}).put('/checkseatsBuMapping', function(req, res, next) {

    var ids = req.body.seatids;

    SectionModel.findOne({ "_id": { "$ne": mongoose.Types.ObjectId(req.body.buid) }, "seats": { "$in": ids.map(function(item) { return mongoose.Types.ObjectId(item) }) } }, function(err, bu) {
        if (bu) {
            res.send({ status: true });
        } else {
            res.send({ status: false });
        }
    })
}).get('/getbuid', function(req, res, next) {
    SectionModel.findOne({ "seats": { "$in": [mongoose.Types.ObjectId(req.query.seatid)] } }, function(err, bu) {
        if (bu) {
            res.send(bu);
        } else {
            res.send({});
        }
    })
}).post('/uploadseats/:floorId', function(req, res, next) {
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
            console.log("Error ", err);
            res.send(err);
        } else {

            try {
                console.log('trying to convert')
                exceltojson({
                    input: 'public/uploads/' + filepath,
                    output: null, //since we don't need output.json
                    lowerCaseHeaders: true,
                    header: {
                        rows: 1
                    },
                    sheet: "Seats"
                }, function(err, result) {
                    if (err) {
                        return res.send(new Error('Corupted excel file'));
                    } else {

                        console.log(JSON.stringify(result));

                        validateseats(result, req.params.floorId, function(err, response) {
                            if (err) {
                                res.send({ msg: "Duplicates not allowed", status: false, err: err });
                            } else {
                                var count = 0;

                                var fid = req.params.floorId;
                                var size = req.body.data.size;
                                var buid = req.body.data.buid;

                                result.forEach(function(item) {


                                    var seatmodel = new SeatModel({ name: item.name, floorId: fid, height: size, width: size });

                                    seatmodel.save(function(err, seat) {

                                        if (err) {
                                            res.send(err)
                                        } else {
                                            console.log('seat saved successfully');
                                            var blemodel = new BleModel({ address: item.address, floorId: fid });

                                            blemodel.save(function(err, ble) {

                                                if (err) {
                                                    res.send(err)
                                                } else {
                                                    var seattoble = new SeatToBle({ floorId: fid, seatId: seat._id, bleId: ble._id });

                                                    seattoble.save(function(err, seatToBle) {

                                                        if (err) {
                                                            res.send(err)
                                                        } else {
                                                            SectionModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(buid) }, { $addToSet: { seats: seat._id } }, function(err, section) {
                                                                if (err) {
                                                                    console.log('Section Error  ', err);
                                                                }
                                                                count = count + 1;

                                                                if (result.length === count) {
                                                                    res.send({ msg: "Seat saved successfully", status: true });
                                                                }

                                                            })

                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                })
                            }
                        })

                    }
                });
            } catch (e) {
                console.log(e);
                res.send(new Error('Corupted excel file'));
            }
        }
    })
}).post('/creatseats/:floorId', function(req, res, next) {
    console.log(req.body);
    var count = 0;
    var seatcategorycount = req.body.seatcount.length;
    var seatcount = 0;
    var addresscount = 0;
    var fid = req.params.floorId;
    var buid = req.body.buid;
    var c = 0;

    insertseats(seatcount, addresscount, fid, buid, count);

    function insertseats(seatcount, addresscount, fid, buid, count) {
        SeatModel.find({ floorId: mongoose.Types.ObjectId(fid) }, function(err, seats) {
            if (seats) {
                seatcount = seats.length;
                addresscount = seats.length;
            }

            var nos = req.body.seatcount[count].count;
            var cls = req.body.seatcount[count].seattype;
            var posx = req.body.seatcount[count].posx;
            var size = req.body.seatcount[count].size;
            insertmultipleseats(seatcount, addresscount, fid, size, buid, nos, cls, c, posx, function(err, success) {
                if (err) {
                    res.send({ msg: "Somthing went wrong. Please try again", status: false });
                } else {
                    count = count + 1;
                    if (count === seatcategorycount) {
                        res.send({ msg: "Seat saved successfully", status: true });
                    } else {
                        insertseats(seatcount, addresscount, fid, buid, count);
                    }
                }
            });
        })
    }

}).put('/updatesettings', function(req, res, next) {

    var data = req.body;

    if (data._id) {

        SeatSettingModel.findByIdAndUpdate(data._id, data, { new: true }, function(err, settings) {
            if (err) {
                res.send(err);
            } else {
                res.send(settings);
            }
        })
    } else {
        var seatSettingModel = new SeatSettingModel(data)
        seatSettingModel.save(function(err, doc, num) {
            if (err) {
                res.send(err);
            } else {
                res.send(doc);
            }
        })
    }
}).get('/seatconfig', function(req, res, next) {



    SeatSettingModel.findOne({}, function(err, settings) {
        if (err) {
            res.send(err);
        } else {
            res.send(settings);
        }
    })

}).get('/getseattypes', function(req, res, next) {

    SeatTypeModel.find({}, function(err, seattypes) {
        if (err) {
            res.send(err);
        } else {
            res.send(seattypes);
        }
    })

}).post('/creatseattype', function(req, res, next) {

    var seattype = new SeatTypeModel(req.body);
    seattype.save(function(err, seattype) {
        if (err) {
            if (err.code == 11000) {

                res.status(400).send("Duplicates Not allowed");
            } else {
                res.status(400).send(err.message);
            }
        } else {
            ShapesModel.findOneAndUpdate({ "name": req.body.shapename }, { "$set": { active: false } }, function() {
                res.send("Done");
            })

        }
    })

}).put('/updateseattype', function(req, res, next) {

    SeatTypeModel.findByIdAndUpdate(req.body._id, req.body, function(err, seattype) {
        if (err) {
            if (err.code == 11000) {

                res.status(400).send("Duplicates Not allowed");
            } else {
                res.status(400).send(err.message);
            }
        } else {
            ShapesModel.findOneAndUpdate({ "name": seattype.shapename }, { "$set": { active: true } }, function() {
                ShapesModel.findOneAndUpdate({ "name": req.body.shapename }, { "$set": { active: false } }, function() {
                    res.send("Done");
                })
            })

        }
    })
}).put('/removeseattype', function(req, res, next) {
    console.log(req.body);
    SeatTypeModel.findByIdAndRemove(req.body._id, function(err, seattype) {
        if (err) {
            res.send(err);
            console.log("Error ", err)
        } else {
            ShapesModel.findOneAndUpdate({ "name": req.body.shapename }, { "$set": { active: true } }, function() {
                res.send("Done");
            })
        }
    })
}).get('/getshapes', function(req, res, next) {

    ShapesModel.find({ active: true }, function(err, shapes) {
        if (err) {
            res.send(err);

        } else {

            res.send(shapes);
        }
    })
}).put('/checkseatsMappingwithotheHost', function(req, res, next) {

    var ids = req.body.seatids.map(function(item) {
        console.log(mongoose.Types.ObjectId(item));
        return mongoose.Types.ObjectId(item)
    });

    // var ids = req.body.seatids;
    console.log(req.body);

    SeatModel.find({
        "_id": { "$in": ids },
        "hostId": { $exists: true, "$ne": mongoose.Types.ObjectId(req.body.hid) }
    }, function(err, seat) {
        // console.log(seat)
        if (seat.length > 0) {
            res.send({ status: true });
        } else {
            res.send({ status: false });
        }
    })
})


function UpdateHosts(hoststoremove, hoststoupdate, callback) {

    console.log('Hosts to update');
    console.log(JSON.stringify(hoststoupdate));
    if (hoststoremove.length > 0) {
        HostModel.remove({ '_id': { '$in': hoststoremove.map(function(item) { return mongoose.Types.ObjectId(item._id) }) } }, function(err) {
            if (err) {
                callback(err);
            } else if (hoststoupdate.length > 0) {
                updatehostsonebyone(hoststoupdate, function(uerr) {
                    if (uerr) {
                        callback(uerr)
                    } else {
                        callback(null);
                    }
                })
            } else {
                callback(null);
            }
        })
    } else if (hoststoupdate.length > 0) {
        updatehostsonebyone(hoststoupdate, function(uerr) {
            if (uerr) {
                callback(uerr)
            } else {
                callback(null);
            }
        })
    }

}

function updatehostsonebyone(hoststoupdate, callback) {

    var count = 0;
    makeupdatecall(hoststoupdate);

    function makeupdatecall(hoststoupdate) {

        HostModel.findByIdAndUpdate(hoststoupdate[count]._id, hoststoupdate[count], function(err, obj) {
            if (err) {
                callback(err);
            } else {
                count = count + 1;
                if (hoststoupdate.length <= count) {
                    callback(null)
                } else {
                    makeupdatecall(hoststoupdate);
                }
            }
        })
    }

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



function validateseats(list, floorId, callback) {
    var errorobj = { dupseatsindb: [], dupaddressindb: [], seatnamedups: [], seataddressdups: [] };
    var count = 0;

    var fid = mongoose.Types.ObjectId(floorId);
    checkdupliacatesindb(list, fid, 'name', SeatModel, function(dups) {

        if (dups) {
            Array.prototype.push.apply(errorobj.dupseatsindb, dups);
        }
        checkdupliacatesindb(list, fid, 'address', BleModel, function(addressdups) {

            if (addressdups) {
                Array.prototype.push.apply(errorobj.dupaddressindb, addressdups);
            }

            var testObject = {},
                array = [];

            errorobj.seatnamedups = checkDuplicateInObject('name', list);
            errorobj.seataddressdups = checkDuplicateInObject('address', list);

            console.log('local dup check   ', errorobj.seatnamedups);

            if (errorobj.dupseatsindb.length > 0 || errorobj.dupaddressindb.length > 0 ||
                errorobj.seatnamedups.length > 0 || errorobj.seataddressdups.length > 0) {
                callback(errorobj);
            } else {
                callback(null, "No Duplicates")
            }
        })
    })
}

function checkdupliacatesindb(data, fid, property, model, callback) {
    var count = 0;
    var duplicates = [];

    var query = { "floorId": mongoose.Types.ObjectId(fid) }

    data.forEach(function(item) {
        query[property] = item[property];
        // console.log(property);
        model.findOne(query, function(err, doc) {

            count = count + 1;

            if (doc) {
                var obj = {};
                obj[property] = doc[property];
                duplicates.push(obj);
                if (data.length === count) {
                    callback(duplicates);
                }
            } else if (data.length === count) {

                callback(duplicates);

            }
        })
    });
}

function checkDuplicateInObject(propertyName, inputArray) {
    var seenDuplicate = false,
        testObject = {},
        array = [];

    inputArray.map(function(item) {
        var itemPropertyName = item[propertyName];
        if (itemPropertyName in testObject) {
            testObject[itemPropertyName].duplicate = true;
            item.duplicate = true;
            var obj = {};
            obj[propertyName] = item[propertyName];
            array.push(obj);
            seenDuplicate = true;
        } else {
            testObject[itemPropertyName] = item;
            delete item.duplicate;
        }
    });
    return array;
}

function insertmultipleseats(seatcount, addresscount, fid, size, buid, nos, cls, count, posx, callback) {

    SeatModel.findOne({ name: "Seat" + seatcount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
        if (err) {
            callback(err, "Failed");
        } else if (obj) {
            seatcount = seatcount + 1;
            insertmultipleseats(seatcount, addresscount, fid, size, buid, nos, cls, count, posx, callback);
        } else {
            BleModel.findOne({ address: addresscount, floorId: mongoose.Types.ObjectId(fid) }, function(err, obj) {
                if (err) {
                    callback(err, "Failed");
                } else if (obj) {
                    addresscount = addresscount + 1;
                    insertmultipleseats(seatcount, addresscount, fid, size, buid, nos, cls, count, posx, callback);
                } else {


                    var seatmodel = new SeatModel({ name: "Seat" + seatcount, floorId: fid, height: size, width: size, class: cls, posX: posx });

                    seatmodel.save(function(err, seat) {

                        if (err) {
                            callback(err, "Failed");
                        } else {
                            console.log('seat saved successfully');
                            var blemodel = new BleModel({ address: addresscount, floorId: fid });

                            blemodel.save(function(err, ble) {

                                if (err) {
                                    callback(err, "Failed");
                                } else {
                                    var seattoble = new SeatToBle({ floorId: fid, seatId: seat._id, bleId: ble._id });

                                    seattoble.save(function(err, seatToBle) {

                                        if (err) {
                                            callback(err, "Failed");
                                        } else {
                                            SectionModel.findByIdAndUpdate({ "_id": mongoose.Types.ObjectId(buid) }, { $addToSet: { seats: seat._id } }, function(err, section) {
                                                if (err) {
                                                    console.log('Section Error  ', err);
                                                }
                                                count = count + 1;

                                                if (nos === count) {
                                                    callback(null, "Success");

                                                } else {
                                                    seatcount = seatcount + 1;
                                                    addresscount = addresscount + 1;
                                                    insertmultipleseats(seatcount, addresscount, fid, size, buid, nos, cls, count, posx, callback);
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
    })
}

module.exports = router;