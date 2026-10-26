require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const host = process.env.DB_HOST || '127.0.0.1';
const dbURI = process.env.MONGODB_URI || `mongodb://${host}/travlr`;

require('./travlr');

mongoose.connection.on('connected', () => console.log('Mongoose connected to MongoDB'));
mongoose.connection.on('error', err => console.error('Mongoose connection error:', err.message));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

// Current Mongoose uses promises for connection and shutdown operations.
mongoose.connect(dbURI, { serverSelectionTimeoutMS: 5000 }).catch(() => {
  // The error event reports the failure; callers can await connection.asPromise().
  process.exitCode = 1;
});

const gracefulShutdown = async (signal) => {
  try {
    await mongoose.connection.close();
    if (signal === 'SIGUSR2') {
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('MongoDB shutdown failed:', err.message);
    process.exit(1);
  }
};

for (const signal of ['SIGINT', 'SIGTERM', 'SIGUSR2']) {
  process.once(signal, () => gracefulShutdown(signal));
}

module.exports = mongoose;
