var mongoose = require('mongoose');

var tokenSchema = mongoose.Schema({
    //tid: {type: mongoose.Schema.Types.ObjectId, auto: true},
    ts: { type: Number, required: true },
    challange: { type: String, required: true },
    did: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, required: true }
})

tokenSchema.pre('save', function(next){
    var currentDate = new Date();

    if(!this.created_at){
        this.created_at = currentDate;
    }
    next();
})

module.exports = mongoose.model('Token', tokenSchema);