const express = require('express');
const router = express.Router();
const trips = require('../controllers/trips');

const methodNotAllowed = allowed => (req, res) => {
  res.set('Allow', allowed).status(405).json({ message: 'Method not allowed.' });
};

router.route('/trips').get(trips.tripsList).post(trips.tripsAddTrip).all(methodNotAllowed('GET, HEAD, POST'));
router.route('/trips/:tripCode').get(trips.tripsFindByCode).put(trips.tripsUpdateTrip).delete(trips.tripsDeleteTrip).all(methodNotAllowed('GET, HEAD, PUT, DELETE'));

router.use((req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
router.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: 'Unable to process API request.' });
});

module.exports = router;
