var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Devices  = require('./device');
//var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
    //uid: {type: mongoose.Schema.Types.ObjectId, auto: true},
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    created_at: Date,
    updated_at: Date,
    twofa: { type: Boolean, default: false }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.has2fa = function(callback){

    Devices.find({uid: this._id}).exec()      
    .then(function(data){
        console.log(data)
        callback(data.length > 0)
    })
}

userSchema.pre('validate', function(next){
    var currentDate = new Date();
    
    this.updated_at = currentDate;

    if(!this.created_at){
        this.created_at = currentDate;
    }
    next();
})

//userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);