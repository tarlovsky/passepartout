var Device = require('./models/device')
var mongoose = require('mongoose');
var configDB = require('./config/database.js');
var loggedin = require('connect-ensure-login');
mongoose.connect(configDB.url);


module.exports = function(app, passport){
    
    app.get('/', function (req, res) {
        res.render('homepage', {
            layout: 'main',
            user: req.user
        })
    })
    
    app.get('/user-account', loggedin.ensureLoggedIn('/sign-in'), function (req, res, next) {
        Device.find({uid: req.user._id}, function(err, myDevices){
            if (err) { return next(err); }
            res.render('user-account', {layout: 'main', user: req.user, devices: myDevices, messages: req.flash('deviceAttachMesage')})
        })
    })
    
    app.get('/attach-device', loggedin.ensureLoggedIn('/sign-in'), function (req, res, next) {
        
            var MAX_PASSCODE_LENGTH = 6,
                User = require('./models/user'),
                Device = require('./models/device'),
                Token = require('./models/token'),
                utils = require("./utils"),
                base32 = require('thirty-two')
                crypto = require('crypto'),
                qrimage = require('qr-image')
                ;
            

            var secretKey = utils.randomKey(48);
            
            const challenge = utils.getChallenge();
            var pin_len = utils.randomInt(6,9);
            const awaited_answer = utils.passcodeGenerator(secretKey, challenge, pin_len);
            
            var deviceToInsert = new Device({
                deviceName: "My First Authentication Device",
                key: secretKey,
                uid: req.user._id,
                confirmed: false,
                first_awaited_answer: awaited_answer.toString()
            });
            
            var did = deviceToInsert._id;
            
            deviceToInsert.save(function(err) {
                if (err){throw err;}
            });

            // Generate qr for the user's device
            var otpUrl = 'otpauth://hotp/'+ 'programist:' + req.user.email + 
            '?secret=' + secretKey + 
            '&challange=' + challenge + 
            '&issuer=programist' + 
            '&pinlength=' + pin_len;
            
            var qr_image_data = new Buffer(qrimage.imageSync(otpUrl, {type:'png'})).toString('base64');
            
        
            res.render('attach-device', {
                layout: 'main',
                
                //get user from session
                user: req.user,

                //nao passamos key
                //passamos devid da base de dados. Registo ainda e unconfirmed
                //e user deve ser checked quando fazemos 
                //secretKey: secretKey, //reduce key usage, certainly in forms sent to client.
                qr: qr_image_data,
                devid: did,
                //REMOVE PRODUCTION
                answer: awaited_answer
            })
        
    })
    
    app.post('/do-attach-device', loggedin.ensureLoggedIn('/sign-in'), function(req, res){
        if(req.user){
            //var Device = require('./models/device')
            // TODO implement csrf token protection
            // var _csrf = req.body._csrf;
            var current_user_id = req.user._id;
            var current_user_email = req.user.email;
            
            var did = req.body.devid;
            var device_name = req.body.devname;
            var user_answer = req.body.answer;

            if(current_user_id && did && user_answer){
                //up
                Device.findOne({_id: did, uid: current_user_id}, function(err, obj){
                    
                    
                    if (err) { return next(err); }
                    
                    //the user had one minute to do this
                    if( (user_answer == obj.first_awaited_answer) && ((new Date() - new Date(obj.created_at)) < (1012 * 60)) ){
                        Device.update({ _id: did, uid: current_user_id  }, { $set: { confirmed: true, deviceName: device_name } }, function(){
                            req.flash('deviceAttachMesage', 'Device ' + device_name + ' registered sucessefully!')
                            res.redirect(303, '/user-account');
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
            }
        }
    })

    app.get('/register-user', function(req, res){
        if(req.user){
            res.redirect('/')
            return;
        }
        res.render('register', { message: req.flash('signupMessage', 'Welcome to registration'), layout: 'layout-sign-in' })
    })
    
    // process the signup form
    app.post('/do-register-user', passport.authenticate('local-signup', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/register-user', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }), function(){

    });
    
    app.post('/do-sign-in', passport.authenticate('local-login', {
        //successRedirect : '/user-account', // redirect to the secure profile section
        failureRedirect : '/sign-in', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }), function(req, res){
        
        console.log(req.session.hasTwoFactor)

        if(req.session.hasTwoFactor){
            res.redirect('/device-choice')
        }else{
            res.redirect('/user-account')
        }
    });

    app.get('/sign-in', function (req, res) {
        
        //TODO check if user posesses 2fa and display accordingly
        //in database
        var userHas2fa = true;
        //if user has more than one device
        //let him pick one
        
    
        res.render('sign-in', { layout: 'layout-sign-in', message: req.flash('loginMessage')})
    })
   
    // Logout endpoint
    app.post('/sign-out', function (req, res) {
        req.logout();
        req.session.destroy();
        res.redirect('/');
    });
    
    app.get('/device-choice', loggedin.ensureLoggedIn('/sign-in'), function(req, res){
        Device.find({uid: req.user._id}, function(err, devlist){
            res.render('device-choice', { layout: 'layout-sign-in' ,devices: devlist })
        })
    })

};


function ensureTwoFactor(req, res, next){
    if(req.session.hasTwoFactor == 'hotp'){
        res.redirect(303, '/device-choice');
    }else{
        next();
    }
}
