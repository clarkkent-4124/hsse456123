const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query(
      'SELECT id, username, nama, role, is_active FROM users WHERE id = ? LIMIT 1',
      [payload.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
    }
    if (!rows[0].is_active) {
      return res.status(403).json({ success: false, message: 'Akun tidak aktif. Hubungi administrator.' });
    }

    req.user = {
      id: rows[0].id,
      username: rows[0].username,
      nama: rows[0].nama,
      role: rows[0].role,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};
