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


const sanitizeHtml = require('sanitize-html');
const fields = ['code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description'];

function tripInput(body) {
  const data = {};
  for (const field of fields) {
    // Angular number inputs send numbers; retain the course model's string price.
    const value = field === 'perPerson' && typeof body?.[field] === 'number' && Number.isFinite(body[field])
      ? String(body[field]) : body?.[field];
    if (typeof value !== 'string' || !value.trim()) {
      throw Object.assign(new Error(`Please provide ${field}.`), { status: 400 });
    }
    data[field] = value.trim();
  }
  if (!/^[A-Za-z0-9_-]+$/.test(data.code)) throw Object.assign(new Error('Use letters, numbers, underscores or hyphens for the trip code.'), { status: 400 });
  if (!Number.isFinite(Date.parse(data.start))) throw Object.assign(new Error('Provide a valid start date.'), { status: 400 });
  if (!/^\d+(\.\d{1,2})?$/.test(data.perPerson)) throw Object.assign(new Error('Provide a nonnegative price with at most two decimal places.'), { status: 400 });
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(data.image)) throw Object.assign(new Error('Provide an image filename, such as reef1.jpg.'), { status: 400 });
  data.description = sanitizeHtml(data.description, { allowedTags: ['p', 'br', 'strong', 'em'], allowedAttributes: {} });
  if (!data.description.trim()) throw Object.assign(new Error('Provide a description.'), { status: 400 });
  return data;
}
function writeError(res, error) {
  if (error.code === 11000) return res.status(409).json({ message: 'That trip code already exists.' });
  if (error.status === 400 || error.name === 'ValidationError') return res.status(400).json({ message: error.status ? error.message : 'Please check the trip fields.' });
  console.error('Trip write failed:', error.message);
  return res.status(500).json({ message: 'Unable to save the trip change.' });
}
const tripsAddTrip = async (req, res) => {
  try {
    const trip = await Trip.create(tripInput(req.body));
    return res.status(201).json(trip);
  } catch (error) { return writeError(res, error); }
};
const tripsUpdateTrip = async (req, res) => {
  try {
    const data = tripInput(req.body);
    if (data.code !== req.params.tripCode) return res.status(400).json({ message: 'The trip code cannot be changed.' });
    const trip = await Trip.findOneAndUpdate({ code: req.params.tripCode }, { $set: data }, { new: true, runValidators: true }).exec();
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    return res.status(200).json(trip);
  } catch (error) { return writeError(res, error); }
};
const tripsDeleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ code: req.params.tripCode }).exec();
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    return res.status(200).json({ message: 'Trip deleted.', code: trip.code });
  } catch (error) { return writeError(res, error); }
};
module.exports = { tripsList, tripsFindByCode, tripsAddTrip, tripsUpdateTrip, tripsDeleteTrip };
