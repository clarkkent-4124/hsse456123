# HSSE Dashboard — Codex Migration Prompt

> Salin seluruh isi dokumen ini sebagai system prompt / task description ke Codex.

---

## 🎯 Ringkasan Proyek

Kamu diminta melanjutkan dan menyempurnakan proyek **HSSE Dashboard Pelaporan & Pengawasan** — sebuah web application internal perusahaan (PLN/utility) untuk mencatat, memantau, dan melaporkan kegiatan pengawasan K3 (Keselamatan dan Kesehatan Kerja) di lapangan.

Proyek ini sudah **~70% selesai**. Tugasmu adalah melanjutkan bagian yang belum selesai dan memastikan seluruh aplikasi berjalan dengan benar.

---

## 🏗️ Arsitektur & Tech Stack

### Backend
- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js v5
- **Database**: MySQL (mysql2/promise, connection pool)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Port**: 5001
- **Entry**: `backend/index.js`

### Frontend
- **Framework**: React 19 + Vite 8
- **Router**: React Router DOM v6 (client-side SPA)
- **HTTP Client**: Axios dengan interceptor JWT
- **Charts**: Recharts (PieChart donut, BarChart stacked)
- **Styling**: Pure inline styles + CSS custom properties (tidak pakai Tailwind secara langsung)
- **Font**: IBM Plex Sans (teks), IBM Plex Mono (kode/ID)
- **Port dev**: 5173

### Struktur Folder
```
project-root/
├── backend/
│   ├── index.js              ← Express entry, CORS, route mounting
│   ├── db.js                 ← MySQL pool (mysql2/promise)
│   ├── middleware/
│   │   ├── auth.js           ← JWT verify → req.user = { id, username, nama, role }
│   │   └── roleGuard.js      ← allow('admin','user','viewer')
│   └── routes/
│       ├── auth.js           ← POST /api/auth/login, GET /api/auth/me
│       ├── laporan.js        ← CRUD /api/laporan + PATCH /status
│       ├── swa.js            ← CRUD /api/swa
│       ├── dashboard.js      ← GET /api/dashboard/summary|chart|breakdown
│       ├── master.js         ← GET+POST /api/master/up3|ulp|regu|vendor|lokasi
│       └── users.js          ← CRUD /api/users (admin only)
│
└── frontend/
    └── src/
        ├── App.jsx               ← BrowserRouter, semua Route definitions
        ├── main.jsx
        ├── index.css             ← CSS custom properties (design tokens)
        ├── context/
        │   ├── AuthContext.jsx   ← useAuth() → { user, login, logout, loading }
        │   └── ThemeContext.jsx  ← useTheme() → { theme, toggle } (dark/light)
        ├── services/
        │   └── api.js            ← axios instance + semua api.* methods
        ├── components/
        │   ├── layout/
        │   │   ├── AdminLayout.jsx    ← Sidebar + topbar, responsive mobile
        │   │   ├── ViewerLayout.jsx   ← Minimal layout untuk viewer
        │   │   └── ProtectedRoute.jsx ← Role-based guard
        │   └── dashboard/
        │       ├── SummaryCards.jsx
        │       ├── LaporanBarChart.jsx
        │       ├── HasilMonitoringDonut.jsx
        │       ├── StatusAPDDonut.jsx
        │       └── RecentLaporan.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── admin/
            │   ├── DashboardPage.jsx     ✅ Selesai
            │   ├── LaporanPage.jsx       ✅ Selesai
            │   ├── SWAPage.jsx           ✅ Selesai
            │   ├── HistoryPage.jsx       ❌ Belum (placeholder)
            │   └── UserPage.jsx          ✅ Selesai
            ├── user/
            │   └── DashboardPage.jsx     ❌ Belum (placeholder)
            └── viewer/
                └── DashboardPage.jsx     ✅ Selesai
```

---

## 🔐 Autentikasi & Role

