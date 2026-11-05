const mongoose = require('mongoose');
const toJSON = require('./plugins');

const programSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true, maxlength: 120 },
    deskripsi: { type: String, default: '', maxlength: 1000 },
    tingkat: { type: String, required: true, trim: true }, // SD | SMP | SMA | Semua jenjang
    durasi: { type: String, default: '' },
    jadwal: { type: String, default: '' },
    biaya: { type: Number, default: 0, min: 0 },
    kuota: { type: Number, default: 0, min: 0 },
    tersedia: { type: Boolean, default: true },
    materi: { type: [String], default: [] },
    fasilitas: { type: [String], default: [] },
  },
  { timestamps: true },
);

programSchema.plugin(toJSON);

module.exports = mongoose.model('Program', programSchema);
