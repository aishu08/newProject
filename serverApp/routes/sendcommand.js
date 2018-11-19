var router = global.express.Router();

var BleModel = require('../models/ble');
var LightModel = require('../models/lights');
var LightToBleModel = require('../models/lightToBle');
var LightSensorToBleModel = require('../models/lightSensorToBle');
var LightSensorModel = require('../models/lightSensors');
var LightTypeModel = require('../models/lighttypes');
var LightShapesModel = require('../models/lightshapes');
var async = require('async');



router.post('/lightAddress', function(req, res, next) {
    var data = req.body
        // console.log("data....", data)
    var fd = updateAddress(data)
    res.send("done successfully")

})


async function updateAddress(val) {
    counter = 0
    pArr = []
    val.address.forEach(async function(pos) {
        bleType = Object.keys(pos)[0]
        if (bleType == 'warm') {
            ble = pos.warm;
        } else {
            ble = pos.cool
        }

        var p = await getTotalData(ble, bleType, val)
        pArr.push(p)
        if (pArr.length == val.address.length) { return true }
    })

    // return finalData
}





async function getTotalData(dt, bleType, data) {
    console.log("dt", dt)
    warm = false
    cool = false
    if (bleType == 'warm') warm = true;
    if (bleType == 'cool') cool = true;

    try {
        var bleData = await BleModel.findOneAndUpdate({ address: dt }, {

            " floorId": data.flId,
            "name": dt,
            "commissionStatus": false,
            "mapped": true,
            "isTP": false,
            "isDLS": false,
            " isCOS": false,
            "isLAD": true,
            "hasDensity": false,
            "isCOS": false,
            "hasTemperature": false,
            "hasOccupancy": false,
            "isHost": false,
            "warmble": warm,
            "coolble": cool
        }, { upsert: true, new: true });
        // console.log("dataltId", data.ltId)
        // console.log("bledata", bleData._id)
        var lightData = await LightToBleModel.findOneAndUpdate({ lightId: data.ltId, bleId: bleData._id }, { status: false }, { upsert: true, new: true })
            // console.log("ddd", lightData)
        if (lightData) {
            console.log("done")
            return true

        }


    } catch (error) {
        console.log(error)
        return false;
    }
}



router.post('/ping', function(req, res, next) {

})



module.exports = router;