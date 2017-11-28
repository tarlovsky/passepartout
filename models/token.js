var mongoose = require('mongoose');

var tokenSchema = mongoose.Schema({
    challange: { type: String, required: true },
    did: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ts: { type: Number, required: true },
    created_at: { type: Date, required: true }
})

tokenSchema.pre('validate', function(next){
    var currentDate = new Date();
    this.ts = currentDate.getTime()/1000;

    if(!this.created_at){
        this.created_at = currentDate;
    }
    next();
})

module.exports = mongoose.model('Token', tokenSchema);