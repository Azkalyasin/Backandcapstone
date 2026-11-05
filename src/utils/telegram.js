// Kirim notifikasi ke admin melalui Telegram Bot API.
// Butuh env TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID. Jika kosong, fungsi ini diam saja.

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

async function sendTelegram(html) {
  if (!isTelegramConfigured()) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: html, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json().catch(() => ({}));
    if (!result.ok) console.error('Telegram API error:', result.description || response.status);
    return Boolean(result.ok);
  } catch (error) {
    console.error('Gagal menghubungi Telegram:', error.message);
    return false;
  }
}

function notifyPendaftar(p) {
  const rows = [
    ['Nama', p.nama],
    ['TTL', [p.tempatLahir, p.tanggalLahir].filter(Boolean).join(', ')],
    ['Jenis kelamin', p.jenisKelamin],
    ['Alamat', p.alamat],
    ['No. HP/WA', p.telepon],
    ['Orang tua/wali', p.namaOrangTua],
    ['Jenjang', p.jenjang],
    ['Program', p.program],
  ].filter(([, v]) => v);
  return sendTelegram(
    ['<b>📝 Pendaftaran baru — Bimble Wanda</b>', '', ...rows.map(([k, v]) => `<b>${k}:</b> ${escapeHtml(v)}`)].join('\n'),
  );
}

function notifyPesan(m) {
  return sendTelegram(
    [
      '<b>💬 Pesan baru dari website — Bimble Wanda</b>',
      '',
      `<b>Nama:</b> ${escapeHtml(m.nama)}`,
      `<b>Kontak:</b> ${escapeHtml(m.kontak)}`,
      '',
      escapeHtml(m.pesan),
    ].join('\n'),
  );
}

module.exports = { isTelegramConfigured, sendTelegram, notifyPendaftar, notifyPesan };
