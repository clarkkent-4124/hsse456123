const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const allow   = require('../middleware/roleGuard');

const router = express.Router();

// ── Helper: generate LP-YYYYMMDD-XXXXX ──────────────────────────
async function generateLaporanId() {
  const now     = new Date();
  const y       = now.getFullYear();
  const m       = String(now.getMonth() + 1).padStart(2, '0');
  const d       = String(now.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;
  const prefix  = `LP-${dateStr}-`;

  const [rows] = await db.query(
    `SELECT id FROM laporan_pengawasan WHERE id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  if (rows.length === 0) return `${prefix}00001`;
  const lastSeq = parseInt(rows[0].id.split('-')[2], 10);
  return `${prefix}${String(lastSeq + 1).padStart(5, '0')}`;
}

// ── Helper: next no_urut untuk laporan ──────────────────────────
async function nextNoUrut() {
  const [[row]] = await db.query('SELECT COALESCE(MAX(no_urut), 0) + 1 AS next_val FROM laporan_pengawasan');
  return row.next_val;
}

// ── Base SELECT dengan JOIN ke semua master ──────────────────────
const BASE_SELECT = `
  SELECT
    lp.*,
    mu.kode_up3,  mu.nama_up3,
    mul.kode_ulp, mul.nama_ulp,
    mr.nama_regu,
    mv.kode_vendor, mv.nama_vendor,
    ml.kode_lokasi, ml.nama_lokasi,
    u.nama AS nama_created_by
  FROM laporan_pengawasan lp
  LEFT JOIN master_up3    mu  ON lp.id_up3    = mu.id
  LEFT JOIN master_ulp    mul ON lp.id_ulp    = mul.id
  LEFT JOIN master_regu   mr  ON lp.id_regu   = mr.id
  LEFT JOIN master_vendor mv  ON lp.id_vendor = mv.id
  LEFT JOIN master_lokasi ml  ON lp.id_lokasi = ml.id
  LEFT JOIN users         u   ON lp.created_by = u.id
`;

// ── GET /api/laporan ─────────────────────────────────────────────
router.get('/', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const {
      tanggal_dari, tanggal_sampai,
      id_up3, id_ulp,
      status_pekerjaan, hasil_monitoring,
      page = 1, limit = 20,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where    = 'WHERE 1=1';
    const params = [];

    if (tanggal_dari)     { where += ' AND DATE(lp.tanggal) >= ?';       params.push(tanggal_dari); }
    if (tanggal_sampai)   { where += ' AND DATE(lp.tanggal) <= ?';       params.push(tanggal_sampai); }
    if (id_up3)           { where += ' AND lp.id_up3 = ?';               params.push(id_up3); }
    if (id_ulp)           { where += ' AND lp.id_ulp = ?';               params.push(id_ulp); }
    if (status_pekerjaan) { where += ' AND lp.status_pekerjaan = ?';     params.push(status_pekerjaan); }
    if (hasil_monitoring) { where += ' AND lp.hasil_monitoring = ?';     params.push(hasil_monitoring); }

    const countSql = `SELECT COUNT(*) AS total FROM laporan_pengawasan lp ${where}`;
    const [[{ total }]] = await db.query(countSql, params);

    const [rows] = await db.query(
      `${BASE_SELECT} ${where} ORDER BY lp.tanggal DESC, lp.id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

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

// ── POST /api/laporan ────────────────────────────────────────────
router.post('/', auth, allow('admin', 'user'), async (req, res) => {
  try {
    const {
      tanggal, id_up3, id_ulp, id_regu, id_lokasi, id_vendor,
      uraian_pekerjaan, nama_pelaksana, jumlah_pekerjaan,
      status_cctv, status_apd, hasil_monitoring,
      temuan_k3, tindak_lanjut, keterangan,
    } = req.body;

    // Validasi field wajib
    const missing = [];
    if (!tanggal)          missing.push('tanggal');
    if (!id_up3)           missing.push('id_up3');
    if (!id_ulp)           missing.push('id_ulp');
    if (!id_regu)          missing.push('id_regu');
    if (!id_lokasi)        missing.push('id_lokasi');
    if (!uraian_pekerjaan) missing.push('uraian_pekerjaan');
    if (!nama_pelaksana)   missing.push('nama_pelaksana');
    if (missing.length > 0)
      return res.status(400).json({ success: false, message: `Field wajib tidak lengkap: ${missing.join(', ')}.` });

    const [id, no_urut] = await Promise.all([generateLaporanId(), nextNoUrut()]);

    const data = {
      id,
      no_urut,
      tanggal,
      id_up3, id_ulp, id_regu, id_lokasi,
      uraian_pekerjaan,
      nama_pelaksana,
      jumlah_pekerjaan: jumlah_pekerjaan || 1,
      status_pekerjaan: 'pending',
      created_by: req.user.id,
    };
    if (id_vendor)        data.id_vendor        = id_vendor;
    if (status_cctv)      data.status_cctv      = status_cctv;
    if (status_apd)       data.status_apd       = status_apd;
    if (hasil_monitoring) data.hasil_monitoring = hasil_monitoring;
    if (temuan_k3)        data.temuan_k3        = temuan_k3;
    if (tindak_lanjut)    data.tindak_lanjut    = tindak_lanjut;
    if (keterangan)       data.keterangan       = keterangan;

    await db.query('INSERT INTO laporan_pengawasan SET ?', [data]);

    const [rows] = await db.query(`${BASE_SELECT} WHERE lp.id = ?`, [id]);
    return res.status(201).json({
      success: true,
      data: rows[0],
      message: `Laporan ${id} berhasil dibuat.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/laporan/:id ─────────────────────────────────────────
router.get('/:id', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const [rows] = await db.query(`${BASE_SELECT} WHERE lp.id = ?`, [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/laporan/:id ─────────────────────────────────────────
router.put('/:id', auth, allow('admin', 'user'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id: _id, created_by: _cb, created_at: _ca,
      status_pekerjaan: _sp,
      tanggal_pekerjaan_berjalan: _tb,
      tanggal_pekerjaan_selesai: _ts,
      ...updateData
    } = req.body;

    updateData.updated_by = req.user.id;
    updateData.updated_at = new Date();

    const [result] = await db.query('UPDATE laporan_pengawasan SET ? WHERE id = ?', [updateData, id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    const [rows] = await db.query(`${BASE_SELECT} WHERE lp.id = ?`, [id]);
    return res.json({ success: true, data: rows[0], message: 'Laporan berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/laporan/:id/status ────────────────────────────────
// Body: { status_pekerjaan: 'berjalan' | 'selesai' | 'pending' }
router.patch('/:id/status', auth, allow('admin', 'user'), async (req, res) => {
  try {
    const { id }              = req.params;
    const { status_pekerjaan } = req.body;

    const allowed = ['pending', 'berjalan', 'selesai'];
    if (!allowed.includes(status_pekerjaan))
      return res.status(400).json({ success: false, message: `Status tidak valid. Harus: ${allowed.join(', ')}.` });

    const now = new Date();
    const updateData = {
      status_pekerjaan,
      updated_by: req.user.id,
      updated_at: now,
    };

    if (status_pekerjaan === 'berjalan') updateData.tanggal_pekerjaan_berjalan = now;
    if (status_pekerjaan === 'selesai')  updateData.tanggal_pekerjaan_selesai  = now;

    const [result] = await db.query(
      'UPDATE laporan_pengawasan SET ? WHERE id = ?',
      [updateData, id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    const [rows] = await db.query(`${BASE_SELECT} WHERE lp.id = ?`, [id]);
    return res.json({
      success: true,
      data: rows[0],
      message: `Status diperbarui ke "${status_pekerjaan}".`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
