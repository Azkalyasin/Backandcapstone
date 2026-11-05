const Admin = require('../models/Admin');
const Program = require('../models/Program');
const Achievement = require('../models/Achievement');
const data = require('./data');

/**
 * Dijalankan otomatis saat server start:
 * - Membuat akun admin pertama jika belum ada (ADMIN_USERNAME / ADMIN_PASSWORD).
 * - Mengisi program & achievement contoh jika koleksinya masih kosong
 *   (matikan dengan SEED_SAMPLE_DATA=false).
 */
async function ensureSeed() {
  if ((await Admin.countDocuments()) === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    let password = process.env.ADMIN_PASSWORD;
    if (!password) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_PASSWORD wajib diisi di production untuk membuat akun admin pertama.');
      }
      password = 'admin12345';
      console.warn(`⚠️  ADMIN_PASSWORD kosong — akun admin dev dibuat: ${username} / ${password}`);
    }
    await Admin.create({ username, password, name: 'Administrator', email: process.env.ADMIN_EMAIL || '' });
    console.log(`Akun admin "${username}" dibuat.`);
  }

  if (process.env.SEED_SAMPLE_DATA === 'false') return;

  if ((await Program.countDocuments()) === 0) {
    await Program.insertMany(data.programs);
    console.log(`Seed: ${data.programs.length} program contoh ditambahkan.`);
  }
  if ((await Achievement.countDocuments()) === 0) {
    await Achievement.insertMany(data.achievements);
    console.log(`Seed: ${data.achievements.length} achievement contoh ditambahkan.`);
  }
}

module.exports = { ensureSeed };
