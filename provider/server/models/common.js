var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var baseSchema = require("./base.js");
var coinSchema = baseSchema.extend({
    pair: {
        type: String
    },
    volume: {
        type: Number
    },
    price: {
        type: Number
    },
    vwap: {
        type: Number
    },
    name: {
        type: String
    },
    high: {
        type: Number
    },
    low: {
        type: Number
    },

    ask: {
        type: Number
    },
    bid: {
        type: Number
    },
    open: {
        type: Number // NA
    },
    close: {
        type: Number   // NA
    },
    date: {
        type: String
    },
    datestamp: {
        type: Date
    },
    lastRecord: {
        type: Boolean,
        default:true
    },
    sevenDayChange:{
        type: Number
    },
    weeklyChangePercent:{
        type: String
    }
    
   

});


module.exports = mongoose.model('Coin', coinSchema);
module.exports.schema = coinSchema;

