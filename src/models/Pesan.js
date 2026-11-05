const mongoose = require('mongoose');
const toJSON = require('./plugins');

// Pesan dari form "Kirim pesan" di halaman Profil/Kontak.
const pesanSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true, maxlength: 100 },
    kontak: { type: String, required: true, trim: true, maxlength: 100 },
    pesan: { type: String, required: true, maxlength: 2000 },
    dibaca: { type: Boolean, default: false },
  },
  { timestamps: true },
);

pesanSchema.plugin(toJSON);

module.exports = mongoose.model('Pesan', pesanSchema);
