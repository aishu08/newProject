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
var Employees = require("../models/employees");
var RoomToBle = require("../models/roomToBle");
var BookingDetails = require('../models/bookingDetails')
var time = require('time');
var fs = require('fs');

var validateRequest = function(decoded, callback)
{
//callback(false);
//console.log(decoded.username);
UserModel.findOne({name: decoded.username}, function(err, user, num){
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
router.post('/addEmployee', function(req, res, next){
	var data = req.body;
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
})

router.post('/cardBooking',function(req,res,next){
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

router.post('/webBooking',function(req,res,next){
	var data = req.body;
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
});

router.post('/cancelFutureBooking',function(req,res,next){
	var data = req.body;
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
})
router.post('/cancelWebBooking',function(req,res,next){
	var data = req.body;
	//res.status(200).json(data)
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
})

router.get('/availableSeats',function(req,res,next){
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
	SeatToBle.find({floorId:floorId}).populate({path:'seatId', select: 'name posX posY'}).
	populate({path:'bookingId',select:'employeeId outTime',populate:{path:"employeeId",select:'uid'}}).then(function(seats){
		if(seats.length){
			res.status(200).json(seats)
		}else{
			res.status(500).json({msg:"no data"})
		}
	})
})

router.get('/getSites',function(req,res,next){
	SiteModel.find({},function(err,cities){
		if(!err){
			res.status(200).json(cities)
		} else{
			res.status(500).json({err})
		}
	})
})

router.get('/getBuildings/:siteId',function(req,res,next){
	var siteId = req.params.siteId;
	SiteModel.find({_id:siteId}).populate({path:'buildings',select:'name'},function(err,buildings){
		if(!err){
			res.status(200).json(buildings)
		} 
		else {
			res.status(500).json(err)
		}
	})
})



router.get('/getFloors/:buildingId',function(req,res,next){
	var buildingId = req.params.buildingId;
	console.log(buildingId)
	BuildingModel.find({_id:buildingId}).populate({path:'floors',select:'name'},function(err,floors){
		if(!err){
			res.status(200).json(floors)
		} else {
			res.status(500).json(err)
		}
	})
})

router.get('/getEmployeeBooking/:empId',function(req,res,next){
	
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
})

module.exports = router;