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
  
  return output;
};
  
exports.getChallenge = function(){
  return crypto.randomBytes(48).toString('hex');
}

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

exports.passcodeGenerator = function(key, challenge, passCodeLength){
  
  console.log(key)
  console.log(challenge)
  console.log(passCodeLength)

  var MAX_PASSCODE_LENGTH = 9,
      PASSCODE_LENGTH = 6,
      codeLength;

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
  
  // left-pad code
  if(passCodeLength == null || passCodeLength < PASSCODE_LENGTH || passCodeLength > MAX_PASSCODE_LENGTH){
    passCodeLength = PASSCODE_LENGTH;
  }
  
  code = new Array(passCodeLength + 1).join('0') + code.toString(10);
  return code.substr(-passCodeLength);
}

