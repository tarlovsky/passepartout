
var User = require('../models/user'),
Device = require('../models/device'),
Token = require('../models/token'),
;
var mongoose = require('mongoose');
var configDB = require('../config/database.js');
mongoose.connect(configDB.url);

var uid = "5a1d4197d83c1212f1048674"
var email="alex@ist.com";

Device.findOne({_id: did, uid: current_user_id}, function(err, obj){
    console.log('object')
    console.log(obj)
    if (err) { return next(err); }
    
    //the user had one minute to do this
    if( (user_answer.toString() == obj.first_awaited_answer.toString()) && ((new Date() - new Date(obj.created_at)) < (1012 * 60)) ){
        obj.update({ _id: did, uid: current_user_id  }, { $set: { confirmed: true, deviceName: device_name } }, function(){
            res.flash('deviceAttachMesage', 'Device ' + did + ' registered sucessefully!')
            res.redirect(303, '/user-account')
        });
    }else{
        //ask user to start over because he missed the window
        Device.remove({_id: did, uid: current_user_id}).exec(function(err){
            if(err){throw err;}
            req.flash('deviceAttachMesage', 'Looks like you were too late or the answer was wrong, try again but this time faster!' );
            res.redirect(303, '/user-account');
        });
    }
    
})