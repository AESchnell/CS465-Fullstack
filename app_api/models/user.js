const mongoose = require('mongoose');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const jwt = require('jsonwebtoken');
const security = require('../config/security');
const pbkdf2 = promisify(crypto.pbkdf2);
const iterations = 210000;
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  hash: { type: String, required: true, select: false },
  salt: { type: String, required: true, select: false }
}, { toJSON: { transform(doc, value) { delete value.hash; delete value.salt; return value; } } });
userSchema.methods.setPassword = async function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = (await pbkdf2(password, this.salt, iterations, 64, 'sha512')).toString('hex');
};
userSchema.methods.validPassword = async function(password) {
  if (!this.hash || !this.salt) return false;
  const candidate = await pbkdf2(password, this.salt, iterations, 64, 'sha512');
  const stored = Buffer.from(this.hash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
};
userSchema.methods.generateJWT = function() {
  return jwt.sign({ email: this.email, name: this.name }, security.secret(), {
    algorithm: 'HS256', subject: this._id.toString(), issuer: security.issuer,
    audience: security.audience, expiresIn: '1h'
  });
};
module.exports = mongoose.model('users', userSchema);
