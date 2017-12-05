var Device = require('./models/device')
var User = require('./models/user')
var Token = require('./models/token')
var mongoose = require('mongoose');
var configDB = require('./config/database.js');
mongoose.connect(configDB.url);
var utils = require("./utils");
var qrimage = require('qr-image');
var crypto = require('crypto');
const MAX_WAIT_2FA_ATTACH = 1012 * 300;
const MAX_WAIT_2FA_AUTH = 1012 * 60;

module.exports = function(app){
    
    app.get('/', function (req, res) {
        if(req.session.user){
            var user = req.session.user
        }
        res.render('homepage', {
            layout: 'main',
            user: user
        })
    })
    
    app.get('/user-account', ensureLoggedIn, function (req, res, next) {
    
        var user = req.session.user;

        Device.find({uid: user._id}, function(err, myDevices){
            if (err) { return next(err); }
            res.render('user-account', {layout: 'main', user: user, devices: myDevices, messages: req.flash('deviceAttachMesage')})
        })
    })
    
    app.get('/attach-device', ensureLoggedIn, function (req, res, next) {
        
            var User = require('./models/user'),
                Device = require('./models/device'),
                Token = require('./models/token'),
                utils = require("./utils"),
                crypto = require('crypto'),
                qrimage = require('qr-image')
                ;
            var u = req.session.user;
            console.log(utils.randomKey(48))
            var secretKey = utils.randomKey(48);
            
            const challenge = utils.getChallenge();
            var pin_len = utils.randomInt(6,9);
            const awaited_answer = utils.passcodeGenerator(secretKey, challenge, pin_len);
            
            var deviceToInsert = new Device({
                deviceName: "My First Authentication Device",
                key: utils.encrypt(secretKey),
                uid: u._id,
                confirmed: false,
                first_awaited_answer: awaited_answer.toString()
            });
            
            var did = deviceToInsert._id;
            
            deviceToInsert.save(function(err) {
                if (err){throw err;}
            });

            // Generate qr for the user's device
            var otpUrl = 'otpauth://hotp/'+ 'programist:' + u.email + 
            '?secret=' + secretKey + 
            '&challange=' + challenge + 
            '&issuer=programist' + 
            '&pinlength=' + pin_len;
            
            var qr_image_data = new Buffer(qrimage.imageSync(otpUrl, {type:'png'})).toString('base64');
            
            res.render('attach-device', {
                layout: 'main',
                
                //get user from session
                user: u,
                time_limit: MAX_WAIT_2FA_ATTACH,
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
    
    app.post('/do-attach-device', ensureLoggedIn, function(req, res){
        var user = req.session.user;
        if(user){
            //var Device = require('./models/device')
            // TODO implement csrf token protection
            // var _csrf = req.body._csrf;
            var current_user_id = user._id;
            var current_user_email = user.email;
            
            var did = req.body.devid;
            var device_name = req.body.devname;
            var user_answer = req.body.answer;

            if(current_user_id && did && user_answer){

                Device.findOne({_id: did, uid: current_user_id}, function(err, obj){
                    if (err) { return next(err); }
                    
                    //the user had one minute to do this
                    if( (user_answer == obj.first_awaited_answer) && ((new Date() - new Date(obj.created_at)) < (MAX_WAIT_2FA_ATTACH)) ){
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
        if(req.session.user){
            res.redirect('/')
            return;
        }
        res.render('register', { message: req.flash('signupMessage'), layout: 'layout-sign-in' })
    })
    
    // process the signup form
    app.post('/do-register-user', function(req, res){
        var email = req.body.email,
            password = req.body.password,
            rpassword = req.body.repeatpassword;
        if(password && rpassword && email){
            if(password != rpassword){
                req.flash('signupMessage', 'Passwords do not match.');
                res.redirect(303, '/register-user');
            }
            User.findOne({ 'email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);
    
                if (user) {
                    req.flash('signupMessage', 'That email is already taken.');
                    res.redirect(303, '/register-user');
                } else {
    
                    var newUser = new User();
    
                    newUser.email = email;
                    newUser.password = newUser.generateHash(password);
    
                    newUser.save(function(err, u) {
                        if (err)
                            throw err;
                        req.flash('deviceAttachMesage', 'User registered successfully. Welcome')
                        req.session.user = u
                        res.redirect(303, '/user-account')
                    });
                }
    
            });
        }
        

    });
    
    app.post('/do-sign-in', function(req, res){
        
        User.authenticate(req.body.email, req.body.password, function(error, result, info){
            if(result){
                if(info != null && typeof info == 'string'){//info contains 2fa method name
                    req.session.twoFactorPending = info
                    req.session.pendingUser = result
                    res.redirect('/device-choice')
                    return;
                }else{
                    console.log(result)
                    req.session.user = result
                    console.log(req.session.user)
                    res.redirect(303, '/user-account')
                    return;
                }
            }
            if(error){
                throw error;
            }
        })
        
    });

    app.get('/sign-in', function (req, res) {    
        res.render('sign-in', { layout: 'layout-sign-in', message: req.flash('loginMessage')})
    })
   
    // Logout endpoint
    app.post('/sign-out', function (req, res) {
        req.session.destroy();
        res.redirect('/');
    });
    
    app.get('/device-choice', ensurePendingUser, function(req, res){
        var method = req.session.twoFactorPending;//generally totp
        var userObject = req.session.pendingUser;
        
        if(userObject && method){
            Device.find({uid: userObject._id}, function(err, devlist){
                res.render('device-choice', { layout: 'layout-sign-in' , devices: devlist, message: req.flash('secondFactor') })
            })
        }
    })

    app.post('/detatch-device', ensureLoggedIn, function(req, res){
        Device.findOne({_id: req.body.devid}, function(err, d){
            if(d.uid.toString() == req.session.user._id.toString()){
                d.remove(function(err){
                    req.flash('deviceAttachMesage', 'Device ' + d.deviceName + ' removed successfully')
                    res.redirect(303, '/user-account')
                })
            }
        })
    })

    app.post('/do-second-factor', ensurePendingUser, function(req, res){
        
        var method = req.twoFactorPending;//generally totp
        var userObject = req.session.pendingUser;
        var devid = req.body.devid;

        Device.findOne({uid: userObject._id, _id: devid}, function(err, dev){
            
            var deviceKey = utils.decrypt(dev.key);

            const challenge = utils.getChallenge();

            var pin_len = utils.randomInt(6,9)
            
            const awaited_answer = utils.passcodeGenerator(deviceKey, challenge, pin_len);
            // Generate qr for the screen
            var otpUrl = 'otpauth://hotp/'+ 'programist:' + req.session.pendingUser.email + 
            '?challange=' + challenge + 
            '&issuer=programist' + 
            '&pinlength=' + pin_len;
            const qr_image_data = new Buffer(qrimage.imageSync(otpUrl, {type:'png'})).toString('base64');

            var t = new Token({
                challange: challenge,
                awaitedAnswer: awaited_answer,//must hide this in hashed form with some salt and key please.
                did: dev._id,
                uid: userObject._id,
            })

            t.save(function(err, data){
                if(err){
                    throw err;
                }
            })
            
            res.render('two-factor-login', {
                layout: 'layout-sign-in', 
                email: userObject.email, 
                devid: dev._id, 
                devname: dev.deviceName,
                qr: qr_image_data,
                tokenid : t._id,
                //remove after tests
                answer: awaited_answer
            });
        })
        
    });

    app.post('/second-factor-pass', ensurePendingUser, function(req, res){
        var tid = req.body.tokenid,
            ans = req.body.answer;

        Token.findOne({_id: tid}, function(err, t){
            if(err){throw err;}
            

            if( t.validateAnswer(ans.toString()) ){
                if(new Date() - t.created_at < MAX_WAIT_2FA_AUTH){

                    req.session.user = req.session.pendingUser;
                    delete req.session.pendingUser;
                    req.flash('deviceAttachMesage', 'Congrats, You have sucessefully authenticated with your device!')
                    res.redirect(303, '/user-account');

                }else{
                    t.remove()
                    req.flash('loginMessage', 'Unfortunately your authentication token has expired, please try again!')
                    res.redirect(303, '/sign-in');    
                }
            }else{
                //wrong answer
                //don't want useless token to interfere
                t.remove()
                req.flash('loginMessage', 'Wrong authentication pincode. Please try again!');
                res.redirect(303, '/sign-in');
            }
        });
    })
};

function ensureLoggedIn(req, res, next) {
    if (req.session.user) {
      return next();
    } else {
      var err = new Error('You must be logged in to view this page.');
      err.status = 401;
      return next(err);
    }
}

function ensurePendingUser(req, res, next){
    if(req.session.pendingUser){
        return next();
    }else{
        var err = new Error('You must be logged in to view this page.');
        err.status = 401;
        return next(err);
    }
}