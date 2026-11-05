const mongoose = require('mongoose');
const toJSON = require('./plugins');

const achievementSchema = new mongoose.Schema(
  {
    namaSiswa: { type: String, required: true, trim: true, maxlength: 120 },
    judul: { type: String, required: true, trim: true, maxlength: 200 },
    deskripsi: { type: String, default: '', maxlength: 1500 },
    kategori: { type: String, default: 'Akademik', trim: true },
    tahun: { type: Number },
    tanggal: { type: String, default: '' }, // YYYY-MM-DD
    // Foto disimpan sebagai data URL (base64, maks ~1 MB) agar tetap aman di hosting gratis
    // yang disk-nya tidak permanen. Bisa juga berupa URL gambar biasa.
    foto: { type: String, default: '' },
  },
  { timestamps: true },
);

achievementSchema.plugin(toJSON);

module.exports = mongoose.model('Achievement', achievementSchema);
