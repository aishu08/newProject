// import { buildingData } from '../controllers/lightController';

var router = global.express.Router();
var BuildingModel = require('../models/building');
var FloorModel = require('../models/floors');
var HostModel = require('../models/hosts');
var SensorDataModel = require('../models/sensorData');
// var SensorHealthLogModel = require('../models/sensorHealthLog');
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
var UserModel = require('../models/users');
var light_controller = require('../controllers/lightController');
var light_analytics = require('../controllers/lightAnalytics');
var light_commissioning = require('../controllers/lightCommissioning');
var HostModel = require('../models/hosts');
// Building, Floor,Dashboard API`s
router.get('/getBuildings', light_controller.getBuildings)

router.get('/buildingData', light_controller.buildingData)
    // Light Api`s
router.get('/getAllLights/:floorId', light_controller.getAllLights)
router.post('/setLightIntensity', light_controller.setIntensity)
    //Zone Api`s
router.post('/createzone', light_controller.createZone)
    // Function needs little bit of work for handling removing of lights from zone 

router.post('/addLightZone', light_controller.addLightToZone)
    // Need to remove scene and schedules of all the zones when deleting zone if present
router.post('/deleteZone', light_controller.deleteZone)
router.get('/getZoneLights/:floorId/:zoneId', light_controller.getallLightsZoneFloor)
router.get('/getZones/:floorId/:hostId', light_controller.getZones);
router.get('/getZonesFloor/:floorId', light_controller.getZonesFloor);


// router.post('/createScene',light_controller.createScene)

// Scene APIs
router.post('/addScene', light_controller.addScene)
router.post('/addScenelights', light_controller.addLightsToScene)
router.get('/applyScene/:sceneId', light_controller.applyScene)
router.post('/getSceneLights', light_controller.getLightsScene)
router.post('/deleteScene', light_controller.deleteScene)

// Schedule APIs
router.post('/createSchedule', light_controller.createSchedule)
router.post('/checkLightSchedule', light_controller.checkLightInSchedule)
router.post('/getScheduleLights', light_controller.getLightsSchedule)
router.post('/deleteSchedule', light_controller.deleteSchedule)
router.post('/applySchedules', light_controller.applySchedules)

router.post('/toggleLights', light_controller.toggleLights)
router.post('/toggleCustomLights', light_controller.toggleCustomLights)
router.post('/toggleAllFloorLights', light_controller.toggleAllFloorLights)
    // Write a GET API for toggling all lights with 

router.get('/getSmartOccupancyValue/:address', light_controller.getSmartOccupancyValue)

// router.get('/lightIntensity/:lightId',light_controller.getLightIntensity)
// router.post('/lightData',light_controller.setLightData)
// router.get('/lightData',light_controller.getLightData)

router.post('/lightSensorData', light_controller.insertLightSensorData)


router.get('/getAllSOS/:floorId', light_controller.getAllSOS)

//Test API`s
router.post('/testrp', light_controller.getLightIntensity)

// Analytics API's
// router.get('/testla',light_analytics.testcontroller)
router.get('/floorLightUsageOld/:buildingId', light_analytics.floorLightUsageOld)
router.get('/floorLightUsage/:buildingId', light_analytics.floorLightUsage)
router.get('/lightUsagePattern/:buildingId', light_analytics.lightUsagePattern)
router.get('/zoneLightUsagePattern/:buildingId', light_analytics.zoneLightUsagePattern);
router.get('/zonePowerUsagePattern/:buildingId', light_analytics.zonePowerUsagePattern);
router.get('/powerUsagePattern/:buildingId', light_analytics.powerUsagePattern)
router.get('/powerUsagePattern1/:buildingId', light_analytics.powerUsagePattern1)
router.get('/lightUsagePercent/:buildingId', light_analytics.buildingFloorPercentUsage);
router.get('/floorUsagePercent/:buildingId', light_analytics.floorLightPercent);


