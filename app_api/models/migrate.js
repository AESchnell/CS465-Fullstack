// Upgrade Module Five's nonunique trip-code index without changing trip records.
const mongoose = require('mongoose');
const host = process.env.DB_HOST || '127.0.0.1';
async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || `mongodb://${host}/travlr`, { autoIndex: false });
    const collection = mongoose.connection.collection('trips');
    const duplicates = await collection.aggregate([
      { $group: { _id: '$code', count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }
    ]).toArray();
    if (duplicates.length) throw new Error('Duplicate trip codes exist. Resolve duplicates before migrating; no records were modified.');
    const indexes = await collection.indexes().catch(error => {
      if (error.codeName === 'NamespaceNotFound') return [];
      throw error;
    });
    const old = indexes.find(index => index.key.code === 1 && Object.keys(index.key).length === 1);
    if (old && !old.unique) await collection.dropIndex(old.name);
    await collection.createIndex({ code: 1 }, { unique: true, name: 'code_1' });
    console.log('Unique trip-code index ready. Existing trip records preserved.');
  } finally { await mongoose.disconnect(); }
}
migrate().catch(error => { console.error(error.message); process.exitCode = 1; });
