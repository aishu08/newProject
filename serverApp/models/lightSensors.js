const mongoose = global.mongoose;
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types;

const lightSensorSchema = new Schema({
    floorId: {
        type: Schema.ObjectId,
        ref: 'Floors',
        index: true
    },
    hostId: {
        type: Schema.ObjectId,
        ref: 'Hosts'
    },
    name: {
        type: String,
        index: true
    },
    posX: {
        type: SchemaTypes.Double,
        default: 0.00
    },
    posY: {
        type: SchemaTypes.Double,
        default: 0.00
    },
    isSOS:{
        type: Boolean,
        default: false

    },
    isDLS:{
        type: Boolean,
        default: false
    },
    timeout:{
        type:Number,
        default:5
    }, 
    width: {
        type: SchemaTypes.Double,
        default: 25
    },
    height: {
        type: SchemaTypes.Double,
        default: 25
    },
})
lightSensorSchema.pre('save', function (next) {
    next();
});
lightSensorSchema.post('save', function (doc, next) {
    console.log("%s is created", doc._id);
    next();
})
var LightSensors = mongoose.model('lightSensors', lightSensorSchema);
module.exports = LightSensors;