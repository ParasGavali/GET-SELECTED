const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and configure your MongoDB connection.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log(`[db] Connected to MongoDB (${mongoose.connection.host})`);
  return mongoose.connection;
}

module.exports = { connectDB };
