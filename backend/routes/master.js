const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const allow   = require('../middleware/roleGuard');

const router = express.Router();

// ── Helper: buat CRUD untuk satu tabel master ────────────────────
function masterCRUD(tableName, orderCol = 'nama') {
  // GET all
  router.get(`/${tableName.replace('master_', '')}`, auth, allow('admin', 'user', 'viewer'), async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT * FROM ${tableName} ORDER BY ${orderCol}`);
      return res.json({ success: true, data: rows });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST create
  router.post(`/${tableName.replace('master_', '')}`, auth, allow('admin'), async (req, res) => {
    try {
      const [result] = await db.query(`INSERT INTO ${tableName} SET ?`, [req.body]);
      const [rows]   = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [result.insertId]);
      return res.status(201).json({ success: true, data: rows[0], message: 'Data berhasil ditambahkan.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });
}

masterCRUD('master_up3',    'nama_up3');
masterCRUD('master_ulp',    'nama_ulp');
masterCRUD('master_regu',   'nama_regu');
masterCRUD('master_vendor', 'nama_vendor');
masterCRUD('master_lokasi', 'nama_lokasi');

module.exports = router;
