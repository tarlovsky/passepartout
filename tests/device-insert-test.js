var MAX_PASSCODE_LENGTH = 6,
    User = require('../models/user'),
    Device = require('../models/device'),
    Token = require('../models/token'),
    utils = require("../utils"),
    base32 = require('thirty-two')
    crypto = require('crypto'),
    qrimage = require('qr-image')
;
var mongoose = require('mongoose');
var configDB = require('../config/database.js');
mongoose.connect(configDB.url);

var secretKey = utils.randomKey(48);

const challenge = utils.getChallenge();
var pin_len = utils.randomInt(6,9);
const awaited_answer = utils.passcodeGenerator(secretKey, challenge, pin_len);


/**
 * var deviceSchema = mongoose.Schema({
    //_id: {type: mongoose.Schema.Types.ObjectId, auto: true},
    deviceName: { type: String, required: true },
    key: {type: String, required: true},
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, required: true },
    confirmed: { type: Boolean, default: false }
})
 */

var deviceToInsert = new Device({
    
});
deviceToInsert.deviceName = "My First Authentication Device";
deviceToInsert.key = secretKey;
deviceToInsert.uid = '5a1d4197d83c1212f1048674';
deviceToInsert.confirmed = false;

var did = deviceToInsert._id;
console.log("Inner id: " + did);
var temp = 0;
deviceToInsert.save(function(err, result) {
    if (err){
        throw err;
    }
    
    console.log("Result id: " + result._id);
});
console.log(temp)
