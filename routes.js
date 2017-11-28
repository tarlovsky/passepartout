
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
        res.render('user-account', {
                layout: 'main',
                user: req.user
            }
        )
    })
    
    app.get('/attach-device', function (req, res, next) {
        if(req.user){

            var MAX_PASSCODE_LENGTH = 6,
                User = require('./models/user'),
                Devices = require('./models/device'),
                Token = require('./models/token'),
                utils = require("./utils"),
                base32 = require('thirty-two')
                crypto = require('crypto'),
                qrimage = require('qr-image')
                ;
            


            var encodedKey = base32.encode(utils.randomKey(48));
            
            const challenge = crypto.randomBytes(48).toString("hex");
            var pin_len = utils.randomInt(6,9);
            const awaited_answer = utils.passcodeGenerator(encodedKey, challenge, pin_len);


            var otpUrl = 'otpauth://hotp/'+ 'programist:' + req.user.email + 
            '?secret=' + encodedKey + 
            '&challange=' + challenge + 
            '&issuer=programist' + 
            '&pinlength=' + pin_len;
            
            var qr_image_data = new Buffer(qrimage.imageSync(otpUrl, {type:'png'})).toString('base64');

            Devices.find({uid: req.user._id}, function(err, obj){
                if (err) { return next(err); }
                if(obj.length == 0){
                    //user has no devices attached
                }else{
                    //user wants to attach a device
                    console.log(obj)
                    //TODO render a list of devices with a link underneeth to use that device
                    if (obj.length > 1){
                        //let him pick a device to login with
                    }else{
                        //only one device
                        //make this work first
                    }
                }
                
            })

            res.render('attach-device', {
                layout: 'main',
                user: req.user,
                qr: qr_image_data
            })
        }else{
            res.redirect('/')
            return;
        }
    })
    
    app.get('/register-user', function(req, res){
        if(req.user){
            res.redirect('/')
            return;
        }
        res.render('register', { message: req.flash('signupMessage'), layout: 'layout-sign-in' })
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
