var router = global.express.Router();
var pool = global.pool;
var bcrypt = global.bcrypt;
var jwt = global.jwt;
var _  = global._;
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
var time = require('time');
var fs = require('fs');
var reA = /[^a-zA-Z]/g;
var reN = /[^0-9]/g;
var sortAlphaNum = function(a,b)
{
    var aA = a.name.replace(reA, "");
    var bA = b.name.replace(reA, "");
    if(aA === bA) {
        var aN = parseInt(a.name.replace(reN, ""), 10);
        var bN = parseInt(b.name.replace(reN, ""), 10);
        return aN === bN ? 0 : aN > bN ? 1 : -1;
    } else {
        return aA > bA ? 1 : -1;
    }
}
var styles = {
  headerDark: {
    font: {
      bold: true
    }
  }
};

var validateRequest = function(decoded, callback)
{
    //callback(false);
    //console.log(decoded.username);
    UserModel.findOne({uid: decoded.uid}, function(err, user, num){
        if(err)
            callback(false);
        else if(user)
        {
            if(decoded.pwd == user.password)
            {
                callback(true);
            }
            else
                callback(false);
        }
        else
            callback(false);
    });
}
router.post('/login', function(req, res, next) {
    var data = req.body;
    data.uid = data.uid.toLowerCase();
    UserModel.findOne({uid: data.uid}, function(err, user, num){
        if(err)
            res.status(400).json(err)
        else if(user)
        {
            bcrypt.compare(data.password, user.password, function(err, status){
                if(status)
                {
                    var text = "Login from: '" + data.uid + "' at " + Date() + "\n"
                    fs.appendFileSync("loginLogs.txt", text);
                    var myToken = jwt.sign({uid:data.uid, pwd:user.password}, global.secret, {expiresIn: '1d'});
                    res.status(200).json({uid: data.uid, auth_token: myToken});
                }
                else
                {
                    res.status(401).json({err: "Invalid Password"});
                }
            })
        }
        else
        {
            res.status(401).json({err: "Account does not exist! "});
        }
    })
})
.post('/changePassword', function(req, res, next){
    var data = req.body;
    data.uid = data.uid.toLowerCase();
    UserModel.findOne({name: data.uid}, function(err, user, num){
        if(err)
            res.status(400).json(err)
        else if(user)
        {
            console.log(data)
            bcrypt.compare(data.oldPassword, user.password, function(err, status){
                if(status)
                {
                    UserModel.findOneAndUpdate({uid: data.uid},{password: bcrypt.hashSync(data.newPassword1)}, function(err, doc){
                        if(err)
                            res.status(400).json(err)
                        else{
                            res.status(200).json({msg: "Done"});
                        }
                    })
                }
                else
                    res.status(401).json({err: "Invalid Password"});
            })
        }
        else
            res.status(401).json({err: "User not found"});
    })
})
.get('/floors',function(req, res, next){
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
           validateRequest(decoded, function(status){
                if(status)
                {
                    FloorModel.find({}, null, {sort: 'name'}, function(err, floors, num){
                        if(err)
                            res.status(400).json(err);
                        else if(floors)
                        {
                            res.status(200).json(floors);
                        }
                        else
                            res.json({"err":"No floor data"});
                    });
                }
                else
                    res.status(403).json({err: "Unauthorized Request"});
           })
        }
    })
})
.get('/floordata/:floorId',function(req, res, next){
    var floorId = req.params.floorId;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    SeatModel.find({floorId: floorId}, null, {sort: 'name'}, function(err, data, num){
                        if(err)
                            res.status(400).json(err);
                        else if(data)
                        {
                            res.status(200).json(data)
                        }
                        else
                            res.json({"err":"No seat data"});
                    });
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            });
        }
    })
})
.post('/addEmployee', function(req, res, next){
    var cookies = req.cookies;
    var token = cookies.auth_token;
    var data = req.body;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    if(data)
                    {
                        var employee = new Employees({
                            empId: data.empId,
                            email: data.email,
                            cardId: data.cardId,
                            uid: data.uniqueID
                        })
                        employee.save(function(err, doc){
                            if(!err)
                                res.status(200).json({msg: "Done"});
                            else 
                                res.status(500).json(err)
                        })
                    }
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            })
        }
    })
})
.post('/cardBooking',function(req,res,next){
    var data = req.body;
    intime = new Date(data.inTime)
    outTime = new Date(data.outTime)
    intime1 = intime.toISOString();
    outTime1 = outTime.toISOString()
    
    if (data){
        BookingDetails.find({seatId:data.seatId,isBooked:true,
            $or:[{inTime:{$gte : intime1, $lte:outTime1}},{outTime:{$gte : intime1, $lte:outTime1}}]
        }).then(function(seatBooked){
            if(!seatBooked.length){
                BookingDetails.find({employeeId:data.empId,isBooked:true,
                    $or:[{inTime:{$gte : data.intime, $lte:data.outTime}},{outTime:{$gte : data.intime, $lte:data.outTime}}]
                }).then(function(empBooked){
                    if(!empBooked.length){
                        var bookingEntry = new BookingDetails({
                            employeeId: data.empId,
                            seatId: data.seatId,
                            inTime: new Date(data.inTime),
                            outTime: new Date(data.outTime),
                            duration: data.duration
                        })
                        bookingEntry.save(function(err, doc){
                            if(!err){
                                SeatToBle.findOneAndUpdate({seatId: data.seatId}, {bookingId: doc.id}, function(err, seatBle){
                                    if(!err){
                                        res.status(200).json({msg:"Done"})
                                    } else {
                                        res.status(500).json(err)
                                    }
                                })
                            } else {
                                res.status(500).json(err)
                            }
                        })
                    } else {
                        res.status(500).json({msg:"Employee has already booked a seat"})
                    }}) 
            }else{
                res.status(500).json({msg:"seat has already been booked"})
            }})

    }else{
        res.status(500).json({msg:"No Data"})
    }
})
.post('/webBooking',function(req,res,next){
    var data = req.body;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    if(data){
                        intime = new Date(data.inTime)
                        outTime = new Date(data.outTime)
                        uid = data.uid; 
                        intime1 = intime.toISOString();
                        outTime1 = outTime.toISOString();
                        Employees.findOne({uid:uid},['employeeId']).then(function(emp){
                            if(emp){
                                empId = emp.employeeId;
                            } else {
                                res.status(500).json({msg:"Employee does not exist"})
                            }
                            BookingDetails.find({seatId:data.seatId,isBooked:true,
                                $or:[{inTime:{$gte : intime1, $lte:outTime1}},{outTime:{$gte : intime1, $lte:outTime1}}]
                            }).then(function(seatBooked ){
                                if(!seatBooked.length){         
                                    BookingDetails.find({employeeId:data.empId,isBooked:true,
                                        $or:[{inTime:{$gte : intime1, $lte:outTime1}},{outTime:{$gte : intime1, $lte:outTime1}}]
                                    }).then(function(empBooked){
                                        if(!empBooked.length){
                                            var bookingEntry = new BookingDetails({
                                                employeeId: data.empId,
                                                seatId: data.seatId,
                                                inTime: new Date(data.inTime),
                                                outTime: new Date(data.outTime),
                                                duration: data.duration,
                                                webBooked: true,
                                                isBooked: true
                                            })
                                            bookingEntry.save(function(err,doc){
                                                if(!err)
                                                    res.status(200).json({msg: "Done"});
                                                else 
                                                    res.status(500).json(err)
                                            })
                                        } else {
                                            res.status(500).json({msg:"Employee has already booked a seat"})
                                        }
                                    })

                                } else{
                                    res.status(500).json({msg:"seat has already been booked"})
                                }
                            })
                        })
                        
                    } else {
                        res.status(500).json({msg:"No Data"})
                    }
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            })
        }
    })
})
.post('/cancelFutureBooking',function(req,res,next){
    var data = req.body;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    if(data){
                        console.log(data)
                        var bookingId = data.bookingId;
                        var empId = data.empId;
                        
                        BookingDetails.findOneAndUpdate({_id:bookingId,employeeId: empId},{isBooked:false},function(err,bd){
                            if(!err){
                                if(bd){
                                    res.status(200).json({msg:"Seat Cancelled"});
                                } else{
                                    res.status(500).json({msg:"booking not found"});
                                }   
                            } else {
                                res.status(500).json(err);
                            }
                        })
                    } else {
                        res.status(500).json({msg:"No Data"})
                    }
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            })
        }
    })
})
.post('/cancelWebBooking',function(req,res,next){
    var data = req.body;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    if(data){
                        var bookingId = data.bookingId; 
                        var employeeId = data.empId;
                        var a = new Date();

                        var curr_time = a.getTime();
                        now = a.toISOString()
                        BookingDetails.findOne({_id:bookingId,employeeId:employeeId}).then(function(bd){

                            if(bd.length){
                                inTime = bd.inTime;
                                outTime = now;
                                t = new Date(inTime);
                                a = new Date(outTime);
                                dur = (a.getTime()-t.getTime())/1000;
                                SeatToBle.findOneAndUpdate({seatId: d.seatId}, {$set: {bookingId: null}},function(err,seatBle){
                                    if(!err){
                                        BookingDetails.findOneAndUpdate({_id:bookingId},{isBooked:false,outTime:outTime,duration:dur},function(err,booking){
                                            res.status(200).json({msg:"Booking cancelled"})
                                        });
                                    }else{
                                        res.status(500).json({err});
                                    }
                                })
                            }else{
                                res.status(500).json({msg:"No booking"})
                            }
                        })
                    }else {
                        res.status(500).json({msg:"No Data"})
                    }
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            })
        }
    })
})
.get('/availableSeats',function(req,res,next){
    var  d = new Date();
    var e = new Date();
    var now = d.toISOString()

    e.setMinutes(e.getMinutes()+30)
    now_30 = e.toISOString();
    BookingDetails.find({isBooked:true,outTime: {
        $lte: now_30,
        $gte: now
    }}).then(function(bookedSeats){
        if(bookedSeats.length){
            res.status(200).json({msg:bookedSeats.length})
        } else{
            res.status(200).json({msg:"0"}) 
        }
    })
})
router.get('/seatDetails/:floorId',function(req,res,next){
	var floorId = req.params.floorId;
	var populateQuery = [{path:'seatId', select: 'name'},{path:'bookingId',select:'employeeId outTime',populate:{path:"employeeId",select:'uid'}}];
	SeatToBle.find({floorId:floorId}).populate({path:'seatId', select: 'name'}).
	populate({path:'bookingId',select:'employeeId outTime',populate:{path:"employeeId",select:'uid'}}).then(function(seats){
		if(seats.length){
			res.status(200).json(seats)
		}else{
			res.status(500).json({msg:"no data"})
		}
	})
})
.get('/getEmployeeBooking/:empId',function(req,res,next){
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    Employees.findOne({uid:uid},['employeeId']).then(function(emp){
                        if(emp){
                            var empId = emp.employeeId;
                            BookingDetails.find({employeeId:empId,isBooked:true},['employeeId','seatId','inTime','outTime','duration','isBooked']).populate({path:'seatId',select:'name'}).then(function(seats){
                                res.status(200).json(seats)
                            })
                        }
                        else
                        {
                            res.status(500).json({msg:"Employee does not exist"})
                        }
                    })
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            })
        }
    })
})
.get('/roomData/:floorId', function(req, res, next){
    var floorId = req.params.floorId;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    FloorModel.findById(floorId).lean().populate({path: 'sections', match:{isRoom: true}}).exec(function(err, rooms){
                        res.json(rooms.sections);
                    });
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            });
        }
    })
})
.get('/roomStatus/:floorId', function(req, res, next){
    var floorId = req.params.floorId;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    RoomToBle.find({floorId:floorId}, 'roomId peopleCount -_id', function(err, roomStatus){
                        res.json(roomStatus)
                    });
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            });
        }
    })
})
.get('/getSections/:floorId', function(req, res, next){
    var floorId = req.params.floorId;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    FloorModel.findById(floorId).lean().populate({path: 'sections', match:{isRoom: false}, select: " -isRoom -capacity"}).exec(function(err, sections){
                        res.json(sections.sections);
                    });
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            });
        }
    })
})

