var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var baseSchema = require("./base.js");
var bitstampSchema = baseSchema.extend({
    pair: {
        type: String
    },
    volume: {
        type: Number
    },
    price: {
        type: Number
    },
    vwap:{
        type: Number
    },
    name:{
        type: String
    },
    high: {
        type: Number
    },
    low: {
        type: Number
    },

    ask:  {
        type: Number
    },
    bid: {
        type: Number
    },
    created_at:  {
        type: Date
    },   
    open:{
        type: Number // NA
    },
    close:{
        type: Number   // NA
    }

});


module.exports = mongoose.model('Bitstamp', bitstampSchema);
module.exports.schema = bitstampSchema;