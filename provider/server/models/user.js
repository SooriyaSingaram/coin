var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var baseSchema = require("./base.js");
var userSchema = baseSchema.extend({
    userName: {
        type: String
    },
    emailId: {
        type: String, trim: true, index: true, unique: true, sparse: true
    },
    salt: {
        type: String
    },
    hashedPassword: {
        type: String
    },
    loginType: {
        type: String,
        required: true
    },
    loginId: {
        type: String
    },
    siteLanguage: {
        type: String,
        default: 'en'
    },
    refreshRate: {
        type: String,
        default: "3"
    },
    siteColor: {
        type: String,
        default: "black-theme"
    },
    nightMode: {
        type: String,
        default: ""
    },
    customizeColumns: {
        desktop: Array,
        mobile: Array,
        app: Array
    },
    currencyType: {
        type: String,
        default:"USD"
    },
    favourites: {
        type: Array
    },
    portfolio: {
        type: Array
    }

});

//Save user password as hashing password using salt
userSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hashedPassword = crypto.createHmac('sha256', this.salt)
        .update(password)
        .digest('hex')
};

//Validate the entered password for the corresponding user
userSchema.methods.validPassword = function (password) {
    var hash = crypto.createHmac('sha256', this.salt)
        .update(password)
        .digest('hex');
    return this.hashedPassword === hash;
};

//Generate access token for succssfully logined user
userSchema.methods.generateJwt = function () {
    if (this.loginType == 'manual') {
        const payload = {
            emailId: this.emailId,
            id: this._id
        };
        return jwt.sign(payload, "tokenValue", {
            expiresIn: 86400 // expires in 24 hours
        });
    } else {
        const payload = {
            loginId: this.loginId,
            id: this._id
        };
        return jwt.sign(payload, "tokenValue", {
            expiresIn: 86400 // expires in 24 hours
        });
    }


}


module.exports = mongoose.model('User', userSchema);
module.exports.schema = userSchema;