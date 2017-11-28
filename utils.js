var crypto = require('crypto');
var Promise = require('bluebird');
var randomNumber = require("random-number-csprng");

exports.randomKey = function(len) {
  //https://gist.github.com/joepie91/7105003c3b26e65efcea63f3db82dfba
  //cryptographically safe pseudo random number generator
  
  var bytes = crypto.randomBytes(len || 32);
  var buf = [],
      chars = 'abcdefghijklmnopqrstuvwxyz0123456789',
      charlen = chars.length;
  
  
  var output = '';
  for (var i = 0, l = bytes.length; i < l; i++) {
    output += chars[Math.floor(bytes[i] / 255.0 * (chars.length - 1))];
  }
  console.log(output)
  return output;
};
  
exports.getChallenge = function(){
  return crypto.randomBytes(48).toString('hex');
}

exports.randomInt = function(min, max){
  var b = crypto.randomBytes(8);
  (function(b) {
    var hex = b.toString('hex');
    var integer = parseInt(hex, 16);
    var random = integer / 0xffffffffffffffff;
    console.log(random)
    return random;
  })(b);
}

exports.passcodeGenerator = function(key, challenge, passCodeLength){

  var MAX_PASSCODE_LENGTH = 9,
      PASSCODE_LENGTH = 6,
      codeLength;

  var hmac = crypto.createHmac('sha256', key);
  hmac.update(challenge);

  var digest = hmac.digest().toString('hex');
  digest = new Buffer(digest);
  var offset = digest[digest.length - 1] & 0xf;
  
  //https://tools.ietf.org/html/rfc4226#section-5.4
  var code = (digest[offset] & 0x7f) << 24 |
      (digest[offset + 1] & 0xff) << 16 |
      (digest[offset + 2] & 0xff) << 8 |
      (digest[offset + 3] & 0xff);
  
  // left-pad code
  console.log(passCodeLength)
  if(passCodeLength != null || passCodeLength < PASSCODE_LENGTH || passCodeLength > MAX_PASSCODE_LENGTH){
    passCodeLength = 6;
  }

  code = new Array(passCodeLength + 1).join('0') + code.toString(10);
  return code.substr(-PASSCODE_LENGTH);
}

