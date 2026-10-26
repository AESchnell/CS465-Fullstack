const passport = require('../config/passport');
const User = require('../models/user');
function credentialsValid(body, registering = false) {
  return body && typeof body.email === 'string' && body.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) &&
    typeof body.password === 'string' && body.password.length >= (registering ? 12 : 1) && body.password.length <= 128 &&
    (!registering || (typeof body.name === 'string' && body.name.trim().length > 0 && body.name.trim().length <= 100));
}
const login = (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!credentialsValid(req.body)) return res.status(400).json({ message: 'Provide a valid email and password.' });
  passport.authenticate('local', { session: false }, (error, user) => {
    if (error) return res.status(503).json({ message: 'Authentication is temporarily unavailable.' });
    if (!user) return res.status(401).json({ message: 'Email or password is incorrect.' });
    try { return res.status(200).json({ token: user.generateJWT() }); }
    catch { return res.status(503).json({ message: 'Authentication is temporarily unavailable.' }); }
  })(req, res, next);
};
const register = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!credentialsValid(req.body, true)) return res.status(400).json({ message: 'Provide a name, valid email, and a password of 12–128 characters.' });
  try {
    const user = new User({ name: req.body.name.trim(), email: req.body.email.trim().toLowerCase() });
    await user.setPassword(req.body.password);
    await user.save();
    return res.status(201).json({ token: user.generateJWT() });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That email is already registered.' });
    return res.status(503).json({ message: 'Unable to register the account.' });
  }
};
module.exports = { login, register, credentialsValid };
