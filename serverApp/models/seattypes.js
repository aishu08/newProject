const mongoose = global.mongoose;
const Schema = mongoose.Schema;
const SchemaTypes = Schema.Types;

const SeatTypeSchema = new Schema({

        name: {
            type: String,
            index: true,
            unique: true
        },
        area: {
            type: Number,
            index: true
        },
        cost: {
            type: Number,
            index: true
        },
        shapename: {
            type: String,
            index: true
        },
        shape: {
            type: String,
            index: true
        },
        discription: {
            type: String
        }
    })
    // , { collection: "SeatTypes" });
    // mongoose.model('SeatTypeModel', SeatTypeSchema);

SeatTypeSchema.pre('save', function(next) {
    next();
});
SeatTypeSchema.post('save', function(doc, next) {
    console.log("%s is created", doc._id);
    next();
})
SeatTypeSchema.set('toJSON', {
    transform: function(doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
var SeatType = mongoose.model('SeatType', SeatTypeSchema);
module.exports = SeatType;