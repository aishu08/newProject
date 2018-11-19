//import { SchemaType } from "mongoose";

const mongoose = global.mongoose;
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types;
// tofl - Time of Full Load; 
const LightSchema = new Schema({
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
    width: {
        type: SchemaTypes.Double,
        default: 25
    },
    height: {
        type: SchemaTypes.Double,
        default: 25
    },
    class: {
        type: String,
            default: ''
    },
    rotate: {
        type: SchemaTypes.Double,
        default: 0.00
    },
    minlevel: {
        type: SchemaTypes.Number,
        default: 0
    },
    maxlevel: {
        type: SchemaTypes.Number,
        default: 99
    },
    faderate: {
        type: SchemaTypes.Number,
        default: 6
    },
    wattage: {
        type: SchemaTypes.Number,
        default: 0
    },
    tofl: {
        type: SchemaTypes.Number,
        default: 8
    },
    isTunable: {
        type: Boolean,
        default: false
    }
});
LightSchema.pre('save', function(next) {
    next();
});
LightSchema.post('save', function(doc, next) {
    console.log("%s is created", doc._id);
    next();
});

var Lights = mongoose.model('Lights', LightSchema);
module.exports = Lights;