### Cara kerja
1. User POST ke `/api/auth/login` dengan `{ username, password }`
2. Backend return `{ token, user: { id, username, nama, email, role } }`
3. Frontend simpan ke `localStorage` dengan key `hsse-token` dan `hsse-user`
4. Setiap request axios attach `Authorization: Bearer <token>`
5. Interceptor 401 → hapus localStorage → redirect ke `/login`

### Role & Akses
| Role | Path | Akses |
|---|---|---|
| `admin` | `/admin/*` | Full CRUD semua menu |
| `user` | `/user/*` | Tambah laporan, update status, input SWA milik sendiri |
| `viewer` | `/dashboard` | Read-only, mobile-first view |

### Route Mapping
```
/login           → LoginPage (redirect ke home jika sudah login)
/                → RootRedirect (→ /admin/dashboard | /user/dashboard | /dashboard)
/admin/dashboard → AdminDashboardPage (role: admin)
/admin/laporan_pengawasan → LaporanPage (role: admin)
/admin/swa       → SWAPage (role: admin)
/admin/history   → HistoryPage (role: admin)  ← BELUM SELESAI
/admin/user      → UserPage (role: admin)
/user/dashboard  → UserDashboardPage (role: user)  ← BELUM SELESAI
/dashboard       → ViewerDashboardPage (role: viewer)
```

---

## 🎨 Design System

### CSS Custom Properties (Dark default, Light via `[data-theme="light"]`)

```css
/* Dark theme */
:root {
  --bg: #0a0f1a;
  --surface: #111827;
  --surface2: #1a2236;
  --border: #1e2d4a;
  --text: #e2e8f0;
  --muted: #8899b4;
  --dim: #5a6a84;
  --accent: #22d3ee;
  --success: #10b981;

  /* Status colors */
  --pending: #f59e0b;          /* amber */
  --berjalan: #3b82f6;         /* blue */
  --selesai: #10b981;          /* green */
  --tidak-aman: #ef4444;       /* red */
  --tidak-termonitor: #8899b4; /* gray */
  --swa: #a855f7;              /* purple */
}
```

### Status Badge Colors (hardcoded hex, JANGAN pakai CSS var di Recharts/SVG fill)
```js
// Status pekerjaan
pending  → #f59e0b (bg: rgba(245,158,11,0.12))
berjalan → #3b82f6 (bg: rgba(59,130,246,0.12))
selesai  → #10b981 (bg: rgba(16,185,129,0.12))

// Hasil monitoring
aman           → #10b981
tidak aman     → #ef4444
tidak termonitor → #8899b4

// Status APD
lengkap       → #10b981
tidak lengkap → #f59e0b
Belum diisi   → #5a6a84

// Status CCTV
ada       → #10b981
tidak ada → #ef4444

// Status SWA
diberhentikan → #ef4444
dilanjutkan   → #f59e0b
diselesaikan  → #10b981

// Role
admin  → #a855f7
user   → #3b82f6
viewer → #10b981
```

### Typography & Spacing
- Font: `'IBM Plex Sans', sans-serif` (ui), `'IBM Plex Mono', monospace` (IDs, kode)
- Border radius: 8px (input/button), 10px (card), 12–14px (modal)
- Gap/padding standar: 8px, 12px, 16px, 20px, 24px

### Komponen Umum yang Diulang di Tiap Halaman
```jsx
// Toast notification (success=hijau, error=merah, auto-dismiss 3.2s)
// Skeleton loading (div.skeleton className → CSS animation)
// Badge inline (color + bg rgba)
// Input style standar
const INPUT_STYLE = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text)', fontSize: 13,
  fontFamily: "'IBM Plex Sans', sans-serif",
  boxSizing: 'border-box', outline: 'none',
};
```

---

## 📡 API Reference

### Base URL: `http://localhost:5001/api`

### Auth
```
POST /auth/login   body: { username, password }
                   return: { success, data: { token, user: { id, username, nama, email, role } } }
GET  /auth/me      → { success, data: { id, username, nama, email, role } }
```

