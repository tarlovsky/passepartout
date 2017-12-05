var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var deviceSchema = mongoose.Schema({
    //_id: {type: mongoose.Schema.Types.ObjectId, auto: true},
    deviceName: { type: String, required: true },
    key: {type: String, required: true},
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, required: true },
    confirmed: { type: Boolean, default: false },
    first_awaited_answer: { type: String }
})

deviceSchema.pre('validate', function(next){
    var currentDate = new Date();

    if(!this.created_at){
        this.created_at = currentDate;
    }
    next();
})

module.exports = mongoose.model('Device', deviceSchema);