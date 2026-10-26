const Trip = require('../models/travlr');

// GET /api/trips: an empty collection is a successful list response.
const tripsList = async (req, res) => {
  try {
    const trips = await Trip.find({}).exec();
    return res.status(200).json(trips);
  } catch (err) {
    console.error('Trip list lookup failed:', err.message);
    return res.status(500).json({ message: 'Unable to retrieve trips.' });
  }
};

// Keep the guide's array response for a filtered Mongoose FIND query.
const tripsFindByCode = async (req, res) => {
  try {
    const trips = await Trip.find({ code: req.params.tripCode }).exec();
    if (trips.length === 0) {
      return res.status(404).json({ message: 'Trip not found.' });
    }
    return res.status(200).json(trips);
  } catch (err) {
    console.error('Trip code lookup failed:', err.message);
    return res.status(500).json({ message: 'Unable to retrieve the trip.' });
  }
};

module.exports = { tripsList, tripsFindByCode };