### Laporan Pengawasan
```
GET    /laporan
  params: tanggal_dari, tanggal_sampai, id_up3, id_ulp,
          status_pekerjaan, hasil_monitoring, page=1, limit=20
  return: { success, data: [...], pagination: { total, page, limit, totalPages } }

POST   /laporan
  body: { tanggal*, id_up3*, id_ulp*, id_regu*, id_lokasi*,
          uraian_pekerjaan*, nama_pelaksana*, jumlah_pekerjaan,
          id_vendor, status_cctv, status_apd, hasil_monitoring,
          temuan_k3, tindak_lanjut, keterangan }
  (* = wajib)
  auto-set: id (LP-YYYYMMDD-XXXXX), no_urut, status_pekerjaan='pending', created_by

PATCH  /laporan/:id/status
  body: { status_pekerjaan: 'pending'|'berjalan'|'selesai' }
  auto-set: tanggal_pekerjaan_berjalan, tanggal_pekerjaan_selesai

GET    /laporan/:id   → single row dengan semua JOIN
PUT    /laporan/:id   → update fields (tidak bisa ubah id, created_by, status)
```

### Kolom tabel `laporan_pengawasan` (hasil JOIN):
```
id, no_urut, tanggal, status_pekerjaan, hasil_monitoring,
id_up3, kode_up3, nama_up3,
id_ulp, kode_ulp, nama_ulp,
id_regu, nama_regu,
id_vendor, kode_vendor, nama_vendor,
id_lokasi, kode_lokasi, nama_lokasi,
uraian_pekerjaan, nama_pelaksana, jumlah_pekerjaan,
status_cctv, status_apd, temuan_k3, tindak_lanjut, keterangan,
tanggal_pekerjaan_berjalan, tanggal_pekerjaan_selesai,
created_by, nama_created_by, updated_by, created_at, updated_at
```

### SWA (Stop Work Authority)
```
GET    /swa
  params: tanggal_dari, tanggal_sampai, id_laporan, page=1, limit=20
  return: { success, data: [...], pagination }
  joined: tanggal_laporan, uraian_pekerjaan, status_pekerjaan, hasil_monitoring, nama_up3

POST   /swa
  body: { id_laporan_pengawasan*, catatan*, tindakan*,
          status_swa='diberhentikan'|'dilanjutkan'|'diselesaikan', keterangan }
  auto-set: id (SWA-YYYYMMDD-XXXXX), no_urut, tanggal=now, created_by

GET    /swa/:id
PUT    /swa/:id
```

### Dashboard
```
GET /dashboard/summary
  return: { total_hari_ini, pending, berjalan, selesai, tidak_aman, tidak_termonitor, swa_aktif }
  (hitung dari tanggal = hari ini)

GET /dashboard/chart
  return: data[] per tanggal (7 hari terakhir)
  fields: tanggal, total, pending, berjalan, selesai, tidak_aman

GET /dashboard/breakdown
  return: {
    by_up3: [{ label, total }],
    by_hasil_monitoring: [{ label, total }],
    by_status_apd: [{ label, total }]
  }
```

### Master Data
```
GET  /master/up3      → [{ id, kode_up3, nama_up3 }]
GET  /master/ulp      → [{ id, kode_ulp, nama_ulp, id_up3 }]
GET  /master/regu     → [{ id, nama_regu }]
GET  /master/vendor   → [{ id, kode_vendor, nama_vendor }]
GET  /master/lokasi   → [{ id, kode_lokasi, nama_lokasi }]
POST /master/*        → tambah data (admin only)
```

### Users (admin only)
```
GET    /users         → [{ id, username, nama, email, role, is_active, created_at }]
POST   /users         body: { username*, password*, role*, nama, email, is_active=true }
PUT    /users/:id     body: { username, nama, email, password(opsional), role, is_active }
DELETE /users/:id     (tidak bisa hapus diri sendiri)
```

