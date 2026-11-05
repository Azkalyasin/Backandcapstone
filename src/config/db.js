const path = require('path');
const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Hubungkan ke MongoDB.
 * - Jika MONGODB_URI diisi (mis. MongoDB Atlas gratis) -> pakai itu.
 * - Jika kosong & bukan production -> jalankan MongoDB in-memory (data hilang saat server mati),
 *   supaya backend bisa langsung dicoba tanpa install apa pun.
 */
async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI wajib diisi di production.');
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      // Simpan binary mongod di folder backend agar tidak diunduh ulang dari direktori lain.
      binary: { downloadDir: path.join(__dirname, '../../node_modules/.cache/mongodb-memory-server') },
    });
    uri = memoryServer.getUri('bimbel-wanda');
    console.warn('⚠️  MONGODB_URI kosong — memakai database in-memory (data hilang saat server berhenti).');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB terhubung: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
