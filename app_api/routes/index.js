const express = require('express');
const router = express.Router();
const trips = require('../controllers/trips');
const auth = require('../controllers/authentication');
const { requireAuth } = require('../middleware/authentication');
const { rateLimit } = require('express-rate-limit');
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many login attempts. Try again in 15 minutes.' } });

const methodNotAllowed = allowed => (req, res) => {
  res.set('Allow', allowed).status(405).json({ message: 'Method not allowed.' });
};

router.post('/login', loginLimit, auth.login);
// Accounts grant administrative access; only an existing administrator may register one.
router.post('/register', requireAuth, auth.register);
router.get('/me', requireAuth, (req, res) => res.set('Cache-Control', 'no-store').json({ name: req.user.name, email: req.user.email }));

router.route('/trips').get(trips.tripsList).post(requireAuth, trips.tripsAddTrip).all(methodNotAllowed('GET, HEAD, POST'));
router.route('/trips/:tripCode').get(trips.tripsFindByCode).put(requireAuth, trips.tripsUpdateTrip).delete(requireAuth, trips.tripsDeleteTrip).all(methodNotAllowed('GET, HEAD, PUT, DELETE'));

router.use((req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
router.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: 'Unable to process API request.' });
});

module.exports = router;