### API Service (frontend `src/services/api.js`)
```js
// Axios instance dengan interceptor:
// - Request: attach Authorization: Bearer <token>
// - Response: return response.data (bukan response)
// - 401: hapus localStorage → redirect /login

export const api = {
  login, logout, getMe,
  getUP3, getULP, getRegu, getVendor, getLokasi,
  getLaporan, createLaporan, getLaporanById, updateLaporan, updateLaporanStatus,
  getSWA, createSWA, getSWAById, updateSWA,
  getDashboardSummary, getDashboardChart, getDashboardBreakdown,
  getUsers, createUser, updateUser, deleteUser,
}
```

---

## ✅ PROGRESS — SUDAH SELESAI

### Phase 1–4: Backend + Fondasi Frontend ✅
- MySQL schema (users, laporan_pengawasan, swa, master_*)
- Express API semua route
- JWT auth + middleware
- React app scaffold: routing, AuthContext, ThemeContext
- CSS design tokens (dark/light)
- LoginPage

### Phase 5: Admin Dashboard ✅
Komponen: `SummaryCards`, `LaporanBarChart`, `HasilMonitoringDonut`, `StatusAPDDonut`, `RecentLaporan`
- 4 parallel API calls dengan `Promise.allSettled`
- Layout: summary cards → [BarChart 1.6fr | donut column 1fr] → recent table
- Skeleton loading state di setiap komponen

### Phase 6: Laporan Pengawasan Page ✅
File: `src/pages/admin/LaporanPage.jsx` (~1300 baris)

**Filter Bar:**
- Draft vs applied filter pattern (fetch HANYA saat klik Terapkan)
- Fields: tanggal_dari, tanggal_sampai, id_up3 (select), id_ulp (select, filtered by UP3), status_pekerjaan, hasil_monitoring
- Tombol Terapkan (icon search + label), Reset

**Tabel data:**
- Kolom: No, Tanggal, ID Laporan (mono font merah), Pekerjaan (UP3 · ULP), Status badge, Hasil badge, Aksi
- Pagination prev/next dengan info total
- Row hover effect

**Modal Detail Laporan:**
- Sections sebagai card (var(--bg) + border): Info Utama, Lokasi & Regu, Status K3, Uraian & Temuan
- Colored badges: status CCTV (hijau/merah), status APD (hijau/amber)

**Modal Tambah Laporan:**
- Form: tanggal, UP3, ULP (filtered), Regu, Lokasi, Vendor (opsional)
- Uraian, nama pelaksana, jumlah pekerjaan
- Status CCTV, status APD, hasil monitoring
- Temuan K3, tindak lanjut, keterangan
- Validasi client-side sebelum submit

**Modal Update Status:**
- Radio card UI: pending (amber) / berjalan (biru) / selesai (hijau)
- Badge "Saat ini" pada status aktif
- PATCH /laporan/:id/status

**Modal Input SWA:**
- HANYA tampil jika `hasil_monitoring === 'tidak aman'`
- Form: catatan, tindakan, status_swa (select), keterangan
- POST /swa

### Phase 7: SWA Page ✅
File: `src/pages/admin/SWAPage.jsx`

**Filter:** tanggal_dari, tanggal_sampai, cari ID laporan (text input)

**Tabel:**
- No, ID SWA (red mono `SWA-YYYYMMDD-XXXXX`), Laporan terkait (LP ID + UP3 + tanggal), Catatan, Tindakan, Status badge, Aksi

**Status SWA badges:**
- diberhentikan → merah
- dilanjutkan → amber
- diselesaikan → hijau

**Modal Detail SWA:**
- Red strip header dengan SWA ID + status badge
- Section "Laporan Terkait" (bg box): LP ID, tanggal laporan, uraian, status pekerjaan badge, hasil monitoring badge
- Section Catatan & Tindakan
- Audit timestamps (dibuat oleh, dibuat pada)

### Phase 8: History Page ❌ (PLACEHOLDER — HARUS DIBANGUN)

