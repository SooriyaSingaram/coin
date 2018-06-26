/**
 * User Module Router
 */
var CryptoName = require('../models/cryptoName'),
express = require('express'),
passport = require('passport'),
mongoose = require('mongoose'),
crypto = require('crypto');
router = express.Router();

//configure routes
router.route('/coinname')
.post(createName);

//Create the New user record in DB.
function createName(req, res) {
var crypto = new CryptoName(req.body);
crypto.save(function (err) {
    if (err) {
       
    }
    else {
        res.send({
            message: 'Crypto saved successfully.'
        });
    }

});

}


module.exports = router;