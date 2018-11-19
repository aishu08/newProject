const mongoose = global.mongoose;
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types;

const SceneToLightSchema = new Schema({
    lightId: {
        type: Schema.ObjectId,
        ref: 'Lights',
        index: true
    },
    sceneId:{
        type: Schema.ObjectId,
        ref: 'Scenes',
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
SceneToLightSchema.pre('save', function(next){
    next();
});
SceneToLightSchema.post('save', function(doc, next){
    console.log("%s is created", doc._id);
    next();
})
var SceneToLight = mongoose.model('SceneToLight', SceneToLightSchema);
module.exports = SceneToLight;