### Phase 9: User Management Page ✅
File: `src/pages/admin/UserPage.jsx`

**Stat cards:** Total User, Aktif, Admin

**Filter bar:**
- Search nama/username/email (client-side filter)
- Filter role (All/Admin/User/Viewer)
- Filter status (All/Aktif/Nonaktif)
- Counter "X dari Y user"

**Tabel:**
- Avatar inisial dengan warna hash dari username
- Kolom: No, Pengguna (avatar + nama + @username), Email, Role badge, Status toggle, Dibuat, Aksi (Edit/Hapus)
- Toggle switch per baris untuk is_active (inline update tanpa reload)

**Modal Tambah/Edit User:**
- Field: username (disabled saat edit), nama, email, password (show/hide toggle, opsional saat edit), role select, is_active toggle
- Validasi: username required, password required untuk new user

**Modal Konfirmasi Hapus:**
- Red strip header, tampil nama + @username yang akan dihapus

### Phase 10: Viewer Dashboard ✅
File: `src/pages/viewer/DashboardPage.jsx`

**Mobile-first layout (tidak pakai sidebar)**

**3 summary cards horizontal:**
- Total Hari Ini (accent), Tidak Aman (merah), SWA Aktif (ungu)

**Date filter:**
- Input tanggal_dari & tanggal_sampai
- Tombol "Semua" (reset ke hari ini)
- Tombol Refresh dengan spinning animation

**Laporan list (load-more pagination):**
- LIMIT 15 per page, append ke list
- LaporanItem: status badge + hasil badge + uraian_pekerjaan + UP3/ULP chips + nama_pelaksana
- Red alert box jika `hasil_monitoring === 'tidak aman'` → tampilkan temuan_k3
- Empty state adaptif (berbeda untuk filter aktif vs no data)
- 5 SkeletonItem saat loading

### Perbaikan Responsif & UI ✅
- AdminLayout: sidebar slide-in/out mobile (≤768px) dengan hamburger icon
- Overlay backdrop saat sidebar mobile terbuka
- NavLink auto-close sidebar saat navigasi di mobile
- Tombol Terapkan dengan icon search SVG
- Modal detail laporan: tiap section sebagai card terpisah

---

## ❌ YANG HARUS DISELESAIKAN

### 1. Phase 8 — History Page (`/admin/history`) — PRIORITAS PERTAMA

**Tujuan:** Read-only view riwayat SEMUA laporan tanpa batasan tanggal. Tidak ada tombol tambah, update status, atau SWA.

**File:** `src/pages/admin/HistoryPage.jsx`

**Spesifikasi lengkap:**

```
Header:
- Judul "History" + subtitle "Riwayat seluruh laporan pengawasan"
- Kanan atas: tombol "Export CSV" (generate dan download CSV dari data yang sedang ditampilkan)

Filter bar (sama persis dengan LaporanPage, TAPI auto-fetch — tidak perlu tombol Terapkan):
- tanggal_dari (date input)
- tanggal_sampai (date input)
- id_up3 (select dropdown, load dari api.getUP3())
- id_ulp (select dropdown, filtered berdasarkan UP3 yang dipilih, load dari api.getULP())
- status_pekerjaan (select: semua / pending / berjalan / selesai)
- hasil_monitoring (select: semua / aman / tidak aman / tidak termonitor)
- Tombol Reset

Tabel (READ-ONLY — tidak ada kolom Aksi):
- Kolom: No, Tanggal, ID Laporan (mono merah), UP3 · ULP, Uraian (truncate 40 char), Status badge, Hasil badge, Dibuat Oleh, Aksi (detail saja)
- Pagination standard prev/next
- Klik ID Laporan atau tombol "Detail" → buka ModalDetailLaporan (sama seperti di LaporanPage, tapi tanpa tombol Update Status & SWA)
- Default sort: tanggal DESC

ModalDetailLaporan (sama persis dengan LaporanPage):
- Card sections: Info Utama, Lokasi & Regu, Status K3, Uraian & Temuan
- Colored K3 badges
- TIDAK ada tombol "Update Status" dan "Input SWA"

Export CSV:
- Download file bernama: history_laporan_YYYYMMDD.csv
- Kolom CSV: No, ID Laporan, Tanggal, UP3, ULP, Regu, Lokasi, Uraian Pekerjaan,
  Nama Pelaksana, Jumlah Pekerjaan, Status Pekerjaan, Hasil Monitoring,
  Status CCTV, Status APD, Temuan K3, Tindak Lanjut, Dibuat Oleh, Dibuat Pada
- Export hanya data yang sedang difilter (semua halaman, bukan hanya halaman aktif)
  → untuk export semua: GET /laporan dengan filter aktif + limit=9999
```

