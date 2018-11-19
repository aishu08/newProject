const mongoose = global.mongoose;
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types;

const touchPanelSchema = new Schema({
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
    }
})
touchPanelSchema.pre('save', function (next) {
    next();
});
touchPanelSchema.post('save', function (doc, next) {
    console.log("%s is created", doc._id);
    next();
})
var TouchPanels = mongoose.model('touchPanels', touchPanelSchema);
module.exports = TouchPanels;