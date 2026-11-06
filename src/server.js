require('dotenv').config();
const crypto = require('crypto');
const { connectDB, disconnectDB } = require('./config/db');
const { ensureSeed } = require('./seed/seed');
const { ensureBucket } = require('./utils/storage');

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET wajib diisi di production.');
    process.exit(1);
  }
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  JWT_SECRET kosong — memakai secret acak sementara (login akan hilang saat restart).');
}

const app = require('./app');

async function start() {
  await connectDB();
  await ensureSeed();
  await ensureBucket().catch((error) => console.warn('Supabase Storage belum siap:', error.message));

  const server = app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Server gagal dijalankan:', error.message);
  process.exit(1);
});