---

### 2. Phase 11 — User Dashboard (`/user/dashboard`)

**Tujuan:** Role `user` bisa tambah laporan baru dan update status laporan yang mereka buat. Tidak ada akses ke User Management atau History.

**File:** `src/pages/user/DashboardPage.jsx`

**Sidebar menu untuk role user (bedanya dengan admin):**
- Dashboard ✓
- Laporan Saya ✓ (lihat dan kelola laporan created_by = user.id sendiri)
- TIDAK ada: History, User Management

**Spesifikasi:**
```
Mirip dengan admin/LaporanPage.jsx TAPI:
1. Filter tidak ada "Dibuat Oleh" karena sudah otomatis filter ke user sendiri
   → Tambahkan param created_by=req.user.id di query (atau filter client-side)
2. Ada tombol "Tambah Laporan" (Modal sama persis dengan admin)
3. Ada tombol "Update Status" per baris (jika status !== 'selesai')
4. Ada tombol "Input SWA" jika hasil_monitoring === 'tidak aman' dan belum ada SWA
5. TIDAK ada tombol "Hapus" laporan
6. Summary cards atas: Laporan Saya (total), Pending, Berjalan, Selesai

Catatan teknis:
- Backend GET /laporan sudah support semua filter yang dibutuhkan
- Frontend perlu filter tambahan: tambahkan state filter created_by
  ATAU tampilkan semua dan filter client-side (jika data tidak terlalu banyak)
- Gunakan komponen yang sama (Modal, Badge, dll) seperti LaporanPage
```

---

### 3. Phase 12 — Docker Compose

**File yang dibutuhkan:**

**`backend/Dockerfile`:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["node", "index.js"]
```

**`frontend/Dockerfile`:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`frontend/nginx.conf`:**
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location /api { proxy_pass http://backend:5001; }
}
```

**`docker-compose.yml` di project root:**
```yaml
version: '3.9'
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: hsse_root
      MYSQL_DATABASE: hsse_db
      MYSQL_USER: hsse_user
      MYSQL_PASSWORD: hsse_pass
    ports: ["3306:3306"]
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    build: ./backend
    ports: ["5001:5001"]
    environment:
      DB_HOST: mysql
      DB_USER: hsse_user
      DB_PASS: hsse_pass
      DB_NAME: hsse_db
      DB_PORT: 3306
      JWT_SECRET: your_super_secret_key_here
      PORT: 5001
    depends_on: [mysql]

  frontend:
    build: ./frontend
    ports: ["3001:80"]
    depends_on: [backend]

volumes:
  mysql_data:
```

---

### 4. Phase 13 — QA & Final Build

**Checklist:**
- [ ] `npm run build` di frontend → 0 error
- [ ] Test login semua 3 role (admin/user/viewer)
- [ ] Test redirect setelah login sesuai role
- [ ] Test CRUD laporan (tambah, lihat detail, update status, input SWA)
- [ ] Test filter dan pagination di semua halaman tabel
- [ ] Test User Management (tambah, edit, toggle aktif, hapus)
- [ ] Test dark/light mode toggle
- [ ] Test mobile view: sidebar hamburger, viewer dashboard
- [ ] Test token expired → redirect ke login
- [ ] Test 401 dari backend → tidak infinite loop

