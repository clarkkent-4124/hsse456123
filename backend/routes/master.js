const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const allow   = require('../middleware/roleGuard');

const router = express.Router();

router.get('/up3', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        APJ_ID AS id,
        APJ_ID AS kode_up3,
        APJ_NAMA AS nama_up3,
        APJ_ALIAS AS alias_up3,
        APJ_DCC AS dcc,
        APJ_ALAMAT AS alamat
      FROM dc_apj
      ORDER BY
        CASE
          WHEN UPPER(COALESCE(APJ_NAMA, '')) LIKE '%UID%' THEN 1
          WHEN UPPER(COALESCE(APJ_NAMA, '')) LIKE '%UP2D%' THEN 2
          ELSE 0
        END,
        APJ_NAMA
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/ulp', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        UPJ_ID AS id,
        UPJ_ID AS kode_ulp,
        APJ_ID AS id_up3,
        UPJ_NAMA AS nama_ulp,
        UPJ_ALAMAT AS alamat
      FROM dc_upj
      ORDER BY UPJ_NAMA
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

function masterCRUD(tableName, orderCol = 'nama') {
  router.get(`/${tableName.replace('master_', '')}`, auth, allow('admin', 'user', 'viewer'), async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT * FROM ${tableName} ORDER BY ${orderCol}`);
      return res.json({ success: true, data: rows });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post(`/${tableName.replace('master_', '')}`, auth, allow('admin', 'user', 'viewer'), async (req, res) => {
    try {
      const [result] = await db.query(`INSERT INTO ${tableName} SET ?`, [req.body]);
      const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [result.insertId]);
      return res.status(201).json({ success: true, data: rows[0], message: 'Data berhasil ditambahkan.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });
}

masterCRUD('master_regu',   'nama_regu');
masterCRUD('master_vendor', 'nama_vendor');
masterCRUD('master_lokasi', 'nama_lokasi');

module.exports = router;
