/**
 * User Module Router
 */
var User = require('../models/user'),
    express = require('express'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    crypto = require('crypto');
var customize = require('../../customize.json');
const request = require("request");

router = express.Router();
//configure routes
router.route('/register')
    .post(addUser);
router.route('/update')
    .put(updateUserData);
router.route('/login')
    .post(login);
router.route('/socialLogin').post(socialLogin)
router.route('/getUserData')
    .post(getUserData);

//Create the New user record in DB.
function addUser(req, res) {
    var userProfile = req.body;
    userProfile.customizeColumns = customize;
    console.log(customize)
    var user = new User(userProfile);
    if (req.body.hasOwnProperty('password')) {
        user.setPassword(req.body.password);


        user.save(function (err) {
            if (err) {
                if ((err.code == 11000)) {
                    if (err.errmsg.search("emailId_1") > 1) {
                        return res.status(409).send("EmailId already exists");
                    }
					if (err.errmsg.search("userName_1") > 1) {
                        return res.status(409).send("UserName already exists");
                    }
                } else {
                    console.log(err.name)
                    if (err.name == 'ValidationError') {
                        return res.status(400).send("Login type is Required")
                    }
                    else {
                        return res.status(409).send("Please try again after sometime");
                    }
                }

            }
            else {

                var token = user.generateJwt();
                res.status(200).json({
                    "access_token": token,
                    "userName": user.userName,
                    "emailId": user.emailId,
                    "id": user._id
                });
                // res.send({
                //     message: 'User registered successfully.'
                // });
            }

        });
    } else {
        res.status(404).json({
            "message": "Please send valid parameter to proceed"
        });
    }
}

/**
*login function - validate user credentials and check wheater the user is authenticate or not.
*/
function login(req, res) {
    passport.authenticate('local', function (err, user, info) {
        var token;
        if (err) {
            res.status(404).json(err);
            return;
        }
        // If user found in db 
        if (user) {
            token = user.generateJwt();
            res.status(200).json({
                "access_token": token,
                "userName": user.userName,
                "siteLanguage": user.siteLanguage,
                "refreshRate": user.refreshRate,
                "siteColor": user.siteColor,
                "customizeColumns": user.customizeColumns,
                "currencyType": user.currencyType,
                "nightMode": user.nightMode ? user.nightMode : '',
                "portfolio": user.portfolio ? user.portfolio : '',
                "favourites": user.favourites ? user.favourites : '',
                "id": user._id
            });
        } else {
            // If user is not found in db
            res.status(401).json(info);
        }
    })(req, res);
};


function socialLogin(req, res) {
    console.log(req.body.loginId)
    var token;

    User.findOne({ loginId: req.body.loginId }, function (err, doc) {
        if (doc) {
            var userDetails = new User(doc);
            token = userDetails.generateJwt();
            res.status(200).json({
                "access_token": token,
                "loginId": doc.loginId,
                "userName": doc.userName,
                "siteLanguage": doc.siteLanguage,
                "refreshRate": doc.refreshRate,
                "siteColor": doc.siteColor,
                "customizeColumns": doc.customizeColumns,
                "currencyType": doc.currencyType,
                "nightMode": doc.nightMode ? doc.nightMode : '',
                "portfolio": doc.portfolio ? doc.portfolio : '',
                "favourites": doc.favourites ? doc.favourites : '',
                "id": doc._id
            });
        } else {
            var userProfile = req.body;
            userProfile.customizeColumns = customize
            var user = new User(userProfile);
            user.save(function (err) {
                if (err) {
                    console.log(err)
                    return res.status(409).send("Please try again after sometime");
                }
                else {
                    var token = user.generateJwt();
                    res.status(200).json({
                        "access_token": token,
                        "loginId": user.loginId,
                        "userName": user.userName,
                        "id": user._id
                    });
                    // res.send({
                    //     message: 'User registered successfully.'
                    // });
                }

            });
        }
    })


}


/**
*updateUserData - update particular User Data
*/
function updateUserData(req, res) {
    console.log(req.decoded.id)
    User.findOne({
        _id: req.decoded.id
    }, function (err, data) {

        if (err) {
            res.send(err);
        }
        else {
            if (data) {
                var userInfo = req.body;
console.log(req.body)
                for (prop in userInfo) {
                    if (prop == 'favourites') {
                        var index = data[prop].indexOf(userInfo[prop]);
                        if (index > -1) {
                            data[prop].splice(index, 1);
                        } else {
                            data[prop].push(userInfo[prop])
                        }
                    } else if (prop == 'portfolio') {
                        data[prop].push(userInfo[prop])
                    }
                    else {
                        data[prop] = userInfo[prop];
                    }

                }

                // update data details in db
                data.save(function (err) {
                    if (err)
                        res.send(err);

                    res.json({
                        message: 'User data updated successfully'
                    });
                });
            }
            else {
                res.status(404).send({ "message": "This User does not exist in db" });
            }

        }
    });
}

function getUserData(req, res) {

    User.find({ _id: req.decoded.id }, {
        "siteLanguage": 1,
        "refreshRate": 1,
        "siteColor": 1,
        "customizeColumns": 1,
        "currencyType": 1,
        "nightMode": 1,
        "portfolio": 1,
        "favourites": 1
    }).
        // User.findOne({ _id: req.decoded.id }).
        exec(function (err, user) {
            if (err) {
                res.status(404).send(err);
            }
            else {
                if (user) {
					
                      if (user.length > 0) {
                        var userData =JSON.parse(JSON.stringify( user[0]) )
                        if (userData.currencyType == 'USD') {
							
                            userData.currency = 1
							res.json(userData);
                        } else {
                            var currency = 'USD_' + userData.currencyType
                            var options = {
                                method: 'GET',
                                url: 'http://free.currencyconverterapi.com/api/v5/convert',
                                qs: { q: currency, compact: 'y' }
                            };

                            request(options, function (error, response, body) {
                                if (error) {
                                    userData.currency = 1;console.log(userData.currency)
                                } else {
									var data = JSON.parse(body);
                                    userData.currency = data[currency].val;
									
                                }
                                res.json(userData);  
                            });
                        }
						
                        
                    } else {
                        res.status(404).send({ "message": "This user data not exist in db" });
                    }

                } else {
                    res.status(404).send({ "message": "This user data not exist in db" });
                }

            }

        });

}
module.exports = router;