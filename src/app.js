const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files untuk uploads
app.use('/uploads', express.static('uploads'));

// Import routes
const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const pendaftarRoutes = require('./routes/pendaftarRoutes');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server Bimbel Wanda berjalan dengan baik',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/pendaftar', pendaftarRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint tidak ditemukan'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Terjadi kesalahan pada server'
  });
});

module.exports = app;
