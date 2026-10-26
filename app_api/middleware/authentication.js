const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
const security = require('../config/security');
const unauthorized = res => res.status(401).json({ message: 'Please log in with a valid, unexpired session.' });
async function requireAuth(req, res, next) {
  const match = /^Bearer ([^ ]+)$/i.exec(req.get('authorization') || '');
  if (!match) return unauthorized(res);
  let payload;
  try {
    payload = jwt.verify(match[1], security.secret(), { algorithms: ['HS256'], issuer: security.issuer, audience: security.audience });
    if (typeof payload !== 'object' || !mongoose.isObjectIdOrHexString(payload.sub) || !Number.isFinite(payload.exp)) return unauthorized(res);
  } catch { return unauthorized(res); }
  try {
    const user = await User.findById(payload.sub).exec();
    if (!user) return unauthorized(res);
    req.user = user;
    return next();
  } catch { return res.status(503).json({ message: 'Authentication is temporarily unavailable.' }); }
}
module.exports = { requireAuth };
