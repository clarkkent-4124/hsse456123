const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const auth    = require('../middleware/auth');
const allow   = require('../middleware/roleGuard');

const router = express.Router();

// ── GET /api/users ───────────────────────────────────────────────
router.get('/', auth, allow('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, nama, email, role, is_active, created_at FROM users ORDER BY nama'
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/users ──────────────────────────────────────────────
router.post('/', auth, allow('admin'), async (req, res) => {
  try {
    const { username, nama, email, password, role, is_active = true } = req.body;
    if (!username || !password || !role)
      return res.status(400).json({ success: false, message: 'Username, password, dan role wajib diisi.' });

    const validRoles = ['admin', 'user', 'viewer'];
    if (!validRoles.includes(role))
      return res.status(400).json({ success: false, message: `Role tidak valid. Harus: ${validRoles.join(', ')}.` });

    // Cek username duplikat
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Username sudah digunakan.' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, nama, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [username, nama || username, email || null, hashed, role, is_active ? 1 : 0]
    );

    const [rows] = await db.query(
      'SELECT id, username, nama, email, role, is_active, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    return res.status(201).json({ success: true, data: rows[0], message: 'User berhasil ditambahkan.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/users/:id ───────────────────────────────────────────
router.put('/:id', auth, allow('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, nama, email, password, role, is_active } = req.body;

    if (role) {
      const validRoles = ['admin', 'user', 'viewer'];
      if (!validRoles.includes(role))
        return res.status(400).json({ success: false, message: `Role tidak valid.` });
    }

    const fields = [];
    const params = [];

    if (username   !== undefined) { fields.push('username = ?');   params.push(username); }
    if (nama       !== undefined) { fields.push('nama = ?');        params.push(nama); }
    if (email      !== undefined) { fields.push('email = ?');       params.push(email); }
    if (role       !== undefined) { fields.push('role = ?');        params.push(role); }
    if (is_active  !== undefined) { fields.push('is_active = ?');   params.push(is_active ? 1 : 0); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      params.push(hashed);
    }

    if (fields.length === 0)
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diperbarui.' });

    params.push(id);
    const [result] = await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const [rows] = await db.query(
      'SELECT id, username, nama, email, role, is_active, created_at FROM users WHERE id = ?', [id]
    );
    return res.json({ success: true, data: rows[0], message: 'User berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/users/:id ────────────────────────────────────────
router.delete('/:id', auth, allow('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Jangan hapus diri sendiri
    if (String(id) === String(req.user.id))
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri.' });

    const [userRows] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
    if (userRows.length === 0)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    if (userRows[0].role === 'admin')
      return res.status(400).json({ success: false, message: 'User admin tidak dapat dihapus.' });

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    return res.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
