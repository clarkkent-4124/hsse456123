const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const db = require('./db');
const app  = express();
const PORT = process.env.PORT || 5001;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

if (process.env.REPLICATION_ENABLED === 'true') {
  require('./schedulers/replicationScheduler');
} else {
  console.log('[REPLICATION] Scheduler nonaktif.');
}

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin tidak diizinkan: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/master',    require('./routes/master'));
app.use('/api/laporan',   require('./routes/laporan'));
app.use('/api/swa',       require('./routes/swa'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users',     require('./routes/users'));

// ── Health check ─────────────────────────────────────────────────
app.get('/api/ping', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1+1 AS result');
    res.json({ success: true, message: 'HSSE Backend OK', db: 'Connected', result: rows[0].result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB Error', error: err.message });
  }
});

// ── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} tidak ditemukan.` });
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`HSSE Backend running → http://localhost:${PORT}`);
  console.log(`Database             → ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
});
