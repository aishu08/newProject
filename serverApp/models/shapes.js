const mongoose = global.mongoose;
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types;

const ShapesSchema = new Schema({

    name: {
        type: String,
        index: true,
        unique: true
    },
    class: {
        type: String,
            index: true
    },
    active: {
        type: Boolean,
        index: true,
        default: true
    }

});
// , { collection: "Shapes" });
// mongoose.model('ShapesModel', ShapesSchema);

ShapesSchema.pre('save', function(next) {
    next();
});
ShapesSchema.post('save', function(doc, next) {
    console.log("%s is created", doc._id);
    next();
})
ShapesSchema.set('toJSON', {
    transform: function(doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
var Shape = mongoose.model('Shape', ShapesSchema);
module.exports = Shape;