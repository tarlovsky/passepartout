var Device = require('./models/device')
var mongoose = require('mongoose');
var configDB = require('./config/database.js');
mongoose.connect(configDB.url);


function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

var keys = {}

function findById(id, fn) {
    var idx = id - 1;
    if (users[idx]) {
        fn(null, users[idx]);
    } else {
        fn(new Error('User ' + id + ' does not exist'));
    }
}

function findByUsername(username, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.username === username) {
            return fn(null, user);
        }
    }
    return fn(null, null);
}

function findKeyForUserId(id, fn) {
    return fn(null, keys[id]);
}

function saveKeyForUserId(id, key, fn) {
    keys[id] = key;
    return fn(null);
}


module.exports = function(app, passport){
    
    app.get('/', function (req, res) {
        res.render('homepage', {
            layout: 'main',
            user: req.user
        })
    })
    
    app.get('/user-account', isLoggedIn, function (req, res, next) {
        Device.find({uid: req.user._id}, function(err, myDevices){
            if (err) { return next(err); }
            res.render('user-account', {layout: 'main', user: req.user, devices: myDevices, messages: req.flash('deviceAttachMesage')})
        })
    })
    
    app.get('/attach-device', function (req, res, next) {
        if(req.user){

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
        }else{
            res.redirect('/')
            return;
        }
    })
    
    app.post('/do-attach-device', function(req, res){
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
        successRedirect : '/user-account', // redirect to the secure profile section
        failureRedirect : '/sign-in', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }), function(){

    });

    app.get('/sign-in', function (req, res) {
        
        if(req.user){
            res.redirect('/')
            return;
        }
        //TODO check if user posesses 2fa and display accordingly
        //in database
        var userHas2fa = true;
        //if user has more than one device
        //let him pick one
        
        // 2fa_in_progress
        // id#ts#challenge#devid#uid
        
        /*if(userHas2fa){
            var qr_svg = qr.image('I love QR!', { type: 'svg' });
            qr_svg.pipe(require('fs').createWriteStream('i_love_qr.svg'));
            var svg_string = qr.imageSync('I love QR!', { type: 'svg' });
            res.render('sign-in-2fa', { layout: 'layout-sign-in' })
        }*/
        res.render('sign-in', { layout: 'layout-sign-in', message: req.flash('loginMessage')})
    })
   
    // Logout endpoint
    app.post('/sign-out', function (req, res) {
        req.logout();
        res.redirect('/');
    });
    
};
