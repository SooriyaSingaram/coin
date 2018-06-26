
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var baseSchema = require("./base.js");
var exchangeSummary = baseSchema.extend({
    name: {
        type: String
    },
    volume: {
        type: Number
    },
    noOfcoins: {
        type: Number
    }  
});


module.exports = mongoose.model('exchange', exchangeSummary);
module.exports.schema = exchangeSummary;