---

## 📋 Catatan Penting untuk Codex

### Pattern yang Konsisten Digunakan

**1. API calls dengan error handling:**
```jsx
const [rows, setRows] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function load() {
    setLoading(true);
    try {
      const data = await api.getLaporan({ ...appliedFilter, page, limit: LIMIT });
      setRows(data.data || []);
      setPagination(data.pagination);
    } catch (e) {
      showToast(e?.message || 'Gagal memuat data.', 'error');
    } finally {
      setLoading(false);
    }
  }
  load();
}, [appliedFilter, page]);
```

**2. Toast notification:**
```jsx
const [toast, setToast] = useState(null);
const showToast = useCallback((msg, type = 'success') => {
  setToast({ msg, type });
}, []);

// Component
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  // render colored notification fixed bottom-right
}
```

**3. Local state update setelah API success (tanpa full refetch):**
```jsx
function handleSuccess(updatedRow, message) {
  showToast(message);
  setRows(prev => prev.map(r => r.id === updatedRow.id ? { ...r, ...updatedRow } : r));
}
function handleDelete(id, message) {
  showToast(message);
  setRows(prev => prev.filter(r => r.id !== id));
}
function handleCreate(newRow, message) {
  showToast(message);
  setRows(prev => [newRow, ...prev]);
}
```

**4. Draft vs Applied filter (fetch hanya saat Terapkan):**
```jsx
const FILTER_BLANK = { tanggal_dari: '', tanggal_sampai: '', id_up3: '', ... };
const [draftFilter, setDraftFilter] = useState(FILTER_BLANK);
const [appliedFilter, setAppliedFilter] = useState(FILTER_BLANK);

function applyFilter() {
  setPage(1);
  setAppliedFilter({ ...draftFilter });
}
function resetFilter() {
  setDraftFilter(FILTER_BLANK);
  setAppliedFilter(FILTER_BLANK);
  setPage(1);
}
// useEffect depends on appliedFilter, NOT draftFilter
```

**5. Modal pattern:**
```jsx
// State
const [detailRow, setDetailRow] = useState(null);
const [editRow, setEditRow] = useState(null);

// Render
{detailRow && <ModalDetail row={detailRow} onClose={() => setDetailRow(null)} />}
{editRow && <ModalEdit row={editRow} onClose={() => setEditRow(null)} onSuccess={handleSuccess} />}

// Modal structure
function ModalX({ row, onClose, onSuccess }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.55)',
      backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)',
        width:'100%', maxWidth:600, maxHeight:'90dvh', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,0.35)' }}>
        {/* Header */}
        {/* Body (overflow scroll) */}
        {/* Footer (buttons) */}
      </div>
    </div>
  );
}
```

**6. Skeleton loading:**
```jsx
// Skeleton div dengan className
<div className="skeleton" style={{ height: 14, width: 120, borderRadius: 6 }} />

// CSS (sudah ada di index.css):
// .skeleton { background: linear-gradient(...); animation: shimmer 1.5s infinite; }
```

**7. Responsive mobile check:**
```jsx
const MOBILE_BP = 768;
const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BP);
useEffect(() => {
  function handleResize() { setIsMobile(window.innerWidth < MOBILE_BP); }
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## 🚀 Perintah Mulai Kerja

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Build check
cd frontend && npm run build
```

---

## 📌 Prioritas Pengerjaan

1. **Phase 8 — History Page** (paling kritis, menu sudah ada di sidebar tapi masih placeholder)
2. **Phase 11 — User Dashboard** (role user tidak bisa ngapa-ngapain sekarang)
3. **Phase 12 — Docker Compose** (deployment)
4. **Phase 13 — QA & build akhir**

---

*Dokumen ini dibuat otomatis dari codebase aktual proyek hsse_dashboard_pelaporan_pengawasan.*
*Last updated: 2026-04-25*
