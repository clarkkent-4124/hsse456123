const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const allow   = require('../middleware/roleGuard');

const router = express.Router();

function buildDateWhere(alias, query) {
  const where = [];
  const params = [];
  if (query.tanggal_dari) {
    where.push(`DATE(${alias}.tanggal) >= ?`);
    params.push(query.tanggal_dari);
  }
  if (query.tanggal_sampai) {
    where.push(`DATE(${alias}.tanggal) <= ?`);
    params.push(query.tanggal_sampai);
  }
  return {
    sql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

// ── GET /api/dashboard/summary ───────────────────────────────────
router.get('/summary', auth, allow('admin', 'user', 'viewer'), async (req, res) => {
  try {
    const laporanDate = buildDateWhere('lp', req.query);
    const swaDate = buildDateWhere('s', req.query);

    const [[monthSummary]] = await db.query(`
      SELECT
        COUNT(*)                                                               AS total_bulan_ini,
        SUM(CASE WHEN status_pekerjaan = 'pending'       THEN 1 ELSE 0 END)   AS pending_bulan_ini,
        SUM(CASE WHEN status_pekerjaan = 'berjalan'      THEN 1 ELSE 0 END)   AS berjalan_bulan_ini,
        SUM(CASE WHEN status_pekerjaan = 'selesai'       THEN 1 ELSE 0 END)   AS selesai_bulan_ini,
        SUM(CASE WHEN hasil_monitoring = 'tidak aman'    THEN 1 ELSE 0 END)   AS tidak_aman_bulan_ini,
        SUM(CASE WHEN hasil_monitoring = 'tidak termonitor' THEN 1 ELSE 0 END) AS tidak_termonitor
      FROM laporan_pengawasan lp
      ${laporanDate.sql || `
        WHERE lp.tanggal >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
          AND lp.tanggal < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
      `}
    `, laporanDate.params);

    const [[monthSwaRow]] = await db.query(`
      SELECT COUNT(*) AS swa_bulan_ini FROM swa s
      ${swaDate.sql || `
        WHERE tanggal >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
          AND tanggal < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
      `}
    `, swaDate.params);

    const [[todaySummary]] = await db.query(`
      SELECT
        COUNT(*)                                                             AS total_hari_ini,
        SUM(CASE WHEN status_pekerjaan = 'pending'  THEN 1 ELSE 0 END)      AS pending_hari_ini,
        SUM(CASE WHEN status_pekerjaan = 'berjalan' THEN 1 ELSE 0 END)      AS berjalan_hari_ini,
        SUM(CASE WHEN status_pekerjaan = 'selesai'  THEN 1 ELSE 0 END)      AS selesai_hari_ini
      FROM laporan_pengawasan
      WHERE DATE(tanggal) = CURDATE()
    `);

    const [[todaySwaRow]] = await db.query(`
      SELECT COUNT(*) AS swa_hari_ini FROM swa WHERE DATE(tanggal) = CURDATE()
    `);

    return res.json({
      success: true,
      data: { ...monthSummary, ...monthSwaRow, ...todaySummary, ...todaySwaRow },
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
        DATE_FORMAT(tanggal, '%Y-%m-%d')                                      AS tanggal,
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
    const laporanDate = buildDateWhere('lp', req.query);
    const laporanWhere = laporanDate.sql || '';

    const [byUP3] = await db.query(`
      SELECT COALESCE(da.APJ_NAMA, 'Belum diisi') AS label, COUNT(lp.id) AS total
      FROM laporan_pengawasan lp
      LEFT JOIN dc_apj da ON lp.id_up3 = da.APJ_ID
      ${laporanWhere}
      GROUP BY lp.id_up3, da.APJ_NAMA
      ORDER BY total DESC
    `, laporanDate.params);

    const [byULP] = await db.query(`
      SELECT COALESCE(du.UPJ_NAMA, 'Belum diisi') AS label, COUNT(lp.id) AS total
      FROM laporan_pengawasan lp
      LEFT JOIN dc_upj du ON lp.id_ulp = du.UPJ_ID
      ${laporanWhere}
      GROUP BY lp.id_ulp, du.UPJ_NAMA
      ORDER BY total DESC
    `, laporanDate.params);

    const [byStatusPekerjaan] = await db.query(`
      SELECT
        lp.status_pekerjaan AS label,
        COUNT(*) AS total
      FROM laporan_pengawasan lp
      ${laporanWhere ? `${laporanWhere} AND` : 'WHERE'} lp.status_pekerjaan IN ('berjalan', 'selesai')
      GROUP BY lp.status_pekerjaan
      ORDER BY total DESC
    `, laporanDate.params);

    const [byAPD] = await db.query(`
      SELECT
        lp.status_apd AS label,
        COUNT(*) AS total
      FROM laporan_pengawasan lp
      ${laporanWhere ? `${laporanWhere} AND` : 'WHERE'} lp.status_apd IN ('lengkap', 'tidak lengkap', 'tidak termonitor')
      GROUP BY lp.status_apd
      ORDER BY total DESC
    `, laporanDate.params);

    const [byKeteranganCCTV] = await db.query(`
      SELECT
        lp.keterangan_cctv AS label,
        COUNT(*) AS total
      FROM laporan_pengawasan lp
      ${laporanWhere ? `${laporanWhere} AND` : 'WHERE'} lp.keterangan_cctv IN ('aktif', 'tidak aktif', 'tidak muncul di Ezviz')
      GROUP BY lp.keterangan_cctv
      ORDER BY total DESC
    `, laporanDate.params);

    return res.json({
      success: true,
      data: {
        by_up3: byUP3,
        by_ulp: byULP,
        by_status_pekerjaan: byStatusPekerjaan,
        by_status_apd: byAPD,
        by_keterangan_cctv: byKeteranganCCTV,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
