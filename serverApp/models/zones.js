const mongoose = global.mongoose;
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types;

const ZoneSchema = new Schema({
    hostId: {type: Schema.ObjectId, ref: 'Hosts'},
    floorId: {type: Schema.ObjectId, ref: 'Floors'},
    name: {type: String,index: true}, 
    lights: {type: [{type: Schema.ObjectId, ref: 'Lights' }]},
    sensors: {type: [{type: Schema.ObjectId,ref: 'Ble'}]},
    scenes: {type:[{type: Schema.ObjectId, ref:'Scenes'}]},
    schedules: {type:[{type: Schema.ObjectId, ref: 'Schedules'}]},
    zoneId: {type: Number, default: 0}
});
ZoneSchema.post('save', function(doc, next){
    console.log(doc+ " saved")
    next();
}); 
ZoneSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

var Zones = mongoose.model('Zones', ZoneSchema);
module.exports = Zones;