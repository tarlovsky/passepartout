var utils = require("../utils"),
    base32 = require('thirty-two'),
    crypto = require('crypto');
Promise = require('bluebird');


var key = "j4g4ewke4v00z407ou4jsugyt2ocruvz3qq2xhpoz5v7ev0n"
var challenge = "18d001e38de847e56a60822790e2a82de2a68a32808d1952b69999c499e14e1ed1ba70d7dc5e5a1f78ab2ab68988dbb4"
var passCodeLength = 7
var answer = "9652530"

key = utils.randomKey(48);
challenge = utils.getChallenge();

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
var offset = byteArray[byteArray.length - 1] & 0xf;
//https://tools.ietf.org/html/rfc4226#section-5.4
var code = (byteArray[offset] & 0x7f) << 24 |
    (byteArray[offset + 1] & 0xff) << 16 |
    (byteArray[offset + 2] & 0xff) << 8 |
    (byteArray[offset + 3] & 0xff);

// left-pad code
if (passCodeLength == null || passCodeLength < PASSCODE_LENGTH || passCodeLength > MAX_PASSCODE_LENGTH) {
    passCodeLength = PASSCODE_LENGTH;
}

code = new Array(passCodeLength + 1).join('0') + code.toString(10);
console.log(code.substr(-passCodeLength) + " " + answer);