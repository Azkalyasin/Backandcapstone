const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Di Render/Railway/Vercel, request lewat proxy — perlu agar rate-limit membaca IP asli.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS: batasi ke domain frontend lewat CORS_ORIGIN (pisahkan dengan koma). Kosong = izinkan semua.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  }),
);

// Batas 2 MB agar foto achievement (data URL ≤ 1 MB) bisa dikirim.
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server Bimbel Wanda berjalan dengan baik',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/programs', require('./routes/programRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/pendaftar', require('./routes/pendaftarRoutes'));
app.use('/api/pesan', require('./routes/pesanRoutes'));
app.use('/api/stats', require('./middlewares/auth').requireAuth, require('./controllers/statsController').getStats);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint tidak ditemukan',
  });
});

// Error handler (Express 5 otomatis meneruskan error dari fungsi async ke sini)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ status: 'error', message: 'Ukuran data terlalu besar (maks 2 MB)' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'Format JSON tidak valid' });
  }
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ status: 'error', message: errors[0]?.message || 'Data tidak valid', errors });
  }
  if (err.code === 11000) {
    return res.status(409).json({ status: 'error', message: 'Data sudah ada' });
  }

  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    status: 'error',
    message: status < 500 ? err.message : 'Terjadi kesalahan pada server',
  });
});

module.exports = app;
