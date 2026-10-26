const fs = require('fs');
const path = require('path');
const mongoose = require('./db');
const Trip = require('./travlr');

const seedDB = async () => {
  try {
    const trips = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/trips.json'), 'utf8'));
    if (!Array.isArray(trips) || trips.length === 0) {
      throw new Error('Seed data must contain at least one trip.');
    }
    // Validate the entire input before replacing the course sample collection.
    await Promise.all(trips.map(trip => new Trip(trip).validate()));
    await mongoose.connection.asPromise();
    await Trip.init();
    console.log('Replacing the trips collection with the sample trips from data/trips.json.');
    await Trip.deleteMany({});
    const inserted = await Trip.insertMany(trips);
    console.log(`Seeded ${inserted.length} trips.`);
  } catch (err) {
    console.error('Database seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedDB();
