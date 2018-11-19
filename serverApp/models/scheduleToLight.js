const mongoose = global.mongoose;
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types;

const ScheduleToLightSchema = new Schema({
    lightId: {
        type: Schema.ObjectId,
        ref: 'lights',
        index: true
    },
    scheduleId:{
        type: Schema.ObjectId,
        ref: 'Schedules',
        index:true
    },
    hostId: {
        type: Schema.ObjectId,
        ref: 'Hosts'
    },
    lightIntensity:{
        type: Number,
        index: true,
        min: 0
    }

});
ScheduleToLightSchema.pre('save', function(next){
    next();
});
ScheduleToLightSchema.post('save', function(doc, next){
    console.log("%s is created", doc._id);
    next();
})
var ScheduleToLight = mongoose.model('ScheduleToLight', ScheduleToLightSchema);
module.exports = ScheduleToLight;