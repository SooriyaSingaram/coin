/**
 * Passport Router
 */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

passport.use(new LocalStrategy({
  usernameField: 'emailId',
  passwordField: 'password'
},
  function (emailId, password, done) {
    User.findOne({ emailId: emailId }, function (err, user) {
      if (err) { return done(err); }

      //Check if user name already exist in db
      if (!user) {
        return done(null, false, {
          message: 'Sorry, This user does not exist.'
        });
      }

      // Return if password is wrong
      if (!user.validPassword(password)) {
        return done(null, false, {
          message: 'Password incorrect. Try again.'
        });
      }
      // If credentials are correct, return the corresponding user object
      return done(null, user);
    });
  }
));