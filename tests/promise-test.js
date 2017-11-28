var Promise = require("bluebird");
var randomNumber = require("random-number-csprng");

Promise.try(function() {
    return randomNumber(10, 30);
}).then(function(number) {
    console.log("Your random number:", number);
}).catch({code: "RandomGenerationError"}, function(err) {
    console.log("Something went wrong!");
});