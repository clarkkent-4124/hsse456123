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
    mu.APJ_ID AS kode_up3,  mu.APJ_NAMA AS nama_up3,
    mul.UPJ_ID AS kode_ulp, mul.UPJ_NAMA AS nama_ulp,
    mr.nama_regu,
    mv.kode_vendor, mv.nama_vendor,
    lp.lokasi AS nama_lokasi,
    CASE WHEN sw.id IS NULL THEN 0 ELSE 1 END AS has_swa,
    sw.id AS swa_id,
    sw.tanggal AS swa_tanggal,
    sw.catatan AS swa_catatan,
    sw.tindakan AS swa_tindakan,
    sw.status_swa,
    sw.keterangan AS swa_keterangan,
    u.nama AS nama_created_by
  FROM laporan_pengawasan lp
  LEFT JOIN dc_apj        mu  ON lp.id_up3    = mu.APJ_ID
  LEFT JOIN dc_upj        mul ON lp.id_ulp    = mul.UPJ_ID
  LEFT JOIN master_regu   mr  ON lp.id_regu   = mr.id
  LEFT JOIN master_vendor mv  ON lp.id_vendor = mv.id
  LEFT JOIN (
    SELECT s.*
    FROM swa s
    INNER JOIN (
      SELECT id_laporan_pengawasan, MIN(id) AS id
      FROM swa
      GROUP BY id_laporan_pengawasan
    ) first_swa ON first_swa.id = s.id
  ) sw
    ON sw.id_laporan_pengawasan = lp.id
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
router.post('/', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const {
      tanggal, id_up3, id_ulp, id_regu, lokasi, nama_lokasi, id_vendor,
      uraian_pekerjaan, nama_pelaksana, jumlah_pekerjaan,
      status_cctv, keterangan_cctv, status_apd, hasil_monitoring,
      temuan_k3, tindak_lanjut, keterangan,
    } = req.body;

    // Validasi field wajib
    const missing = [];
    if (!tanggal)          missing.push('tanggal');
    if (!id_up3)           missing.push('id_up3');
    if (!id_regu)          missing.push('id_regu');
    const lokasiText = String(lokasi || nama_lokasi || '').trim();

    if (!lokasiText) missing.push('lokasi');
    if (missing.length > 0)
      return res.status(400).json({ success: false, message: `Field wajib tidak lengkap: ${missing.join(', ')}.` });

    const [id, no_urut] = await Promise.all([
      generateLaporanId(),
      nextNoUrut(),
    ]);

    const data = {
      id,
      no_urut,
      tanggal,
      id_up3, id_ulp: id_ulp || null, id_regu, lokasi: lokasiText,
      uraian_pekerjaan: uraian_pekerjaan || '',
      nama_pelaksana: nama_pelaksana || '',
      jumlah_pekerjaan: jumlah_pekerjaan || 1,
      status_pekerjaan: 'pending',
      created_by: req.user.id,
    };
    if (id_vendor)        data.id_vendor        = id_vendor;
    if (status_cctv)      data.status_cctv      = status_cctv;
    if (keterangan_cctv)  data.keterangan_cctv  = keterangan_cctv;
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
router.put('/:id', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tanggal, id_up3, id_ulp, id_regu, lokasi, nama_lokasi, id_vendor,
      uraian_pekerjaan, nama_pelaksana, jumlah_pekerjaan,
      status_cctv, keterangan_cctv, status_apd, hasil_monitoring,
      temuan_k3, tindak_lanjut, keterangan,
    } = req.body;

    const [existingRows] = await db.query('SELECT status_pekerjaan, hasil_monitoring FROM laporan_pengawasan WHERE id = ?', [id]);
    if (existingRows.length === 0)
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    if (existingRows[0].status_pekerjaan === 'selesai')
      return res.status(400).json({ success: false, message: 'Laporan selesai tidak dapat diedit.' });

    const [swaRows] = await db.query('SELECT id FROM swa WHERE id_laporan_pengawasan = ? LIMIT 1', [id]);
    if (
      swaRows.length > 0 &&
      hasil_monitoring &&
      hasil_monitoring !== existingRows[0].hasil_monitoring
    ) {
      return res.status(400).json({ success: false, message: 'Hasil monitoring tidak dapat diubah karena SWA sudah dibuat.' });
    }

    const lokasiText = String(lokasi || nama_lokasi || '').trim();
    const missing = [];
    if (!tanggal)    missing.push('tanggal');
    if (!id_up3)     missing.push('id_up3');
    if (!id_regu)    missing.push('id_regu');
    if (!lokasiText) missing.push('lokasi');
    if (missing.length > 0)
      return res.status(400).json({ success: false, message: `Field wajib tidak lengkap: ${missing.join(', ')}.` });

    const updateData = {
      tanggal,
      id_up3,
      id_ulp: id_ulp || null,
      id_regu,
      lokasi: lokasiText,
      id_vendor: id_vendor || null,
      uraian_pekerjaan: uraian_pekerjaan || '',
      nama_pelaksana: nama_pelaksana || '',
      jumlah_pekerjaan: jumlah_pekerjaan || 1,
      temuan_k3: temuan_k3 || null,
      tindak_lanjut: tindak_lanjut || null,
      keterangan: keterangan || null,
      updated_by: req.user.id,
      updated_at: new Date(),
    };
    if (status_cctv)      updateData.status_cctv      = status_cctv;
    if (keterangan_cctv)  updateData.keterangan_cctv  = keterangan_cctv;
    if (status_apd)       updateData.status_apd       = status_apd;
    if (hasil_monitoring) updateData.hasil_monitoring = hasil_monitoring;

    const [result] = await db.query('UPDATE laporan_pengawasan SET ? WHERE id = ?', [updateData, id]);

    const [rows] = await db.query(`${BASE_SELECT} WHERE lp.id = ?`, [id]);
    return res.json({ success: true, data: rows[0], message: 'Laporan berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/laporan/:id/status ────────────────────────────────
// Body: { status_pekerjaan: 'berjalan' | 'selesai' | 'pending' }
router.patch('/:id/status', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
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
