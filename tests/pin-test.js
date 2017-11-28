var utils = require("../utils"),
base32 = require('thirty-two'),
crypto = require('crypto');
Promise = require('bluebird');

var encodedKey = base32.encode(utils.randomKey(10));

//cryptographically secure random bytes
const challenge = crypto.randomBytes(48).toString("hex");
var pin_len = utils.randomInt(6,9);
const awaited_answer = utils.passcodeGenerator(encodedKey, challenge, pin_len);

console.log(challenge)
console.log(awaited_answer)