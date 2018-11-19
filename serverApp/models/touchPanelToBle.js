const mongoose = global.mongoose;
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types;

const TouchPanelToBleSchema = new Schema({
    floorId: {
        type: Schema.ObjectId,
        ref: 'Floors',
        index: true
    },
    touchPanelId: {
        type: Schema.ObjectId,
        ref: 'touchPanels',
        index: true
    },
    bleId: {
        type: Schema.ObjectId,
        ref: 'Ble',
        index: true
    },
    hostId: {
        type: Schema.ObjectId,
        ref: 'Hosts'
    },
    lightBles: {
        type: Schema.ObjectId,
        ref: 'Ble',
        index: true
    },
    lights: {
        type: [{ type: Schema.ObjectId, ref: 'Lights' }]
    },
    sensors:{
        type:[{ type: Schema.ObjectId, ref: 'lightSensors' }]
    },
    status: {
        type: Boolean,
        default: false
    },
    lastStatusUpdate: {
        type: Date,
        index: true
    }
});
TouchPanelToBleSchema.pre('save', function (next) {
    next();
});
TouchPanelToBleSchema.post('save', function (doc, next) {
    console.log("%s is created", doc._id);
    next();
})

var TouchPanelToBleData = mongoose.model('touchPanelToBle', TouchPanelToBleSchema);
module.exports = TouchPanelToBleData;