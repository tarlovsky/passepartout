
var path = require('path');
var express = require('express');
var bodyparser = require('body-parser');
var cookieParser = require('cookie-parser');
var http = require('http');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var session = require('express-session');
var https = require('https');
var fs = require('fs')
var qr = require('qr-image');
var base32 = require('thirty-two');
var crypto = require('crypto');
var key = fs.readFileSync('encryption/localhost.key.pem');
var cert = fs.readFileSync( 'encryption/localhost.cert.pem' );
var ca = fs.readFileSync( 'encryption/ca-chain.cert.pem' );
var mongoose = require('mongoose');
var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

// options used for local self signed certificats
// at the moment we use HEROKU's SSL certificate 
// because to import our own we had to pay a fee.
// the cert chain is inside the ./encryption directory
var options = {
    key: key,
    cert: cert,
    ca: ca,
    passphrase: 'The!rO0t!pa%%word(7331'
};

var app = express();

var handlebars = require('express3-handlebars').create({
     defaultLayout:'main',
     helpers: {
        foo: function (){ return "<h2>FOO HELPER</f2>"},

        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
     }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static('public'))
//app.use(express.logger());
app.use(express.cookieParser());
app.use(bodyparser());
app.use(express.methodOverride());
app.use(session({secret: '12345678aA!'}));
app.use(flash());
app.use(app.router);


require('./routes.js')(app);
https.createServer(options, app).listen(8080)