.get('/getSectionNames/:floorId', function(req, res, next){
    var floorId = req.params.floorId;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    FloorModel.findById(floorId).lean().populate({path: 'sections', match:{isRoom: false}, select: " -isRoom -capacity -seats "}).exec(function(err, sections){
                        var keys = {};
                        var sectionNames = [];
                        sections.sections.forEach(function(section){
                            if(!(section.name in keys))
                            {
                                keys[section.name] = 1;
                                sectionNames.push(section.name);   
                            }

                        })
                        res.json(sectionNames);
                    });
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            });
        }
    })
})
.get('/tempdata/:floorId', function(req, res, next){
    var floorId = req.params.floorId;
    var cookies = req.cookies;
    var token = cookies.auth_token;

    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    BleModel.find({floorId: floorId, hasTemperature: true}, '_id', function(err, bles){
                        if(err)
                            res.status(400).json(err);
                        else if(bles)
                        {
                            var bleIds = bles.map(function(ble){return ble.id});
                            SeatToBle.find({bleId: {$in: bleIds}}, 'seatId', function(err, seats){
                                if(err)
                                    res.status(400).json(err);
                                else if(seats)
                                {
                                    var seatIds = seats.map(function(seat){return seat.seatId});
                                    SeatModel.find({_id: {$in: seatIds}},function(err, seatData){
                                        if(err)
                                            res.status(400).json(err);
                                        else
                                            res.json(seatData)
                                    })
                                }
                                else{
                                    res.json({"err":"No seat data"});
                                }
                            })
                        }
                        else{
                            res.json({"err":"No seat data"});
                        }
                        
                    })
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            });
        }
    });
})
.get('/tempStatus/:floorId', function(req, res, next){
    var floorId = req.params.floorId;
    var cookies = req.cookies;
    var token = cookies.auth_token;

    jwt.verify(token, global.secret,function(err,decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
            BleModel.find({floorId: floorId, hasTemperature: true}, '_id', function(err, bles){

                if(err)
                    res.status(400).json(err);
                else if(bles)
                {
                    var bleIds = bles.map(function(ble){return ble.id});
                    SeatToBle.find({bleId: {$in: bleIds}}, 'seatId temperature -_id', function(err, seats){
                        if(err)
                            res.status(400).json(err);
                        else if(seats)
                        {
                            //console.log(seats);
                            res.status(200).json(seats);
                        }
                        else{
                            res.json({"err":"No seat data"});
                        }
                    })
                }
                else{
                    res.json({"err":"No seat data"});
                }
                
            })
        }
    });
})
.get('/seatStatus/:floorId', function(req, res, next){
    var floorId = req.params.floorId;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    var currentTime = new Date().getTime();
                    var pastTime = new Date(currentTime - 180000);
                    /*SeatToBle.update({floorId: floorId, lastOccupied: {$lt: pastTime}}, {occupied: false}, {multi: true}, function(err, result){
                    })*/
                    SeatToBle.find({floorId: floorId},'seatId occupied -_id', function(err, seats){
                        if(err){
                            res.status(401).json(err);
                        }
                        else if(seats){
                            res.status(200).json(seats)
                        }
                        else
                        {
                            res.json({"err": "No data found"})
                        }
                    })
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            });
        }
    });
})
.get('/avgFloorsTemp', function(req, res, next){
    var cookies = req.cookies;
    var token = cookies.auth_token;
    var seatData = {};
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
            SeatToBle.aggregate([{ $group: {_id:"$floorId", average: {$avg: '$temperature'}}}]).exec(function(err, doc){
                if (err)
                    console.log(err);
                else
                {
                    FloorModel.populate(doc, {path:'_id', select: " name  -_id"},function(err, results){
                        var data = results.map(function(result){ return {name: result._id.name, average: parseFloat(result.average.toFixed(1))}});
                        data.sort(sortAlphaNum);
                        res.json(data);
                    })
                }
            })
        }
    });
})
.get('/seatBuMapping', function(req, res, next){
    SectionModel.find({isRoom: false}, 'name seats -_id').lean().populate({path: 'seats', select: 'name -_id'}).exec(function(err, doc){
        res.json(doc);
    })
})
.get('/seatData/:floorId', function(req, res, next){
    var floorId = req.params.floorId;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    var seatData = {};
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
             validateRequest(decoded, function(status){
                if(status)
                {
                    SeatModel.count({floorId: floorId},function(err, seatCount){
                        if(err)
                            res.status(400).json(err);
                        else
                            seatData.totalSeats = seatCount;

                        SeatToBle.count({floorId: floorId, occupied: true}, function(err, filledSeats){
                            if(err)
                                res.status(400).json(err);
                            else
                                seatData.filledSeats = filledSeats;

                            SeatToBle.count({floorId: floorId, occupied: false}, function(err, emptySeats){
                                if(err)
                                    res.status(400).json(err);
                                else
                                    seatData.emptySeats = emptySeats;
                                BleModel.count({floorId: floorId, status: true, isHost: false, hasDensity: false}, function(err, healthySeats){
                                    if(err)
                                        res.status(400).json(err)
                                    else
                                    {
                                        seatData.healthySeats = healthySeats;
                                        SeatToBle.count({floorId: floorId, temperature: {$ne: null}}, function(err, tempCount){
                                            if(err)
                                                res.status(400).json(err);
                                            else{
                                                seatData.tempCount = tempCount;
                                                SeatToBle.aggregate([{$match: {floorId: mongoose.Types.ObjectId(floorId)}}, { $group: {_id: floorId, average: {$avg: '$temperature'}}}]).exec(function(err, doc){
                                                    if (err)
                                                        console.log(err);
                                                    else
                                                    {
                                                        if(doc){
                                                            if(doc[0].average)
                                                                seatData.tempAvg = doc[0].average.toFixed(1);
                                                            else
                                                                seatData.tempAvg = 0.0;
                                                            RoomToBle.count({floorId: floorId}, function(err, roomCount){
                                                                if(!err)
                                                                {
                                                                    seatData.roomCount = roomCount;
                                                                    RoomToBle.count({floorId: floorId, peopleCount: {$gt: 0}}, function(err, roomOccupancy){
                                                                        if(err)
                                                                            res.status(400).json(err);
                                                                        else
                                                                        {
                                                                            seatData.roomOccupancy = roomOccupancy;
                                                                            res.status(200).json(seatData);
                                                                        }
                                                                    })
                                                                }
                                                                else
                                                                    res.status(400).json(err);
                                                            })
                                                        }
                                                    }
                                                })
                                            }

                                        })
                                        //res.status(200).json(seatData);
                                    }
                                })
                            })
                        })
                    })
                }
                else
                {
                    res.status(403).json({err: "Unauthorized Request"});
                }
            });
        }
    });
})
.get('/buComparisonPlot', function(req, res, next){
    var cookies = req.cookies;
    var token = cookies.auth_token;
    var floorNames = [];
    var emptySeats = [];
    var filledSeats = [];
    var data = req.query;
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
            FloorModel.find({}, ' name ', function(err, floors){
                if(floors){
                    var dayRangeStartIST = new time.Date(data.syear, data.smonth, data.sday, 0, 0, 0, 'Asia/Kolkata').getTime();
                    var dayRangeEndIST = new time.Date(data.eyear, data.emonth, data.eday, 23, 59, 59, 'Asia/Kolkata').getTime();
                    var noOfDays = Math.round(Math.abs((dayRangeStartIST - dayRangeEndIST)/(86399000)));
                    var daysCounter = 0;
                    var dayStartIST = 0;
                    var dayEndIST = 0;
                    var averageData = [];
                    var averageFilled = Array.apply(null, Array(floors.length)).map(Number.prototype.valueOf,0);
                    //console.log(averageFilled)
                    var averageEmpty = Array.apply(null, Array(floors.length)).map(Number.prototype.valueOf,0);
                    while(dayRangeStartIST < dayRangeEndIST)
                    {
                        // console.log("Start Day", dayRangeStartIST)
                        // console.log("End Day", dayRangeEndIST) 
                        dayStartIST = dayRangeStartIST;
                        dayEndIST = dayRangeStartIST + 86399000;
                        generateFloorPlots(floors, dayStartIST, dayEndIST, function(floorData, dayStartIST){
                            floorData.sort(sortAlphaNum);
                            //console.log(floorData);
                            var tempSum = 0;
                            //console.log(averageFilled, averageEmpty)
                            if(averageData.length == 0)
                                averageData = floorData;
                            else
                            {
                                for(var i=0; i < floorData.length; i++)
                                {
                                    for(var j=0; j < floorData[i].sections.length; j++)
                                    {
                                        for(var k=0; k<floorData[i].sections[j].filled.length; k++ )
                                            averageData[i].sections[j].filled[k] += floorData[i].sections[j].filled[k];
                                    }
                                }
                            }
                            
                            if(++daysCounter == noOfDays)
                            {
                                console.log('done');
                                dayRangeStartIST += 1000;
                                for(var i=0; i< floorData.length; i++)
                                {
                                    for(var j=0; j < floorData[i].sections.length; j++)
                                    {
                                        for(var k=0; k<floorData[i].sections[j].filled.length; k++ )
                                        {
                                            averageData[i].sections[j].filled[k] = Math.round(averageData[i].sections[j].filled[k]/noOfDays);
                                            averageData[i].sections[j].empty[k] = averageData[i].sections[j].total - averageData[i].sections[j].filled[k];
                                        }
                                    }
                                    //floorNames[i] = floorData[i].name;
                                }
                                for(var i = 0; i<floorData.length; i++)
                                {
                                    for(var j=0; j < floorData[i].sections.length; j++)
                                    {
                                        for(var k=0; k<floorData[i].sections[j].filled.length; k++ )
                                            averageData[i].sections[j].percentFilled[k] = parseFloat(averageFilled[i] / (averageFilled[i] + averageEmpty[i]).toFixed(2));
                                    }
                                }
                                res.json({sectionData: averageData});
                            }
                        })
                        dayRangeStartIST = dayRangeStartIST + 86399000;
                        if(noOfDays > 1)
                            dayRangeStartIST += 1000;
                    }
                }
            })
        }
    });
    function generateFloorPlots(floors, dayStartIST, dayEndIST, callback)
    {
        var counter = 0;
        var pending = floors.length;
        var dayStart = new Date(dayStartIST);
        var dayEnd = new Date(dayEndIST);
        var floorData = [];
        floors.forEach(function(floor){
            FloorModel.findById(floor._id).lean().populate({path: 'sections', match:{isRoom: false}, select: " -isRoom -capacity -seats "}).exec(function(err, sections){
                var keys = {};
                var sectionNames = [];
                //console.log('Before Loop')
                sections.sections.forEach(function(section){
                    if(!(section.name in keys))
                    {
                        keys[section.name] = 1;
                        sectionNames.push(section.name);
                    }
                });
                //console.log('afterloop');
                getBuValues(floor._id, sectionNames, dayStart, dayEnd, function(buData){
                    //console.log(sectionNames);
                    buData.sort(sortAlphaNum);
                    var parentTemp = {}
                    parentTemp.name = floor.name;
                    SeatModel.count({floorId: floor._id},function(err, seatCount){
                        var temp = {};
                        temp.seatCount = seatCount;
                        temp.names = [];
                        temp.total = [];
                        temp.filled = [];
                        temp.empty = [];
                        temp.percentFilled = [];
                        buData.forEach(function(bu){
                            temp.names.push(bu.name);
                            temp.total.push(bu.total);
                            temp.filled.push(bu.filled);
                            temp.empty.push(bu.total - bu.filled);
                            temp.percentFilled.push(((bu.filled / bu.total) * 100 ).toFixed(2));
                        });
                        parentTemp.sections = temp;
                        floorData.push(parentTemp);
                        if(++counter == pending)
                        {
                            //res.json(floorData);
                            //console.log(floorData);
                            callback(floorData);
                        }
                    });
                });
            });
        })
    }
    function getBuValues(floorId, sectionNames, dayStart, dayEnd, callback)
    {
        var seats = [];
        var sectionData = [];
        var counter = 0;
        var pending = sectionNames.length; 
        sectionNames.forEach(function(sectionName){

            FloorModel.findById(floorId).lean().populate({path: 'sections', match:{name: sectionName}, select: " -isRoom -capacity"}).exec(function(err, sections){
                seats = [];
                sections.sections.forEach(function(section){
                    section.seats.map(function(seat){seats.push(seat)});
                })
                SeatToBle.find({seatId : {$in: seats}}, function(err, bles){
                    var bleIds = bles.map(function(ble){return ble.bleId})
                    if(bleIds.length > 0)
                    {
                        SensorDataModel.aggregate(
                            [
                                {"$match": {$and: [{'sensorId': {$in: bleIds}}, {$and: [{time :{$gte: dayStart}}, {time :{$lte: dayEnd}}]}, {'occupancy': true}]}},
                                {"$sort": {"sensorId": 1}},
                                {"$group": {"_id": "$sensorId", total: {$sum: 1}}},
                                {$match: {total: {$gte: 20}}}
                            ], function(err, result){
                                var temp = {};
                                temp.name = sectionName;
                                temp.filled = result.length;
                                temp.total = bleIds.length;
                                sectionData.push(temp);
                                if(++counter == pending)
                                    callback(sectionData);
                            }
                        )
                    }
                })
            });
        })
    }
})
.get('/floorPlots', function(req, res, next){
    var cookies = req.cookies;
    var token = cookies.auth_token;
    var floorNames = [];
    var emptySeats = [];
    var filledSeats = [];
    var data = req.query;
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
            FloorModel.find({}, ' name ', function(err, floors){
                if(floors){
                    var dayRangeStartIST = new time.Date(data.syear, data.smonth, data.sday, 0, 0, 0, 'Asia/Kolkata').getTime();
                    var dayRangeEndIST = new time.Date(data.eyear, data.emonth, data.eday, 23, 59, 59, 'Asia/Kolkata').getTime();
                    var noOfDays = Math.round(Math.abs((dayRangeStartIST - dayRangeEndIST)/(86399000)));
                    var daysCounter = 0;
                    var dayStartIST = 0;
                    var dayEndIST = 0;
                    var averageFilled = Array.apply(null, Array(floors.length)).map(Number.prototype.valueOf,0);
                    //console.log(averageFilled)
                    var averageEmpty = Array.apply(null, Array(floors.length)).map(Number.prototype.valueOf,0);
                    var peakDayArr = [];
                    var leastDayArr = [];
                    var peakDayValue = 0;
                    var leastDayValue = 99999;
                    var leastDay = 0;
                    var peakDay = 0;
                    while(dayRangeStartIST < dayRangeEndIST)
                    {
                        // console.log("Start Day", dayRangeStartIST)
                        // console.log("End Day", dayRangeEndIST) 
                        dayStartIST = dayRangeStartIST;
                        dayEndIST = dayRangeStartIST + 86399000;
                        generateFloorPlots(floors, dayStartIST, dayEndIST, function(floorData, dayStartIST){
                            floorData.sort(sortAlphaNum);
                            //console.log(floorData);
                            var tempSum = 0;
                            //console.log(averageFilled, averageEmpty)
                            for(var i=0; i < floors.length; i++)
                            {
                                averageFilled[i] += floorData[i].filled;
                                tempSum += floorData[i].filled
                            }
                            //console.log(averageFilled, averageEmpty);
                            if(tempSum > peakDayValue)
                            {
                                peakDayValue = tempSum;
                                peakDay = dayStartIST;
                                peakDayArr = [];
                                floorData.forEach(function(floor){peakDayArr.push(floor.filled)});
                            }
                            if(tempSum < leastDayValue)
                            {
                                leastDayValue = tempSum;
                                leastDay = dayStartIST;
                                leastDayArr = [];
                                floorData.forEach(function(floor){leastDayArr.push(floor.filled)});
                            }
                            if(++daysCounter == noOfDays)
                            {
                                console.log('done');
                                dayRangeStartIST += 1000;
                                for(var i=0; i< floors.length; i++)
                                {
                                    floorNames[i] = floorData[i].name;
                                    averageFilled[i] = Math.round(averageFilled[i]/noOfDays);
                                    averageEmpty[i] = floorData[i].total - averageFilled[i];
                                }
                                var percentFilled = [];
                                for(var i = 0; i<averageFilled.length; i++)
                                {
                                    percentFilled[i] = parseFloat(averageFilled[i] / (averageFilled[i] + averageEmpty[i]).toFixed(2));
                                }
                                //console.log(percentFilled)
                                var maxIndex = percentFilled.indexOf(Math.max.apply(null, percentFilled));
                                var minIndex = percentFilled.indexOf(Math.min.apply(null, percentFilled));
                                res.json({floorNames: floorNames, filledSeats: averageFilled, emptySeats: averageEmpty, maxFloor: floorNames[maxIndex], maxFilled: averageFilled[maxIndex], maxEmpty: averageEmpty[maxIndex], minFloor: floorNames[minIndex], minFilled: averageFilled[minIndex], minEmpty: averageEmpty[minIndex], peakDay: peakDay, leastDay: leastDay, peakDayArr: peakDayArr, leastDayArr: leastDayArr});
                            }
                        })
                        dayRangeStartIST = dayRangeStartIST + 86399000;
                        if(noOfDays > 1)
                            dayRangeStartIST += 1000;
                    }
                }
            })
        }
    });
    function generateFloorPlots(floors, dayStartIST, dayEndIST, callback)
    {
        var counter = 0;
        var pending = floors.length;
        var dayStart = new Date(dayStartIST);
        var dayEnd = new Date(dayEndIST);
        var floorData = [];
        //console.log(dayStart, dayEnd, floors.length)
        floors.forEach(function(floor){
            BleModel.find({floorId: floor._id, hasDensity: false, isHost: false}, function(err, bles){
                var bleIds = bles.map(function(ble){return ble._id});
                SensorDataModel.aggregate(
                    [
                        {"$match": {$and: [{'sensorId': {$in: bleIds}}, {$and: [{time :{$gte: dayStart}}, {time :{$lte: dayEnd}}]}, {'occupancy': true}]}},
                        {"$sort": {"sensorId": 1}},
                        {"$group": {"_id": "$sensorId", total: {$sum: 1}}},
                        {$match: {total: {$gte: 20}}}
                    ], function(err, result){
                        var temp = {};
                        temp.name = floor.name;
                        temp.filled = result.length;
                        temp.total = bleIds.length
                        floorData.push(temp);
                        if(++counter == pending){
                            callback(floorData, dayStartIST)
                            //floorData.sort(sortAlphaNum);
                            /*floorData.map(function(floor){floorNames.push(floor.name); filledSeats.push(floor.filled); emptySeats.push(floor.empty)});
                            var percentFilled = [];
                            for(var i=0;i<filledSeats.length; i++)
                            {
                                percentFilled[i] = filledSeats[i] / (filledSeats[i] + emptySeats[i]);
                            }
                            var maxIndex = percentFilled.indexOf(Math.max.apply(null, percentFilled));
                            var minIndex = percentFilled.indexOf(Math.min.apply(null, percentFilled));
                            res.json({floorNames: floorNames, filledSeats: filledSeats, emptySeats: emptySeats, maxFloor: floorNames[maxIndex], maxFilled: filledSeats[maxIndex], maxEmpty: emptySeats[maxIndex], minFloor: floorNames[minIndex], minFilled: filledSeats[minIndex], minEmpty: emptySeats[minIndex]});*/
                        }
                    }
                )
            })
        })
    }
})
.get('/getTempData', function(req, res, next){
    var data = req.query;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
            var floors = ['Level 1', 'Level 7', 'Level 8', 'Level 9', 'Level 10']
            var tempData = [];
            var hour = 99;
            var today = new Date();
            if(data.eday == data.sday && data.emonth == data.smonth && data.eyear == data.syear)
            {
                if(data.eday == today.getDate() && data.emonth == today.getMonth() && data.eyear == today.getFullYear())
                {
                    hour = today.getHours();
                }
            }
            dummy.find({}, function(err, docs){
                floors.forEach(function(floor){
                    var temp = {};
                    temp.name = floor;
                    temp[floor] = [];
                    var i=0;
                    docs.forEach(function(doc){
                        if(doc.name == floor)
                        {
                            if(i >= hour)
                                temp[floor].push(0);
                            else
                                temp[floor].push(doc.temperature);
                            i++;
                        }
                    })
                    tempData.push(temp);
                })
                res.json(tempData);
            })
        }
    });
})
.get('/roomUtil', function(req, res, next){
    //var floorId = req.params.floorId;
    var data = req.query;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    var hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
            var dayStartIST = new time.Date(data.syear, data.smonth, data.sday, 0, 0, 0, 'Asia/Kolkata').getTime()/1000 | 0;
            var dayEndIST = new time.Date(data.eyear, data.emonth, data.eday, 23, 59, 59, 'Asia/Kolkata').getTime()/1000 | 0;
            var floorData = [];
            FloorModel.find({}, ' name ', function(err, floors){
                var parentCounter = 0;
                var parentPending = floors.length;
                floors.forEach(function(floor){
                    RoomToBle.find({floorId: floor.id}, 'bleId roomId', {sort: 'roomId'}).lean().populate({path:'roomId', select: 'name'}).exec(function(err, rooms){
                        if(err)
                            res.status(400).json(err);
                        else if(rooms){
                            //console.log(rooms)
                            var bles = rooms.map(function(room){return {id: room.bleId}});
                            iterateRooms(bles, dayStartIST, dayEndIST, function(roomData){
                                var names = [];
                                var used = [];
                                var temp = {};
                                rooms.forEach(function(room){
                                    names.push(room.roomId.name);
                                    used.push(roomData[room.bleId]);
                                })
                                temp['name'] = floor.name;
                                temp['roomData'] = {'rooms': names, 'used': used};
                                floorData.push(temp);
                                if(++parentCounter == parentPending){
                                    floorData.sort(sortAlphaNum);
                                    res.json(floorData);
                                }
                            })
                        }
                        else
                            res.json({"used": "[]", "names": "[]"});              
                    });
                })
            });
        }
    });
    function iterateHours(ble, dayStart, dayEnd, callback)
    {
        var counter = 0;
        var pending = hours.length;
        var count = 0;
        hours.forEach(function(hour){
            var hourStart = new Date((dayStart + (hour * 3600))*1000);
            var hourEnd = new Date((dayStart + ((hour + 1) * 3600 - 1))*1000);
            //console.log(hourStart, hourEnd);
            SensorDataModel.count({sensorId: ble, time: {$gte: hourStart, $lte: hourEnd}, density: 1},function(err, densityCount){
                //console.log(ble, densityCount)
                if(densityCount >= 5)
                {
                    count++;
                }
                if(++counter == pending)
                {
                    callback(ble, count);
                }
            });
        })
    }
    function iterateRooms(bles, dayStart, dayEnd, callback)
    {
        var counter = 0;
        var pending = bles.length;
        var roomData = {};
        //console.log(dayStart, dayEnd);
        bles.forEach(function(ble){
            iterateHours(ble.id, dayStart, dayEnd, function(roomId, count){
                roomData[roomId] = count;
                if(++counter == pending){
                    callback(roomData);
                }
            })
        })
    }
})
.get('/utilData/:floorId', function(req, res, next){
    var floorId = req.params.floorId;
    var data = req.query;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    var hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
            var dayStartIST = new time.Date(data.year, data.month, data.day, 0, 0, 0, 'Asia/Kolkata').getTime();
            var dayEndIST = new time.Date(data.year, data.month, data.day, 23, 59, 59, 'Asia/Kolkata').getTime();
            var dayStart = new Date(dayStartIST);
            var dayEnd = new Date(dayEndIST);
            SeatToBle.find({floorId: floorId}, 'seatId bleId', {sort: 'seatId'}).lean().populate({path:'seatId', select: 'name'}).exec(function(err, seats){
                if(err)
                    res.status(400).json(err);
                else if(seats){
                    var bleIds = seats.map(function(seat){return seat.bleId});
                    SensorDataModel.aggregate(
                        [
                            {"$match": {$and: [{'sensorId': {$in: bleIds}}, {$and: [{time :{$gte: dayStart}}, {time :{$lte: dayEnd}}]}, {'occupancy': true}]}},
                            {"$sort": {"sensorId": 1}},
                            {"$group": {"_id": "$sensorId", total: {$sum: 1}}}
                        ], function(err, data){
                            var used = [];
                            var names = [];
                            //console.log(data);
                            seats.forEach(function(seat){
                                names.push(seat.seatId.name);
                                var obj = _.find(data, {"_id":seat.bleId})
                                if(obj)
                                {
                                    var tmp = (parseInt(obj.total)/120).toFixed(2);
                                    used.push(parseFloat(tmp));
                                }
                                else
                                    used.push(0);
                            })
                            res.json({used: used, names: names});
                        });
                }
                else
                    res.json({"used": "[]", "names": "[]"});              
            });
        }
    });
})
.get("/occupancyData/:floorId",function(req, res, next){
    var floorId = req.params.floorId;
    var data = req.query;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    var hours = ["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];
    var times = ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'];
    var times1 = ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'];
    var times2 = ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'];
    var angles = [100, 8.3, 16.6, 25, 33.3, 41.6, 50, 58.3, 66.6, 75, 83.3, 91.6, 100, 8.3, 16.6, 25, 33.3, 41.6, 50, 58.3, 66.6, 75, 83.3, 91.6];
    //var occData = [];
    /*var tempSpider1 = [];
    var tempSpider2 = [];
    var spiderData1 = [];
    var spiderData2 = [];*/
    //var percentOccData = [];
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
            /*var dayStart = new time.Date(data.year, data.month, data.day, 0, 0, 0, 'Asia/Kolkata').getTime()/1000 | 0;
            var dayEnd = new time.Date(data.year, data.month, data.day, 23, 59, 59, 'Asia/Kolkata').getTime()/1000 | 0;*/
            if(data.bu == '' || !data.bu)
            {
                //console.log(data);
                SeatModel.count({floorId: floorId}, function(err, seatCount){
                    if(err)
                        res.status(400).json(err);
                    else if(seatCount <= 0)
                        res.status(400).json({"err": "No seats found"});
                    else
                    {
                        BleModel.find({floorId: floorId}, '_id').exec(function(err, bles){
                            console.log(bles)
                            if(!bles)
                                res.status(404).json({"err": "No Ble found"})
                            else
                            {
                                computeOccupancy(bles, seatCount);
                            }
                        })
                    }
                });
            }
            else
            {
                //console.log(data);
                var seats = [];
                FloorModel.findById(floorId).lean().populate({path: 'sections', match:{name: data.bu}, select: " -isRoom -capacity"}).exec(function(err, sections){
                    sections.sections.forEach(function(section){
                        section.seats.map(function(seat){seats.push(seat)});
                    })
                    SeatToBle.find({seatId : {$in: seats}}, function(err, bles){
                        var bleIds = bles.map(function(ble){return {_id: ble.bleId}})
                        console.log(bleIds)
                        if(bleIds.length > 0)
                        {
                            computeOccupancy(bleIds, bleIds.length);
                        }
                        /*res.json({sections: sections.sections, seats: seats, bles: bleIds});*/
                    })
                });
            }
            
            function computeOccupancy(bles, seatCount)
            {
                var dayRangeStartIST = new time.Date(data.syear, data.smonth, data.sday, 0, 0, 0, 'Asia/Kolkata').getTime()/1000 | 0;
                var dayRangeEndIST = new time.Date(data.eyear, data.emonth, data.eday, 23, 59, 59, 'Asia/Kolkata').getTime()/1000 | 0;
                var noOfDays = Math.round(Math.abs((dayRangeStartIST - dayRangeEndIST)/(86399)));
                var daysCounter = 0;
                var averageOccData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                var averagePercentOccData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

                while(dayRangeStartIST < dayRangeEndIST)
                {
                    var dayStartIST = dayRangeStartIST;
                    var dayEndIST = dayRangeStartIST + 86399;
                    getHourlyOccupancy(bles, seatCount, dayStartIST, dayEndIST, function(occData, percentOccData){
                        for(var i=0; i<occData.length; i++)
                        {
                            averageOccData[i] += occData[i];
                            averagePercentOccData[i] += percentOccData[i];
                        }
                        if(++daysCounter == noOfDays)
                        {
                            //console.log(averageOccData);
                            if(noOfDays > 1)
                            {
                                for(var i=0; i< averageOccData.length; i++)
                                {
                                    averageOccData[i] = Math.round((averageOccData[i]/noOfDays))
                                    averagePercentOccData[i] = Math.round((averagePercentOccData[i]/noOfDays))
                                }
                            }
                                
                            var peakValue = (Math.max.apply(null,averageOccData));
                            var peakIndex = averageOccData.indexOf(peakValue);
                            var peakPercent = ((peakValue/seatCount) * 100).toFixed(2);
                            var tempData = averageOccData.slice();
                            for(var i=0; i<tempData.length; i++)
                            {
                                if(tempData[i] == 0)
                                    tempData[i] = 999;
                            }
                            var leastValue = Math.min.apply(null,tempData) == 999 ? 0 : Math.min.apply(null,tempData);
                            var leastIndex = tempData.indexOf(leastValue);
                            var leastPercent =((leastValue/seatCount) * 100).toFixed(2);
                            res.status(200).json({occData: averageOccData, percentOccData: averagePercentOccData, peakTime: times[peakIndex], peakAngle: angles[peakIndex], peakPercent: peakPercent, leastTime: times[leastIndex], leastAngle: angles[leastIndex], leastPercent: leastPercent, peakValue: peakValue, leastValue: leastValue, seatCount: seatCount});
                        }
                    });
                    dayRangeStartIST = dayRangeStartIST + 86399;
                    if(noOfDays > 1)
                        dayRangeStartIST += 1;
                }
            }
            function getHourlyOccupancy(bles, seatCount, dayStart, dayEnd, callback)
            {
                var parentCounter = 0;
                var parentPending = hours.length;
                var occData = [];
                var percentOccData = [];
                var tempOccData = {};
                var tempPercentData = {};
                //console.log(dayStart, dayEnd);
                hours.forEach(function(hour){
                    var currentDay = new Date(dayStart*1000);
                    var condition = {};
                    condition[hour] = {$gte:20}
                    condition['day'] = currentDay;
                    condition['sensorId'] = {$in: bles}
                    occAgg.count(condition, function(err, count){
                        var average = parseFloat((((seatCount - count)/seatCount)*100).toFixed(2));
                        tempOccData[hour] = count;
                        tempPercentData[hour] = average;
                        //occData.push(count);
                        //percentOccData.push(average);
                        if(++parentCounter == parentPending)
                        {
                            hours.forEach(function(hour){
                                occData.push(tempOccData[hour]);
                                percentOccData.push(tempPercentData[hour]);
                            })
                            callback(occData, percentOccData);
                        }
                    })
                })
            }
        }
    });
    //res.send("Done");
})
.get("/exportExcel",function(req, res, next){
    var data = req.query;
    var cookies = req.cookies;
    var token = cookies.auth_token;
    /*var hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];*/
    var hours = ["00:00","00:10","00:20","00:30","00:40","00:50","01:00","01:10","01:20","01:30","01:40","01:50","02:00","02:10","02:20","02:30","02:40","02:50","03:00","03:10","03:20","03:30","03:40","03:50","04:00","04:10","04:20","04:30","04:40","04:50","05:00","05:10","05:20","05:30","05:40","05:50","06:00","06:10","06:20","06:30","06:40","06:50","07:00","07:10","07:20","07:30","07:40","07:50","08:00","08:10","08:20","08:30","08:40","08:50","09:00","09:10","09:20","09:30","09:40","09:50","10:00","10:10","10:20","10:30","10:40","10:50","11:00","11:10","11:20","11:30","11:40","11:50","12:00","12:10","12:20","12:30","12:40","12:50","13:00","13:10","13:20","13:30","13:40","13:50","14:00","14:10","14:20","14:30","14:40","14:50","15:00","15:10","15:20","15:30","15:40","15:50","16:00","16:10","16:20","16:30","16:40","16:50","17:00","17:10","17:20","17:30","17:40","17:50","18:00","18:10","18:20","18:30","18:40","18:50","19:00","19:10","19:20","19:30","19:40","19:50","20:00","20:10","20:20","20:30","20:40","20:50","21:00","21:10","21:20","21:30","21:40","21:50","22:00","22:10","22:20","22:30","22:40","22:50","23:00","23:10","23:20","23:30","23:40","23:50"]
    jwt.verify(token, global.secret, function(err, decoded){
        if(err){
            res.status(401).json(err);
        }
        else
        {
            var heading = [[{value: 'Seats status for every 10 minutes from, ' + data.sday + '-' + (parseInt(data.smonth) + 1) + '-' + data.syear + ' to ' + data.eday + '-' + (parseInt(data.emonth) + 1) + '-' + data.eyear, style: styles.headerDark}]];
            var specification = {
                country: {
                    displayName: 'Country', 
                    headerStyle: styles.headerDark, 
                    width: 120 
                },
                region: {
                    displayName: 'Region', 
                    headerStyle: styles.headerDark, 
                    width: 120 
                },
                location: {
                    displayName: 'Location', 
                    headerStyle: styles.headerDark, 
                    width: 120 
                },
                day: {
                    displayName: 'Date', 
                    headerStyle: styles.headerDark, 
                    width: 120 
                },
                resourceType: {
                    displayName: 'Resource Type', 
                    headerStyle: styles.headerDark, 
                    width: 120 
                },
                Department: {
                    displayName: 'Department', 
                    headerStyle: styles.headerDark, 
                    width: 120 
                },
                floor: {
                    displayName: 'Floor', 
                    headerStyle: styles.headerDark, 
                    width: 120 
                },
                seatName: {
                    displayName: 'Seat Number', 
                    headerStyle: styles.headerDark, 
                    width: 120 
                }
            }
            hours.forEach(function(hour){
                specification[hour] = {
                    displayName: hour,
                    headerStyle: styles.headerDark, 
                    width: 60
                }
            })
            var dataset = [];
            var dayRangeStartIST = new time.Date(data.syear, data.smonth, data.sday, 0, 0, 0, 'Asia/Kolkata').getTime();
            var dayRangeEndIST = new time.Date(data.eyear, data.emonth, data.eday, 0, 0, 0, 'Asia/Kolkata').getTime();
            var noOfDays = Math.round(Math.abs((dayRangeStartIST - dayRangeEndIST)/(86400000)));
            var days = [];
            for(var i=0;i<=noOfDays; i++)
            {
                var dayCounter = i*86400000;
                var currentDay = new time.Date(dayRangeStartIST + dayCounter, 'Asia/Kolkata')
                var dateStr = currentDay.getDate() + "-" + parseInt(currentDay.getMonth() + 1) + "-" + currentDay.getFullYear();
                days.push(dateStr);
            }
            excelAgg.find({day:{$in: days}}, '-_id -done', function(err, data){
                var report = excel.buildExport(
                [ 
                    {
                        name: "Report",
                        heading: heading,
                        specification: specification,
                        data: data
                    }
                ]
                );
                res.attachment('Report.xlsx');
                return res.send(report);
            })
            /*FloorModel.findById(floorId, function(err, floor){
                var floorName = floor.name;
                BleModel.find({floorId: floorId}, '_id').exec(function(err, bles){
                    var daysCounter = parseInt(weekStartDate) - 1;
                    var daysPending = parseInt(weekEndDate);
                    var bleIds = bles.map(function(ble){return ble._id});
                    for(var i=weekStartDate; i<=weekEndDate; i++)
                    {
                        var dayStart = new time.Date(data.year, data.month, i, 0, 0, 0, 'Asia/Kolkata').getTime()/1000 | 0;
                        getDayData(hours, dayStart, bleIds, function(dayData){
                            dataset.push(dayData);
                            console.log(daysCounter)
                            if(++daysCounter == daysPending)
                            {
                                var report = excel.buildExport(
                                [ 
                                    {
                                        name: floorName,
                                        heading: heading,
                                        specification: specification,
                                        data: dataset
                                    }
                                ]
                                );
                                res.attachment('Report.xlsx');
                                return res.send(report);
                            }
                        })
                    }
                })
            });*/
            function getDayData(hours, dayStart, bleIds, callback)
            {
                var dayData = {};
                var counter = 0;
                var pending = hours.length;
                dayData.date = new Date(dayStart * 1000).toString().slice(0, 15);
                hours.forEach(function(hour){
                    var hourStart = new Date((dayStart + (hour * 3600))*1000);
                    var hourEnd = new Date((dayStart + ((hour + 1) * 3600 - 1))*1000);
                    SensorDataModel.aggregate(
                        [
                            {"$match": {$and: [{'sensorId': {$in: bleIds}}, {$and: [{time :{$gte: hourStart}}, {time :{$lte: hourEnd}}]}, {'occupancy': true}]}},
                            {"$sort": {"sensorId": 1}},
                            {"$group": {"_id": "$sensorId", total: {$sum: 1}}},
                            {$match: {total: {$gte: 20}}}
                        ], function(err, result){

                            dayData['hr' + hour] = result.length;
                            if(++counter == pending)
                            {
                                callback(dayData);
                            }
                    })
                })
            }

            /*var report = excel.buildExport(
            [ 
                {
                    name: "Floorname", 
                    specification: specification, 
                    data: dataset
                }
            ]
            );*/
            /*res.attachment('report.xlsx'); 
            return res.send(report);*/
        }
    });
})
module.exports = router;
