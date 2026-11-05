const mongoose = require('mongoose');
const toJSON = require('./plugins');

const STATUS = ['Baru', 'Dihubungi', 'Selesai'];

const pendaftarSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true, maxlength: 120 },
    tempatLahir: { type: String, default: '', maxlength: 80 },
    tanggalLahir: { type: String, default: '' },
    jenisKelamin: { type: String, default: '' },
    alamat: { type: String, default: '', maxlength: 500 },
    telepon: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, default: '', maxlength: 120 },
    namaOrangTua: { type: String, default: '', maxlength: 120 },
    jenjang: { type: String, default: '' },
    program: { type: String, default: '' },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    pesan: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: STATUS, default: 'Baru' },
  },
  { timestamps: true },
);

pendaftarSchema.plugin(toJSON);

module.exports = mongoose.model('Pendaftar', pendaftarSchema);
module.exports.STATUS = STATUS;
