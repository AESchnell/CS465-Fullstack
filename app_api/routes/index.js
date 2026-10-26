const express = require('express');
const router = express.Router();
const trips = require('../controllers/trips');

const methodNotAllowed = (req, res) => {
  res.set('Allow', 'GET, HEAD').status(405).json({ message: 'Method not allowed.' });
};

router.route('/trips').get(trips.tripsList).all(methodNotAllowed);
router.route('/trips/:tripCode').get(trips.tripsFindByCode).all(methodNotAllowed);

router.use((req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
router.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: 'Unable to process API request.' });
});

module.exports = router;
