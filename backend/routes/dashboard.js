const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const allow   = require('../middleware/roleGuard');

const router = express.Router();

// ── GET /api/dashboard/summary ───────────────────────────────────
router.get('/summary', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[summary]] = await db.query(`
      SELECT
        COUNT(*)                                                                AS total_hari_ini,
        SUM(CASE WHEN status_pekerjaan = 'pending'       THEN 1 ELSE 0 END)   AS pending,
        SUM(CASE WHEN status_pekerjaan = 'berjalan'      THEN 1 ELSE 0 END)   AS berjalan,
        SUM(CASE WHEN status_pekerjaan = 'selesai'       THEN 1 ELSE 0 END)   AS selesai,
        SUM(CASE WHEN hasil_monitoring = 'tidak aman'    THEN 1 ELSE 0 END)   AS tidak_aman,
        SUM(CASE WHEN hasil_monitoring = 'tidak termonitor' THEN 1 ELSE 0 END) AS tidak_termonitor
      FROM laporan_pengawasan
      WHERE DATE(tanggal) = ?
    `, [today]);

    const [[swaRow]] = await db.query(`
      SELECT COUNT(*) AS swa_aktif FROM swa WHERE DATE(tanggal) = ?
    `, [today]);

    return res.json({
      success: true,
      data: { ...summary, swa_aktif: swaRow.swa_aktif },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/dashboard/chart ─────────────────────────────────────
// Data 7 hari terakhir: jumlah laporan per hari per status
router.get('/chart', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE(tanggal)                                                         AS tanggal,
        COUNT(*)                                                              AS total,
        SUM(CASE WHEN status_pekerjaan = 'pending'    THEN 1 ELSE 0 END)    AS pending,
        SUM(CASE WHEN status_pekerjaan = 'berjalan'   THEN 1 ELSE 0 END)    AS berjalan,
        SUM(CASE WHEN status_pekerjaan = 'selesai'    THEN 1 ELSE 0 END)    AS selesai,
        SUM(CASE WHEN hasil_monitoring = 'tidak aman' THEN 1 ELSE 0 END)    AS tidak_aman
      FROM laporan_pengawasan
      WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(tanggal)
      ORDER BY DATE(tanggal) ASC
    `);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/dashboard/breakdown ─────────────────────────────────
router.get('/breakdown', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const [byUP3] = await db.query(`
      SELECT mu.nama_up3 AS label, COUNT(lp.id) AS total
      FROM laporan_pengawasan lp
      LEFT JOIN master_up3 mu ON lp.id_up3 = mu.id
      GROUP BY lp.id_up3, mu.nama_up3
      ORDER BY total DESC
    `);

    const [byHasil] = await db.query(`
      SELECT
        COALESCE(hasil_monitoring, 'Belum diisi') AS label,
        COUNT(*)                                    AS total
      FROM laporan_pengawasan
      GROUP BY hasil_monitoring
      ORDER BY total DESC
    `);

    const [byAPD] = await db.query(`
      SELECT
        COALESCE(status_apd, 'Belum diisi') AS label,
        COUNT(*)                              AS total
      FROM laporan_pengawasan
      GROUP BY status_apd
      ORDER BY total DESC
    `);

    return res.json({
      success: true,
      data: { by_up3: byUP3, by_hasil_monitoring: byHasil, by_status_apd: byAPD },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