router.post('/lighMappingInsert', light_controller.lighMappingInsert);
router.post('/SubmitToHost', light_controller.SubmitToHost);


// Commissioning APIs

// router.get('/testcommissioning/:asdf', light_commissioning.testcommissioning);
router.post('/createLights/:floorId', light_commissioning.createLights);
router.get('/getlights', light_commissioning.getLights);
router.get('/getlightsWithBle', light_commissioning.getlightsWithBle)
router.get('/geTunAddress', light_commissioning.geTunAddress)
router.get('/getTunLightsBle', light_commissioning.getTunLightsBle)
router.get('/getLightsBle', light_commissioning.getLightsBle);
router.put('/UpdateLight', light_commissioning.UpdateLight);
router.put('/removeSelectedLights', light_commissioning.removeSelectedLights);
router.put('/updateAllLightswithoutsensor', light_commissioning.updateAllLightswithoutsensor);
router.post('/creatsensors/:floorId', light_commissioning.creatsensors);
router.put('/updatesensor', light_commissioning.updatesensor);
router.post('/createTouchPanels/:floorId', light_commissioning.createTouchPanels);
router.get('/getTouchPanels', light_commissioning.getTouchPanels);
router.put('/updateTouchPanel', light_commissioning.updateTouchPanel);
router.put('/removeTouchPanel', light_commissioning.removeTouchPanel);
router.put('/checkLightTouchpanelMapping', light_commissioning.checkLightTouchpanelMapping);
router.put('/MapSelectedLightswithTP', light_commissioning.MapSelectedLightswithTP);
router.put('/savetouchPanelPosition', light_commissioning.savetouchPanelPosition);
router.post('/createDevices/:floorId', light_commissioning.createDevices)
router.put('/UpdateDeviceAddress/:floorId', light_commissioning.UpdateDeviceAddress);


router.put('/updateAllDevicesWBle', light_commissioning.updateAllDevicesWBle);
router.post('/uploadDevices/:floorId', light_commissioning.uploadDevices);
router.post('/uploadaddress/:floorId', light_commissioning.uploadaddress);
router.post('/createSensorsWBles/:floorId', light_commissioning.createSensorsWBles);
router.post('/createTPWBles/:floorId', light_commissioning.createTPWBles);
router.put('/removeSelectedSensors', light_commissioning.removeSelectedSensors);
router.put('/removeSelectedTPs', light_commissioning.removeSelectedTPs);

router.get('/getsensorsWBles', light_commissioning.getsensorsWBles);
router.get('/getSensorsBle', light_commissioning.getSensorsBle);
router.get('/getTouchPanelsWBles', light_commissioning.getTouchPanelsWBles);

router.get('/getlightshost', light_commissioning.getLightsHost)
router.get('/getTouchPanelBle', light_commissioning.getTouchPanelBle);
router.get('/getTouchPanelBles', light_commissioning.getTouchPanelBles);

router.put('/UpdateLightBle', light_commissioning.UpdateLightBle);

router.get('/getAllBles/:floorId', light_commissioning.getAllBles);
router.post('/mapBle/:floorId', light_commissioning.mapBle);

router.post('/createHost', light_commissioning.createHost);
router.post('/updateHost', light_commissioning.updateHost);
router.put('/MapDevciesWithHost', light_commissioning.MapDevciesWithHost);

router.post("/getHostDevices", light_commissioning.getHostDevices);
router.post("/publishHostDevices", light_commissioning.publishHostDevices);

router.post('/sendCommandToDevice', light_commissioning.sendCommandToDevice);
router.post('/hostAutoCommssioning', light_commissioning.hostAutoCommssioning);
router.post('/deviceCommission', light_commissioning.deviceCommission);


router.post('/getModBusValues', light_commissioning.getModBusValues);
router.post('/postModBusValues', light_commissioning.postModBusValues);
router.post('/addUser', light_controller.addUser);

module.exports = router;