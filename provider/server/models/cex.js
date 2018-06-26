var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var baseSchema = require("./base.js");
var cexSchema = baseSchema.extend({
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
    },
    lastrecord:{
        type:Boolean
    }

});


module.exports = mongoose.model('Cex', cexSchema);
module.exports.schema = cexSchema;