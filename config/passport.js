var LocalStrategy = require('passport-local').Strategy;
var CustomStrategy = require('passport-custom').Strategy;
var TwoFAStartegy = require('passport-2fa-totp').Strategy;
var User = require('../models/user.js');


//https://scotch.io/tutorials/easy-node-authentication-setup-and-local
module.exports = function(passport){
   
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
    
    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
            
            User.findOne({ 'email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {

                    var newUser = new User();

                    newUser.email = email;
                    newUser.password = newUser.generateHash(password);

                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }

            });    

        });

    }));
    
    passport.use('local-login', new TwoFAStartegy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) { 
        User.findOne({ 'email' :  email }, function(err, user) {
            
            if (err)
                return done(err);
            
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
            
            user.getAllDevices(function(data){
                console.log(data)
            })

            return done(null, user);
            
            // if(user.has2fa(function(val){
            //     if(val){
            //         req.session.twoFactorPending = true;
            //         req.session.user = user;
                    
            //     }
            //     // all is well, return successful user
            //     req.session.twoFactorPending = false;
            //     return done(null, user);
            // }));
            
        });
    }, function(user, done){
        //console.log(user)
    }))
};
