/**
 * Database file for the user model
 */

var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Devices  = require('./device');

var userSchema = new mongoose.Schema({
    //uid: {type: mongoose.Schema.Types.ObjectId, auto: true},
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    created_at: Date,
    updated_at: Date,
    twofa: { type: Boolean, default: false }
});

userSchema.pre('validate', function(next){
    var currentDate = new Date();
    
    this.updated_at = currentDate;

    if(!this.created_at){
        this.created_at = currentDate;
    }
    next();
})
// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
// Bcrypt's compare sync knows how to chop out the salt from it's bcrypt.genSaltSync(8) generated hash
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.getAllDevices = function(callback){
    Devices.find({uid: this._id}, function(err, data){
        callback(data)
    })
}

userSchema.methods.has2fa = function(callback){
    Devices.find({uid: this._id}).exec()      
    .then(function(data){
        callback(data.length > 0)
    })
}

userSchema.statics.authenticate = function (email, password, callback) {
    this.findOne({ email: email })
      .exec(function (err, user) {
        if (err) {
          return callback(err)
        } else if (!user) {
          var err = new Error('User not found.');
          err.status = 401;
          return callback(err);
        }
        //bcrypt pulls out the salt of the password and checks hash agains hash, never plaintext
        bcrypt.compare(password, user.password, function (err, result) {
          if (result === true) {
            //check if user has 2fa
            user.has2fa(function(result){
                if(result){
                    return callback(null, user, 'totp');
                }else{
                    //user with no 2fa
                    return callback(null, user, null);
                }
            })
          } else {
            return callback(null, false, null);
          }
        })
      });
}

module.exports = mongoose.model('User', userSchema);

