const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const db = require('./db');
const app  = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
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
