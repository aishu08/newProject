var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var SeatSettings = new Schema({

    size: Number,
    type: String

}, { collection: 'Seat_Settings' });

mongoose.model('SeatSettingModel', SeatSettings);
