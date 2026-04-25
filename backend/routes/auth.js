const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });

    const [rows] = await db.query(
      'SELECT id, username, nama, email, role, is_active FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });

    const user = rows[0];
    if (!user.is_active)
      return res.status(403).json({ success: false, message: 'Akun tidak aktif. Hubungi administrator.' });

    const [pwRows] = await db.query('SELECT password FROM users WHERE id = ? LIMIT 1', [user.id]);
    const match = await bcrypt.compare(password, pwRows[0].password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });

    const payload = { id: user.id, username: user.username, nama: user.nama, role: user.role };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

    return res.json({
      success: true,
      data: { token, user: { id: user.id, username: user.username, nama: user.nama, email: user.email, role: user.role } },
      message: 'Login berhasil.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────
// JWT adalah stateless — logout dilakukan di sisi client (hapus token).
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logout berhasil.' });
});

// ── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, nama, email, role FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
