var utils = require("../utils"),
base32 = require('thirty-two'),
crypto = require('crypto');
Promise = require('bluebird');

var key = utils.randomKey(48);

const challenge = utils.getChallenge();
var pin_len = utils.randomInt(6,9);
const awaited_answer = utils.passcodeGenerator(key, challenge, pin_len);

console.log(challenge)
console.log(awaited_answer)