var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var baseSchema = require("./base.js");
var nameSchema = baseSchema.extend({
    symbol: {
        type: String
    },
    name: {
        type: String
    },
    image: {
        type: String
    }

});


module.exports = mongoose.model('Name', nameSchema);
module.exports.schema = nameSchema;