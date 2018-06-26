
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var baseSchema = require("./base.js");
var minuteSchema = baseSchema.extend({
    pair: {
        type: String
    },
    price: {
        type: Number
    },
    high: {
        type: Number
    },
    low: {
        type: Number
    },
    volume: {
        type: Number
    },
    open: {
        type: Number
    },
    close: {
        type: Number
    },
    dayChangeStatus: {
        type: String
    },
    datestamp: {
        type: Date
    },
    weeklyChangeStatus: {
        type: String
    },
    percentChange: {
        type: String
    },
    weeklyChange: {
        type: Number
    },
    priceStatus: {
        type: String
    },
    dayPricePercent: {
        type: String
    },
    weeklyChangePercent: {
        type: String
    },
    dayPrice: {
        type: String
    },
    dayPriceStatus: {
        type: String
    } 

});


module.exports = mongoose.model('MinuteData', minuteSchema);
module.exports.schema = minuteSchema;

