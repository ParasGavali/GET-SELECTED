/**
 * Local development helper.
 * Boots an in-memory MongoDB (mongodb-memory-server) and prints the URI
 * so you can run the app and seed data without installing MongoDB.
 *
 * Usage:
 *   node scripts/dev-mongo.js
 *   # then in another terminal:
 *   set MONGODB_URI=mongodb://127.0.0.1:PORT/getselected && npm run dev
 *   node seed/seed.js
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('getselected');
  console.log('[dev-mongo] In-memory MongoDB ready.');
  console.log(`[dev-mongo] URI: ${uri}`);
  console.log('[dev-mongo] Keep this process running. Set MONGODB_URI to the URI above.');
  console.log('[dev-mongo] Press Ctrl+C to stop.');
}

main().catch((err) => {
  console.error('[dev-mongo] Failed to start:', err.message);
  process.exit(1);
});
