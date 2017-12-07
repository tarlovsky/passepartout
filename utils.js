var crypto = require('crypto');
var Promise = require('bluebird');
var mode = 'aes-256-ctr';
var randomNumber = require("random-number-csprng");

//HARDCODED MASTER KEY
//TODO make use of a password based key derivation function to encrypt every user's device.
var KEY_ENC_KEY = "1569147e7d2b36e52ced9cbb8bb4fb1d6057c5cb1956134e650310e2acff3968d646eae3358a0da596a699c6d2029ecd"

exports.encrypt = function(text){
  var cipher = crypto.createCipher(mode, KEY_ENC_KEY)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
exports.decrypt = function(text){
  var decipher = crypto.createDecipher(mode, KEY_ENC_KEY)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

// GENERATES KEY FOR EVERY DEVICE ON ATTACHMET TO ACCOUNT
exports.randomKey = function(len) {

  //https://gist.github.com/joepie91/7105003c3b26e65efcea63f3db82dfba
  //cryptographically safe pseudo random number generator
  var bytes = crypto.randomBytes(len || 32);
  var buf = [],
      chars = 'abcdefghijklmnopqrstuvwxyz0123456789',//KEY CONSISTS OF THESE CHARS
      charlen = chars.length;
  
  var output = '';
  for (var i = 0, l = bytes.length; i < l; i++) {
    output += chars[Math.floor(bytes[i] / 255.0 * (chars.length - 1))];//INTEGER DIVISION COUNTERMEASURE
  }
  
  return output;
};
//CHALLENGE USED AT TWO FACTOR STEP
exports.getChallenge = function(){
  return crypto.randomBytes(48).toString('hex');
}
// CRYPTOGRAPHICALLY SECURE PSEUDO RANDOM INTEGER GENERATOR
exports.randomInt = function(min, max){
  var b = crypto.randomBytes(8);
  var hex = b.toString('hex');
  var integer = parseInt(hex, 16);
  //removing bias
  //https://gist.github.com/joepie91/7105003c3b26e65efcea63f3db82dfba
  //https://stackoverflow.com/questions/23505071/is-this-a-cryptographically-secure-method-to-generate-a-random-number-in-node-js
  var random = integer / 0xffffffffffffffff;
  return parseInt(Math.floor((random * (max - min + 1) + min)), 10);
}

// GENERATES VARIABLE LENGTH PASSCODE FROM A KEYED HMAC
// ACCORDING TO THE METHOD DESCRIBED https://tools.ietf.org/html/rfc4226#section-5.4
exports.passcodeGenerator = function(key, challenge, passCodeLength){
  
  var MAX_PASSCODE_LENGTH = 9,
      PASSCODE_LENGTH = 6;

  var hmac = crypto.createHmac('sha256', key);
  hmac.update(challenge);
  var digest = hmac.digest().toString('hex');

  var byteArray = []
  for (var i = 0; i < digest.length; ++i) {
      byteArray.push(digest.charCodeAt(i) & 0xff)
  }
  // RFC for hotp code generation
  //https://tools.ietf.org/html/rfc4226#section-5.4
  var offset = byteArray[byteArray.length - 1] & 0xf;
  var code = (byteArray[offset] & 0x7f) << 24 |
      (byteArray[offset + 1] & 0xff) << 16 |
      (byteArray[offset + 2] & 0xff) << 8 |
      (byteArray[offset + 3] & 0xff);
  
  if(passCodeLength == null || passCodeLength < PASSCODE_LENGTH || passCodeLength > MAX_PASSCODE_LENGTH){
    passCodeLength = PASSCODE_LENGTH;
  }
  
  code = new Array(passCodeLength + 1).join('0') + code.toString(10);
  return code.substr(-passCodeLength);
}

