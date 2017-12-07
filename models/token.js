/**
 * Database file for authentication tokens
 */


var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var tokenSchema = mongoose.Schema({
    challange: { type: String, required: true },
    awaitedAnswer: { type: String },
    did: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ts: { type: Number, required: true },
    created_at: { type: Date, required: true }
})

tokenSchema.pre('validate', function(next){
    var currentDate = new Date();
    this.ts = currentDate.getTime() / 1000;

    this.awaitedAnswer = bcrypt.hashSync(this.awaitedAnswer, bcrypt.genSaltSync(8), null);

    if(!this.created_at){
        this.created_at = currentDate;
    }
    next();
})
// Bcrypt's compare sync knows how to chop out the salt from it's bcrypt.genSaltSync(8) generated hash
tokenSchema.methods.validateAnswer = function(ans){
    return res = bcrypt.compareSync(ans, this.awaitedAnswer)
}

module.exports = mongoose.model('Token', tokenSchema);