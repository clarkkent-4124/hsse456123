const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const allow   = require('../middleware/roleGuard');

const router = express.Router();

// ── Helper: generate SWA-YYYYMMDD-XXXXX ─────────────────────────
async function generateSWAId() {
  const now     = new Date();
  const y       = now.getFullYear();
  const m       = String(now.getMonth() + 1).padStart(2, '0');
  const d       = String(now.getDate()).padStart(2, '0');
  const prefix  = `SWA-${y}${m}${d}-`;

  const [rows] = await db.query(
    `SELECT id FROM swa WHERE id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  if (rows.length === 0) return `${prefix}00001`;
  const lastSeq = parseInt(rows[0].id.split('-')[2], 10);
  return `${prefix}${String(lastSeq + 1).padStart(5, '0')}`;
}

// ── GET /api/swa ─────────────────────────────────────────────────
router.get('/', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const { tanggal_dari, tanggal_sampai, id_laporan, lokasi, id_up3, id_ulp, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where    = 'WHERE 1=1';
    const params = [];

    if (tanggal_dari)  { where += ' AND DATE(s.tanggal) >= ?';              params.push(tanggal_dari); }
    if (tanggal_sampai){ where += ' AND DATE(s.tanggal) <= ?';              params.push(tanggal_sampai); }
    if (id_laporan)    { where += ' AND s.id_laporan_pengawasan = ?';        params.push(id_laporan); }
    if (lokasi)        { where += ' AND lp.lokasi LIKE ?';                   params.push(`%${lokasi}%`); }
    if (id_up3)        { where += ' AND lp.id_up3 = ?';                      params.push(id_up3); }
    if (id_ulp)        { where += ' AND lp.id_ulp = ?';                      params.push(id_ulp); }

    const baseSql = `
      FROM swa s
      LEFT JOIN laporan_pengawasan lp ON s.id_laporan_pengawasan = lp.id
      LEFT JOIN dc_apj mu ON lp.id_up3 = mu.APJ_ID
      LEFT JOIN dc_upj du ON lp.id_ulp = du.UPJ_ID
      LEFT JOIN master_regu mr ON lp.id_regu = mr.id
      LEFT JOIN master_vendor mv ON lp.id_vendor = mv.id
      ${where}
    `;

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${baseSql}`, params);

    const [rows] = await db.query(`
      SELECT
        s.*,
        lp.tanggal            AS tanggal_laporan,
        lp.uraian_pekerjaan,
        lp.lokasi,
        lp.status_pekerjaan,
        lp.hasil_monitoring,
        mu.APJ_NAMA AS nama_up3,
        du.UPJ_NAMA AS nama_ulp,
        mr.nama_regu,
        mv.nama_vendor
      ${baseSql}
      ORDER BY s.tanggal DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(total) / parseInt(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/swa ────────────────────────────────────────────────
router.post('/', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const { id_laporan_pengawasan, catatan, tindakan, status_swa, keterangan } = req.body;

    // Validasi field wajib
    if (!id_laporan_pengawasan || !catatan || !tindakan || !status_swa)
      return res.status(400).json({ success: false, message: 'Field wajib tidak lengkap: id_laporan_pengawasan, catatan, tindakan, status_swa.' });

    const allowedStatus = ['berjalan setelah perbaikan', 'diberhentikan'];
    if (status_swa && !allowedStatus.includes(status_swa))
      return res.status(400).json({ success: false, message: 'Status SWA tidak valid.' });

    const [existingRows] = await db.query(
      'SELECT id FROM swa WHERE id_laporan_pengawasan = ? LIMIT 1',
      [id_laporan_pengawasan]
    );
    if (existingRows.length > 0)
      return res.status(400).json({ success: false, message: 'SWA untuk laporan ini sudah pernah dibuat.' });

    const id = await generateSWAId();
    const [[noUrutRow]] = await db.query('SELECT COALESCE(MAX(no_urut), 0) + 1 AS nxt FROM swa');
    const no_urut = noUrutRow.nxt;

    const data = {
      id,
      no_urut,
      tanggal:               new Date(),
      id_laporan_pengawasan,
      catatan,
      tindakan,
      status_swa,
      created_by:  req.user.id,
    };
    if (keterangan) data.keterangan = keterangan;

    await db.query('INSERT INTO swa SET ?', [data]);

    const [rows] = await db.query(`
      SELECT s.*, lp.tanggal AS tanggal_laporan, lp.uraian_pekerjaan, lp.hasil_monitoring
      FROM swa s
      LEFT JOIN laporan_pengawasan lp ON s.id_laporan_pengawasan = lp.id
      WHERE s.id = ?
    `, [id]);

    return res.status(201).json({
      success: true,
      data: rows[0],
      message: `SWA ${id} berhasil dibuat.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/swa/:id ─────────────────────────────────────────────
router.get('/:id', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, lp.tanggal AS tanggal_laporan, lp.uraian_pekerjaan, lp.status_pekerjaan, lp.hasil_monitoring
      FROM swa s
      LEFT JOIN laporan_pengawasan lp ON s.id_laporan_pengawasan = lp.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'SWA tidak ditemukan.' });

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/swa/:id ─────────────────────────────────────────────
router.put('/:id', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const { id: _id, created_by: _cb, created_at: _ca, ...updateData } = req.body;
    updateData.updated_by = req.user.id;
    updateData.updated_at = new Date();

    const [result] = await db.query('UPDATE swa SET ? WHERE id = ?', [updateData, req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'SWA tidak ditemukan.' });

    const [rows] = await db.query('SELECT * FROM swa WHERE id = ?', [req.params.id]);
    return res.json({ success: true, data: rows[0], message: 'SWA berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
