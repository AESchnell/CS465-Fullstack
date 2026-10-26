const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
// Perform a comparable hash operation for unknown accounts too.
const dummy = new User({ name: 'dummy', email: 'dummy@example.invalid' });
const dummyReady = dummy.setPassword(require('node:crypto').randomBytes(32).toString('hex'));
passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+hash +salt').exec();
    await dummyReady;
    const valid = await (user || dummy).validPassword(password);
    if (!user || !valid) return done(null, false, { message: 'Email or password is incorrect.' });
    return done(null, user);
  } catch (error) { return done(error); }
}));
module.exports = passport;
